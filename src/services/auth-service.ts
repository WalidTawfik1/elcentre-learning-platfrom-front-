
import { apiRequest } from "./api";
import { LoginDTO, RegisterDTO, UserDTO } from "@/types/api";

export const AuthService = {
  login: async (credentials: LoginDTO): Promise<any> => {
    return apiRequest<any>("/Account/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },
  
  register: async (userData: RegisterDTO): Promise<any> => {
    return apiRequest<any>("/Account/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },
  
  logout: async (): Promise<any> => {
    return apiRequest<any>("/Account/logout", {
      method: "POST",
    });
  },
  
  getProfile: async (): Promise<UserDTO> => {
    return apiRequest<UserDTO>("/Account/profile");
  },
  
  updateProfile: async (userData: UserDTO): Promise<any> => {
    return apiRequest<any>("/Account/edit-profile", {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  },
  
  verifyOTP: async (email: string, code: string): Promise<any> => {
    return apiRequest<any>("/Account/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
  },
  
  resendOTP: async (email: string): Promise<any> => {
    return apiRequest<any>("/Account/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  
  requestPasswordReset: async (email: string): Promise<any> => {
    return apiRequest<any>(`/Account/send-email-forget-password?email=${email}`);
  },
  
  resetPassword: async (email: string, password: string, code: string): Promise<any> => {
    return apiRequest<any>("/Account/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, password, code }),
    });
  },
};
