import { SESSION_COOKIE } from "$lib/server/auth";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = ({ cookies }) => {
  cookies.delete(SESSION_COOKIE, { path: "/" });
  return new Response(null, {
    status: 303,
    headers: { location: "/login" },
  });
};
