import { API } from "@/lib/api";
import { Course, PaginatedResponse, CourseModule, Lesson, CourseReview, PendingCourse, CourseApprovalRequest } from "@/types/api";
import { EnrollmentService } from "./enrollment-service";
import { backgroundRequest, highPriorityRequest, debouncedSearch } from "@/lib/rate-limiter";


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
    
    // Use rate limiting for course searches
    if (search) {
      return debouncedSearch(
        () => API.courses.getAll(params),
        `courses-search-${JSON.stringify(params)}`,
        500 // 500ms debounce for search
      );
    }
    
    return await highPriorityRequest(
      () => API.courses.getAll(params),
      `courses-${JSON.stringify(params)}`
    );
  },

  getFeaturedCourses: async (pageSize: number = 16): Promise<any> => {
    const params = {
      pagenum: 1,
      pagesize: pageSize,
      sort: "Rating"
    };
    
    return await highPriorityRequest(
      () => API.courses.getAll(params),
      `featured-courses-${pageSize}`
    );
  },
  
  getCourseById: async (id: string | number): Promise<any> => {
    return await highPriorityRequest(
      () => API.courses.getById(Number(id)),
      `course-detail-${id}`
    );
  },
  
  // Course modules
  getModulesByCourseId: async (courseId: string | number): Promise<any> => {
    return await highPriorityRequest(
      () => API.modules.getAll(Number(courseId)),
      `course-modules-${courseId}`
    );
  },
  
  // Alias for more readable calls in components
  getModules: async (courseId: string | number): Promise<any> => {
    return await highPriorityRequest(
      () => API.modules.getAll(Number(courseId)),
      `course-modules-${courseId}`
    );
  },
  
  // Lessons
  getLessonsByModuleId: async (moduleId: string | number): Promise<any> => {
    return await highPriorityRequest(
      () => API.lessons.getByModule(Number(moduleId)),
      `module-lessons-${moduleId}`
    );
  },
  
  // Alias for more readable calls in components
  getLessons: async (courseId: string | number, moduleId: string | number): Promise<any> => {
    return await highPriorityRequest(
      () => API.lessons.getByModule(Number(moduleId)),
      `module-lessons-${moduleId}`
    );
  },
  
  getLessonById: async (id: string | number): Promise<any> => {
    return await highPriorityRequest(
      () => API.lessons.getById(Number(id)),
      `lesson-${id}`
    );
  },
  
  // Reviews
  getCourseReviews: async (courseId: string | number): Promise<any> => {
    return await highPriorityRequest(
      () => API.reviews.getByCourse(Number(courseId)),
      `course-reviews-${courseId}`
    );
  },
  
  addCourseReview: async (courseId: string | number, rating: number, reviewContent: string): Promise<any> => {
    return API.reviews.add({
      CourseId: Number(courseId),
      Rating: rating,
      ReviewContent: reviewContent
    });
  },
  
  updateCourseReview: async (id: string | number, rating: number, reviewContent: string): Promise<any> => {
    return API.reviews.update({
      Id: Number(id),
      Rating: rating,
      ReviewContent: reviewContent
    });
  },
  
  deleteCourseReview: async (reviewId: string | number): Promise<any> => {
    return API.reviews.delete(Number(reviewId));
  },

  // Enrollments
  getEnrollments: async (): Promise<any> => {
    return API.enrollments.getStudentEnrollments();
  },

  // Regular enrollment - this will handle payment processing for paid courses
  enroll: async (courseId: string | number): Promise<any> => {
    return EnrollmentService.enrollInCourse(Number(courseId));
  },
  
  // Free enrollment - specifically for courses where price = 0
  freeEnroll: async (courseId: string | number): Promise<any> => {
    return EnrollmentService.freeEnrollment(Number(courseId));
  },

  isEnrolled: async (courseId: string | number): Promise<any> => {
    // Use EnrollmentService directly for consistency
    return EnrollmentService.isEnrolled(Number(courseId));
  },
  // Get enrollment count for a course
  getEnrollmentCount: async (courseId: string | number): Promise<any> => {
    return await highPriorityRequest(
      () => API.enrollments.getStudentsCount(Number(courseId)),
      `enrollment-count-${courseId}`
    );
  },

  // Get completion rate for a course
  getCourseCompletionRate: async (courseId: string | number): Promise<number> => {
    return await backgroundRequest(
      async () => {
        try {
          // Get all enrollments for the course
          const enrollments = await EnrollmentService.getCourseEnrollments(Number(courseId));
          
          if (!Array.isArray(enrollments) || enrollments.length === 0) {
            return 0;
          }
          
          // Calculate average progress across all enrollments
          const totalProgress = enrollments.reduce((total, enrollment) => {
            return total + (enrollment.progress || 0);
          }, 0);
          return Math.round(totalProgress / enrollments.length);
        } catch (error) {
          return 0;
        }
      },
      `course-completion-${courseId}`,
      300000 // 5 minute cache for completion rates
    );
  },

  // Get course reviews with count information
  getCourseReviewsWithCount: async (courseId: string | number): Promise<number> => {
    return await highPriorityRequest(
      async () => {
        const reviews = await API.reviews.getByCourse(Number(courseId)) as { studentId: string, studentName: string, id: number, rating: number, reviewContent: string, createdAt: string, count: number }[];
        const reviewCount = reviews[0]?.count || 0;  // Assuming reviews is an array and you're interested in the first one
        return reviewCount;
      },
      `course-reviews-count-${courseId}`
    );
  },

  getInstructorCourses: async (): Promise<any> => {
    return await backgroundRequest(
      () => API.courses.getInstructorCourses(),
      'instructor-courses',
      5000 // 5 second debounce
    );
  },

  addCourse: async (courseData: {
    title: string;
    description: string;
    price: number;
    thumbnail: File;
    isActive: boolean;
    categoryId: number;
    durationInHours: number;
    requirements?: string;
    useAIAssistant?: boolean;
  }): Promise<any> => {
    // Transform the data to match API expectations (PascalCase)
    const formattedData = {
      Title: courseData.title,
      Description: courseData.description,
      Price: courseData.price,
      Thumbnail: courseData.thumbnail,
      IsActive: courseData.isActive,
      CategoryId: courseData.categoryId,
      DurationInHours: courseData.durationInHours,
      Requirements: courseData.requirements || "",
      UseAIAssistant: courseData.useAIAssistant ?? false
    };

    return API.courses.add(formattedData);
  },

  updateCourse: async (courseData: {
    id: number;
    title?: string;
    description?: string;
    price?: number;
    thumbnail?: File;
    isActive?: boolean;
    categoryId?: number;
    durationInHours?: number;
    requirements?: string;
    useAIAssistant?: boolean;
  }): Promise<any> => {
    // Transform the data to match API expectations (PascalCase)
    const formattedData = {
      Id: courseData.id,
      Title: courseData.title,
      Description: courseData.description,
      Price: courseData.price,
      Thumbnail: courseData.thumbnail,
      IsActive: courseData.isActive,
      CategoryId: courseData.categoryId,
      DurationInHours: courseData.durationInHours,
      Requirements: courseData.requirements || undefined,
      UseAIAssistant: courseData.useAIAssistant
    };

    return API.courses.update(formattedData);
  },

  deleteCourse: async (courseId: number): Promise<any> => {
    try {      await API.courses.delete(courseId);
      return true;
    } catch (error) {
      throw error; // Re-throw to handle in component
    }
  },
  // Admin course approval functions
  getPendingCourses: async (): Promise<any> => {
    return API.courses.getPendingCourses();
  },

  approveCourse: async (courseId: number): Promise<any> => {
    return API.courses.updatePendingCourse(courseId, { status: 'Approved' });
  },

  rejectCourse: async (courseId: number, rejectionReason?: string): Promise<any> => {
    return API.courses.updatePendingCourse(courseId, { 
      status: 'Rejected', 
      rejectionReason 
    });
  },
};
