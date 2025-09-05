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
      const query = new URLSearchParams(params).toString();
      return apiRequest("GET", `/api/attendance${query ? `?${query}` : ""}`);
    },
    create: (data: any) => apiRequest("POST", "/api/attendance", data),
    getStats: () => apiRequest("GET", "/api/attendance/stats"),
  },
  
  calendar: {
    getEvents: (params?: { startDate?: string; endDate?: string }) => {
      const query = new URLSearchParams(params).toString();
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
      const query = new URLSearchParams(params as any).toString();
      return apiRequest("GET", `/api/chat/messages${query ? `?${query}` : ""}`);
    },
  },
  
  user: {
    updateFaceDescriptor: (data: { faceDescriptor: number[] }) =>
      apiRequest("POST", "/api/user/face-descriptor", data),
  },
};
