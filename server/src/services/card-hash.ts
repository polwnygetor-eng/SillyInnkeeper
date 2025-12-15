import { createHash } from "node:crypto";

function canonicalizeForHash(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map(canonicalizeForHash);
  if (typeof value !== "object") return value;

  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const key of Object.keys(obj).sort()) {
    // CCv3: игнорируем поля, которые часто меняются при переэкспорте
    if (key === "creation_date" || key === "modification_date") continue;
    out[key] = canonicalizeForHash(obj[key]);
  }

  // CCv3: поля creation_date/modification_date лежат обычно в card.data
  // (снаружи тоже может встретиться — игнорим в любом месте)
  return out;
}

export function computeContentHash(cardOriginalData: unknown): string {
  const canonical = canonicalizeForHash(cardOriginalData);
  const json = JSON.stringify(canonical);
  return createHash("sha256").update(json, "utf8").digest("hex");
}
