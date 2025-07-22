// API Service for interacting with the backend

import { API_BASE_URL, DIRECT_API_URL } from "@/config/api-config";
import { rateLimitMonitor } from "./rate-limit-monitor";

// Configuration for rate limiting and retries
const API_CONFIG = {
  maxRetries: 3,             // Maximum number of retry attempts
  initialBackoffMs: 2000,    // Start with 2 seconds delay (increased)
  maxBackoffMs: 30000,       // Maximum delay of 30 seconds (increased)
  backoffFactor: 2,          // Double the delay on each retry
  retryStatusCodes: [429],   // Status codes that should trigger a retry
  
  // New: Request tracking for better monitoring
  trackRequests: true,
  logRateLimitErrors: true,
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
    if (token) {      // Validate token format and expiration
      if (!isValidJwtToken(token)) {
        if (!silentMode) {
          // Clear invalid token
        }
        // Clear invalid token
        document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      } else if (isTokenExpired(token)) {
        if (!silentMode) {
          // Clear expired token
        }
        // Clear expired token
        document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";} else {
        headers["Authorization"] = `Bearer ${token}`;
      }    } else {      // Don't log this warning for silent mode requests
      if (!silentMode) {
        // No JWT token found for authenticated request
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
    }  }

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
        
      }
      
      // Check if we got a rate limit error and should retry
      if (API_CONFIG.retryStatusCodes.includes(response.status) && retryCount < API_CONFIG.maxRetries) {
        // Log the rate limit error for monitoring
        if (API_CONFIG.logRateLimitErrors) {
          rateLimitMonitor.logRateLimitError(url, method, retryCount, {
            endpoint: endpointPath,
            requiresAuth,
            timestamp: new Date().toISOString()
          });
        }
        
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
            // API Error occurred
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
      } catch (jsonError) {        // Only log warnings for non-silent requests
        if (!silentMode) {
          // Could not parse response as JSON
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
  // API request failed after retries
  
  throw lastError || new Error(`Request failed after ${retryCount} retries`);
}

// Helper to handle file uploads and form data
const createFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    // Skip undefined and null values entirely
    if (value === undefined || value === null) {
      return;
    }
    
    // If dealing with a file
    if (value instanceof File) {
      formData.append(key, value);
    } 
    // If dealing with an array of files
    else if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
      value.forEach(file => formData.append(key, file));
    }
    // For boolean, number, and other primitive values
    else if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
      formData.append(key, String(value));
    }
  });
  
  return formData;
};

// Helper function for uploads with progress tracking and cancellation
const uploadWithProgress = <T>(
  endpoint: string,
  formData: FormData,
  onProgress?: (progress: number) => void,
  abortController?: AbortController
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${API_BASE_URL}${endpoint}`;

    // Set up upload progress tracking
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });
    }

    // Handle upload completion
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = xhr.responseText ? JSON.parse(xhr.responseText) : {};
          resolve(response);
        } catch (error) {
          resolve(xhr.responseText as any);
        }
      } else {
        reject(new Error(`Upload failed with status: ${xhr.status}`));
      }
    });

    // Handle upload errors
    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed due to network error'));
    });

    // Handle upload abort
    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was cancelled'));
    });

    // Set up abort controller
    if (abortController) {
      abortController.signal.addEventListener('abort', () => {
        xhr.abort();
      });
    }

    // Open the request first
    xhr.open('POST', url);
    
    // Add JWT token to Authorization header if available (after opening)
    const token = getCookie('jwt');
    if (token && isValidJwtToken(token) && !isTokenExpired(token)) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    // Send the request
    xhr.send(formData);
  });
};

// Helper function to validate JWT token format
const isValidJwtToken = (token: string): boolean => {
  if (!token) return false;
  // JWT tokens should have 3 parts separated by dots
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
};

// Helper function to decode JWT payload (for debugging)
const decodeJwtPayload = (token: string): any => {
  try {
    if (!isValidJwtToken(token)) return null;
    const payload = token.split('.')[1];
    const decoded = atob(payload);    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
};

// Helper function to check if JWT token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
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
    }) => {
      // Use direct API URL for auth endpoints to ensure cookies are set correctly
      const url = `${DIRECT_API_URL}/Account/register`;
      return fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include',
        mode: 'cors'
      }).then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.message || 'Registration failed');
          });
        }
        return response.json();
      });
    },
      login: (data: { email: string; password: string }) => {
      // Use direct API URL for auth endpoints to ensure cookies are set correctly
      const url = `${DIRECT_API_URL}/Account/login`;
      return fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include',
        mode: 'cors'
      }).then(async response => {
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Login failed');
        }
        
        const responseData = await response.json();
        
        // Extract JWT token from response and set it as cookie
        let token = null;
        
        // Check for token in multiple possible locations
        if (typeof responseData === 'string') {
          token = responseData;
        } else if (responseData) {
          token = responseData.message || 
                  responseData.token || 
                  responseData.accessToken || 
                  responseData.jwt ||
                  responseData.access_token ||
                  (responseData.data && (
                    responseData.data.token || 
                    responseData.data.accessToken ||
                    responseData.data.jwt
                  ));
        }
        
        // Also check response headers for Authorization header
        const authHeader = response.headers.get('Authorization') || response.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
        
        if (token) {
          // Clear any existing token cookies
          document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          
          // Set the JWT as a cookie with proper attributes
          const date = new Date();
          date.setTime(date.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
          const expires = "; expires=" + date.toUTCString();          document.cookie = "jwt=" + token + expires + "; path=/; SameSite=Lax";
          
        }
        
        return responseData;
      });
    },
    
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
      getAllInstructors: () => 
      apiRequest('/Account/get-all-instructors', 'GET', undefined, false),
    
    getInstructorById: (instructorId: string | number) =>
      apiRequest(`/Account/get-instructor-by-id/${instructorId}`, 'GET', undefined, false),

    getAllUsers: (params: {
      pagenum?: number;
      pagesize?: number;
      Maxpagesize?: number;
      sort?: string;
      search?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (params.pagenum) queryParams.append('pagenum', params.pagenum.toString());
      if (params.pagesize) queryParams.append('pagesize', params.pagesize.toString());
      if (params.Maxpagesize) queryParams.append('Maxpagesize', params.Maxpagesize.toString());
      if (params.sort) queryParams.append('sort', params.sort);
      if (params.search) queryParams.append('search', params.search);
      
      const queryString = queryParams.toString();
      return apiRequest(`/Account/get-all-users${queryString ? `?${queryString}` : ''}`, 'GET', undefined, true);
    },

    blockUnblockUser: (userId: string, block: boolean) => {
      return apiRequest(`/Account/block-user/${userId}?block=${block}`, 'PUT', undefined, true);
    },
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
      apiRequest(`/Course/get-course/${id}`, 'GET', undefined, false),    getInstructorCourses: () =>
      apiRequest('/Course/get-all-instructor-courses', 'GET', undefined, true),
    
    getInstructorCoursesById: (instructorId: string | number) =>
      apiRequest(`/Course/get-all-approved-instructor-courses/${instructorId}`, 'GET', undefined, false),
    
    // Admin course approval endpoints
    getPendingCourses: () =>
      apiRequest('/Course/get-pending-courses', 'GET', undefined, true),
      updatePendingCourse: (courseId: number, data: {
      status: 'Approved' | 'Rejected';
      rejectionReason?: string;
    }) => {
      const payload = {
        decision: data.status === 'Approved' ? 'approve' : 'reject',
        rejectionReason: data.rejectionReason || ""
      };
      return apiRequest(`/Course/update-pending-course/${courseId}`, 'PUT', payload, true);
    },
    
    add: (data: { 
      Title: string; 
      Description: string; 
      Price: number; 
      Thumbnail: File | File[];
      IsActive: boolean; 
      CategoryId: number;
      DurationInHours: number;
      Requirements?: string;
      UseAIAssistant?: boolean;
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
      DurationInHours?: number;
      Requirements?: string;
      UseAIAssistant?: boolean;
    }) => {
      const formData = createFormData(data);
      return apiRequest('/Course/update-course', 'PUT', formData, true, true);
    },
    
    delete: (id: number) => 
      apiRequest(`/Course/delete-course/${id}`, 'DELETE'),
    
    // Admin specific course management
    getAllForAdmin: (params?: { 
      pagenum?: number;
      pagesize?: number; 
      Maxpagesize?: number;
      sort?: string;
      categoryId?: number;
      search?: string;
      minPrice?: number;
      maxPrice?: number;
    }) => 
      apiRequest(`/Course/get-all-courses-for-admin${params ? `?${new URLSearchParams(params as any).toString()}` : ""}`, 'GET', undefined, true),
    
    deleteAdmin: (courseId: number) => 
      apiRequest(`/Course/delete-course-admin/${courseId}?delete=true`, 'PUT', undefined, true),
    
    undeleteAdmin: (courseId: number) => 
      apiRequest(`/Course/delete-course-admin/${courseId}?delete=false`, 'PUT', undefined, true),
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
      Description: string;
      IsPublished: boolean;
      ModuleId: number;
    }) => {
      const formData = createFormData(data);
      return apiRequest('/Lesson/add-lesson', 'POST', formData, true, true);
    },

    addWithProgress: (
      data: {
        Title: string;
        Content: File;
        ContentType: string;
        DurationInMinutes: number;
        Description: string;
        IsPublished: boolean;
        ModuleId: number;
      },
      onProgress?: (progress: number) => void,
      abortController?: AbortController
    ) => {
      const formData = createFormData(data);
      return uploadWithProgress('/Lesson/add-lesson', formData, onProgress, abortController);
    },    update: (data: {
      Id: number;
      Title?: string;
      DurationInMinutes?: number;
      Description?: string;
      IsPublished?: boolean;
    }) => {
      // Send as JSON (backend expects JSON format, not FormData)
      return apiRequest('/Lesson/update-lesson', 'PUT', data, true, false);
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
      apiRequest(`/Enrollment/enroll?courseId=${courseId}${isFree ? '' : ''}`, 'POST'),
    
    // For free courses, use simple endpoint without payment processing
    enrollFree: (courseId: number) => 
      apiRequest(`/Enrollment/enroll?courseId=${courseId}`, 'POST'),
    
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
  },  // Quiz endpoints
  quiz: {    getAllCourseQuizzes: (courseId: number) => 
      apiRequest(`/Quiz/get-all-course-quizzes?courseId=${courseId}`, 'GET', undefined, true),
      getQuizById: (id: number) =>
      apiRequest(`/Quiz/get-quiz-by-id/${id}`, 'GET', undefined, true),
        addQuiz: (data: {
      Question: string;
      OptionA: string;
      OptionB: string;
      OptionC: string;
      OptionD: string;
      CorrectAnswer: string;
      Explanation: string;
      CourseId: number;
      LessonId: number;
    }) => {
      const formData = createFormData(data);
      return apiRequest('/Quiz/add-quiz', 'POST', formData, true, true);
    },

    updateQuiz: (data: {
      Id: number;
      Question: string;
      OptionA: string;
      OptionB: string;
      OptionC: string;
      OptionD: string;
      CorrectAnswer: string;
      Explanation: string;
      CourseId: number;
      LessonId: number;
    }) => {
      const formData = createFormData(data);
      return apiRequest('/Quiz/update-quiz', 'PUT', formData, true, true);
    },    deleteQuiz: (quizId: number) =>
      apiRequest(`/Quiz/delete-quiz/${quizId}`, 'DELETE', undefined, true),
  },
  
  // Student Quiz endpoints
  studentQuiz: {
    submitAnswer: (quizId: number, answer: string) => {
      const endpoint = `/StudentQuiz/submit-quiz-answer?quizId=${quizId}&answer=${encodeURIComponent(answer)}`;
      return apiRequest(endpoint, 'POST', undefined, true);
    },
    
    getTotalScore: (lessonId: number) =>
      apiRequest(`/StudentQuiz/get-total-score?lessonId=${lessonId}`, 'GET', undefined, true),
    
    getStudentQuizzesByLesson: (lessonId: number) =>
      apiRequest(`/StudentQuiz/get-student-quizzes-by-lesson?lessonId=${lessonId}`, 'GET', undefined, true),
  },
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
