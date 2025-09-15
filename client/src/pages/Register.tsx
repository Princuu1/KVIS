import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import FaceScanner from "@/components/FaceScanner";

export default function Register() {
  const [formData, setFormData] = useState({
    collegeRollNo: "",
    fullName: "",
    studentPhone: "",
    parentPhone: "",
    studentEmail: "",
    parentEmail: "",
    password: "",
    confirmPassword: "",
    studentClass: "",
  });

  const classOptions = [
    "1st year BTech CSE A ",
    " 1st Year BTech CSE B ",
    " 2nd year BTech CSE A",
    "2nd year BTech CSE B",
    "3rd year BTech CSE A ",
    " 3rd Year BTech CSE B ",
    "4th year BTech CSE A ",
    " 4th Year BTech CSE B ",
  ];

  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);

  const [showFaceScanner, setShowFaceScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { isRegisterPending, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (isAuthenticated) {
    setLocation("/");
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size must not exceed 2MB");
        e.currentTarget.value = "";
        return;
      }
      setIdPhoto(file);
    } else {
      setIdPhoto(null);
    }
  };

  const handleFaceDetected = (descriptor: Float32Array) => {
    setFaceDescriptor(descriptor);
    setShowFaceScanner(false);
    setScanError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!idPhoto) {
      alert("Please upload your ID photo");
      return;
    }
    if (!faceDescriptor) {
      alert("Please scan your face using the Live Scan option");
      return;
    }
    if (!formData.studentClass) {
      alert("Please select your class");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== "confirmPassword") {
        formDataToSend.append(key, value as string);
      }
    });

    formDataToSend.append("idPhoto", idPhoto);
    formDataToSend.append("faceDescriptor", JSON.stringify(Array.from(faceDescriptor)));

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        body: formDataToSend,
      });

      // Try to read server JSON for optional email-info
      let json: any = null;
      try {
        json = await response.json();
      } catch {
        /* ignore if no json */
      }

      if (response.ok) {
        // If server includes emailsSent or emailError, show appropriate message
        if (json?.emailsSent === true) {
          alert("Registration successful. Welcome emails sent to student & parent.");
        } else if (json?.emailsSent === false && json?.emailError) {
          alert(`Registration successful. But welcome email failed: ${json.emailError}`);
        } else {
          // Fallback message (most likely the case if backend sends emails asynchronously)
          alert("Registration successful. Welcome emails will be sent to student & parent.");
        }
        setLocation("/login");
      } else {
        let errMsg = "Registration failed";
        if (json?.message) errMsg = json.message;
        throw new Error(errMsg);
      }
    } catch (error: any) {
      console.error("Registration failed:", error);
      alert(error?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-6">
      <Card className="w-full max-w-2xl shadow-2xl border border-border/40 rounded-2xl">
        <CardHeader className="text-center space-y-5 p-8">
          <div className="flex justify-center">
            <div className="w-28 h-28 rounded-full overflow-hidden shadow-lg border-4 border-primary/30">
              <img src="/photos/kvislogo.jpeg" alt="App Logo" className="w-full h-full object-cover" />
            </div>
          </div>

          <CardTitle className="text-3xl font-extrabold tracking-tight text-primary">KVIS</CardTitle>

          <CardTitle className="text-3xl font-bold tracking-tight">Create Your Account</CardTitle>
          <p className="text-muted-foreground">Join the smart student attendance system today</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="collegeRollNo">College Roll Number *</Label>
                <Input id="collegeRollNo" name="collegeRollNo" type="text" placeholder="Enter Your College Roll No." value={formData.collegeRollNo} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input id="fullName" name="fullName" type="text" placeholder="Enter Your Full Name" value={formData.fullName} onChange={handleChange} required />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studentPhone">Student Phone *</Label>
                <Input id="studentPhone" name="studentPhone" type="tel" placeholder="Enter Your Phone No." value={formData.studentPhone} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentPhone">Parent Phone *</Label>
                <Input id="parentPhone" name="parentPhone" type="tel" placeholder="Enter Your Parent Phone No." value={formData.parentPhone} onChange={handleChange} required />
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studentEmail">Student Email *</Label>
                <Input id="studentEmail" name="studentEmail" type="email" placeholder="Enter Your Email" value={formData.studentEmail} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentEmail">Parent Email *</Label>
                <Input id="parentEmail" name="parentEmail" type="email" placeholder="Enter Your Parent Email" value={formData.parentEmail} onChange={handleChange} required />
              </div>
            </div>

            {/* Class Select */}
            <div className="space-y-2">
              <Label htmlFor="studentClass">Class *</Label>
              <select
                id="studentClass"
                name="studentClass"
                value={formData.studentClass}
                onChange={handleChange}
                required
                className="w-full p-3 border border-input rounded-lg bg-background text-foreground"
              >
                <option value="" disabled>
                  Select your class
                </option>
                {classOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Choose your class (only listed options allowed).</p>
            </div>

            {/* ID Photo */}
            <div className="space-y-2">
              <Label htmlFor="idPhoto">ID Photo *</Label>
              <Input id="idPhoto" name="idPhoto" type="file" accept="image/*" required onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 2 * 1024 * 1024) {
                    alert("File size must not exceed 2MB");
                    e.target.value = "";
                    return;
                  }
                  handleFileChange(e);
                }
              }} />
              <p className="text-xs text-muted-foreground">Upload a clear photo for face recognition (Max size: 2MB)</p>
            </div>

            {/* Live Face Scan */}
            <div className="space-y-2">
              <Label>Live Face Scan *</Label>
              <div className="flex items-center space-x-3">
                <Button type="button" onClick={() => { setShowFaceScanner(true); setIsScanning(true); }} className="flex items-center gap-2">
                  {isScanning ? "Open Camera" : "Scan Face"}
                </Button>

                {faceDescriptor ? (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="inline-block w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-muted-foreground">Face captured ({faceDescriptor.length} dims)</span>
                    <button type="button" onClick={() => { setFaceDescriptor(null); alert("You can re-scan now."); }} className="ml-2 text-xs text-primary hover:underline">Re-scan</button>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No live scan yet</div>
                )}
              </div>

              {scanError && <p className="text-xs text-red-400">{scanError}</p>}
              <p className="text-xs text-muted-foreground">Use the camera to capture your face descriptor for accurate matching later.</p>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 relative">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Enter password" value={formData.password} onChange={handleChange} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm password" value={formData.confirmPassword} onChange={handleChange} required />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full text-lg font-semibold shadow-md hover:shadow-lg transition" disabled={isRegisterPending}>
              {isRegisterPending ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <button onClick={() => setLocation("/login")} className="text-primary hover:underline font-medium">
                Sign in here
              </button>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* FaceScanner modal */}
      <FaceScanner
        isOpen={showFaceScanner}
        onClose={() => { setShowFaceScanner(false); setIsScanning(false); }}
        onFaceDetected={(descriptor) => { handleFaceDetected(descriptor); }}
      />
    </div>
  );
}
