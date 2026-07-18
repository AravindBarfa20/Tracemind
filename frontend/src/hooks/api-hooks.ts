import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Service, ServiceListResponse, User, TokenResponse } from '@/types/api';

// ========================
// Auth Hooks
// ========================

export function useRegister() {
  return useMutation({
    mutationFn: (data: { email: string; full_name: string; password: string }) =>
      apiClient.post<User>('/auth/register', data),
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      apiClient.post<TokenResponse>('/auth/login', data),
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => apiClient.get<User>('/auth/me'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

// ========================
// Services Hooks
// ========================

interface ServiceListParams {
  page?: number;
  page_size?: number;
  status?: string;
  environment?: string;
  team?: string;
  search?: string;
}

export function useServices(params: ServiceListParams = {}) {
  const queryString = new URLSearchParams();
  if (params.page) queryString.set('page', String(params.page));
  if (params.page_size) queryString.set('page_size', String(params.page_size));
  if (params.status) queryString.set('status', params.status);
  if (params.environment) queryString.set('environment', params.environment);
  if (params.team) queryString.set('team', params.team);
  if (params.search) queryString.set('search', params.search);

  const qs = queryString.toString();
  const path = `/services${qs ? `?${qs}` : ''}`;

  return useQuery({
    queryKey: ['services', params],
    queryFn: () => apiClient.get<ServiceListResponse>(path),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useService(slug: string) {
  return useQuery({
    queryKey: ['service', slug],
    queryFn: () => apiClient.get<Service>(`/services/${slug}`),
    enabled: !!slug,
    staleTime: 30 * 1000,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      service_type: string;
      environment: string;
      base_url?: string;
      health_endpoint?: string;
      team?: string;
      tags?: string[];
    }) => apiClient.post<Service>('/services', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

export function useUpdateService(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<{
      name: string;
      description: string;
      service_type: string;
      environment: string;
      base_url: string;
      health_endpoint: string;
      team: string;
      tags: string[];
    }>) => apiClient.put<Service>(`/services/${slug}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service', slug] });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => apiClient.delete<Service>(`/services/${slug}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

export function useServiceHealth(slug: string) {
  return useQuery({
    queryKey: ['service-health', slug],
    queryFn: () => apiClient.get<{ status: string; latency_ms: number; checked_at: string }>(`/services/${slug}/health`),
    enabled: !!slug,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
}

// ========================
// Health Check Hook
// ========================

export function useSystemHealth() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const start = performance.now();
      const res = await fetch('/health');
      const elapsed = Math.round(performance.now() - start);
      if (!res.ok) throw new Error('Health check failed');
      const data = await res.json();
      return { ...data, latency_ms: elapsed };
    },
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
}
