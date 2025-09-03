import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { ApiResponse } from '../types/database';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
) {
  const { immediate = true, onSuccess, onError } = options;
  
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiCall();
      
      if (response.success) {
        setState({
          data: response.data || null,
          loading: false,
          error: null,
        });
        
        if (onSuccess && response.data) {
          onSuccess(response.data);
        }
      } else {
        setState({
          data: null,
          loading: false,
          error: response.message,
        });
        
        if (onError) {
          onError(response.message);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
      
      if (onError) {
        onError(errorMessage);
      }
    }
  }, [apiCall, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  const refetch = useCallback(() => {
    execute();
  }, [execute]);

  return {
    ...state,
    execute,
    refetch,
  };
}

// Specialized hooks for common API operations
export function useUsers() {
  return useApi(() => apiService.getUsers());
}

export function useMaterials(filters?: {
  semester?: number;
  subject?: string;
  academic_year?: number;
}) {
  return useApi(() => apiService.getMaterials(filters), {
    immediate: true,
  });
}

export function useDeliveryLogs(filters?: {
  user_id?: string;
  material_id?: number;
  status?: 'pending' | 'sent' | 'failed';
}) {
  return useApi(() => apiService.getDeliveryLogs(filters));
}

export function useAuditTrail(filters?: {
  user_id?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
}) {
  return useApi(() => apiService.getAuditTrail(filters));
}

export function useSystemStats() {
  return useApi(() => apiService.getSystemStats());
}

// Mutation hook for API operations that modify data
export function useMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options: {
    onSuccess?: (data: TData) => void;
    onError?: (error: string) => void;
  } = {}
) {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
  }>({
    loading: false,
    error: null,
  });

  const mutate = useCallback(async (variables: TVariables) => {
    setState({ loading: true, error: null });
    
    try {
      const response = await mutationFn(variables);
      
      if (response.success) {
        setState({ loading: false, error: null });
        
        if (options.onSuccess && response.data) {
          options.onSuccess(response.data);
        }
        
        return response.data;
      } else {
        setState({ loading: false, error: response.message });
        
        if (options.onError) {
          options.onError(response.message);
        }
        
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setState({ loading: false, error: errorMessage });
      
      if (options.onError) {
        options.onError(errorMessage);
      }
      
      throw error;
    }
  }, [mutationFn, options]);

  return {
    ...state,
    mutate,
  };
}