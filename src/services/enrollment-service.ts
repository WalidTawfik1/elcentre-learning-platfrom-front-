import { apiRequest } from "./api";
import { Enrollment } from "@/types/api";

export const EnrollmentService = {
  enrollInCourse: async (courseId: number): Promise<any> => {
    return apiRequest(`/Enrollment/enroll?courseId=${courseId}`, {
      method: "POST",
    });
  },
  
  // New method for free enrollment regardless of course price
  freeEnrollment: async (courseId: number): Promise<any> => {
    // Using the correct parameter format for services/api.ts apiRequest function
    return apiRequest(`/Enrollment/enroll?courseId=${courseId}&isFree=true`, {
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
};
