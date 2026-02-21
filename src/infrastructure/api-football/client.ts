/**
 * API-Football HTTP Client
 * Configured HTTP client for making requests to API-Football
 */
import { API_CONFIG } from '@/config/api.config';

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
  private baseUrl: string;
  private headers: HeadersInit;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
    this.headers = {
      'x-rapidapi-key': API_CONFIG.key,
      'x-rapidapi-host': API_CONFIG.host,
    };
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
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
