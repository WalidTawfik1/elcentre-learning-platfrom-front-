// API Service for interacting with the backend

// Base API URL - Use environment variable with fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://elcentre.runasp.net";

// Configuration for rate limiting and retries
const API_CONFIG = {
  maxRetries: 3,             // Maximum number of retry attempts
  initialBackoffMs: 1000,    // Start with 1 second delay
  maxBackoffMs: 10000,       // Maximum delay of 10 seconds
  backoffFactor: 2,          // Double the delay on each retry
  retryStatusCodes: [429]    // Status codes that should trigger a retry
};

// Helper function to get a cookie value
const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

// Helper function to sleep for a specified number of milliseconds
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

// Calculate backoff time using exponential backoff algorithm
const calculateBackoff = (attempt: number): number => {
  const backoff = Math.min(
    API_CONFIG.maxBackoffMs,
    API_CONFIG.initialBackoffMs * Math.pow(API_CONFIG.backoffFactor, attempt)
  );
  // Add some randomness (jitter) to prevent synchronized retries
  return Math.floor(backoff * (0.8 + Math.random() * 0.4));
};

// Special silent fetch function for endpoints that might 404 in development
// This prevents the browser from logging 404 errors to the console
async function silentFetch(url: string, config: RequestInit): Promise<Response> {
  // Use a try-catch to swallow errors if needed
  try {
    return await fetch(url, config);
  } catch (error) {
    // Create a mock Response object for 404
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper function for making API requests with retry mechanism
async function apiRequest<T>(
  endpoint: string,
  method: string = "GET",
  data?: any,
  requiresAuth: boolean = true,
  isFormData: boolean = false,
  silentMode: boolean = false
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // For logging purposes, extract endpoint path without query params
  const endpointPath = endpoint.split('?')[0];
  
  // Detect if this is a lesson module request, which might result in 404s during development
  const isLessonModuleRequest = endpointPath.includes('/Lesson/get-module-lessons');
  
  // Always use silent mode for lesson module requests
  silentMode = silentMode || isLessonModuleRequest;
  
  const headers: HeadersInit = {
    "Accept": "application/json",
  };

  // Don't set content-type for FormData, let the browser set it with the boundary
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add JWT token to Authorization header if authentication is required
  if (requiresAuth) {
    const token = getCookie('jwt');
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      // Don't log this warning for silent mode requests
      if (!silentMode) {
        console.warn('No JWT token found in cookies for authenticated request');
      }
    }
  }

  const config: RequestInit = {
    method,
    headers,
    mode: "cors",
    credentials: requiresAuth ? "include" : "omit", // Still include cookies for redundancy
  };

  if (data) {
    if (isFormData && data instanceof FormData) {
      config.body = data;
    } else if (method === "POST" || method === "PUT" || method === "PATCH") {
      config.body = JSON.stringify(data);
    }
  }

  // Initialize retry counter
  let retryCount = 0;
  let lastResponse: Response | null = null;
  let lastError: any = null;

  // Keep trying while we have retries left
  while (retryCount <= API_CONFIG.maxRetries) {
    try {
      // If this is a retry, add a delay with exponential backoff
      if (retryCount > 0) {
        const backoffMs = calculateBackoff(retryCount - 1);
        if (!silentMode) {
          console.log(`Rate limited (429). Retry ${retryCount}/${API_CONFIG.maxRetries} after ${backoffMs}ms delay`);
        }
        await sleep(backoffMs);
      }

      // Use the appropriate fetch function based on silent mode
      const response = silentMode 
        ? await silentFetch(url, config)
        : await fetch(url, config);
      
      lastResponse = response;
      
      // For silent mode requests that return 404, return empty array/object
      if (silentMode && response.status === 404) {
        return ([] as unknown) as T;
      }
      
      // Only log for non-silent requests
      if (!silentMode) {
        // Log reduced information without full URLs
        console.log(`API ${method} to ${endpointPath} - Status: ${response.status}`);
      }
      
      // Check if we got a rate limit error and should retry
      if (API_CONFIG.retryStatusCodes.includes(response.status) && retryCount < API_CONFIG.maxRetries) {
        retryCount++;
        continue;
      }
      
      // For other non-OK responses
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage;
        try {
          const errorData = await response.json();
          
          // Special handling for 400 errors - they often contain validation details
          if (response.status === 400) {
            // Check for various error formats
            if (errorData.errors) {
              // Handle ASP.NET validation errors object
              const errorDetails = Object.entries(errorData.errors)
                .map(([key, messages]) => `${key}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                .join('; ');
              errorMessage = `Validation error: ${errorDetails}`;
            } else if (errorData.detail) {
              // Some APIs use 'detail' field for error messages
              errorMessage = errorData.detail;
            } else if (errorData.message) {
              // Standard message field
              errorMessage = errorData.message;
            } else if (typeof errorData === 'string') {
              // Plain string error
              errorMessage = errorData;
            } else {
              // Fallback to stringify the entire error object
              errorMessage = `Bad Request: ${JSON.stringify(errorData)}`;
            }
          } else {
            // Standard error format for other status codes
            errorMessage = errorData.message || `API Error: ${response.status}`;
          }
          
          // Only log errors for non-silent requests
          if (!silentMode) {
            console.error(`API Error (${method} ${endpointPath}):`, {
              status: response.status,
              message: errorMessage,
              data: errorData
            });
          }
        } catch (e) {
          errorMessage = `API Error: ${response.status}`;
        }
        
        // For silent mode, just return empty data instead of throwing
        if (silentMode) {
          return ([] as unknown) as T;
        }
        
        throw new Error(errorMessage);
      }
      
      // For 204 No Content responses
      if (response.status === 204) {
        return {} as T;
      }
      
      // Try to parse JSON or return empty object
      try {
        return await response.json();
      } catch (jsonError) {
        // Only log warnings for non-silent requests
        if (!silentMode) {
          console.warn(`Could not parse response as JSON for ${endpointPath}`);
        }
        return {} as T;
      }
    } catch (error) {
      lastError = error;
      
      // Only retry network errors, not application errors
      if (!(error instanceof TypeError) || retryCount >= API_CONFIG.maxRetries) {
        break;
      }
      
      retryCount++;
    }
  }
  
  // If we get here, all retries have failed or we got an error that wasn't retryable
  
  // For silent mode, just return empty data instead of throwing
  if (silentMode) {
    return ([] as unknown) as T;
  }
  
  // For other errors, log with limited info
  console.error(`API request failed after ${retryCount} retries (${method} ${endpointPath}):`, 
    lastError instanceof Error ? lastError.message : "Unknown error");
  
  throw lastError || new Error(`Request failed after ${retryCount} retries`);
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

    getInstructorCourses: () =>
      apiRequest('/Course/get-all-instructor-courses', 'GET', undefined, true),
    
    add: (data: { 
      Title: string; 
      Description: string; 
      Price: number; 
      Thumbnail: File | File[];
      IsActive: boolean; 
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
      apiRequest("/Category/update-category", "PUT", data,),
      
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
      // Remove silent mode and handle retries properly for lesson fetching
      apiRequest(`/Lesson/get-module-lessons?moduleId=${moduleId}`, 'GET', undefined, false, false, false),
    
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
      KeepExistingContent?: boolean;
    }) => {
      const formData = createFormData(data);
      
      // If KeepExistingContent is true, add a special field to inform the backend
      if (data.KeepExistingContent) {
        formData.append("KeepExistingContent", "true");
      }
      
      return apiRequest('/Lesson/update-lesson', 'PUT', formData, true, true);
    },
    
    delete: (id: number) => 
      apiRequest(`/Lesson/delete-lesson/${id}`, 'DELETE'),
  },
  
  // Reviews
  reviews: {
    add: (data: { CourseId: number; Rating: number; ReviewContent: string }) => {
      // Explicitly set requiresAuth to true to ensure cookies are included
      return apiRequest('/CourseReview/add-course-review', 'POST', data, true);
    },
    
    getByCourse: (courseId: number) => 
      apiRequest(`/CourseReview/get-course-review/${courseId}`, 'GET', undefined, false),
    
    update: (data: { Id: number; Rating: number; ReviewContent: string }) => 
      // Explicitly set requiresAuth to true to ensure cookies are included
      apiRequest('/CourseReview/update-course-review', 'PUT', data, true),
    
    delete: (reviewId: number) => 
      // Explicitly set requiresAuth to true to ensure cookies are included
      apiRequest(`/CourseReview/delete-course-review/${reviewId}`, 'DELETE', undefined, true),
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
    
    getStudentsCount: (courseId: number) =>
      apiRequest(`/Enrollment/students-count/${courseId}`),
    
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
