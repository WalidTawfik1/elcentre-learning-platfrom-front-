import { API } from "@/lib/api";
import { CourseModule } from "@/types/api";

export const ModuleService = {
  /**
   * Get all modules for a specific course
   */
  getModulesByCourseId: async (courseId: string | number): Promise<CourseModule[]> => {    try {
      const modules = await API.modules.getAll(Number(courseId));
      return Array.isArray(modules) ? modules : [];
    } catch (error) {
      return [];
    }
  },
  
  /**
   * Get a single module by ID
   */
  getModuleById: async (id: number, courseId: number): Promise<CourseModule | null> => {
    try {
      const module = await API.modules.getById(id, courseId);
      // Check if module has all required CourseModule properties
      if (module && typeof module === 'object' && module !== null && 'id' in module && 'title' in module) {
        return module as CourseModule;
      }      return null;
    } catch (error) {
      return null;
    }
  },
  
  /**
   * Add a new module to a course
   */
  addModule: async (moduleData: {
    title: string;
    description: string;
    isPublished: boolean;
    courseId: number;
  }): Promise<any> => {
    try {
      // Transform the data to match API expectations (PascalCase)
      const formattedData = {
        Title: moduleData.title,
        Description: moduleData.description,
        IsPublished: moduleData.isPublished,
        CourseId: moduleData.courseId
      };      return await API.modules.add(formattedData);
    } catch (error) {
      throw error; // Re-throw to handle in component
    }
  },
  
  /**
   * Update an existing module
   */
  updateModule: async (moduleData: {
    id: number;
    title?: string;
    description?: string;
    isPublished?: boolean;
  }): Promise<any> => {
    try {
      // Transform the data to match API expectations (PascalCase)
      // Only include properties that are actually provided
      const formattedData: any = {
        Id: moduleData.id
      };
      
      // Only add properties that are defined
      if (moduleData.title !== undefined) formattedData.Title = moduleData.title;
      if (moduleData.description !== undefined) formattedData.Description = moduleData.description;
      if (moduleData.isPublished !== undefined) formattedData.IsPublished = moduleData.isPublished;      return await API.modules.update(formattedData);
    } catch (error) {
      throw error; // Re-throw to handle in component
    }
  },
  
  /**
   * Delete a module by ID
   */
  deleteModule: async (moduleId: number): Promise<boolean> => {
    try {      await API.modules.delete(moduleId);
      return true;
    } catch (error) {
      throw error; // Re-throw to handle in component
    }
  }
};