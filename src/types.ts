export interface PloneCredentials {
  api_url: string;
  token?: string;
  cookie?: string;
}

export interface PloneResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

export interface DynamicPageRowData {
  title: string;
  row_type: string;
  fields?: Record<string, any>;
  featured?: FeaturedItemData[];
}

export interface FeaturedItemData {
  title: string;
  fields?: Record<string, any>;
}
