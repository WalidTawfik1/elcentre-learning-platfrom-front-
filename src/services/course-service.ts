import { API } from "@/lib/api";
import { Course, PaginatedResponse, CourseModule, Lesson, CourseReview } from "@/types/api";
import { EnrollmentService } from "./enrollment-service";

export const CourseService = {
  getAllCourses: async (
    pageNum: number = 1, 
    pageSize: number = 10, 
    sort?: string,
    categoryId?: number,
    search?: string,
    minPrice?: number,
    maxPrice?: number
  ): Promise<any> => {
    const params: any = {
      pagenum: pageNum,
      pagesize: pageSize
    };
    
    if (sort) params.sort = sort;
    if (categoryId) params.categoryId = categoryId;
    if (search) params.search = search;
    if (minPrice !== undefined) params.minPrice = minPrice;
    if (maxPrice !== undefined) params.maxPrice = maxPrice;
    
    return API.courses.getAll(params);
  },
  
  getCourseById: async (id: string | number): Promise<any> => {
    return API.courses.getById(Number(id));
  },
  
  // Course modules
  getModulesByCourseId: async (courseId: string | number): Promise<any> => {
    return API.modules.getAll(Number(courseId));
  },
  
  // Alias for more readable calls in components
  getModules: async (courseId: string | number): Promise<any> => {
    return API.modules.getAll(Number(courseId));
  },
  
  // Lessons
  getLessonsByModuleId: async (moduleId: string | number): Promise<any> => {
    return API.lessons.getByModule(Number(moduleId));
  },
  
  // Alias for more readable calls in components
  getLessons: async (courseId: string | number, moduleId: string | number): Promise<any> => {
    return API.lessons.getByModule(Number(moduleId));
  },
  
  getLessonById: async (id: string | number): Promise<any> => {
    return API.lessons.getById(Number(id));
  },
  
  // Reviews
  getCourseReviews: async (courseId: string | number): Promise<any> => {
    return API.reviews.getByCourse(Number(courseId));
  },
  
  addCourseReview: async (courseId: string | number, rating: number, reviewContent: string): Promise<any> => {
    return API.reviews.add({ courseId: Number(courseId), rating, reviewContent });
  },
  
  updateCourseReview: async (id: string | number, rating: number, reviewContent: string): Promise<any> => {
    return API.reviews.update({ id: Number(id), rating, reviewContent });
  },
  
  deleteCourseReview: async (reviewId: string | number): Promise<any> => {
    return API.reviews.delete(Number(reviewId));
  },

  // Enrollments
  getEnrollments: async (): Promise<any> => {
    return API.enrollments.getStudentEnrollments();
  },

  enroll: async (courseId: string | number): Promise<any> => {
    return EnrollmentService.enrollInCourse(Number(courseId));
  },
  
  // New method for free enrollment regardless of course price
  freeEnroll: async (courseId: string | number): Promise<any> => {
    return EnrollmentService.freeEnrollment(Number(courseId));
  },

  isEnrolled: async (courseId: string | number): Promise<any> => {
    // Use EnrollmentService directly for consistency
    return EnrollmentService.isEnrolled(Number(courseId));
  }
};
