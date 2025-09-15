// client/src/hooks/useAuth.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export const useAuth = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Load current user
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (response.status === 401) return null;
        if (!response.ok) return null;

        const data = await response.json();
        return data.user; // 👈 always return the user object
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: Infinity,
  });

  // LOGIN
  const loginMutation = useMutation({
    mutationFn: api.auth.login,
    onSuccess: async (data: any) => {
      queryClient.setQueryData(["/api/auth/me"], data.user); // 👈 set user
      toast({ title: "Success", description: "Logged in successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Login failed",
        variant: "destructive",
      });
    },
  });

  // LOGOUT
  const logoutMutation = useMutation({
    mutationFn: api.auth.logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
      toast({ title: "Success", description: "Logged out successfully" });
    },
  });

  // REGISTER
  const registerMutation = useMutation({
    mutationFn: api.auth.register,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Registration successful! Please login.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Registration failed",
        variant: "destructive",
      });
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    register: registerMutation.mutate,
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
  };
};
