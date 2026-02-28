import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * Auth Guard Middleware Tests
 *
 * Validates that the middleware correctly:
 *   - Redirects unauthenticated users to /login
 *   - Allows unauthenticated users to access public routes (/login, /)
 *   - Redirects authenticated users away from /login to /dashboard
 *   - Allows authenticated users to access protected routes
 */

// ─── Hoist mock references ────────────────────────────────────────────────────

const mockGetUser = vi.hoisted(() => vi.fn());

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

import { middleware } from "@/middleware";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(pathname: string): NextRequest {
  return new NextRequest(new URL(`http://localhost:3000${pathname}`));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Auth Guard Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Unauthenticated user", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    });

    it("redirects /dashboard → /login", async () => {
      const req = makeRequest("/dashboard");
      const res = await middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login");
    });

    it("redirects /upload → /login", async () => {
      const req = makeRequest("/upload");
      const res = await middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login");
    });

    it("redirects /settings → /login", async () => {
      const req = makeRequest("/settings");
      const res = await middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login");
    });

    it("allows access to /login (public route — no redirect loop)", async () => {
      const req = makeRequest("/login");
      const res = await middleware(req);

      // Pass-through: no Location header (null) means no redirect
      const location = res.headers.get("location");
      expect(location).toBeNull();
    });

    it("allows access to / (public route)", async () => {
      const req = makeRequest("/");
      const res = await middleware(req);

      // Pass-through: no Location header
      const location = res.headers.get("location");
      expect(location).toBeNull();
    });
  });

  describe("Authenticated user", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-uuid-123", email: "user@example.com" } },
        error: null,
      });
    });

    it("redirects /login → /dashboard (no re-login needed)", async () => {
      const req = makeRequest("/login");
      const res = await middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/dashboard");
    });

    it("allows access to /dashboard", async () => {
      const req = makeRequest("/dashboard");
      const res = await middleware(req);

      // Pass-through: no Location header means no redirect
      expect(res.headers.get("location")).toBeNull();
    });

    it("allows access to /upload", async () => {
      const req = makeRequest("/upload");
      const res = await middleware(req);

      expect(res.headers.get("location")).toBeNull();
    });

    it("allows access to /settings", async () => {
      const req = makeRequest("/settings");
      const res = await middleware(req);

      expect(res.headers.get("location")).toBeNull();
    });
  });
});
