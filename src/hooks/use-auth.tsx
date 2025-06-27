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
  updateProfile: (userData: UserDTO, profilePicture?: File) => Promise<void>;
  refreshUser: () => Promise<void>; // Add method to refresh user data
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Key for storing user data in localStorage
const USER_STORAGE_KEY = "elcentre_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Use refs to prevent multiple fetch attempts
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  const minimumFetchInterval = 5000; // 5 seconds minimum between fetches
  
  // Helper function to store user in localStorage
  const storeUserInLocalStorage = (userData: UserDTO | null) => {
    if (userData) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      // Also store userType separately for easy access during login redirects
      if (userData.userType) {
        localStorage.setItem('userType', userData.userType);
      }
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem('userType');
    }
  };
    // Initialize user from localStorage on app start
  useEffect(() => {
    const initializeAuth = () => {
      const hasJwtCookie = document.cookie.includes('jwt=');
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      
      if (hasJwtCookie && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          ("Initializing user from localStorage");
          setUser(parsedUser);
          setError(null);
        } catch (parseError) {
          console.error("Failed to parse stored user data:", parseError);
          localStorage.removeItem(USER_STORAGE_KEY);
          localStorage.removeItem('userType');
        }
      }
    };
    
    initializeAuth();
  }, []);
    // Helper function to check if auth state is valid
  const isAuthStateValid = useCallback(() => {
    const hasJwtCookie = document.cookie.includes('jwt=');
    const hasStoredUser = !!localStorage.getItem(USER_STORAGE_KEY);
    return hasJwtCookie && (user || hasStoredUser);
  }, [user]);
  
  // Use useCallback to memoize the fetchUser function
  const fetchUser = useCallback(async (force = false) => {
    // Check if we're already fetching or if it's too soon since last fetch
    const currentTime = Date.now();
    const timeSinceLastFetch = currentTime - lastFetchTimeRef.current;
    
    if (!force && (isFetchingRef.current || (timeSinceLastFetch < minimumFetchInterval && lastFetchTimeRef.current !== 0))) {
      return;
    }
    
    // Check if we have JWT cookie before even trying
    if (!document.cookie.includes('jwt=')) {
      // No JWT cookie, clear everything
      setUser(null);
      storeUserInLocalStorage(null);
      setIsLoading(false);
      return;
    }
    
    try {
      isFetchingRef.current = true;
      lastFetchTimeRef.current = currentTime;
      
      const userData = await AuthService.getProfile();      
      const userWithComputedProps = {
        ...userData,
        name: `${userData.firstName} ${userData.lastName}`,
        avatar: userData.profilePicture || undefined
      };
      setUser(userWithComputedProps);
      storeUserInLocalStorage(userWithComputedProps);
      setError(null);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      
      // If we have a JWT cookie but the API call failed, try to restore from localStorage
      // This prevents users from being logged out on page refresh when there are temporary network issues
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          ("Restoring user from localStorage due to API failure");
          setUser(parsedUser);
          setError(null);
        } catch (parseError) {
          console.error("Failed to parse stored user data:", parseError);
          // Only clear everything if we can't parse stored data
          setUser(null);
          storeUserInLocalStorage(null);
          setError("Failed to restore user session");
        }
      } else {
        // No stored user data, clear everything
        setUser(null);
        storeUserInLocalStorage(null);
        setError("Failed to fetch user profile");
      }
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
    // Add a small delay to allow localStorage initialization to complete
    const timeoutId = setTimeout(() => {
      fetchUser();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [fetchUser]);
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await AuthService.login({ email, password });
      
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
            avatar: userData.profilePicture || undefined
          };
          setUser(userWithComputedProps);
          storeUserInLocalStorage(userWithComputedProps);
        }
        
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        return true;
      } catch (profileError) {
        console.error("Error fetching profile after login:", profileError);
        
        // If profile fetch fails but we have the JWT cookie, try to proceed anyway
        // The user will be restored from localStorage on next app load
        if (document.cookie.includes('jwt=')) {
          toast({
            title: "Login successful",
            description: "Welcome back!",
          });
          return true;
        }
        
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
      storeUserInLocalStorage(null);
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
      
      // Clear all possible JWT and token cookies that might exist
      document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      setUser(null);
      storeUserInLocalStorage(null);
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      console.error("Logout failed:", error);
      
      // Even if logout API call fails, clear local state
      document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      setUser(null);
      storeUserInLocalStorage(null);
      
      toast({
        title: "Logged out",
        description: "You have been logged out.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const updateProfile = async (userData: UserDTO, profilePicture?: File) => {
    setIsLoading(true);
    try {
      // Always use updateProfileWithPicture since backend expects FormData
      // The backend will handle null profilePicture by keeping the existing one
      await AuthService.updateProfileWithPicture(userData, profilePicture);
      
      // Refresh user data to get updated profile picture URL
      await fetchUser(true);
      
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
