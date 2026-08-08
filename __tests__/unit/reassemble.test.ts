import { describe, it, expect } from "vitest";
import { reassembleDynamicContent } from "../../src/dynamicPages/reassemble";

describe("reassembleDynamicContent", () => {
  const pageData = {
    "@type": "DynamicPage",
    title: "Home",
    items: [
      {
        "@id": "https://site/++api++/home/rows",
        "@type": "DynamicPageFolder",
      },
      { "@id": "https://site/++api++/home/other", "@type": "Link" },
    ],
  } as unknown as Record<string, any>;

  const searchResults = [
    {
      "@id": "https://site/++api++/home/rows/row-a",
      "@type": "DynamicPageRow",
      title: "Row A",
    },
    {
      "@id": "https://site/++api++/home/rows/row-b",
      "@type": "DynamicPageRow",
      title: "Row B",
    },
    {
      "@id": "https://site/++api++/home/rows/row-a/item-1",
      "@type": "DynamicPageRowFeatured",
      title: "Item 1",
    },
    {
      "@id": "https://site/++api++/home/rows/row-a/item-2",
      "@type": "DynamicPageRowFeatured",
      title: "Item 2",
    },
    {
      "@id": "https://site/++api++/home/rows/row-b/item-3",
      "@type": "DynamicPageRowFeatured",
      title: "Item 3",
    },
  ];

  it("groups featured items under their parent row and nests them in the page output", () => {
    const result = reassembleDynamicContent(pageData, searchResults);

    expect(result.dynamic_rows_folder_full).toEqual({
      "@id": "https://site/++api++/home/rows",
      "@type": "DynamicPageFolder",
      rows_items_full: [
        {
          "@id": "https://site/++api++/home/rows/row-a",
          "@type": "DynamicPageRow",
          title: "Row A",
          featured_items_full: [
            {
              "@id": "https://site/++api++/home/rows/row-a/item-1",
              "@type": "DynamicPageRowFeatured",
              title: "Item 1",
            },
            {
              "@id": "https://site/++api++/home/rows/row-a/item-2",
              "@type": "DynamicPageRowFeatured",
              title: "Item 2",
            },
          ],
        },
        {
          "@id": "https://site/++api++/home/rows/row-b",
          "@type": "DynamicPageRow",
          title: "Row B",
          featured_items_full: [
            {
              "@id": "https://site/++api++/home/rows/row-b/item-3",
              "@type": "DynamicPageRowFeatured",
              title: "Item 3",
            },
          ],
        },
      ],
    });
  });

  it("leaves the page payload unchanged when there is no rows folder", () => {
    const noRowsFolder = {
      "@type": "document",
      title: "Doc",
      items: [],
    };
    const result = reassembleDynamicContent(noRowsFolder, searchResults);
    expect(result).toEqual(noRowsFolder);
    expect(result.dynamic_rows_folder_full).toBeUndefined();
  });

  it("only attaches rows found inside the rows folder", () => {
    const result = reassembleDynamicContent(pageData, [
      {
        "@id": "https://site/++api++/home/rows/row-a",
        "@type": "DynamicPageRow",
      },
      {
        "@id": "https://site/++api++/somewhere-else/wrong",
        "@type": "DynamicPageRow",
      },
      {
        "@id": "https://site/++api++/home/rows/row-a/item-1",
        "@type": "DynamicPageRowFeatured",
      },
    ]);

    const rowsFolder = result.dynamic_rows_folder_full as {
      rows_items_full: Array<{ "@id": string }>;
    };
    const rowIds = rowsFolder.rows_items_full.map((r) => r["@id"]);
    expect(rowIds).toEqual(["https://site/++api++/home/rows/row-a"]);
  });

  it("does not mutate the input page data", () => {
    const snapshot = JSON.stringify(pageData);
    reassembleDynamicContent(pageData, searchResults);
    expect(JSON.stringify(pageData)).toBe(snapshot);
  });
});