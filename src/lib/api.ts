
// API Service for interacting with the backend

// Base API URL
const API_BASE_URL = "http://elcentre.runasp.net/";

// Helper function for making API requests
async function apiRequest<T>(
  endpoint: string,
  method: string = "GET",
  data?: any,
  requiresAuth: boolean = true
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const config: RequestInit = {
    method,
    headers,
    credentials: requiresAuth ? "include" : "omit", // Include cookies for auth
  };

  if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || `API Error: ${response.status}`;
      } catch (e) {
        errorMessage = `API Error: ${response.status}`;
      }
      
      throw new Error(errorMessage);
    }
    
    // For 204 No Content responses
    if (response.status === 204) {
      return {} as T;
    }
    
    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

// API Functions
export const API = {
  // Courses
  courses: {
    getAll: (params?: { category?: string; search?: string; page?: number; limit?: number }) => 
      apiRequest(`courses${params ? `?${new URLSearchParams(params as any).toString()}` : ""}`),
    
    getFeatured: () => 
      apiRequest("courses/featured"),
    
    getById: (id: string) => 
      apiRequest(`courses/${id}`),
    
    getModules: (courseId: string) => 
      apiRequest(`courses/${courseId}/modules`),
    
    getLessons: (courseId: string, moduleId: string) => 
      apiRequest(`courses/${courseId}/modules/${moduleId}/lessons`),
    
    enroll: (courseId: string) => 
      apiRequest(`enrollments`, "POST", { courseId }),
    
    getEnrollments: () => 
      apiRequest("enrollments"),
    
    submitReview: (courseId: string, data: { rating: number; content: string }) => 
      apiRequest(`courses/${courseId}/reviews`, "POST", data),
  },
  
  // Categories
  categories: {
    getAll: () => 
      apiRequest("categories"),
    
    getBySlug: (slug: string) => 
      apiRequest(`categories/${slug}`),
    
    getCourses: (slug: string, params?: { page?: number; limit?: number }) => 
      apiRequest(`categories/${slug}/courses${params ? `?${new URLSearchParams(params as any).toString()}` : ""}`),
  },
  
  // User profile
  profile: {
    get: () => 
      apiRequest("users/me"),
    
    update: (data: { name?: string; avatar?: string }) => 
      apiRequest("users/me", "PATCH", data),
    
    changePassword: (data: { currentPassword: string; newPassword: string }) => 
      apiRequest("users/me/password", "PUT", data),
  },
  
  // Instructors
  instructors: {
    getAll: (params?: { page?: number; limit?: number }) => 
      apiRequest(`instructors${params ? `?${new URLSearchParams(params as any).toString()}` : ""}`),
    
    getById: (id: string) => 
      apiRequest(`instructors/${id}`),
    
    getCourses: (id: string, params?: { page?: number; limit?: number }) => 
      apiRequest(`instructors/${id}/courses${params ? `?${new URLSearchParams(params as any).toString()}` : ""}`),
  },
  
  // Admin functions
  admin: {
    getUsers: (params?: { page?: number; limit?: number; userType?: string }) => 
      apiRequest(`admin/users${params ? `?${new URLSearchParams(params as any).toString()}` : ""}`),
    
    updateUser: (userId: string, data: { name?: string; isActive?: boolean; userType?: string }) => 
      apiRequest(`admin/users/${userId}`, "PATCH", data),
  },
  
  // Instructor dashboard
  instructor: {
    getCourses: (params?: { published?: boolean; page?: number; limit?: number }) => 
      apiRequest(`instructor/courses${params ? `?${new URLSearchParams(params as any).toString()}` : ""}`),
    
    createCourse: (data: { title: string; description: string; price: number; categoryId: string; thumbnail?: string }) => 
      apiRequest("instructor/courses", "POST", data),
    
    updateCourse: (courseId: string, data: { title?: string; description?: string; price?: number; categoryId?: string; thumbnail?: string; isPublished?: boolean }) => 
      apiRequest(`instructor/courses/${courseId}`, "PATCH", data),
    
    createModule: (courseId: string, data: { title: string; orderIndex: number }) => 
      apiRequest(`instructor/courses/${courseId}/modules`, "POST", data),
    
    updateModule: (courseId: string, moduleId: string, data: { title?: string; orderIndex?: number }) => 
      apiRequest(`instructor/courses/${courseId}/modules/${moduleId}`, "PATCH", data),
    
    createLesson: (courseId: string, moduleId: string, data: { title: string; content: string; contentType: string; orderIndex: number; duration?: number }) => 
      apiRequest(`instructor/courses/${courseId}/modules/${moduleId}/lessons`, "POST", data),
    
    updateLesson: (courseId: string, moduleId: string, lessonId: string, data: { title?: string; content?: string; contentType?: string; orderIndex?: number; duration?: number }) => 
      apiRequest(`instructor/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, "PATCH", data),
  }
};
