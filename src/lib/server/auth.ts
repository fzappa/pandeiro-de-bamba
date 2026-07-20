import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { env } from "$env/dynamic/private";

export const SESSION_COOKIE = "pdb_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h

function safeEqual(a: string, b: string): boolean {
  // Compara hashes de tamanho fixo em vez das strings originais: evita
  // timing attack e o erro do timingSafeEqual quando os dois valores têm
  // comprimentos diferentes.
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

export function isAuthConfigured(): boolean {
  return Boolean(env.BASIC_AUTH_USER && env.BASIC_AUTH_PASSWORD);
}

export function verifyCredentials(user: string, password: string): boolean {
  const expectedUser = env.BASIC_AUTH_USER;
  const expectedPassword = env.BASIC_AUTH_PASSWORD;
  if (!expectedUser || !expectedPassword) return false;
  return safeEqual(user, expectedUser) && safeEqual(password, expectedPassword);
}

function sessionSecret(): string {
  // Derivado do usuário/senha configurados: nenhuma env var extra é
  // necessária, e trocar a senha invalida sessões antigas automaticamente.
  return createHash("sha256")
    .update(`${env.BASIC_AUTH_USER ?? ""}:${env.BASIC_AUTH_PASSWORD ?? ""}`)
    .digest("hex");
}

export function createSessionToken(): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const signature = createHmac("sha256", sessionSecret())
    .update(String(expiresAt))
    .digest("hex");
  return `${expiresAt}.${signature}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expiresAtRaw, signature] = token.split(".");
  if (!expiresAtRaw || !signature) return false;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const expectedSignature = createHmac("sha256", sessionSecret())
    .update(expiresAtRaw)
    .digest("hex");
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}
