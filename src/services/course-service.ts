import { apiRequest, apiFormRequest } from "./api";
import { Course, PaginatedResponse, CourseModule, Lesson, CourseReview } from "@/types/api";

// Base API URL
const API_BASE_URL = "http://elcentre.runasp.net";

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
    
    const response = await apiRequest<any>(url);
    
    // Transform the response to match our PaginatedResponse interface
    return {
      items: response.data || [],
      totalCount: response.totalCount,
      pageNumber: response.pageNumber,
      pageSize: response.pageSize,
      totalPages: Math.ceil(response.totalCount / response.pageSize)
    };
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
  
  // Get course thumbnail full URL
  getCourseThumbnailUrl: (thumbnailPath: string): string => {
    // If the thumbnail is a full URL, return it as is
    if (thumbnailPath.startsWith('http')) {
      return thumbnailPath;
    }
    
    // Otherwise, join it with the base URL
    return `${API_BASE_URL}${thumbnailPath}`;
  }
};
