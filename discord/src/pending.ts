import { randomIdempotencyKey, type RunInput } from "../../edengen-rest/edengen-rest.ts";

export interface PendingRun {
  userId: string;
  input: RunInput;
  idempotencyKey: string;
  usdTotal: number;
  createdAt: number;
}

const pending = new Map<string, PendingRun>();
const MAX_AGE_MS = 10 * 60_000;

export function stageRun(userId: string, input: RunInput, usdTotal: number): string {
  const id = randomIdempotencyKey();
  pending.set(id, { userId, input, idempotencyKey: id, usdTotal, createdAt: Date.now() });
  return id;
}

export function takeRun(id: string, userId: string): PendingRun | undefined {
  const run = pending.get(id);
  if (!run || run.userId !== userId) return undefined;
  pending.delete(id);
  if (Date.now() - run.createdAt > MAX_AGE_MS) return undefined;
  return run;
}

export function dropRun(id: string, userId: string): boolean {
  const run = pending.get(id);
  if (!run || run.userId !== userId) return false;
  pending.delete(id);
  return true;
}

export function clearRuns(): void {
  pending.clear();
}
