import { API } from "@/lib/api";
import { UserDTO } from "@/types/api";

export const InstructorService = {
  /**
   * Get all instructors
   */
  getAllInstructors: async (): Promise<UserDTO[]> => {
    try {
        const instructors = await API.auth.getAllInstructors();
      
      return Array.isArray(instructors) ? instructors : [];
    } catch (error) {
      return [];
    }
  },
  /**
   * Get instructor by ID
   */
  getInstructorById: async (instructorId: string | number): Promise<UserDTO | null> => {
    try {
      
      const instructor = await API.auth.getInstructorById(instructorId) as UserDTO;
      
      return instructor || null;    } catch (error) {
      return null;
    }
  },

  /**
   * Get all approved courses for a specific instructor with real enrollment counts
   */
  getInstructorCourses: async (instructorId: string | number): Promise<any[]> => {
    try {
      
      const courses = await API.courses.getInstructorCoursesById(instructorId);
      
      
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
            };          } catch (error) {
            return {
              ...course,
              studentsCount: 0
            };
          }
        })
      );      return coursesWithRealStudentCount;
    } catch (error) {
      return [];
    }
  },

  /**
   * Get enrollment count for a specific course
   */  getCourseEnrollmentCount: async (courseId: number): Promise<number> => {
    try {
      const count = await API.enrollments.getStudentsCount(courseId);      return Number(count) || 0;
    } catch (error) {
      return 0;
    }
  },
};
