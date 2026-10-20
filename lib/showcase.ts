// The launch showcase (full-screen intro / corner popup) runs until this date, then switches itself off.
export const SHOWCASE_UNTIL = "2026-11-19T23:59:59Z";

export const SHOWCASE_SEEN_KEY = "toolninja:showcase-seen";
export const OPEN_ASSISTANT_EVENT = "toolninja:open-assistant";
// Fired by the showcase whenever its overlay or corner card opens or closes ({ detail: { open } })
export const ASSISTANT_VIEW_EVENT = "toolninja:assistant-view";

export function isShowcaseActive(now = Date.now()): boolean {
  return now < Date.parse(SHOWCASE_UNTIL);
}

export function openAssistant() {
  window.dispatchEvent(new Event(OPEN_ASSISTANT_EVENT));
}
