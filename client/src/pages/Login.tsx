"use client";

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BackgroundAnimation from "@/pages/BackgroundAnimation";


export default function Login() {
  const [formData, setFormData] = useState({
    collegeRollNo: "",
    password: "",
  });

  const { login, isLoginPending, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // ✅ Redirect once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(formData); // ✅ call login from hook
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden">
      {/* 🎆 Background Animation */}
      <BackgroundAnimation />

      {/* Login Card (foreground) */}
      <Card className="w-full max-w-md relative z-10 bg-background/90 backdrop-blur-md shadow-lg">
        <CardHeader className="text-center">
          {/* Logo Section */}
          <div className="flex justify-center">
            <div className="w-28 h-28 rounded-full overflow-hidden shadow-lg border-4 border-primary/30">
              <img
                src="/photos/kvislogo.jpeg"
                alt="App Logo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* App name */}
          <CardTitle className="text-3xl font-extrabold tracking-tight text-primary">
            KVIS
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="collegeRollNo">College Roll Number</Label>
              <Input
                id="collegeRollNo"
                name="collegeRollNo"
                type="text"
                placeholder="Enter your roll number"
                value={formData.collegeRollNo}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoginPending}>
              {isLoginPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button
                onClick={() => setLocation("/register")}
                className="text-primary hover:underline font-medium"
              >
                Register here
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
