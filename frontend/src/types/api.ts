export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  role: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  project_id: string;
  organization_id: string;
  description: string | null;
  service_type: 'api' | 'worker' | 'cron' | 'frontend';
  environment: 'production' | 'staging' | 'development';
  base_url: string | null;
  health_endpoint: string | null;
  team: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  status: 'active' | 'inactive' | 'deprecated';
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceListResponse {
  items: Service[];
  total: number;
  page: number;
  page_size: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
