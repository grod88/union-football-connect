/**
 * API-Football HTTP Client
 * Routes requests through Edge Function proxy to avoid CORS issues
 */

export interface ApiResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: string[] | Record<string, string>;
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: T;
}

export class ApiFootballClient {
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const functionUrl = `https://${projectId}.supabase.co/functions/v1/api-football-proxy?endpoint=${encodeURIComponent(endpoint)}`;

      const response = await fetch(functionUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Proxy request failed: ${response.status} ${response.statusText}`);
      }

      const data: ApiResponse<T> = await response.json();

      // Check for API-level errors
      if (data.errors && (Array.isArray(data.errors) ? data.errors.length > 0 : Object.keys(data.errors).length > 0)) {
        const errorMessage = Array.isArray(data.errors)
          ? data.errors.join(', ')
          : Object.values(data.errors).join(', ');
        throw new Error(`API error: ${errorMessage}`);
      }

      return data;
    } catch (error) {
      console.error('API-Football request error:', error);
      throw error;
    }
  }
}

// Singleton instance
export const apiFootballClient = new ApiFootballClient();
