export async function bcryptHash(password: string, rounds: number): Promise<string> {
  const bcrypt = (await import("bcryptjs")).default;
  return bcrypt.hash(password, rounds);
}

export async function bcryptCompare(password: string, hash: string): Promise<boolean> {
  const bcrypt = (await import("bcryptjs")).default;
  return bcrypt.compare(password, hash);
}

export function isBcryptHash(value: string): boolean {
  return /^\$2[aby]?\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value.trim());
}

export function bcryptCost(hash: string): number | null {
  const match = hash.trim().match(/^\$2[aby]?\$(\d{2})\$/);
  return match ? parseInt(match[1], 10) : null;
}
