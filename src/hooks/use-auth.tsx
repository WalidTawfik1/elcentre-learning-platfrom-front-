import { createContext, useContext, useEffect, useState } from "react";
import { AuthService } from "@/services/auth-service";
import { UserDTO } from "@/types/api";
import { useToast } from "@/components/ui/use-toast";
import { UserRole } from "@/types/user";

type AuthContextType = {
  user: UserDTO | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: UserDTO) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUser = async () => {
    try {
      const userData = await AuthService.getProfile();
      const userWithComputedProps = {
        ...userData,
        name: `${userData.firstName} ${userData.lastName}`,
        avatar: undefined
      };
      setUser(userWithComputedProps);
      setError(null);
    } catch (error) {
      setUser(null);
      setError("Failed to fetch user profile");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await AuthService.login({ email, password });
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      await fetchUser();
    } catch (error: any) {
      setUser(null);
      setError(error.message || "Login failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      await AuthService.register(userData);
      toast({
        title: "Registration successful",
        description: "Please check your email to activate your account.",
      });
    } catch (error: any) {
      setError(error.message || "Registration failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AuthService.logout();
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (userData: UserDTO) => {
    setIsLoading(true);
    try {
      await AuthService.updateProfile(userData);
      setUser(userData);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
