import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarCheck } from "lucide-react";

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
  });
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const { register, isRegisterPending, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if already authenticated
  if (isAuthenticated) {
    setLocation('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'confirmPassword') {
        formDataToSend.append(key, value);
      }
    });
    
    if (idPhoto) {
      formDataToSend.append('idPhoto', idPhoto);
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        body: formDataToSend,
      });

      if (response.ok) {
        setLocation('/login');
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIdPhoto(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <CalendarCheck className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <p className="text-muted-foreground">Register for student attendance system</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="collegeRollNo">College Roll Number *</Label>
                <Input
                  id="collegeRollNo"
                  name="collegeRollNo"
                  type="text"
                  placeholder="CS2021001"
                  value={formData.collegeRollNo}
                  onChange={handleChange}
                  required
                  data-testid="input-roll-number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  data-testid="input-full-name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studentPhone">Student Phone *</Label>
                <Input
                  id="studentPhone"
                  name="studentPhone"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={formData.studentPhone}
                  onChange={handleChange}
                  required
                  data-testid="input-student-phone"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="parentPhone">Parent Phone *</Label>
                <Input
                  id="parentPhone"
                  name="parentPhone"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={formData.parentPhone}
                  onChange={handleChange}
                  required
                  data-testid="input-parent-phone"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studentEmail">Student Email *</Label>
                <Input
                  id="studentEmail"
                  name="studentEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.studentEmail}
                  onChange={handleChange}
                  required
                  data-testid="input-student-email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="parentEmail">Parent Email *</Label>
                <Input
                  id="parentEmail"
                  name="parentEmail"
                  type="email"
                  placeholder="parent@example.com"
                  value={formData.parentEmail}
                  onChange={handleChange}
                  required
                  data-testid="input-parent-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="idPhoto">ID Photo</Label>
              <Input
                id="idPhoto"
                name="idPhoto"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                data-testid="input-id-photo"
              />
              <p className="text-xs text-muted-foreground">Upload a clear photo for face recognition</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  data-testid="input-password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  data-testid="input-confirm-password"
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isRegisterPending}
              data-testid="button-register"
            >
              {isRegisterPending ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                onClick={() => setLocation('/login')}
                className="text-primary hover:underline font-medium"
                data-testid="link-login"
              >
                Sign in here
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
