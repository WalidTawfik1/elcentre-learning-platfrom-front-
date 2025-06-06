import { API } from "@/lib/api";
import { CourseService } from "./course-service";
import { CategoryService } from "./category-service";

export const AdminService = {  // Get total courses count
  getTotalCoursesCount: async (): Promise<number> => {
    try {
      const response = await CourseService.getAllCourses(1, 1000); // Get large number to count all
      const courses = (response as any)?.data || (response as any)?.items || response || [];
      return Array.isArray(courses) ? courses.length : 0;
    } catch (error) {
      console.error("Error fetching total courses count:", error);
      return 0;
    }
  },

  // Get active courses count
  getActiveCoursesCount: async (): Promise<number> => {
    try {
      const response = await CourseService.getAllCourses(1, 1000); // Get large number to count all
      const courses = (response as any)?.data || (response as any)?.items || response || [];
      if (Array.isArray(courses)) {
        return courses.filter((course: any) => course.isActive === true).length;
      }
      return 0;
    } catch (error) {
      console.error("Error fetching active courses count:", error);
      return 0;
    }
  },
  // Get total instructors count
  getTotalInstructorsCount: async (): Promise<number> => {
    try {
      const response = await API.auth.getAllInstructors();
      const instructors = (response as any)?.data || response || [];
      return Array.isArray(instructors) ? instructors.length : 0;
    } catch (error) {
      console.error("Error fetching total instructors count:", error);
      return 0;
    }
  },

  // Get total categories count
  getTotalCategoriesCount: async (): Promise<number> => {
    try {
      const categories = await CategoryService.getAllCategories();
      return Array.isArray(categories) ? categories.length : 0;
    } catch (error) {
      console.error("Error fetching total categories count:", error);
      return 0;
    }
  },
  // Get total enrollments count (this is an approximation since we don't have a direct endpoint)
  getTotalEnrollmentsCount: async (): Promise<number> => {
    try {
      const response = await CourseService.getAllCourses(1, 100); // Get courses
      const courses = (response as any)?.data || (response as any)?.items || response || [];
      
      if (!Array.isArray(courses) || courses.length === 0) {
        return 0;
      }

      // Get enrollment counts for all courses and sum them
      const enrollmentPromises = courses.map(async (course: any) => {
        try {
          const count = await CourseService.getEnrollmentCount(course.id);
          return count || 0;
        } catch (error) {
          return 0;
        }
      });

      const enrollmentCounts = await Promise.all(enrollmentPromises);
      return enrollmentCounts.reduce((total, count) => total + count, 0);
    } catch (error) {
      console.error("Error fetching total enrollments count:", error);
      return 0;
    }
  },
  // Get admin dashboard statistics
  getAdminStatistics: async (): Promise<{
    totalCourses: number;
    activeCourses: number;
    totalInstructors: number;
    totalCategories: number;
    totalEnrollments: number;
    pendingCourses: number;
  }> => {
    try {
      const [
        totalCourses,
        activeCourses,
        totalInstructors,
        totalCategories,
        totalEnrollments
      ] = await Promise.all([
        AdminService.getTotalCoursesCount(),
        AdminService.getActiveCoursesCount(),
        AdminService.getTotalInstructorsCount(),
        AdminService.getTotalCategoriesCount(),
        AdminService.getTotalEnrollmentsCount()
      ]);      // Fetch pending courses separately for better debugging
      const pendingCoursesResponse = await CourseService.getPendingCourses();
      console.log("AdminService - Pending courses response:", pendingCoursesResponse);
      
      // Handle different response structures
      let coursesArray = [];
      if (pendingCoursesResponse?.data && Array.isArray(pendingCoursesResponse.data)) {
        coursesArray = pendingCoursesResponse.data;
      } else if (pendingCoursesResponse?.items && Array.isArray(pendingCoursesResponse.items)) {
        coursesArray = pendingCoursesResponse.items;
      } else if (Array.isArray(pendingCoursesResponse)) {
        coursesArray = pendingCoursesResponse;
      }
      
      // Normalize the status field - check for different possible status field names
      coursesArray = coursesArray.map((course: any) => {
        const statusField = course.status || course.courseStatus || course.Status || course.CourseStatus;
        return {
          ...course,
          status: statusField || 'Pending' // Default to Pending if no status found
        };
      });
      
      console.log("AdminService - Courses array:", coursesArray);
      console.log("AdminService - Courses statuses:", coursesArray.map((c: any) => ({ id: c.id, status: c.status })));
      
      // Count pending courses with flexible status matching
      const pendingCourses = coursesArray.filter((course: any) => {
        const normalizedStatus = course.status?.toLowerCase();
        return normalizedStatus === 'pending' || 
               normalizedStatus === 'Pending' || 
               normalizedStatus === 'PENDING' ||
               !course.status; // Also count courses without status as pending
      }).length;
      console.log("AdminService - Pending courses count:", pendingCourses);

      return {
        totalCourses,
        activeCourses,
        totalInstructors,
        totalCategories,
        totalEnrollments,
        pendingCourses
      };
    } catch (error) {
      console.error("Error fetching admin statistics:", error);
      return {
        totalCourses: 0,
        activeCourses: 0,
        totalInstructors: 0,
        totalCategories: 0,
        totalEnrollments: 0,
        pendingCourses: 0
      };
    }
  }
};
