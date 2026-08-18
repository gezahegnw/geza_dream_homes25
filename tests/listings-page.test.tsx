import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import ListingsPage from "@/app/listings/page";

vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string }) =>
    // eslint-disable-next-line @next/next/no-img-element
    <img src={props.src} alt={props.alt} />,
}));

vi.mock("@/components/FilterPanel", () => ({ default: () => <div /> }));

const listing = { id: "1", address: "1231 Dream St", city: "Overland Park", state: "KS", price: 100000 };

type Session = { user: { id: string; approved: boolean } | null };

function mockApi({ session, favorites }: { session: Session; favorites: string[] }) {
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      if (url.startsWith("/api/listings")) {
        return { ok: true, status: 200, json: async () => ({ listings: [listing] }) } as Response;
      }
      if (url.startsWith("/api/auth/me")) {
        // The real route answers 200 even when nobody is signed in.
        return { ok: true, status: 200, json: async () => session } as Response;
      }
      if (url.startsWith("/api/favorites")) {
        if (!session.user) {
          return { ok: false, status: 401, json: async () => ({ error: "Unauthorized" }) } as Response;
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ favorites: favorites.map((id) => ({ id, property_id: id })) }),
        } as Response;
      }
      return { ok: false, status: 404, json: async () => ({}) } as Response;
    }),
  );
  return calls;
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("ListingsPage auth detection", () => {
  it("treats 200 { user: null } as signed out", async () => {
    mockApi({ session: { user: null }, favorites: [] });

    render(<ListingsPage />);

    // The banner only renders when isAuthenticated === false, which never
    // happened while the page trusted res.ok.
    expect(await screen.findByText("Sign in required")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login?redirect=/listings",
    );
  });

  it("treats a real session as signed in", async () => {
    mockApi({ session: { user: { id: "u1", approved: true } }, favorites: [] });

    render(<ListingsPage />);
    await screen.findByText("1231 Dream St");

    expect(screen.queryByText("Sign in required")).not.toBeInTheDocument();
  });

  it("does not request favorites while signed out", async () => {
    const calls = mockApi({ session: { user: null }, favorites: [] });

    render(<ListingsPage />);
    await screen.findByText("Sign in required");

    expect(calls.some((url) => url.startsWith("/api/favorites"))).toBe(false);
  });

  it("hydrates saved favorites on mount for a signed-in user", async () => {
    const calls = mockApi({ session: { user: { id: "u1", approved: true } }, favorites: ["1"] });

    render(<ListingsPage />);
    await screen.findByText("1231 Dream St");

    await waitFor(() => expect(calls.some((url) => url.startsWith("/api/favorites"))).toBe(true));
    // Without hydration the heart renders as an outline and clicking it would
    // delete the saved property instead of adding one.
    await waitFor(() => expect(document.querySelector("svg.text-red-500")).not.toBeNull());
  });
});
