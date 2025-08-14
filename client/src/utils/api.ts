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

    uploadBlueprint: (data: {
      projectId: number;
      file: File;
    }) => {
      const formData = new FormData();
      formData.append('blueprint', data.file);
      formData.append('projectId', data.projectId.toString());

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
};

export { ApiError };
