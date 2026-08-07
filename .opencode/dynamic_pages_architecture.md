# Plone Dynamic Pages Architecture

This document describes the structure and logic of the `cs_dynamicpages` system in Plone.

## Content Hierarchy

A Dynamic Page in Plone follows a specific nesting pattern:

1. **DynamicPage**: The main container (e.g., a landing page or a portal home).
2. **DynamicPageFolder (ID: `rows`)**: A hidden folder inside every `DynamicPage` that contains all the layout sections.
3. **DynamicPageRow**: A section of the page. Each row has a `row_type` that determines its layout and fields.
4. **DynamicPageRowFeatured**: Optional child items inside a `DynamicPageRow`. These are used for sliders, accordions, or feature grids.

## Key Concepts

### The "Rows" Folder
Layout sections (Rows) are not direct children of the `DynamicPage`. They MUST be created inside the `DynamicPageFolder` located at `{page_url}/rows`.

### Row Types (`row_type`)
The `row_type` field is critical. It determines:
- Which fields in `DynamicPageRow.json` are relevant.
- If the row can have `DynamicPageRowFeatured` children (check `row_type_has_featured_add_button` in `docs/ROWTYPES.json`).
- The visual rendering on the frontend.

### Common Fields
- **title**: Internal name of the row or featured item.
- **description**: Often used as the main text block in a row.
- **extra_class**: CSS classes applied to the row wrapper (useful for custom styling like `bg-light`, `text-center`).
- **related_image**: A relation field to an Image object in Plone.
- **query**: Used in "Collection" type rows to automatically fetch content based on criteria.

## Asset Management
- **Images**: Should be uploaded to an `images` or `imagenes` folder. Use `search_content` to find existing assets before uploading new ones.
- **Links**: Use absolute Plone paths (e.g., `/es/blog/post-1`) or external URLs.

## Content Mapping Patterns (Migration)
When migrating content from a PDF to a Dynamic Page structure:
- **Heading 1 + Short Para** -> `header-hero-view` or `cs_dynamicpages-title-description-view`.
- **Three/Four Bullet Points** -> `cs_dynamicpages-features-view` (Check `columns` field).
- **Q&A or List of Details** -> `cs_dynamicpages-accordion-view`.
- **Images with Text Overlays** -> `cs_dynamicpages-featured-overlay-view`.
- **Long Narrative** -> `cs_dynamicpages-text-view` or `cs_dynamicpages-intro-text-view`.

## Workflow Patterns
- **Layout Discovery**: Always call `get_dynamic_page_content` to see the full structure including rows and featured items.
- **Validation**: Compare desired fields against `docs/DynamicPageRow.json` and `docs/DynamicPageRowFeatured.json` before sending a `POST` or `PATCH` request.

## Protocol Evolution & Performance Standards

To ensure optimal performance and reliability when managing Dynamic Pages, the following technical standards must be adhered to:

### 1. Request Optimization (Bulk Operations)
- **Problem**: Individual POST requests for large page structures (e.g., 20+ rows) are inefficient, increase authentication overhead, and risk database write conflicts.
- **Standard**: When creating multiple rows, use a bulk creation tool (e.g., `create_rows_bulk`) if available. A single transaction reduces server load and ensures layout atomicity.
- **Retrieval Optimization**: To avoid partial layout data, `get_dynamic_page_content` fetches with `b_size=1000`. For general discovery, `search_content` defaults to `b_size=100`.

### 2. Schema Enforcement & Validation
- **Local Pre-validation**: The MCP agent must validate payloads against local schemas *before* network execution. 
- **Prefix Consistency**: All `row_type` values must be prefixed with the vendor namespace (e.g., `cs_dynamicpages-`) as defined in `docs/ROWTYPES.json`.
- **Mandatory Defaults**: Fields like `query` must be initialized (e.g., as an empty list `[]`) even if not used, to satisfy Plone's strict type validation.

### 3. Error Observability
- **Traceback Passthrough**: In the event of a `400 BadRequest` or `401 Unauthorized`, the full Plone traceback must be captured and returned to the agent. This allows for immediate self-correction of technical field mismatches or permission issues.
- **Permission Transparency**: Credential checks must verify effective permissions on the specific target container (e.g., the `rows` folder) before attempting modifications.
