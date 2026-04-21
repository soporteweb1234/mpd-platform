import { auth } from "@/lib/auth";
import type { Session } from "next-auth";

export class AuthzError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "AuthzError";
  }
}

export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user) throw new AuthzError(401, "Unauthorized");
  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    throw new AuthzError(403, "Forbidden");
  }
  return session;
}

export function authzResponse(err: unknown): Response {
  if (err instanceof AuthzError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  throw err;
}

/**
 * For server actions: returns discriminated union so callers can early-return
 * a user-facing { error } object without throwing across the server boundary.
 */
export async function checkAdmin(): Promise<
  { session: Session } | { error: string }
> {
  try {
    const session = await requireAdmin();
    return { session };
  } catch (err) {
    if (err instanceof AuthzError) return { error: "No autorizado" };
    throw err;
  }
}
