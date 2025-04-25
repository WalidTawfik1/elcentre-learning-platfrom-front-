
// API Service for interacting with the backend

// Base API URL
const API_BASE_URL = "http://elcentre.runasp.net";

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
    "Accept": "application/json",
  };

  const config: RequestInit = {
    method,
    headers,
    mode: "cors",
    credentials: requiresAuth ? "include" : "omit", // Include cookies for auth
  };

  if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
    config.body = JSON.stringify(data);
  }

  try {
    console.log(`Making API request to: ${url}`, { method, hasData: !!data });
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
      apiRequest(`/Course/get-all-courses${params ? `?${new URLSearchParams(params as any).toString()}` : ""}`),
    
    getFeatured: () => 
      apiRequest("/Course/get-featured-courses"),
    
    getById: (id: string) => 
      apiRequest(`/Course/get-course-by-id?courseId=${id}`),
    
    getModules: (courseId: string) => 
      apiRequest(`/Module/get-course-modules?courseId=${courseId}`),
    
    getLessons: (courseId: string, moduleId: string) => 
      apiRequest(`/Lesson/get-module-lessons?moduleId=${moduleId}`),
    
    enroll: (courseId: string) => 
      apiRequest(`/Enrollment/enroll-course`, "POST", { courseId }),
    
    getEnrollments: () => 
      apiRequest("/Enrollment/get-student-enrollments"),
    
    submitReview: (courseId: string, data: { rating: number; content: string }) => 
      apiRequest(`/Review/add-review`, "POST", { courseId, ...data }),
  },
  
  // Categories
  categories: {
    getAll: () => 
      apiRequest("/Category/get-all-categories"),
    
    getBySlug: (slug: string) => 
      apiRequest(`/Category/get-category-by-slug?slug=${slug}`),
    
    getCourses: (slug: string, params?: { page?: number; limit?: number }) => 
      apiRequest(`/Category/get-category-courses?slug=${slug}${params ? `&${new URLSearchParams(params as any).toString()}` : ""}`),
  },
  
  // User profile
  profile: {
    get: () => 
      apiRequest("/Account/profile"),
    
    update: (data: { name?: string; avatar?: string }) => 
      apiRequest("/Account/edit-profile", "PUT", data),
    
    changePassword: (data: { currentPassword: string; newPassword: string }) => 
      apiRequest("/Account/change-password", "PUT", data),
  },
  
  // Instructors
  instructors: {
    getAll: (params?: { page?: number; limit?: number }) => 
      apiRequest(`/Instructor/get-all-instructors${params ? `?${new URLSearchParams(params as any).toString()}` : ""}`),
    
    getById: (id: string) => 
      apiRequest(`/Instructor/get-instructor-by-id?instructorId=${id}`),
    
    getCourses: (id: string, params?: { page?: number; limit?: number }) => 
      apiRequest(`/Instructor/get-instructor-courses?instructorId=${id}${params ? `&${new URLSearchParams(params as any).toString()}` : ""}`),
  },
  
  // Admin functions
  admin: {
    getUsers: (params?: { page?: number; limit?: number; userType?: string }) => 
      apiRequest(`/Admin/get-all-users${params ? `?${new URLSearchParams(params as any).toString()}` : ""}`),
    
    updateUser: (userId: string, data: { name?: string; isActive?: boolean; userType?: string }) => 
      apiRequest(`/Admin/update-user`, "PUT", { userId, ...data }),
  },
  
  // Instructor dashboard
  instructor: {
    getCourses: (params?: { published?: boolean; page?: number; limit?: number }) => 
      apiRequest(`/Instructor/get-my-courses${params ? `?${new URLSearchParams(params as any).toString()}` : ""}`),
    
    createCourse: (data: { title: string; description: string; price: number; categoryId: string; thumbnail?: string }) => 
      apiRequest("/Instructor/create-course", "POST", data),
    
    updateCourse: (courseId: string, data: { title?: string; description?: string; price?: number; categoryId?: string; thumbnail?: string; isPublished?: boolean }) => 
      apiRequest("/Instructor/update-course", "PUT", { courseId, ...data }),
    
    createModule: (courseId: string, data: { title: string; orderIndex: number }) => 
      apiRequest("/Instructor/create-module", "POST", { courseId, ...data }),
    
    updateModule: (courseId: string, moduleId: string, data: { title?: string; orderIndex?: number }) => 
      apiRequest("/Instructor/update-module", "PUT", { courseId, moduleId, ...data }),
    
    createLesson: (courseId: string, moduleId: string, data: { title: string; content: string; contentType: string; orderIndex: number; duration?: number }) => 
      apiRequest("/Instructor/create-lesson", "POST", { courseId, moduleId, ...data }),
    
    updateLesson: (courseId: string, moduleId: string, lessonId: string, data: { title?: string; content?: string; contentType?: string; orderIndex?: number; duration?: number }) => 
      apiRequest("/Instructor/update-lesson", "PUT", { courseId, moduleId, lessonId, ...data }),
  }
};
