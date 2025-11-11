import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InsertVendor, SelectVendor } from "@db/schema";
import { z } from 'zod';

type RequestResult = {
  ok: true;
} | {
  ok: false;
  message: string;
};

// Separate login credentials type from full vendor type
type VendorLoginCredentials = {
  email: string;
  password: string;
};

async function handleRequest(
  url: string,
  method: string,
  body?: VendorLoginCredentials | InsertVendor
): Promise<RequestResult> {
  try {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status >= 500) {
        return { ok: false, message: response.statusText };
      }

      const message = await response.text();
      return { ok: false, message };
    }

    return { ok: true };
  } catch (e: any) {
    return { ok: false, message: e.toString() };
  }
}

async function fetchVendor(): Promise<SelectVendor | null> {
  const response = await fetch('/api/vendor', {
    credentials: 'include'
  });

  if (!response.ok) {
    if (response.status === 401) {
      return null;
    }

    if (response.status >= 500) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    throw new Error(`${response.status}: ${await response.text()}`);
  }

  return response.json();
}

export function useVendor() {
  const queryClient = useQueryClient();

  const { data: vendor, error, isLoading } = useQuery<SelectVendor | null, Error>({
    queryKey: ['vendor'],
    queryFn: fetchVendor,
    staleTime: Infinity,
    retry: false
  });

  const loginMutation = useMutation<RequestResult, Error, VendorLoginCredentials>({
    mutationFn: (credentials) => handleRequest('/api/vendor/login', 'POST', credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor'] });
    },
  });

  const logoutMutation = useMutation<RequestResult, Error>({
    mutationFn: () => handleRequest('/api/vendor/logout', 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor'] });
    },
  });

  const registerMutation = useMutation<RequestResult, Error, InsertVendor>({
    mutationFn: (vendorData) => handleRequest('/api/vendor/register', 'POST', vendorData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor'] });
    },
  });

  return {
    vendor,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
  };
}