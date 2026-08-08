import { describe, it, expect } from "vitest";
import { computeOrderingPayload, rowShortName } from "../../src/dynamicPages/ordering";

describe("rowShortName", () => {
  it("returns the last path segment for full URLs", () => {
    expect(rowShortName("https://site/++api++/home/rows/row-a/")).toBe("row-a");
  });

  it("returns short ids unchanged", () => {
    expect(rowShortName("row-a")).toBe("row-a");
  });
});

describe("computeOrderingPayload", () => {
  const folderItems = [{ "@id": "https://site/++api++/rows/row-a" }, { "@id": "https://site/++api++/rows/row-b" }] as {
    "@id": string;
  }[];

  it("computes a delta for a numeric target position (position - current index)", () => {
    expect(computeOrderingPayload(folderItems, "row-a", "1")).toEqual({
      ordering: { obj_id: "row-a", delta: 1 },
    });
  });

  it("treats a non-numeric position (top/bottom) as a verbatim delta", () => {
    expect(computeOrderingPayload(folderItems, "row-a", "top")).toEqual({
      ordering: { obj_id: "row-a", delta: "top" },
    });
  });

  it("accepts a full row URL and still emits the short id", () => {
    expect(computeOrderingPayload(folderItems, "https://site/++api++/rows/row-b", "2")).toEqual({
      ordering: { obj_id: "row-b", delta: 1 },
    });
  });

  it("throws when the row is not present in the folder", () => {
    expect(() => computeOrderingPayload(folderItems, "missing", "1")).toThrow(
      "Row not found in folder",
    );
  });
});