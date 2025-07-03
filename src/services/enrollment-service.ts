import { apiRequest } from "./api";
import { Enrollment } from "@/types/api";

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
    // Make sure we're using the correct API call format
    return apiRequest<boolean>(`/Enrollment/is-enrolled?courseId=${courseId}`, {
      method: "GET"
    }, true);
  },
  
  getStudentEnrollments: async (): Promise<Enrollment[]> => {
    return apiRequest<Enrollment[]>("/Enrollment/get-student-enrollments");
  },
  
  getCourseEnrollments: async (courseId: number): Promise<any[]> => {
    return apiRequest<any[]>(`/Enrollment/get-course-enrollments?courseId=${courseId}`);
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
