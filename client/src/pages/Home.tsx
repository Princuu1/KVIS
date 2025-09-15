import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import Nav from "@/components/Nav";
import { Card, CardContent } from "@/components/ui/card";
import {
  Camera,
  History,
  MessageCircle,
  TrendingUp,
  Calendar,
  CalendarX,
  FileText,
} from "lucide-react";

// 👇 Define types for API responses
interface AttendanceStatsResponse {
  stats: {
    totalPresent: number;
    totalAbsent: number;
    totalLeave: number;
    percentage: number;
  };
}

interface AttendanceRecord {
  id: string;
  status: "present" | "absent" | "leave";
  subject?: string;
  date: string;
}

interface AttendanceRecordsResponse {
  records: AttendanceRecord[];
}

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch attendance stats
  const { data: stats } = useQuery<AttendanceStatsResponse>({
    queryKey: ["/api/attendance/stats"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch recent attendance records
  const { data: recentRecords } = useQuery<AttendanceRecordsResponse>({
    queryKey: ["/api/attendance"],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const attendanceStats = stats?.stats || {
    totalPresent: 0,
    totalAbsent: 0,
    totalLeave: 0,
    percentage: 0,
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // ✅ Always safe: fallback to empty array
  const safeRecords: AttendanceRecord[] = recentRecords?.records ?? [];

  const quickActions = [
    {
      title: "Mark Attendance",
      description: "Use face recognition",
      icon: Camera,
      color: "bg-primary",
      path: "/attendance",
    },
    {
      title: "View History",
      description: "Check past records",
      icon: History,
      color: "bg-secondary",
      path: "/history",
    },
    {
      title: "Chat Room",
      description: "Connect with peers",
      icon: MessageCircle,
      color: "bg-green-500",
      path: "/chat",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      {/* Main Content Area */}
      <main className="pt-16 pb-20 md:pt-0 md:pb-0 md:ml-64 min-h-screen">
        <div className="p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            {/* Welcome Section */}
            <div className="bg-card rounded-xl p-6 mb-6 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2
                    className="text-xl font-semibold text-foreground mb-1"
                    data-testid="text-welcome"
                  >
                    Welcome back, {user?.fullName || "Student"}!
                  </h2>
                  <p
                    className="text-muted-foreground"
                    data-testid="text-roll-number"
                  >
                    Roll No: {user?.collegeRollNo || "N/A"}&nbsp;&nbsp;&nbsp;
                    Class: {user?.studentClass || "N/A"}

                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p
                    className="text-lg font-medium text-foreground"
                    data-testid="text-current-date"
                  >
                    {currentDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-2xl font-bold text-foreground"
                      data-testid="text-attendance-percentage"
                    >
                      {attendanceStats.percentage}%
                    </p>
                    <p className="text-sm text-muted-foreground">Attendance</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-2xl font-bold text-foreground"
                      data-testid="text-present-days"
                    >
                      {attendanceStats.totalPresent}
                    </p>
                    <p className="text-sm text-muted-foreground">Present Days</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-2xl font-bold text-foreground"
                      data-testid="text-leave-days"
                    >
                      {attendanceStats.totalLeave}
                    </p>
                    <p className="text-sm text-muted-foreground">Leave Days</p>
                  </div>
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={() => setLocation(action.path)}
                    className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-shadow text-left group"
                    data-testid={`button-quick-action-${action.path.replace(
                      "/",
                      ""
                    )}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {action.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Recent Activity */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {safeRecords.length > 0 ? (
                    safeRecords.slice(0, 3).map((record, index) => (
                      <div
                        key={record.id}
                        className="flex items-center space-x-4"
                        data-testid={`activity-record-${index}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            record.status === "present"
                              ? "bg-green-500"
                              : record.status === "absent"
                              ? "bg-red-500"
                              : "bg-orange-500"
                          }`}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            Attendance marked for {record.subject || "Class"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(record.date).toLocaleDateString()} at{" "}
                            {new Date(record.date).toLocaleTimeString()}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            record.status === "present"
                              ? "bg-green-100 text-green-700"
                              : record.status === "absent"
                              ? "bg-red-100 text-red-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {record.status.charAt(0).toUpperCase() +
                            record.status.slice(1)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8" data-testid="empty-activity">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No recent activity</p>
                      <p className="text-sm text-muted-foreground">
                        Mark your first attendance to see activity here
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
