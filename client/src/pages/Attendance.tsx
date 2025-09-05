import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Nav from "@/components/Nav";
import FaceScanner from "@/components/FaceScanner";
import { useGeoFence } from "@/hooks/useGeoFence";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Camera, MapPin, Check, X, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function Attendance() {
  const [selectedStatus, setSelectedStatus] = useState<'present' | 'absent' | 'leave' | null>(null);
  const [reason, setReason] = useState("");
  const [subject, setSubject] = useState("");
  const [showFaceScanner, setShowFaceScanner] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { isWithinGeofence, isLoading: geoLoading, error: geoError, distance } = useGeoFence();

  const attendanceMutation = useMutation({
    mutationFn: api.attendance.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/stats"] });
      toast({
        title: "Success",
        description: "Attendance marked successfully",
      });
      // Reset form
      setSelectedStatus(null);
      setReason("");
      setSubject("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark attendance",
        variant: "destructive",
      });
    },
  });

  const handleManualSubmit = () => {
    if (!selectedStatus) {
      toast({
        title: "Error",
        description: "Please select attendance status",
        variant: "destructive",
      });
      return;
    }

    attendanceMutation.mutate({
      status: selectedStatus,
      subject: subject || null,
      reason: reason || null,
      method: 'manual',
      verified: false,
      date: new Date().toISOString(),
    });
  };

  const handleFaceDetected = async (faceDescriptor: Float32Array) => {
    try {
      // Save face descriptor for future verification
      await api.user.updateFaceDescriptor({
        faceDescriptor: Array.from(faceDescriptor)
      });

      // Mark attendance with face recognition
      attendanceMutation.mutate({
        status: 'present',
        subject: subject || null,
        method: 'face_recognition',
        verified: true,
        date: new Date().toISOString(),
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process face recognition",
        variant: "destructive",
      });
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const statusOptions = [
    {
      id: 'present',
      label: 'Present',
      icon: Check,
      color: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
    },
    {
      id: 'absent',
      label: 'Absent',
      icon: X,
      color: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
    },
    {
      id: 'leave',
      label: 'Leave',
      icon: Clock,
      color: 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      
      <main className="pt-16 pb-20 md:pt-0 md:pb-0 md:ml-64 min-h-screen">
        <div className="p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Mark Attendance</h2>
              <p className="text-muted-foreground" data-testid="text-current-date">Today, {currentDate}</p>
            </div>

            {/* Subject Input */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <label className="block text-sm font-medium text-foreground mb-2">Subject/Class</label>
                <input
                  type="text"
                  placeholder="Enter subject name (optional)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground"
                  data-testid="input-subject"
                />
              </CardContent>
            </Card>

            {/* Location Status */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Location Verification</h3>
                  <Badge 
                    variant={isWithinGeofence ? "default" : "destructive"}
                    data-testid="badge-location-status"
                  >
                    {geoLoading ? "Checking..." : 
                     geoError ? "Error" :
                     isWithinGeofence ? "✓ On Campus" : "✗ Off Campus"}
                  </Badge>
                </div>
                <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span data-testid="text-location-info">
                    {geoError ? geoError :
                     distance !== null ? `${Math.round(distance)}m from campus` :
                     "Getting location..."}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Face Recognition Section */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Face Recognition</h3>
                <div className="text-center">
                  <div className="w-48 h-48 mx-auto mb-4 bg-muted rounded-xl border-2 border-dashed border-border flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Click to start camera</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowFaceScanner(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    data-testid="button-start-face-scan"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Start Face Scan
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Manual Attendance */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Manual Attendance</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {statusOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.id}
                          onClick={() => setSelectedStatus(option.id as any)}
                          className={`p-4 rounded-lg border-2 transition-colors ${
                            selectedStatus === option.id 
                              ? option.color + ' ring-2 ring-offset-2 ring-primary' 
                              : option.color
                          }`}
                          data-testid={`button-status-${option.id}`}
                        >
                          <Icon className="w-6 h-6 mx-auto mb-2" />
                          <p className="font-medium">{option.label}</p>
                        </button>
                      );
                    })}
                  </div>
                  
                  {(selectedStatus === 'absent' || selectedStatus === 'leave') && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Reason {selectedStatus === 'leave' ? '(for leave)' : '(if absent)'}
                      </label>
                      <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Enter reason..."
                        rows={3}
                        data-testid="textarea-reason"
                      />
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleManualSubmit}
                    disabled={!selectedStatus || attendanceMutation.isPending}
                    className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    data-testid="button-submit-attendance"
                  >
                    {attendanceMutation.isPending ? "Submitting..." : "Submit Attendance"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <FaceScanner
        isOpen={showFaceScanner}
        onClose={() => setShowFaceScanner(false)}
        onFaceDetected={handleFaceDetected}
      />
    </div>
  );
}
