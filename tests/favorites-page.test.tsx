import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FavoritesPage from "@/app/favorites/page";

type FetchResult = { status: number; body: unknown };

function mockFetch(handler: (url: string, init?: RequestInit) => FetchResult) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const { status, body } = handler(String(input), init);
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    } as Response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const favorite = { id: "f1", property_id: "1", created_at: "2026-01-01T00:00:00.000Z" };

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("FavoritesPage", () => {
  it("prompts anonymous visitors to sign in instead of showing a fetch error", async () => {
    mockFetch(() => ({ status: 401, body: { error: "Unauthorized" } }));

    render(<FavoritesPage />);

    expect(await screen.findByText("Sign in to see your favorites")).toBeInTheDocument();
    expect(screen.queryByText(/failed to fetch favorites/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login?redirect=/favorites",
    );
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute("href", "/signup");
  });

  it("surfaces the API's own message for real server errors", async () => {
    mockFetch(() => ({
      status: 500,
      body: { error: "Failed to fetch favorites", message: "Can't reach database server" },
    }));

    render(<FavoritesPage />);

    expect(await screen.findByText("Can't reach database server")).toBeInTheDocument();
    expect(screen.queryByText("Sign in to see your favorites")).not.toBeInTheDocument();
  });

  it("renders saved properties for a signed-in user", async () => {
    mockFetch((url) => {
      if (url.startsWith("/api/favorites")) return { status: 200, body: { favorites: [favorite] } };
      return { status: 200, body: { listing: { id: "1", address: "1231 Dream St" } } };
    });

    render(<FavoritesPage />);

    expect(await screen.findByText("You have 1 saved properties")).toBeInTheDocument();
    expect(screen.getByText("1231 Dream St")).toBeInTheDocument();
  });

  it("shows the empty state when nothing is saved", async () => {
    mockFetch(() => ({ status: 200, body: { favorites: [] } }));

    render(<FavoritesPage />);

    expect(await screen.findByText("No favorites yet")).toBeInTheDocument();
  });

  it("drops a property from the list once removal succeeds", async () => {
    mockFetch((url, init) => {
      if (url.startsWith("/api/favorites") && init?.method === "POST") {
        return { status: 200, body: { favorited: false } };
      }
      if (url.startsWith("/api/favorites")) return { status: 200, body: { favorites: [favorite] } };
      return { status: 404, body: {} };
    });

    render(<FavoritesPage />);
    await screen.findByText("You have 1 saved properties");

    await userEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(screen.getByText("No favorites yet")).toBeInTheDocument());
  });

  it("falls back to the sign-in prompt when the session expires mid-removal", async () => {
    mockFetch((url, init) => {
      if (url.startsWith("/api/favorites") && init?.method === "POST") {
        return { status: 401, body: { error: "Unauthorized" } };
      }
      if (url.startsWith("/api/favorites")) return { status: 200, body: { favorites: [favorite] } };
      return { status: 404, body: {} };
    });

    render(<FavoritesPage />);
    await screen.findByText("You have 1 saved properties");

    await userEvent.click(screen.getByRole("button"));

    expect(await screen.findByText("Sign in to see your favorites")).toBeInTheDocument();
  });
});
