// API Service for interacting with the backend

// Base API URL
const API_BASE_URL = "http://elcentre.runasp.net";

// Helper function for making API requests
async function apiRequest<T>(
  endpoint: string,
  method: string = "GET",
  data?: any,
  requiresAuth: boolean = true,
  isFormData: boolean = false
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    "Accept": "application/json",
  };

  // Don't set content-type for FormData, let the browser set it with the boundary
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const config: RequestInit = {
    method,
    headers,
    mode: "cors",
    credentials: requiresAuth ? "include" : "omit", // Include cookies for auth
  };

  if (data) {
    if (isFormData && data instanceof FormData) {
      config.body = data;
    } else if (method === "POST" || method === "PUT" || method === "PATCH") {
      config.body = JSON.stringify(data);
    }
  }

  try {
    console.log(`Making API request to: ${url}`, { method, hasData: !!data, requiresAuth });
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

// Helper to handle file uploads and form data
const createFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    // If dealing with a file
    if (value instanceof File) {
      formData.append(key, value);
    } 
    // If dealing with an array of files
    else if (Array.isArray(value) && value[0] instanceof File) {
      value.forEach(file => formData.append(key, file));
    }
    // For boolean, number, and other primitive values
    else if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });
  
  return formData;
};

// API Functions
export const API = {
  // Authentication
  auth: {
    register: (data: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      phoneNumber: string;
      gender: string;
      dateOfBirth: string;
      userType: string;
    }) => apiRequest('/Account/register', 'POST', data, false),
    
    login: (data: { email: string; password: string }) => 
      apiRequest('/Account/login', 'POST', data, false),
    
    activeAccount: (data: { email: string; code: string }) => 
      apiRequest('/Account/active-account', 'POST', data, false),
    
    sendForgetPasswordEmail: (email: string) => 
      apiRequest(`/Account/send-email-forget-password?email=${encodeURIComponent(email)}`, 'GET', undefined, false),
    
    resetPassword: (data: { email: string; password: string; code: string }) => 
      apiRequest('/Account/reset-password', 'POST', data, false),
    
    logout: () => 
      apiRequest('/Account/logout', 'POST'),
    
    verifyOTP: (data: { email: string; code: string }) => 
      apiRequest('/Account/verify-otp', 'POST', data, false),
    
    resendOTP: (data: { email: string }) => 
      apiRequest('/Account/resend-otp', 'POST', data, false),
  },
  
  // Courses
  courses: {
    getAll: (params?: { 
      pagenum?: number;
      pagesize?: number; 
      Maxpagesize?: number;
      sort?: string;
      categoryId?: number;
      search?: string;
      minPrice?: number;
      maxPrice?: number;
    }) => 
      apiRequest(`/Course/get-all-courses${params ? `?${new URLSearchParams(params as any).toString()}` : ""}`, 'GET', undefined, false),
    
    getById: (id: number) => 
      apiRequest(`/Course/get-course/${id}`, 'GET', undefined, false),
    
    add: (data: { 
      Title: string; 
      Description: string; 
      Price: number; 
      Thumbnail: File | File[];
      IsActive: boolean; 
      DurationInHours: number;
      CategoryId: number;
    }) => {
      const formData = createFormData(data);
      return apiRequest('/Course/add-course', 'POST', formData, true, true);
    },
    
    update: (data: { 
      Id: number;
      Title?: string; 
      Description?: string; 
      Price?: number; 
      Thumbnail?: File | File[];
      IsActive?: boolean; 
      DurationInHours?: number;
      CategoryId?: number;
    }) => {
      const formData = createFormData(data);
      return apiRequest('/Course/update-course', 'PUT', formData, true, true);
    },
    
    delete: (id: number) => 
      apiRequest(`/Course/delete-course/${id}`, 'DELETE'),
  },
  
  // Categories
  categories: {
    getAll: () => 
      apiRequest("/Category/get-all-categories", 'GET', undefined, false),
    
    getById: (id: number) => 
      apiRequest(`/Category/get-category-by-id/${id}`, 'GET', undefined, false),
    
    add: (data: { name: string }) => 
      apiRequest("/Category/add-category", "POST", data),
      
    update: (data: { id: number; name: string }) => 
      apiRequest("/Category/update-category", "PUT", data),
      
    delete: (id: number) => 
      apiRequest(`/Category/delete-category/${id}`, "DELETE"),
  },
  
  // Modules
  modules: {
    getAll: (courseId: number) => 
      apiRequest(`/CourseModule/get-all-course-modules?courseId=${courseId}`, 'GET', undefined, false),
    
    getById: (id: number, courseId: number) => 
      apiRequest(`/CourseModule/get-course-module-by-id/${id}?courseId=${courseId}`, 'GET', undefined, false),
    
    add: (data: { 
      Title: string;
      Description: string;
      IsPublished: boolean;
      CourseId: number;
    }) => {
      const formData = createFormData(data);
      return apiRequest('/CourseModule/add-course-module', 'POST', formData, true, true);
    },
    
    update: (data: { 
      Id: number;
      Title?: string;
      Description?: string;
      IsPublished?: boolean;
    }) => {
      const formData = createFormData(data);
      return apiRequest('/CourseModule/update-course-module', 'PUT', formData, true, true);
    },
    
    delete: (id: number) => 
      apiRequest(`/CourseModule/delete-course-module/${id}`, 'DELETE'),
  },
  
  // Lessons
  lessons: {
    getByModule: (moduleId: number) => 
      apiRequest(`/Lesson/get-module-lessons?moduleId=${moduleId}`, 'GET', undefined, false),
    
    getById: (id: number) => 
      apiRequest(`/Lesson/get-lesson-by-id/${id}`, 'GET', undefined, false),
    
    add: (data: {
      Title: string;
      Content: File;
      ContentType: string;
      DurationInMinutes: number;
      IsPublished: boolean;
      ModuleId: number;
    }) => {
      const formData = createFormData(data);
      return apiRequest('/Lesson/add-lesson', 'POST', formData, true, true);
    },
    
    update: (data: {
      Id: number;
      Title?: string;
      Content?: File;
      ContentType?: string;
      DurationInMinutes?: number;
      IsPublished?: boolean;
    }) => {
      const formData = createFormData(data);
      return apiRequest('/Lesson/update-lesson', 'PUT', formData, true, true);
    },
    
    delete: (id: number) => 
      apiRequest(`/Lesson/delete-lesson/${id}`, 'DELETE'),
  },
  
  // Reviews
  reviews: {
    add: (data: { courseId: number; rating: number; reviewContent: string }) => 
      apiRequest('/CourseReview/add-course-review', 'POST', data),
    
    getByCourse: (courseId: number) => 
      apiRequest(`/CourseReview/get-course-review/${courseId}`, 'GET', undefined, false),
    
    update: (data: { id: number; rating: number; reviewContent: string }) => 
      apiRequest('/CourseReview/update-course-review', 'PUT', data),
    
    delete: (reviewId: number) => 
      apiRequest(`/CourseReview/delete-course-review/${reviewId}`, 'DELETE'),
  },
  
  // Enrollments
  enrollments: {
    enroll: (courseId: number, isFree: boolean = false) => 
      apiRequest(`/Enrollment/enroll?courseId=${courseId}${isFree ? '&isFree=true' : ''}`, 'POST'),
    
    isEnrolled: (courseId: number) => 
      apiRequest(`/Enrollment/is-enrolled?courseId=${courseId}`),
    
    getById: (id: number) => 
      apiRequest(`/Enrollment/get-enrollment/${id}`),
    
    getCoursesEnrollments: (courseId: number) => 
      apiRequest(`/Enrollment/get-course-enrollments?courseId=${courseId}`),
    
    getStudentEnrollments: () => 
      apiRequest('/Enrollment/get-student-enrollments'),
    
    completeLesson: (lessonId: number) => 
      apiRequest(`/Enrollment/complete-lesson/${lessonId}`, 'POST'),
    
    isLessonCompleted: (lessonId: number) => 
      apiRequest(`/Enrollment/is-lesson-completed/${lessonId}`),
    
    getCompletedLessons: (courseId: number) => 
      apiRequest(`/Enrollment/completed-lessons/${courseId}`),
    
    recalculateProgress: (enrollmentId: number) => 
      apiRequest(`/Enrollment/recalculate-progress/${enrollmentId}`, 'POST'),
  },
  
  // User profile
  profile: {
    get: () => 
      apiRequest("/Account/profile"),
    
    update: (data: UserDTO) => 
      apiRequest("/Account/edit-profile", "PUT", data),
  }
};

// Types based on the documentation
interface UserDTO {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  gender?: string;
  userType?: string;
  dateOfBirth?: string;
}
