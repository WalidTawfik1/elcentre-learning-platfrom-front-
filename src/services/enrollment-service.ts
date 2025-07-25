import { apiRequest } from "./api";
import { API } from "@/lib/api";
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
    try {
      const result = await API.enrollments.getCoursesEnrollments(courseId);
      // Ensure we return an array
      const enrollments = Array.isArray(result) ? result : [];
      return enrollments;
    } catch (error) {
      // Return empty array on error to prevent dashboard from breaking
      return [];
    }
  },

  // Calculate student count from enrollment response
  calculateStudentCount: (enrollments: any[]): number => {
    if (!Array.isArray(enrollments)) {
      return 0;
    }
    return enrollments.length;
  },

  // Calculate completion rate for a specific course
  calculateCourseCompletionRate: (enrollments: any[]): number => {
    if (!Array.isArray(enrollments) || enrollments.length === 0) {
      return 0;
    }

    
    // Count completed enrollments (assuming progress >= 100 or completed flag)
    const completedCount = enrollments.filter(enrollment => {
      const progress = enrollment.progress || enrollment.Progress || 0;
      const isCompleted = enrollment.completed || enrollment.Completed || progress >= 100;
      return isCompleted;
    }).length;

    const completionRate = enrollments.length > 0 ? (completedCount / enrollments.length) * 100 : 0;
    
    return Math.round(completionRate); // Round to integer
  },

  // Calculate average completion rate across multiple courses
  calculateAverageCompletionRate: (coursesEnrollments: { courseId: number, enrollments: any[] }[]): number => {
    if (!Array.isArray(coursesEnrollments) || coursesEnrollments.length === 0) {
      return 0;
    }
    
    const courseRates = coursesEnrollments.map(({ courseId, enrollments }) => {
      const rate = EnrollmentService.calculateCourseCompletionRate(enrollments);
      return rate;
    });

    const validRates = courseRates.filter(rate => !isNaN(rate) && rate >= 0);
    const averageRate = validRates.length > 0 
      ? validRates.reduce((sum, rate) => sum + rate, 0) / validRates.length 
      : 0;

    return Math.round(averageRate); // Round to integer
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

  // Get detailed completed lessons with completion dates
  getCompletedLessonsDetailed: async (courseId: number): Promise<{
    lessonId: number;
    enrollmentId: number;
    completedDate: string;
  }[]> => {
    return apiRequest<{
      lessonId: number;
      enrollmentId: number;
      completedDate: string;
    }[]>(`/Enrollment/completed-lessons/${courseId}`);
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
