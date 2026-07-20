import { fail, redirect } from "@sveltejs/kit";
import {
  SESSION_COOKIE,
  createSessionToken,
  isAuthConfigured,
  verifyCredentials,
  verifySessionToken,
} from "$lib/server/auth";
import type { Actions, PageServerLoad } from "./$types";

// Só permite redirecionar para caminhos internos, nunca para outro host
// (evita open redirect via ?redirect=).
function safeRedirect(target: string | null): string {
  if (target && target.startsWith("/") && !target.startsWith("//")) {
    return target;
  }
  return "/";
}

export const load: PageServerLoad = ({ cookies, url }) => {
  if (!isAuthConfigured()) redirect(303, "/");
  if (verifySessionToken(cookies.get(SESSION_COOKIE))) {
    redirect(303, safeRedirect(url.searchParams.get("redirect")));
  }
  return {};
};

export const actions: Actions = {
  default: async ({ request, cookies, url }) => {
    const data = await request.formData();
    const username = String(data.get("username") ?? "");
    const password = String(data.get("password") ?? "");

    if (!verifyCredentials(username, password)) {
      return fail(401, {
        error: "Usuário ou senha inválidos.",
        username,
      });
    }

    cookies.set(SESSION_COOKIE, createSessionToken(), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: url.protocol === "https:",
      maxAge: 60 * 60 * 12,
    });

    redirect(303, safeRedirect(url.searchParams.get("redirect")));
  },
};
