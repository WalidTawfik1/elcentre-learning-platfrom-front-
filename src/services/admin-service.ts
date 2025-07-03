import { API } from "@/lib/api";
import { CourseService } from "./course-service";
import { CategoryService } from "./category-service";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: 'Student' | 'Instructor' | 'Admin';
  isActive: boolean;
  createdAt: string;
  phoneNumber?: string;
}

interface GetAllUsersParams {
  pagenum?: number;
  pagesize?: number;
  Maxpagesize?: number;
  sort?: 'Admin' | 'Instructor' | 'Student' | 'Active' | 'Blocked';
  search?: string;
}

interface GetAllUsersResponse {
  users: User[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

interface GetAllCoursesParams {
  pagenum?: number;
  pagesize?: number;
  Maxpagesize?: number;
  sort?: 'PriceAsc' | 'PriceDesc' | 'Rating';
  categoryId?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

interface AdminCourse {
  id: number;
  title: string;
  description: string;
  price: number;
  thumbnail: string;
  isActive: boolean;
  isDeleted: boolean;
  durationInHours: number;
  categoryId: number;
  categoryName?: string;
  rating?: number;
  instructorId?: string;
  instructorName?: string;
  instructorImage?: string;
  enrollmentCount?: number;
  courseStatus?: string;
  createdAt?: string;
}

interface GetAllCoursesResponse {
  courses: AdminCourse[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export const AdminService = {  // Get total courses count
  getTotalCoursesCount: async (): Promise<number> => {
    try {
      const response = await CourseService.getAllCourses(1, 1000); // Get large number to count all
      const courses = (response as any)?.data || (response as any)?.items || response || [];
      return Array.isArray(courses) ? courses.length : 0;
    } catch (error) {
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
      
      // Count pending courses with flexible status matching
      const pendingCourses = coursesArray.filter((course: any) => {
        const normalizedStatus = course.status?.toLowerCase();
        return normalizedStatus === 'pending' ||
               normalizedStatus === 'Pending' || 
               normalizedStatus === 'PENDING' ||
               !course.status; // Also count courses without status as pending
      }).length;
      

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
  },

  // User management methods
  getAllUsers: async (params: GetAllUsersParams = {}): Promise<GetAllUsersResponse> => {
    try {
      const defaultParams = {
        pagenum: 1,
        pagesize: 20, // Updated default page size
        Maxpagesize: 100, // Increased max page size
        ...params
      };
      
      const response = await API.auth.getAllUsers(defaultParams);
      
      // Handle different possible response structures
      if (response && typeof response === 'object') {
        const responseData = response as any;
        
        // If response has users array directly
        if (Array.isArray(responseData.users)) {
          return {
            users: responseData.users,
            totalCount: responseData.totalCount || responseData.users.length,
            currentPage: responseData.currentPage || defaultParams.pagenum,
            totalPages: responseData.totalPages || Math.ceil((responseData.totalCount || responseData.users.length) / defaultParams.pagesize)
          };
        }
        // If response is directly an array
        else if (Array.isArray(response)) {
          const usersArray = response as User[];
          return {
            users: usersArray,
            totalCount: usersArray.length,
            currentPage: defaultParams.pagenum,
            totalPages: Math.ceil(usersArray.length / defaultParams.pagesize)
          };
        }
        // If response has data property
        else if (responseData.data && Array.isArray(responseData.data)) {
          return {
            users: responseData.data,
            totalCount: responseData.totalCount || responseData.data.length,
            currentPage: responseData.currentPage || defaultParams.pagenum,
            totalPages: responseData.totalPages || Math.ceil((responseData.totalCount || responseData.data.length) / defaultParams.pagesize)
          };
        }
      }
      
      // Fallback if response structure is unexpected
      console.warn("Unexpected API response structure:", response);
      return {
        users: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 0
      };
    } catch (error) {
      console.error("Error fetching users:", error);
      
      // For development, provide mock data if API is not available
      if (process.env.NODE_ENV === 'development') {
        console.warn("API not available, returning mock data for development");
        const mockUsers: User[] = [
          {
            id: "1",
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            userType: "Admin",
            isActive: true,
            createdAt: "2024-01-15T00:00:00Z",
            phoneNumber: "+1234567890"
          },
          {
            id: "2",
            firstName: "Jane",
            lastName: "Smith",
            email: "jane.smith@example.com",
            userType: "Instructor",
            isActive: true,
            createdAt: "2024-01-20T00:00:00Z",
            phoneNumber: "+1234567891"
          },
          {
            id: "3",
            firstName: "Bob",
            lastName: "Johnson",
            email: "bob.johnson@example.com",
            userType: "Student",
            isActive: false,
            createdAt: "2024-01-25T00:00:00Z",
            phoneNumber: "+1234567892"
          },
          {
            id: "4",
            firstName: "Alice",
            lastName: "Williams",
            email: "alice.williams@example.com",
            userType: "Student",
            isActive: true,
            createdAt: "2024-02-01T00:00:00Z",
            phoneNumber: "+1234567893"
          },
          {
            id: "5",
            firstName: "Charlie",
            lastName: "Brown",
            email: "charlie.brown@example.com",
            userType: "Instructor",
            isActive: true,
            createdAt: "2024-02-05T00:00:00Z",
            phoneNumber: "+1234567894"
          }
        ];
        
        return {
          users: mockUsers,
          totalCount: mockUsers.length,
          currentPage: params.pagenum || 1,
          totalPages: Math.ceil(mockUsers.length / (params.pagesize || 50))
        };
      }
      
      return {
        users: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 0
      };
    }
  },

  blockUnblockUser: async (userId: string, block: boolean): Promise<boolean> => {
    try {
      const response = await API.auth.blockUnblockUser(userId, block);
      return !!response; // Return true if response exists, false otherwise
    } catch (error) {
      console.error("Error blocking/unblocking user:", error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      return false;
    }
  },

  // Course management methods
  getAllCoursesForAdmin: async (params: GetAllCoursesParams = {}): Promise<GetAllCoursesResponse> => {
    try {
      const defaultParams = {
        pagenum: 1,
        pagesize: 20,
        Maxpagesize: 50,
        ...params
      };
      
      const response = await API.courses.getAllForAdmin(defaultParams);
      
      // Handle different possible response structures
      if (response && typeof response === 'object') {
        const responseData = response as any;
        
        // If response has courses array directly
        if (Array.isArray(responseData.courses)) {
          return {
            courses: responseData.courses,
            totalCount: responseData.totalCount || responseData.courses.length,
            currentPage: responseData.currentPage || defaultParams.pagenum,
            totalPages: responseData.totalPages || Math.ceil((responseData.totalCount || responseData.courses.length) / defaultParams.pagesize)
          };
        }
        // If response is directly an array
        else if (Array.isArray(response)) {
          const coursesArray = response as AdminCourse[];
          return {
            courses: coursesArray,
            totalCount: coursesArray.length,
            currentPage: defaultParams.pagenum,
            totalPages: Math.ceil(coursesArray.length / defaultParams.pagesize)
          };
        }
        // If response has data property
        else if (responseData.data && Array.isArray(responseData.data)) {
          return {
            courses: responseData.data,
            totalCount: responseData.totalCount || responseData.data.length,
            currentPage: responseData.currentPage || defaultParams.pagenum,
            totalPages: responseData.totalPages || Math.ceil((responseData.totalCount || responseData.data.length) / defaultParams.pagesize)
          };
        }
        // If response has items property
        else if (responseData.items && Array.isArray(responseData.items)) {
          return {
            courses: responseData.items,
            totalCount: responseData.totalCount || responseData.items.length,
            currentPage: responseData.currentPage || defaultParams.pagenum,
            totalPages: responseData.totalPages || Math.ceil((responseData.totalCount || responseData.items.length) / defaultParams.pagesize)
          };
        }
      }
      
      // Fallback if response structure is unexpected
      console.warn("Unexpected API response structure:", response);
      return {
        courses: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 0
      };
    } catch (error) {
      console.error("Error fetching courses for admin:", error);
      return {
        courses: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 0
      };
    }
  },

  deleteCourse: async (courseId: number): Promise<boolean> => {
    try {
      
      const response = await API.courses.deleteAdmin(courseId);
      return true;
    } catch (error) {
      console.error("Error deleting course:", error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      return false;
    }
  },

  undeleteCourse: async (courseId: number): Promise<boolean> => {
    try {
      
      const response = await API.courses.undeleteAdmin(courseId);
      return true;
    } catch (error) {
      console.error("Error undeleting course:", error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      return false;
    }
  },
};
