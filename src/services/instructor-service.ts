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
   * Get all approved courses for a specific instructor
   */
  getInstructorCourses: async (instructorId: string | number): Promise<any[]> => {
    try {
      console.log(`Calling API.courses.getInstructorCoursesById(${instructorId})...`);
      const courses = await API.courses.getInstructorCoursesById(instructorId);
      console.log("API response:", courses);
      return Array.isArray(courses) ? courses : [];
    } catch (error) {
      console.error(`Error fetching courses for instructor ${instructorId}:`, error);
      return [];
    }
  },
};
