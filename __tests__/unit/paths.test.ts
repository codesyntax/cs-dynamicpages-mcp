import { describe, it, expect } from "vitest";
import { stripTrailingSlash, normalizePath, localPath } from "../../src/dynamicPages/paths";

describe("stripTrailingSlash", () => {
  it("removes trailing slashes", () => {
    expect(stripTrailingSlash("/rows/")).toBe("/rows");
    expect(stripTrailingSlash("/rows//")).toBe("/rows");
    expect(stripTrailingSlash("rows")).toBe("rows");
  });
});

describe("normalizePath", () => {
  it("maps root to '/'", () => {
    expect(normalizePath("/")).toBe("/");
    expect(normalizePath("")).toBe("/");
  });

  it("strips trailing slashes from other paths", () => {
    expect(normalizePath("/en/home/")).toBe("/en/home");
    expect(normalizePath("/en/home")).toBe("/en/home");
  });
});

describe("localPath", () => {
  it("extracts the site-relative path from an absolute ++api++ @id", () => {
    expect(localPath("https://site/++api++/rows/hero")).toBe("/rows/hero");
    expect(localPath("https://example.com/site/++api++/en/home/rows/row-a")).toBe(
      "/en/home/rows/row-a",
    );
  });

  it("treats paths without a scheme as already-local", () => {
    expect(localPath("/rows/hero")).toBe("/rows/hero");
  });
});