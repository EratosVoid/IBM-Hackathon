import { useAuthStore } from "@/stores/authStore";

const API_BASE_URL = import.meta.env.VITE_API_BACKEND_URL;

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiRequestOptions extends RequestInit {
  requireAuth?: boolean;
}

// Helper functions for the policy API
const getAuthToken = () => {
  return useAuthStore.getState().token;
};

const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      error.error || error.message || `HTTP ${response.status}`
    );
  }
  return response.json();
};

export const api = {
  async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const { requireAuth = false, ...fetchOptions } = options;
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    };

    // Add auth token if required
    if (requireAuth) {
      const token = useAuthStore.getState().token;
      if (token) {
        (headers as any).Authorization = `Bearer ${token}`;
      } else {
        throw new ApiError(401, "Authentication required");
      }
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status,
          error.error || `HTTP ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, "Network error");
    }
  },

  // Generic HTTP methods
  async get<T>(endpoint: string, options: Omit<ApiRequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET', requireAuth: true });
  },

  async post<T>(endpoint: string, data?: any, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      requireAuth: true
    });
  },

  async put<T>(endpoint: string, data?: any, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      requireAuth: true
    });
  },

  async delete<T>(endpoint: string, options: Omit<ApiRequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE', requireAuth: true });
  },

  // Auth endpoints
  auth: {
    login: (email: string, password: string) =>
      api.request<{ success: boolean; token: string; user: any }>(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        }
      ),

    register: (email: string, password: string, name: string) =>
      api.request<{ success: boolean; token: string; user: any }>(
        "/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify({ email, password, name }),
        }
      ),

    logout: () =>
      api.request<{ success: boolean }>("/api/auth/logout", {
        method: "POST",
        requireAuth: true,
      }),
  },

  // Project endpoints
  projects: {
    list: () =>
      api.request<{ success: boolean; projects: any[] }>("/api/projects", {
        requireAuth: true,
      }),

    create: (projectData: {
      name: string;
      description?: string;
      cityType?: string;
      constraints?: any;
    }) =>
      api.request<{ success: boolean; project: any }>("/api/init-city", {
        method: "POST",
        body: JSON.stringify(projectData),
        requireAuth: true,
      }),

    getById: (id: number) =>
      api.request<{ success: boolean; project: any }>(`/api/projects/${id}`, {
        requireAuth: true,
      }),

    delete: (id: number) =>
      api.request<{ success: boolean; message: string }>(
        `/api/projects/${id}`,
        {
          method: "DELETE",
          requireAuth: true,
        }
      ),

    updateBlueprint: (projectId: number, blueprintData: { width: number; height: number; unit: string }) =>
      api.request<{ success: boolean; message: string; project: any }>(`/api/projects/${projectId}/blueprint`, {
        method: "PUT",
        body: JSON.stringify(blueprintData),
        requireAuth: true,
      }),

    uploadBlueprint: (data: { projectId: number; file: File }) => {
      const formData = new FormData();
      formData.append("blueprint", data.file);
      formData.append("projectId", data.projectId.toString());

      const token = useAuthStore.getState().token;
      return fetch(`${API_BASE_URL}/api/upload-blueprint`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }).then(async (response) => {
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new ApiError(
            response.status,
            error.error || `HTTP ${response.status}`
          );
        }
        return response.json();
      });
    },

    getFeedback: (projectId: number) =>
      api.request<{
        success: boolean;
        feedback: Array<{
          id: number;
          author: string;
          category: string;
          rating: number;
          comment: string;
          sentiment: string;
          timestamp: string;
        }>;
        stats: {
          total: number;
          avgRating: number;
          positive: number;
          negative: number;
          neutral: number;
        };
      }>(`/api/projects/${projectId}/feedback`, {
        requireAuth: true,
      }),
  },

  // Public Project endpoints (no authentication required)
  publicProjects: {
    getById: (id: number) =>
      api.request<{ success: boolean; project: any }>(`/api/projects/public/${id}`, {
        requireAuth: false,
      }),

    submitFeedback: (projectId: number, feedbackData: {
      name?: string;
      category: string;
      rating: number;
      comment: string;
    }) =>
      api.request<{ success: boolean; message: string; feedback_id?: number }>(`/api/projects/public/${projectId}/feedback`, {
        method: "POST",
        body: JSON.stringify(feedbackData),
        requireAuth: false,
      }),
  },

  // AI Planner endpoints
  planner: {
    sendPrompt: (message: string, projectId: number, context: any = {}) =>
      api.request<{
        success: boolean;
        response: {
          agent_response: string;
          reasoning: string;
        };
      }>("/api/prompt", {
        method: "POST",
        body: JSON.stringify({ message, projectId, context }),
        requireAuth: true,
      }),
  },

  // Simulation endpoints
  simulation: {
    run: (projectId: number) =>
      api.request<{
        success: boolean;
        simulation: {
          metrics: any;
        };
      }>(`/api/simulation/${projectId}`, {
        requireAuth: true,
      }),
  },

  // Document endpoints
  documents: {
    upload: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const token = useAuthStore.getState().token;
      return fetch(`${API_BASE_URL}/documents/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }).then((res) => res.json());
    },

    query: (query: string) =>
      api.request<{
        answer: string;
        confidence_score: number;
      }>("/query", {
        method: "POST",
        body: JSON.stringify({ query }),
        requireAuth: true,
      }),

    list: () =>
      api.request<any[]>("/documents/list", {
        requireAuth: true,
      }),

    delete: (docId: string) =>
      api.request<{ message: string }>(`/documents/${docId}`, {
        method: "DELETE",
        requireAuth: true,
      }),
  },

  // Feedback endpoints
  feedback: {
    analyze: (feedbackText: string) =>
      api.request<{
        feedback_text: string;
        sentiment_label: string;
        sentiment_score: number;
        topics: string[];
        confidence: number;
      }>("/feedback/analyze", {
        method: "POST",
        body: JSON.stringify({ feedback_text: feedbackText }),
        requireAuth: true,
      }),
  },

  // Policy document endpoints (uses main API server)
  policy: {
    upload: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch(`${API_BASE_URL}/api/policy/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: formData,
      });
      
      return handleApiResponse(response);
    },
    
    query: async (query: string) => {
      const response = await fetch(`${API_BASE_URL}/api/policy/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ query }),
      });
      
      return handleApiResponse(response);
    },
    
    list: async () => {
      const response = await fetch(`${API_BASE_URL}/api/policy/list`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      
      return handleApiResponse(response);
    },
    
    delete: async (docId: string) => {
      const response = await fetch(`${API_BASE_URL}/api/policy/${docId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      
      return handleApiResponse(response);
    },
  },
};

export { ApiError };
