import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { AuthService } from "@/services/auth-service";
import { UserDTO } from "@/types/api";
import { useToast } from "@/components/ui/use-toast";
import { UserRole } from "@/types/user";

type AuthContextType = {
  user: UserDTO | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>; // Return success status
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: UserDTO) => Promise<void>;
  refreshUser: () => Promise<void>; // Add method to refresh user data
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Use refs to prevent multiple fetch attempts
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  const minimumFetchInterval = 5000; // 5 seconds minimum between fetches
  
  // Use useCallback to memoize the fetchUser function
  const fetchUser = useCallback(async (force = false) => {
    // Check if we're already fetching or if it's too soon since last fetch
    const currentTime = Date.now();
    const timeSinceLastFetch = currentTime - lastFetchTimeRef.current;
    
    if (!force && (isFetchingRef.current || (timeSinceLastFetch < minimumFetchInterval && lastFetchTimeRef.current !== 0))) {
      console.log(
        `Profile fetch skipped: ${isFetchingRef.current ? 'Already fetching' : 'Too soon'} (${Math.round(timeSinceLastFetch / 1000)}s since last fetch)`
      );
      return;
    }
    
    // Check if we have JWT cookie before even trying
    if (!document.cookie.includes('jwt=')) {
      console.log("No JWT cookie found, skipping profile fetch");
      setUser(null);
      setIsLoading(false);
      return;
    }
    
    try {
      isFetchingRef.current = true;
      lastFetchTimeRef.current = currentTime;
      console.log("Attempting to fetch user profile...");
      
      const userData = await AuthService.getProfile();
      console.log("Profile fetch successful:", userData);
      
      const userWithComputedProps = {
        ...userData,
        name: `${userData.firstName} ${userData.lastName}`,
        avatar: undefined
      };
      setUser(userWithComputedProps);
      console.log("User state updated:", userWithComputedProps);
      setError(null);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setUser(null);
      setError("Failed to fetch user profile");
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Function to refresh user data that can be called from anywhere
  const refreshUser = useCallback(async () => {
    await fetchUser(true); // Force refresh
  }, [fetchUser]);

  // Check for existing authentication on load - only once when component mounts
  useEffect(() => {
    console.log("Auth provider initialized, checking for JWT cookie");
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Attempting login...");
      const response = await AuthService.login({ email, password });
      console.log("Login successful:", response);
      
      // Wait a moment for the cookie to be set
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Force immediate fetch of user profile
      try {
        await fetchUser(true); // Force fetch
        
        // Important fix: The state might not be updated immediately due to React's async state updates
        // So we need to set the user directly here to ensure isAuthenticated becomes true
        if (response.user) {
          const userData = response.user;
          const userWithComputedProps = {
            ...userData,
            name: `${userData.firstName} ${userData.lastName}`,
            avatar: undefined
          };
          setUser(userWithComputedProps);
        }
        
        console.log("User authentication state after login:", { user: !!user, cookieExists: document.cookie.includes('jwt=') });
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        return true;
      } catch (profileError) {
        console.error("Error fetching profile after login:", profileError);
        toast({
          title: "Login partial success",
          description: "Logged in but couldn't fetch your profile. Please refresh.",
          variant: "destructive"
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    } catch (error: any) {
      setUser(null);
      setIsLoading(false);
      const errorMessage = error.message || "Login failed. Please check your network connection.";
      setError(errorMessage);
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
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
      const errorMessage = error.message || "Registration failed. Please check your network connection.";
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AuthService.logout();
      
      // Clear both JWT and token cookies that might exist
      document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        title: "Logout Failed",
        description: "There was an issue logging you out. Please try again.",
        variant: "destructive"
      });
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
      toast({
        title: "Update Failed",
        description: "There was an issue updating your profile. Please try again.",
        variant: "destructive"
      });
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
        refreshUser,
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
