// client/src/lib/api.ts
import { apiRequest } from "./queryClient";

export const api = {
  auth: {
    login: (data: { collegeRollNo: string; password: string }) =>
      apiRequest("POST", "/api/auth/login", data),
    register: (data: FormData) =>
      apiRequest("POST", "/api/auth/register", data),
    logout: () => apiRequest("POST", "/api/auth/logout"),
    me: () => apiRequest("GET", "/api/auth/me"),
  },

  attendance: {
    getRecords: (params?: { startDate?: string; endDate?: string }) => {
      const query = new URLSearchParams(params || {}).toString();
      return apiRequest("GET", `/api/attendance${query ? `?${query}` : ""}`);
    },
    create: (data: any) => apiRequest("POST", "/api/attendance", data),
    getStats: () => apiRequest("GET", "/api/attendance/stats"),
  },

  calendar: {
    getEvents: (params?: { startDate?: string; endDate?: string }) => {
      const query = new URLSearchParams(params || {}).toString();
      return apiRequest("GET", `/api/calendar${query ? `?${query}` : ""}`);
    },
    create: (data: any) => apiRequest("POST", "/api/calendar", data),
  },

  exams: {
    getSchedule: () => apiRequest("GET", "/api/exams"),
    create: (data: any) => apiRequest("POST", "/api/exams", data),
  },

  syllabus: {
    getItems: () => apiRequest("GET", "/api/syllabus"),
    create: (data: any) => apiRequest("POST", "/api/syllabus", data),
  },

  chat: {
    getMessages: (params?: { room?: string; limit?: number }) => {
      const query = new URLSearchParams(
        Object.fromEntries(
          Object.entries(params ?? {}).map(([key, value]) => [
            key,
            String(value),
          ])
        )
      ).toString();

      return apiRequest("GET", `/api/chat/messages${query ? `?${query}` : ""}`);
    },
  },

  user: {
    updateFaceDescriptor: (data: { faceDescriptor: number[] }) =>
      apiRequest("POST", "/api/user/face-descriptor", data),

    // ✅ Fixed: Handles array, object, or string response from backend
    getFaceDescriptor: async (): Promise<number[] | null> => {
      const res = await fetch("/api/user/face");
      if (!res.ok) {
        console.error("❌ Failed to fetch face descriptor", res.status);
        return null;
      }

      try {
        const data = await res.json();

        // Case 1: API returns raw array
        if (Array.isArray(data)) return data;

        // Case 2: API returns { faceDescriptor: [...] }
        if (data?.faceDescriptor) {
          if (Array.isArray(data.faceDescriptor)) {
            return data.faceDescriptor;
          }

          // Case 3: API returns { faceDescriptor: "[-0.17,0.04,...]" }
          if (typeof data.faceDescriptor === "string") {
            try {
              return JSON.parse(data.faceDescriptor);
            } catch (err) {
              console.error("❌ Failed to parse faceDescriptor string", err);
              return null;
            }
          }
        }

        return null;
      } catch (err) {
        console.error("❌ Invalid JSON from /api/user/face", err);
        return null;
      }
    },
  },
};
