# Content Migration & Page Replication Expertise

This document outlines the protocol for replicating the structure of an existing Dynamic Page and populating it with new content extracted from a source document (like a PDF).

## The "Skeleton + Mapping" Workflow

When asked to "Replicate Page X using PDF Y", follow these steps:

### 1. Structure Blueprinting (Extraction)
- Call `get_dynamic_page_content` on the **Source Page**.
- Analyze the `rows_items_full` list.
- For each row, record:
    - `row_type` (The most critical field).
    - Structural fields: `width`, `columns`, `extra_class`, `padding_*`, `margin_*`.
    - Content placeholders: Identify where titles, descriptions, and featured items go.

### 2. Semantic Data Extraction
- Read the **PDF content**.
- Segment the text into logical blocks that match the "shape" of the source rows.
- If the source has a 3-column feature grid, find 3 distinct points or paragraphs in the PDF.

### 3. Structural Mapping Rules
Map PDF segments to Row Types based on these conventions:
- **Hero/Header**: High-level value propositions, main titles.
- **Features/Grid**: Lists of benefits, services, or product attributes.
- **Accordion**: FAQs, technical specifications, or detailed lists.
- **Text Blocks**: Narrative content or mission statements.

### 4. Proposing the Blueprint (MANDATORY)
Before creating the new page, present a concise mapping to the user:
- "Row 1 (Hero): Using 'Company Vision' from PDF."
- "Row 2 (3-Col Grid): Using the 3 service descriptions from PDF page 2."
- "Row 3 (Accordion): Using the 'Terms & Conditions' section."

### 5. Execution (Targeted Creation)
- Create the target **DynamicPage** (if it doesn't exist).
- Navigate to `{target_page_url}/rows`.
- Use `create_dynamic_page_row` for each mapped row.
- Ensure structural fields (`extra_class`, `width`) are copied exactly from the source to preserve the visual design.

## Handling Mismatches
- **PDF has more content**: Suggest adding new rows of the same type as the existing ones to maintain rhythm.
- **PDF has less content**: Propose merging data or leaving specific sections out of the new page.
- **Missing Images**: If the source has images but the PDF doesn't, use `search_content` to find relevant generic images or ask the user for guidance.
