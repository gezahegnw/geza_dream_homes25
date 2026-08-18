import { describe, expect, it } from "vitest";
import { safeRedirect } from "@/lib/redirect";

describe("safeRedirect", () => {
  it("keeps same-site paths", () => {
    expect(safeRedirect("/favorites")).toBe("/favorites");
    expect(safeRedirect("/listings/42")).toBe("/listings/42");
    expect(safeRedirect("/listings?page=2")).toBe("/listings?page=2");
  });

  it("falls back to /listings when nothing is requested", () => {
    expect(safeRedirect(null)).toBe("/listings");
    expect(safeRedirect(undefined)).toBe("/listings");
    expect(safeRedirect("")).toBe("/listings");
  });

  it("rejects off-site targets", () => {
    for (const value of [
      "https://evil.com",
      "http://evil.com",
      "//evil.com",
      "evil.com",
      "javascript:alert(1)",
    ]) {
      expect(safeRedirect(value)).toBe("/listings");
    }
  });

  it("rejects backslash forms browsers normalize to //", () => {
    for (const value of ["/\\evil.com", "\\\\evil.com", "\\/evil.com"]) {
      expect(safeRedirect(value)).toBe("/listings");
    }
  });

  it("rejects control characters browsers strip out of URLs", () => {
    for (const value of [
      "/\t/evil.com",
      "/\n/evil.com",
      "/\r/evil.com",
      "/\t\\evil.com",
      "\t//evil.com",
      "/\u0000/evil.com",
    ]) {
      expect(safeRedirect(value)).toBe("/listings");
    }
  });

  it("returns the normalized value, not the raw input", () => {
    expect(safeRedirect("/fav\torites")).toBe("/favorites");
  });
});
