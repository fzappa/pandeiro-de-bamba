import type { Handle } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import {
  SESSION_COOKIE,
  isAuthConfigured,
  verifySessionToken,
} from "$lib/server/auth";

// A Content-Security-Policy é gerada pelo SvelteKit (kit.csp em
// svelte.config.js) para permitir nonces em vez de 'unsafe-inline'.
function applySecurityHeaders(response: Response) {
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set(
    "permissions-policy",
    "camera=(), microphone=(), geolocation=()",
  );
}

// Caminhos que precisam ficar acessíveis mesmo sem sessão: a própria
// página de login (form + submit) e os assets estáticos que ela usa
// (bundle JS/CSS do SvelteKit e a logo).
const PUBLIC_PATH_PREFIXES = ["/_app/", "/login", "/logout"];
const PUBLIC_PATHS = ["/favicon.ico", "/pandeiro.png", "/robots.txt"];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export const handle: Handle = async ({ event, resolve }) => {
  const allowedIpsEnv = env.ALLOWED_IPS;

  // 1) Allowlist de IP (camada de rede), se configurada.
  if (allowedIpsEnv) {
    // Nunca ler X-Forwarded-For diretamente: o primeiro valor é controlado
    // pelo cliente e permite falsificar um IP da allowlist. getClientAddress()
    // do adapter-node resolve o IP conforme configurado via env:
    // - Render: ADDRESS_HEADER=true-client-ip (header injetado pela borda
    //   do Render/Cloudflare; o X-Forwarded-For lá tem hops internos no
    //   final, então XFF_DEPTH não funciona).
    // - Proxy reverso genérico com 1 hop confiável (ex.: nginx local):
    //   ADDRESS_HEADER=x-forwarded-for e XFF_DEPTH=1.
    // Sem essas variáveis, retorna o endereço do socket (correto em dev
    // local; atrás de proxy seria o IP do próprio proxy — falha fechado).
    let clientIp = "";
    try {
      clientIp = event.getClientAddress();
    } catch {
      clientIp = "";
    }

    if (!clientIp) {
      const response = new Response("Forbidden: Invalid client IP", {
        status: 403,
      });
      applySecurityHeaders(response);
      return response;
    }

    const allowedIps = allowedIpsEnv
      .split(",")
      .map((ip: string) => ip.trim())
      .filter((ip: string) => ip !== "");

    // Normaliza localhost IPv6 para IPv4 para maior robustez local
    if (clientIp === "::1") {
      clientIp = "127.0.0.1";
    }

    if (!allowedIps.includes(clientIp)) {
      // Log de diagnóstico: mostra nos logs do servidor qual IP foi
      // resolvido, para ajustar ALLOWED_IPS/ADDRESS_HEADER sem adivinhar.
      console.warn(`[allowlist] acesso negado para IP resolvido: ${clientIp}`);
      const response = new Response("Forbidden: Your IP is not allowed", {
        status: 403,
      });
      applySecurityHeaders(response);
      return response;
    }
  }

  // 2) Login por usuário/senha (sessão via cookie), se configurado.
  // Ativa com BASIC_AUTH_USER + BASIC_AUTH_PASSWORD. A verificação de
  // credenciais acontece na action de /login (src/routes/login); aqui só
  // checamos se já existe uma sessão válida.
  if (isAuthConfigured() && !isPublicPath(event.url.pathname)) {
    const token = event.cookies.get(SESSION_COOKIE);
    if (!verifySessionToken(token)) {
      const redirectTo = `${event.url.pathname}${event.url.search}`;
      const response = new Response(null, {
        status: 303,
        headers: {
          location: `/login?redirect=${encodeURIComponent(redirectTo)}`,
        },
      });
      applySecurityHeaders(response);
      return response;
    }
  }

  const response = await resolve(event);
  applySecurityHeaders(response);
  return response;
};
