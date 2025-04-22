
import { apiRequest, apiFormRequest } from "./api";
import { Course, PaginatedResponse, CourseModule, Lesson, CourseReview } from "@/types/api";

export const CourseService = {
  getAllCourses: async (
    pageNum: number = 1, 
    pageSize: number = 10, 
    sort?: string,
    categoryId?: number,
    search?: string,
    minPrice?: number,
    maxPrice?: number
  ): Promise<PaginatedResponse<Course>> => {
    let url = `/Course/get-all-courses?pagenum=${pageNum}&pagesize=${pageSize}`;
    
    if (sort) url += `&sort=${sort}`;
    if (categoryId) url += `&categoryId=${categoryId}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (minPrice !== undefined) url += `&minPrice=${minPrice}`;
    if (maxPrice !== undefined) url += `&maxPrice=${maxPrice}`;
    
    return apiRequest<PaginatedResponse<Course>>(url);
  },
  
  getCourseById: async (id: number): Promise<Course> => {
    return apiRequest<Course>(`/Course/get-course/${id}`);
  },
  
  // Course modules
  getModulesByCourseId: async (courseId: number): Promise<CourseModule[]> => {
    return apiRequest<CourseModule[]>(`/CourseModule/get-all-course-modules?courseId=${courseId}`);
  },
  
  // Lessons
  getLessonsByModuleId: async (moduleId: number): Promise<Lesson[]> => {
    return apiRequest<Lesson[]>(`/Lesson/get-module-lessons?moduleId=${moduleId}`);
  },
  
  getLessonById: async (id: number): Promise<Lesson> => {
    return apiRequest<Lesson>(`/Lesson/get-lesson-by-id/${id}`);
  },
  
  // Reviews
  getCourseReviews: async (courseId: number): Promise<CourseReview[]> => {
    return apiRequest<CourseReview[]>(`/CourseReview/get-course-review/${courseId}`);
  },
  
  addCourseReview: async (courseId: number, rating: number, reviewContent: string): Promise<any> => {
    return apiRequest("/CourseReview/add-course-review", {
      method: "POST",
      body: JSON.stringify({ courseId, rating, reviewContent }),
    });
  },
  
  updateCourseReview: async (id: number, rating: number, reviewContent: string): Promise<any> => {
    return apiRequest("/CourseReview/update-course-review", {
      method: "PUT",
      body: JSON.stringify({ id, rating, reviewContent }),
    });
  },
  
  deleteCourseReview: async (reviewId: number): Promise<any> => {
    return apiRequest(`/CourseReview/delete-course-review/${reviewId}`, {
      method: "DELETE",
    });
  },
};
