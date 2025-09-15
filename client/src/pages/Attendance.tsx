import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import Nav from "@/components/Nav";
import FaceScanner from "@/components/FaceScanner";
import { useGeoFence } from "@/hooks/useGeoFence";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Camera, MapPin, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function Attendance() {
  const [selectedStatus, setSelectedStatus] = useState<"leave" | null>(null);
  const [reason, setReason] = useState("");
  const [subject, setSubject] = useState("");
  const [showFaceScanner, setShowFaceScanner] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch stored face descriptor
  const { data: storedDescriptorRaw, isLoading: faceLoading } = useQuery({
    queryKey: ["/api/user/face"],
    queryFn: api.user.getFaceDescriptor,
  });

  let storedDescriptor: number[] | null = null;
  if (storedDescriptorRaw) {
    if (Array.isArray(storedDescriptorRaw)) storedDescriptor = storedDescriptorRaw;
    else if (typeof storedDescriptorRaw === "string") {
      try { storedDescriptor = JSON.parse(storedDescriptorRaw); } catch { storedDescriptor = null; }
    }
  }

  // Geofence
  const { isWithinGeofence, distance, geoError, geoLoading } = useGeoFence();

  // Attendance mutation
  const attendanceMutation = useMutation({
    mutationFn: api.attendance.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/stats"] });
      toast({ title: "Success", description: "Attendance marked successfully" });
      setSelectedStatus(null);
      setReason("");
      setSubject("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to mark attendance", variant: "destructive" });
    },
  });

  // Cosine similarity for face recognition
  function cosineSimilarity(a: number[], b: number[]) {
    if (a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Manual attendance (only Leave)
  const handleManualSubmit = () => {
    if (!selectedStatus) {
      toast({ title: "Error", description: "Please select attendance status", variant: "destructive" });
      return;
    }

    if (!subject.trim()) {
      toast({ title: "Error", description: "Class/Subject is mandatory", variant: "destructive" });
      return;
    }

    // Only Leave is allowed for manual attendance
    if (selectedStatus !== "leave") return;

    attendanceMutation.mutate({
      status: "leave",
      subject: subject,
      reason: reason || null,
      method: "manual",
      verified: false,
      date: new Date().toISOString(),
    });
  };

  // Face recognition submit (Present/Absent only)
  const handleFaceDetected = async (faceDescriptor: Float32Array) => {
    try {
      if (!storedDescriptor) {
        toast({ title: "Error", description: "No stored face data. Please register first.", variant: "destructive" });
        return;
      }

      if (!isWithinGeofence) {
        toast({ title: "Error", description: "You must be on campus to mark attendance", variant: "destructive" });
        return;
      }

      if (!subject.trim()) {
        toast({ title: "Error", description: "Class/Subject is mandatory", variant: "destructive" });
        return;
      }

      const similarity = cosineSimilarity(Array.from(faceDescriptor), storedDescriptor);

      if (similarity > 0.85) {
        attendanceMutation.mutate({
          status: "present",
          subject: subject,
          method: "face_recognition",
          verified: true,
          date: new Date().toISOString(),
        });
        toast({ title: "Face Verified", description: "Attendance marked ✅" });
      } else {
        toast({
          title: "Face Not Verified",
          description: "Scanned face does not match your registered face. Attendance not marked.",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Error", description: "Failed to process face recognition", variant: "destructive" });
    }
  };

  const currentDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <main className="pt-16 pb-20 md:pt-0 md:pb-0 md:ml-64 min-h-screen">
        <div className="p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Mark Attendance</h2>
              <p className="text-muted-foreground">Today, {currentDate}</p>
            </div>

            {/* Subject Input */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <label className="block text-sm font-medium text-foreground mb-2">Subject/Class</label>
                <input
                  type="text"
                  placeholder="Enter class/subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground"
                />
              </CardContent>
            </Card>

            {/* Location Status */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Location Verification</h3>
                  <Badge variant={isWithinGeofence ? "default" : "destructive"}>
                    {geoLoading ? "Checking..." : geoError ? "Error" : isWithinGeofence ? "✓ On Campus" : "✗ Off Campus"}
                  </Badge>
                </div>
                <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {geoError ? geoError : distance !== null ? `${Math.round(distance)}m from campus` : "Getting location..."}
                  </span>
                </div>
              </CardContent>
            </Card>
               {/* Face Recognition */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Face Recognition (Present)</h3>
                <div className="text-center">
                  {faceLoading ? (
                    <p className="text-muted-foreground">Loading face data...</p>
                  ) : (
                    <>
                      <div className="w-48 h-48 mx-auto mb-4 bg-muted rounded-xl border-2 border-dashed border-border flex items-center justify-center">
                        <div className="text-center">
                          <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Click to start camera</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setShowFaceScanner(true)}
                        disabled={!isWithinGeofence || geoLoading || !subject.trim()}
                        className={`bg-primary text-primary-foreground hover:bg-primary/90 ${
                          !isWithinGeofence || geoLoading || !subject.trim() ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        {geoLoading ? "Checking location..." : !isWithinGeofence ? "Cannot scan off-campus" : "Start Face Scan"}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Manual Attendance (Leave Only) */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Manual Attendance (Leave Only)</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setSelectedStatus("leave")}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        selectedStatus === "leave" ? "border-orange-200 bg-orange-50 text-orange-700 ring-2 ring-offset-2 ring-primary" : "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                      }`}
                    >
                      <Clock className="w-6 h-6 mx-auto mb-2" />
                      <p className="font-medium">Leave</p>
                    </button>
                  </div>

                  {selectedStatus === "leave" && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">(Reason for leave)</label>
                      <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Enter reason..."
                        rows={3}
                      />
                    </div>
                  )}

                  <Button
                    onClick={handleManualSubmit}
                    disabled={!selectedStatus || attendanceMutation.isPending}
                    className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  >
                    {attendanceMutation.isPending ? "Submitting..." : "Submit Leave"}
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
