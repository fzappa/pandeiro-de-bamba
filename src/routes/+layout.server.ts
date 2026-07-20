import { isAuthConfigured } from "$lib/server/auth";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = () => {
  return { authEnabled: isAuthConfigured() };
};
