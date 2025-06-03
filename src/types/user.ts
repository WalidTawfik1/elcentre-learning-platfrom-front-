
export type UserRole = "admin" | "instructor" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  userType: UserRole;
  isActive: boolean;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  gender?: string;
  dateOfBirth?: string;
  bio?: string;
  profilePicture?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
