import { createHash } from "crypto";
import { kv, safe } from "@/lib/kv";

// Idea board: the tools Ask Ninja couldn't point anyone to, grouped and counted, with a status.
// Identical requests (after normalisation) count towards the same idea; ideas merged in /admin keep
// an alias, so future requests for the merged wording land on the surviving idea too.

export type IdeaStatus = "new" | "planned" | "built" | "dismissed";
export const IDEA_STATUSES: IdeaStatus[] = ["new", "planned", "built", "dismissed"];

export interface Idea {
  id: string;
  title: string;
  count: number;
  status: IdeaStatus;
  topics: string[];
  firstTs: number;
  lastTs: number;
  note?: string;
}

const K = {
  idea: (id: string) => `tn:idea:${id}`,
  alias: (norm: string) => `tn:idea:alias:${norm}`,
  index: "tn:ideas",
  migrated: "tn:ideas:migrated",
  legacy: "tn:ai:unmet",
};

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b(a|an|the|tool|to|that|which|for|online)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const normKey = (title: string) => createHash("sha1").update(normalize(title)).digest("hex").slice(0, 16);

async function getIdea(id: string): Promise<Idea | null> {
  const raw = await kv().get(K.idea(id));
  try {
    return raw ? (JSON.parse(raw) as Idea) : null;
  } catch {
    return null;
  }
}

async function putIdea(idea: Idea) {
  await kv().batch().set(K.idea(idea.id), JSON.stringify(idea)).zadd(K.index, idea.lastTs, idea.id).exec();
}

export async function upsertIdea(title: string, topic: string, ts = Date.now()) {
  const clean = title.trim().slice(0, 160);
  if (!clean) return;
  const norm = normKey(clean);
  const id = (await kv().get(K.alias(norm))) ?? norm;
  const existing = await getIdea(id);
  if (existing) {
    existing.count += 1;
    existing.lastTs = Math.max(existing.lastTs, ts);
    existing.firstTs = Math.min(existing.firstTs, ts);
    if (topic && !existing.topics.includes(topic)) existing.topics = [...existing.topics, topic].slice(0, 6);
    // a built/dismissed idea that people keep asking for goes back on the board
    if (existing.status === "dismissed" && existing.count % 5 === 0) existing.status = "new";
    await putIdea(existing);
  } else {
    await putIdea({ id, title: clean, count: 1, status: "new", topics: topic ? [topic] : [], firstTs: ts, lastTs: ts });
  }
}

/** One-time import of the requests recorded before the idea board existed. */
async function migrateLegacy() {
  const first = await kv().set(K.migrated, "1", { nx: true });
  if (!first) return;
  const rows = await kv().lrange(K.legacy, 0, 499);
  for (const r of rows.reverse()) {
    try {
      const { text, topic, ts } = JSON.parse(r) as { text: string; topic: string; ts: number };
      await upsertIdea(text, topic, ts);
    } catch {}
  }
}

export async function listIdeas(): Promise<Idea[]> {
  await safe(migrateLegacy, undefined);
  const ids = await safe(() => kv().zrevrange(K.index, 0, 999), []);
  if (!ids.length) return [];
  const b = kv().batch();
  ids.forEach((id) => b.get(K.idea(id)));
  const rows = (await safe(() => b.exec(), [])) as (string | null)[];
  return rows.flatMap((r) => {
    try {
      return r ? [JSON.parse(r) as Idea] : [];
    } catch {
      return [];
    }
  });
}

export async function updateIdea(id: string, patch: Partial<Pick<Idea, "status" | "title" | "note">>) {
  const idea = await getIdea(id);
  if (!idea) return;
  if (patch.status && IDEA_STATUSES.includes(patch.status)) idea.status = patch.status;
  if (patch.title !== undefined && patch.title.trim()) idea.title = patch.title.trim().slice(0, 160);
  if (patch.note !== undefined) idea.note = patch.note.trim().slice(0, 300);
  await putIdea(idea);
}

/** Folds `sources` into `target`: counts add up, and future requests for any of them count for the target. */
export async function mergeIdeas(targetId: string, sourceIds: string[]) {
  const target = await getIdea(targetId);
  if (!target) return;
  const b = kv().batch();
  for (const sid of sourceIds) {
    if (sid === targetId) continue;
    const s = await getIdea(sid);
    if (!s) continue;
    target.count += s.count;
    target.firstTs = Math.min(target.firstTs, s.firstTs);
    target.lastTs = Math.max(target.lastTs, s.lastTs);
    target.topics = Array.from(new Set([...target.topics, ...s.topics])).slice(0, 6);
    b.set(K.alias(sid), targetId).del(K.idea(sid)).zrem(K.index, sid);
  }
  b.set(K.idea(target.id), JSON.stringify(target)).zadd(K.index, target.lastTs, target.id);
  await b.exec();
}
