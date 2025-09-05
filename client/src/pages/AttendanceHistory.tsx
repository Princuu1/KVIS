import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Nav from "@/components/Nav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, Filter, TrendingUp, Calendar, CalendarX, FileText } from "lucide-react";

export default function AttendanceHistory() {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    subject: "",
  });

  const { data: records, isLoading } = useQuery({
    queryKey: ["/api/attendance", filters],
    staleTime: 2 * 60 * 1000,
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/attendance/stats"],
    staleTime: 5 * 60 * 1000,
  });

  const attendanceStats = stats?.stats || {
    totalPresent: 0,
    totalAbsent: 0,
    totalLeave: 0,
    percentage: 0
  };

  const attendanceRecords = records?.records || [];

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const exportToCSV = () => {
    if (!attendanceRecords.length) return;

    const headers = ['Date', 'Subject', 'Time', 'Status', 'Method', 'Location'];
    const csvData = attendanceRecords.map((record: any) => [
      new Date(record.date).toLocaleDateString(),
      record.subject || 'N/A',
      new Date(record.date).toLocaleTimeString(),
      record.status,
      record.method || 'N/A',
      record.location || 'N/A'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'attendance_history.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      present: { label: 'Present', variant: 'default' as const, className: 'bg-green-100 text-green-700' },
      absent: { label: 'Absent', variant: 'destructive' as const, className: 'bg-red-100 text-red-700' },
      leave: { label: 'Leave', variant: 'secondary' as const, className: 'bg-orange-100 text-orange-700' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.absent;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      
      <main className="pt-16 pb-20 md:pt-0 md:pb-0 md:ml-64 min-h-screen">
        <div className="p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Attendance History</h2>
              <p className="text-muted-foreground">View and export your attendance records</p>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="startDate">From Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      data-testid="input-start-date"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">To Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      data-testid="input-end-date"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Select onValueChange={(value) => handleFilterChange('subject', value)}>
                      <SelectTrigger data-testid="select-subject">
                        <SelectValue placeholder="All Subjects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Subjects</SelectItem>
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                        <SelectItem value="Physics">Physics</SelectItem>
                        <SelectItem value="Chemistry">Chemistry</SelectItem>
                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end space-x-2">
                    <Button 
                      className="flex-1"
                      data-testid="button-apply-filters"
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={exportToCSV}
                      disabled={!attendanceRecords.length}
                      data-testid="button-export-csv"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600" data-testid="text-total-present">
                      {attendanceStats.totalPresent}
                    </p>
                    <p className="text-sm text-muted-foreground">Present</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-red-600" data-testid="text-total-absent">
                      {attendanceStats.totalAbsent}
                    </p>
                    <p className="text-sm text-muted-foreground">Absent</p>
                  </div>
                  <CalendarX className="w-8 h-8 text-red-600" />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-orange-600" data-testid="text-total-leave">
                      {attendanceStats.totalLeave}
                    </p>
                    <p className="text-sm text-muted-foreground">Leave</p>
                  </div>
                  <FileText className="w-8 h-8 text-orange-600" />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-blue-600" data-testid="text-attendance-percentage">
                      {attendanceStats.percentage}%
                    </p>
                    <p className="text-sm text-muted-foreground">Percentage</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
              </Card>
            </div>

            {/* Attendance Table */}
            <Card>
              <CardContent className="p-0">
                <div className="p-6 border-b border-border">
                  <h3 className="font-semibold text-foreground">Attendance Records</h3>
                </div>
                
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading records...</p>
                  </div>
                ) : attendanceRecords.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-4 font-medium text-foreground">Date</th>
                          <th className="text-left p-4 font-medium text-foreground">Subject</th>
                          <th className="text-left p-4 font-medium text-foreground">Time</th>
                          <th className="text-left p-4 font-medium text-foreground">Status</th>
                          <th className="text-left p-4 font-medium text-foreground">Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceRecords.map((record: any, index: number) => (
                          <tr key={record.id} className="border-b border-border" data-testid={`record-row-${index}`}>
                            <td className="p-4 text-foreground">
                              {new Date(record.date).toLocaleDateString()}
                            </td>
                            <td className="p-4 text-foreground">
                              {record.subject || 'N/A'}
                            </td>
                            <td className="p-4 text-muted-foreground">
                              {new Date(record.date).toLocaleTimeString()}
                            </td>
                            <td className="p-4">
                              {getStatusBadge(record.status)}
                            </td>
                            <td className="p-4 text-muted-foreground">
                              {record.method === 'face_recognition' ? 'Face Recognition' : 
                               record.method === 'manual' ? 'Manual' : 
                               record.method || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center" data-testid="empty-records">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium text-foreground mb-2">No attendance records found</h3>
                    <p className="text-muted-foreground">Start marking your attendance to see records here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
