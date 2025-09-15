// client/src/hooks/useAttendance.ts
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  status: string;
  subject: string;
  reason?: string;
  method?: string;
  verified?: boolean;
  location?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export interface AttendanceResponse {
  records: AttendanceRecord[];
}

export const useAttendance = () =>
  useQuery<AttendanceResponse>({
    queryKey: ["attendance"],
    queryFn: () => apiRequest<AttendanceResponse>("GET", "/api/attendance"),
  });
