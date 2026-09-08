import { describe, it, expect } from "vitest";
import {
  buildRowPayload,
  buildFeaturedPayload,
  buildUploadPayload,
  guessMimeType,
} from "../../src/dynamicPages/payloads";

describe("buildRowPayload", () => {
  it("builds a DynamicPageRow POST body with type, title, row_type and custom fields", () => {
    expect(
      buildRowPayload({
        title: "Hero",
        row_type: "hero",
        fields: { background_color: "#000", extra_class: "full-width" },
      }),
    ).toEqual({
      "@type": "DynamicPageRow",
      title: "Hero",
      row_type: "hero",
      background_color: "#000",
      extra_class: "full-width",
    });
  });

  it("defaults the title when not provided", () => {
    expect(buildRowPayload({ row_type: "columns" })).toEqual({
      "@type": "DynamicPageRow",
      title: "New Row",
      row_type: "columns",
    });
  });
});

describe("buildFeaturedPayload", () => {
  it("builds a DynamicPageRowFeatured POST body with type, title and custom fields", () => {
    expect(
      buildFeaturedPayload({
        title: "Card",
        fields: { body_text: "<p>hi</p>" },
      }),
    ).toEqual({
      "@type": "DynamicPageRowFeatured",
      title: "Card",
      body_text: "<p>hi</p>",
    });
  });

  it("defaults the title when not provided", () => {
    expect(buildFeaturedPayload({})).toEqual({
      "@type": "DynamicPageRowFeatured",
      title: "Featured Item",
    });
  });
});

describe("guessMimeType", () => {
  it("maps known extensions to their mime types", () => {
    expect(guessMimeType("photo.PNG")).toBe("image/png");
    expect(guessMimeType("report.pdf")).toBe("application/pdf");
    expect(guessMimeType("notes.txt")).toBe("text/plain");
  });

  it("falls back to octet-stream for unknown extensions", () => {
    expect(guessMimeType("blob.xyz")).toBe("application/octet-stream");
  });
});

describe("buildUploadPayload", () => {
  it("builds an Image payload for image content types", () => {
    expect(
      buildUploadPayload({
        filename: "hero.png",
        data: "aGVsbG8=",
        contentType: "image/png",
      }),
    ).toEqual({
      "@type": "Image",
      title: "hero.png",
      image: {
        data: "aGVsbG8=",
        encoding: "base64",
        "content-type": "image/png",
        filename: "hero.png",
      },
    });
  });

  it("builds a File payload for non-image content types and honours explicit title", () => {
    expect(
      buildUploadPayload({
        filename: "report.pdf",
        data: "cGRm",
        contentType: "application/pdf",
        title: "Annual Report",
      }),
    ).toEqual({
      "@type": "File",
      title: "Annual Report",
      file: {
        data: "cGRm",
        encoding: "base64",
        "content-type": "application/pdf",
        filename: "report.pdf",
      },
    });
  });
});
