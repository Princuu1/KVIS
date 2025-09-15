import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

type FormState = {
  fullName: string;
  collegeRollNo: string;
  studentPhone: string;
  parentPhone: string;
  studentEmail: string;
  parentEmail: string;
  studentClass: string;
  idPhotoUrl: string;
};

const classOptions = [
  "1st year BTech CSE A",
  "1st Year BTech CSE B",
  "2nd year BTech CSE A",
  "2nd year BTech CSE B",
  "3rd year BTech CSE A",
  "3rd Year BTech CSE B",
  "4th year BTech CSE A",
  "4th Year BTech CSE B",
];

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const [form, setForm] = useState<FormState>({
    fullName: "",
    collegeRollNo: "",
    studentPhone: "",
    parentPhone: "",
    studentEmail: "",
    parentEmail: "",
    studentClass: "",
    idPhotoUrl: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // initialize from useAuth user
  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName ?? "",
        collegeRollNo: user.collegeRollNo ?? "",
        studentPhone: user.studentPhone ?? "",
        parentPhone: user.parentPhone ?? "",
        studentEmail: user.studentEmail ?? "",
        parentEmail: user.parentEmail ?? "",
        studentClass: user.studentClass ?? classOptions[0],
        idPhotoUrl: user.idPhotoUrl ?? "",
      });
      setPreview(user.idPhotoUrl ?? null);
    }
  }, [user]);

  // redirect if not authenticated
  useEffect(() => {
    if (isAuthenticated === false) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setFile(null);
      setPreview(form.idPhotoUrl || null);
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      alert("File must be under 5MB");
      e.currentTarget.value = "";
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(f);
  };

  const validateBeforeSubmit = () => {
    // validate email/phone lightly
    if (!form.studentEmail || !form.studentPhone) {
      setError("Student email and phone are required.");
      return false;
    }

    // If user wants to change password, validate it
    if (newPassword || confirmNewPassword || currentPassword) {
      if (!currentPassword) {
        setError("Enter your current password to change password.");
        return false;
      }
      if (newPassword.length < 6) {
        setError("New password must be at least 6 characters.");
        return false;
      }
      if (newPassword !== confirmNewPassword) {
        setError("New password and confirm password do not match.");
        return false;
      }
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError(null);
    setMessage(null);

    if (!validateBeforeSubmit()) return;

    setLoading(true);

    try {
      // Build FormData - only allowed editable fields
      const fd = new FormData();
      fd.append("studentPhone", form.studentPhone);
      fd.append("studentEmail", form.studentEmail);
      fd.append("parentPhone", form.parentPhone ?? "");
      fd.append("parentEmail", form.parentEmail ?? "");
      // class
      if (form.studentClass) fd.append("studentClass", form.studentClass);
      // file
      if (file) fd.append("idPhoto", file);

      // password change (only if provided)
      if (newPassword) {
        fd.append("currentPassword", currentPassword);
        fd.append("newPassword", newPassword);
      }

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        credentials: "include",
        body: fd,
      });

      // handle non-JSON HTML responses elegantly
      const text = await res.text();
      if (!res.ok) {
        // try parse JSON, but if HTML returned, show text
        try {
          const json = JSON.parse(text);
          throw new Error(json?.message || JSON.stringify(json));
        } catch {
          throw new Error(text || "Update failed");
        }
      }

      // parse JSON safely
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        json = {};
      }

      setMessage("Profile updated successfully");
      // refresh the page or re-fetch /api/auth/me in your auth hook
      setTimeout(() => window.location.reload(), 900);
    } catch (err: any) {
      console.error("Profile update failed", err);
      setError(err?.message ?? "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-12 p-6 bg-card rounded-xl shadow">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="w-28 h-28 rounded-full overflow-hidden bg-muted flex items-center justify-center">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-xl font-bold text-muted-foreground">
                {form.fullName ? form.fullName.split(" ").map(s => s[0]).join("").slice(0,2).toUpperCase() : "U"}
              </div>
            )}
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Change photo</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            <p className="text-xs text-muted-foreground mt-1">Max 2MB. JPG/PNG recommended.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full name</label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Roll no </label>
            <input
              name="collegeRollNo"
              value={form.collegeRollNo}
              readOnly
              disabled
              className="w-full p-2 border rounded bg-gray-100 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Student phone</label>
            <input
              name="studentPhone"
              value={form.studentPhone}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Parent phone</label>
            <input
              name="parentPhone"
              value={form.parentPhone}
              readOnly
              disabled
              className="w-full p-2 border rounded cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Student email</label>
            <input
              name="studentEmail"
              value={form.studentEmail}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Parent email</label>
            <input
              name="parentEmail"
              value={form.parentEmail}
              readOnly
              disabled
              className="w-full p-2 border rounded cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Class</label>
            <input
              name="parentEmail"
              value={form.studentClass}
              readOnly
              disabled
              className="w-full p-2 border rounded cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Change class to</label>
          <select
            name="studentClass"
            value={form.studentClass}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="">Select class</option>
            {classOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Password change block */}
        <div className="p-4 border rounded space-y-3">
          <p className="text-sm font-medium">Change Password</p>
          <div>
            <label className="block text-xs mb-1">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter current password to change"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="New password (min 6 chars)"
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Confirm new password</label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Leave password fields empty if you don't want to change password.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button type="submit" disabled={loading} className="bg-primary text-white px-4 py-2 rounded">
            {loading ? "Saving..." : "Save changes"}
          </button>
          <button type="button" onClick={() => setLocation("/")} className="px-4 py-2 rounded border">Cancel</button>
        </div>

        {message && <div className="text-green-600">{message}</div>}
        {error && <div className="text-red-600">{error}</div>}
      </form>
    </div>
  );
}
