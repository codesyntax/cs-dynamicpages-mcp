import { describe, it, expect } from "vitest";
import { computeOrderingPayload, rowShortName } from "../../src/dynamicPages/ordering";

describe("rowShortName", () => {
  it("returns the last path segment for full URLs", () => {
    expect(rowShortName("https://site/++api++/home/rows/row-a/")).toBe("row-a");
  });

  it("returns short ids unchanged", () => {
    expect(rowShortName("row-a")).toBe("row-a");
  });

  it("returns the last path segment for site-relative paths", () => {
    expect(rowShortName("/rows/row-a")).toBe("row-a");
  });
});

describe("computeOrderingPayload", () => {
  const folderItems = [{ "@id": "https://site/++api++/rows/row-a" }, { "@id": "https://site/++api++/rows/row-b" }] as {
    "@id": string;
  }[];

  it("computes the relative delta for a 1-based target position", () => {
    // row-a is at index 0 (position 1): moving it to position 1 is a no-op.
    expect(computeOrderingPayload(folderItems, "row-a", "1")).toEqual({
      ordering: { obj_id: "row-a", delta: 0 },
    });
    // row-b is at index 1 (position 2): moving it to position 1 is -1.
    expect(computeOrderingPayload(folderItems, "row-b", "1")).toEqual({
      ordering: { obj_id: "row-b", delta: -1 },
    });
  });

  it("treats a non-numeric position (top/bottom) as a verbatim delta", () => {
    expect(computeOrderingPayload(folderItems, "row-a", "top")).toEqual({
      ordering: { obj_id: "row-a", delta: "top" },
    });
  });

  it("accepts a full row URL and still emits the short id", () => {
    expect(computeOrderingPayload(folderItems, "https://site/++api++/rows/row-b", "2")).toEqual({
      ordering: { obj_id: "row-b", delta: 0 },
    });
  });

  it("accepts a site-relative path and still emits the short id", () => {
    expect(computeOrderingPayload(folderItems, "/rows/row-b", "2")).toEqual({
      ordering: { obj_id: "row-b", delta: 0 },
    });
  });

  it("throws when the row is not present in the folder", () => {
    expect(() => computeOrderingPayload(folderItems, "missing", "1")).toThrow(
      "Row not found in folder",
    );
  });
});