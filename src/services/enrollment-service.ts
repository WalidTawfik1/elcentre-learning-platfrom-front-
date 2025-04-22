
import { apiRequest } from "./api";
import { Enrollment } from "@/types/api";

export const EnrollmentService = {
  enrollInCourse: async (courseId: number): Promise<any> => {
    return apiRequest(`/Enrollment/enroll?courseId=${courseId}`, {
      method: "POST",
    });
  },
  
  isEnrolled: async (courseId: number): Promise<boolean> => {
    return apiRequest<boolean>(`/Enrollment/is-enrolled?courseId=${courseId}`);
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
};
