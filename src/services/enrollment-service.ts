import { apiRequest } from "./api";
import { Enrollment } from "@/types/api";
import { backgroundRequest, highPriorityRequest } from "@/lib/rate-limiter";

export const EnrollmentService = {
  // Regular enrollment - this will handle payment processing if needed
  enrollInCourse: async (courseId: number): Promise<any> => {
    return apiRequest(`/Enrollment/enroll?courseId=${courseId}`, {
      method: "POST",
    });
  },
  
  // Free enrollment - specifically for free courses (price = 0)
  freeEnrollment: async (courseId: number): Promise<any> => {
    // For free courses, use the simple enroll endpoint without payment processing
    return apiRequest(`/Enrollment/enroll?courseId=${courseId}`, {
      method: "POST",
    }, true);  // Last parameter is requiresAuth = true
  },
  
  isEnrolled: async (courseId: number): Promise<boolean> => {
    return await highPriorityRequest(
      () => apiRequest<boolean>(`/Enrollment/is-enrolled?courseId=${courseId}`, {
        method: "GET"
      }, true),
      `is-enrolled-${courseId}`
    );
  },
  
  getStudentEnrollments: async (): Promise<Enrollment[]> => {
    return await highPriorityRequest(
      () => apiRequest<Enrollment[]>("/Enrollment/get-student-enrollments"),
      'student-enrollments'
    );
  },
  
  getCourseEnrollments: async (courseId: number): Promise<any[]> => {
    return await backgroundRequest(
      () => apiRequest<any[]>(`/Enrollment/get-course-enrollments?courseId=${courseId}`),
      `course-enrollments-${courseId}`,
      120000 // 2 minute cache for course enrollment lists
    );
  },
  
  completeLesson: async (lessonId: number): Promise<any> => {
    return apiRequest(`/Enrollment/complete-lesson/${lessonId}`, {
      method: "POST",
    });
  },
  
  isLessonCompleted: async (lessonId: number): Promise<boolean> => {
    return apiRequest<boolean>(`/Enrollment/is-lesson-completed/${lessonId}`);
  },
    getCompletedLessons: async (courseId: number): Promise<number[]> => {
    return apiRequest<number[]>(`/Enrollment/completed-lessons/${courseId}`);
  },
  
  getStudentsCount: async (courseId: number): Promise<number> => {
    return apiRequest<number>(`/Enrollment/students-count/${courseId}`);
  },

  recalculateProgress: async (enrollmentId: number): Promise<{ progress: number }> => {
    return apiRequest<{ progress: number }>(`/Enrollment/recalculate-progress/${enrollmentId}`, {
      method: "POST",
    });
  },
};
