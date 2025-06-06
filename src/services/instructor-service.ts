import { API } from "@/lib/api";
import { UserDTO } from "@/types/api";

export const InstructorService = {
  /**
   * Get all instructors
   */
  getAllInstructors: async (): Promise<UserDTO[]> => {
    try {
      console.log("Calling API.auth.getAllInstructors()...");
      const instructors = await API.auth.getAllInstructors();
      console.log("API response:", instructors);
      return Array.isArray(instructors) ? instructors : [];
    } catch (error) {
      console.error("Error fetching all instructors:", error);
      return [];
    }
  },
  /**
   * Get instructor by ID
   */
  getInstructorById: async (instructorId: string | number): Promise<UserDTO | null> => {
    try {
      console.log(`Fetching instructor by ID: ${instructorId}`);
      const instructor = await API.auth.getInstructorById(instructorId) as UserDTO;
      console.log("Found instructor:", instructor);
      return instructor || null;
    } catch (error) {
      console.error(`Error fetching instructor ${instructorId}:`, error);
      return null;
    }
  },

  /**
   * Get all approved courses for a specific instructor with real enrollment counts
   */
  getInstructorCourses: async (instructorId: string | number): Promise<any[]> => {
    try {
      console.log(`Calling API.courses.getInstructorCoursesById(${instructorId})...`);
      const courses = await API.courses.getInstructorCoursesById(instructorId);
      console.log("API response:", courses);
      
      if (!Array.isArray(courses)) {
        return [];
      }

      // Fetch real enrollment count for each course
      const coursesWithRealStudentCount = await Promise.all(
        courses.map(async (course: any) => {
          try {
            const studentsCount = await API.enrollments.getStudentsCount(course.id);            return {
              ...course,
              studentsCount: Number(studentsCount) || 0
            };
          } catch (error) {
            console.error(`Error fetching enrollment count for course ${course.id}:`, error);
            return {
              ...course,
              studentsCount: 0
            };
          }
        })
      );

      return coursesWithRealStudentCount;
    } catch (error) {
      console.error(`Error fetching courses for instructor ${instructorId}:`, error);
      return [];
    }
  },

  /**
   * Get enrollment count for a specific course
   */  getCourseEnrollmentCount: async (courseId: number): Promise<number> => {
    try {
      const count = await API.enrollments.getStudentsCount(courseId);
      return Number(count) || 0;
    } catch (error) {
      console.error(`Error fetching enrollment count for course ${courseId}:`, error);
      return 0;
    }
  },
};
