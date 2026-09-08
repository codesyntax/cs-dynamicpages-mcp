export type JsonRecord = Record<string, unknown>;

export interface RowInput {
  title?: string;
  row_type: string;
  fields?: JsonRecord;
  featured?: FeaturedInput[];
}

export interface FeaturedInput {
  title?: string;
  fields?: JsonRecord;
}

export interface UploadInput {
  filename: string;
  data: string;
  contentType: string;
  title?: string;
}

export function buildRowPayload({ title, row_type, fields }: RowInput): JsonRecord {
  return {
    "@type": "DynamicPageRow",
    title: title || "New Row",
    row_type,
    ...(fields || {}),
  };
}

export function buildFeaturedPayload({ title, fields }: FeaturedInput): JsonRecord {
  return {
    "@type": "DynamicPageRowFeatured",
    title: title || "Featured Item",
    ...(fields || {}),
  };
}

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".csv": "text/csv",
  ".zip": "application/zip",
};

export function guessMimeType(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

export function buildUploadPayload({ filename, data, contentType, title }: UploadInput): JsonRecord {
  const isImage = contentType.startsWith("image/");
  return {
    "@type": isImage ? "Image" : "File",
    title: title || filename,
    [isImage ? "image" : "file"]: {
      data,
      encoding: "base64",
      "content-type": contentType,
      filename,
    },
  };
}
