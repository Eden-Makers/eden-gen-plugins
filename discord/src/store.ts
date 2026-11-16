import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export interface LinkedAccount {
  kind: "personal" | "oauth";
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  clientId?: string;
}

export class LinkStore {
  private accounts = new Map<string, LinkedAccount>();
  private readonly file: string;

  constructor(file: string) {
    this.file = file;
    try {
      const parsed = JSON.parse(readFileSync(file, "utf8")) as Record<string, LinkedAccount>;
      for (const [id, account] of Object.entries(parsed)) this.accounts.set(id, account);
    } catch {
      // A missing file means nobody is linked yet.
    }
  }

  get(userId: string): LinkedAccount | undefined {
    return this.accounts.get(userId);
  }

  set(userId: string, account: LinkedAccount): void {
    this.accounts.set(userId, account);
    mkdirSync(dirname(this.file), { recursive: true });
    writeFileSync(this.file, JSON.stringify(Object.fromEntries(this.accounts)), { mode: 0o600 });
    try {
      chmodSync(this.file, 0o600);
    } catch {
      // Some filesystems ignore the mode. The file is still gitignored under data/.
    }
  }
}
