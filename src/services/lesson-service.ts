import { API } from "@/lib/api";
import { Lesson } from "@/types/api";

/**
 * Validates lesson data before submission
 */
const validateLesson = (lessonData: any): string | null => {
  if (!lessonData.title || lessonData.title.trim() === '') {
    return 'Lesson title is required';
  }
  
  if (lessonData.durationInMinutes !== undefined && lessonData.durationInMinutes <= 0) {
    return 'Duration must be greater than zero';
  }

  // Description validation for new lessons
  if (!lessonData.isUpdate && (!lessonData.description || lessonData.description.trim() === '')) {
    return 'Lesson description is required';
  }
  
  // For updates, we only validate the fields that are provided
  if (lessonData.isUpdate) {
    // If content is provided, validate it
    if (lessonData.content !== undefined) {
      if (lessonData.contentType === 'text' && 
          (typeof lessonData.content === 'string' && lessonData.content.trim() === '')) {
        return 'Text content cannot be empty';
      }
      
      if (lessonData.content instanceof File) {
        const validTypes = ['video/mp4', 'video/webm', 'video/ogg'];
        if (!validTypes.includes(lessonData.content.type)) {
          return `Invalid video format. Supported formats: ${validTypes.join(', ')}`;
        }
        
        // Check file size (max 500MB)
        const maxSize = 500 * 1024 * 1024; // 500MB in bytes
        if (lessonData.content.size > maxSize) {
          return 'Video file is too large (maximum 500MB)';
        }
      }
    }
  } else {
    // Full validation for new lessons
    // Check content based on content type
    if (lessonData.contentType === 'text') {
      if (!lessonData.content || (typeof lessonData.content === 'string' && lessonData.content.trim() === '')) {
        return 'Text content is required for text lessons';
      }
    } else if (lessonData.contentType === 'video') {
      // For new lessons, content is required
      if (!lessonData.content) {
        return 'Video content is required for new video lessons';
      }
    }
  }
  
  return null; // No validation errors
};

export const LessonService = {
  /**
   * Get all lessons for a specific module
   */
  getLessonsByModuleId: async (moduleId: string | number): Promise<Lesson[]> => {    try {
      const lessons = await API.lessons.getByModule(Number(moduleId));
      return Array.isArray(lessons) ? lessons : [];
    } catch (error) {
      return [];
    }
  },
  
  /**
   * Get a single lesson by ID
   */
  getLessonById: async (id: string | number): Promise<Lesson | null> => {
    try {
      const lesson = await API.lessons.getById(Number(id));
      // Check if the returned object has the required Lesson properties
      return lesson && typeof lesson === 'object' && lesson !== null && 'id' in lesson ? lesson as Lesson : null;    } catch (error) {
      return null;
    }
  },
    /**
   * Add a new lesson to a module with upload progress support
   */
  addLesson: async (
    lessonData: {
      title: string;
      content: File | string; // Can be a file for video or string for text
      contentType: string; // "video" or "text"
      durationInMinutes: number;
      description: string;
      isPublished: boolean;
      moduleId: number;
    },
    onProgress?: (progress: number) => void,
    abortController?: AbortController
  ): Promise<any> => {
    try {
      // Validate the lesson data first
      const validationError = validateLesson({
        ...lessonData,
        isUpdate: false
      });
      
      if (validationError) {
        throw new Error(validationError);
      }
      
      // Convert string content to File if needed
      let contentAsFile: File;
      if (typeof lessonData.content === 'string') {
        const blob = new Blob([lessonData.content], { type: 'text/plain' });
        contentAsFile = new File([blob], 'content.txt', { type: 'text/plain' });
      } else {
        contentAsFile = lessonData.content;
      }
      
      // Transform the data to match API expectations (PascalCase)
      const formattedData = {
        Title: lessonData.title,
        Content: contentAsFile,
        ContentType: lessonData.contentType,
        DurationInMinutes: lessonData.durationInMinutes,
        Description: lessonData.description,
        IsPublished: lessonData.isPublished,
        ModuleId: lessonData.moduleId
      };

      // Use the new API method with progress support
      const result = await API.lessons.addWithProgress(formattedData, onProgress, abortController);
      return result;
    } catch (error) {
      throw error; // Re-throw to handle in component
    }
  },
    /**
   * Update an existing lesson
   */
  updateLesson: async (lessonData: {
    id: number;
    title?: string;
    durationInMinutes?: number;
    description?: string;
    isPublished?: boolean;
    content?: string;
    contentType?: string;
  }): Promise<any> => {
    try {
      // Validate the lesson data first (partial validation for updates)
      const validationError = validateLesson({
        ...lessonData,
        isUpdate: true
      });
      
      if (validationError) {
        throw new Error(validationError);
      }
      
      // Transform the data to match API expectations (PascalCase)
      const formattedData: any = {
        Id: lessonData.id
      };

      // Add properties that are defined
      if (lessonData.title !== undefined) formattedData.Title = lessonData.title;
      if (lessonData.durationInMinutes !== undefined) formattedData.DurationInMinutes = lessonData.durationInMinutes;
      if (lessonData.description !== undefined) formattedData.Description = lessonData.description;
      if (lessonData.isPublished !== undefined) formattedData.IsPublished = lessonData.isPublished;
      
      // Handle content - only for text lessons, send empty for video lessons
      if (lessonData.contentType === 'text' && lessonData.content !== undefined) {
        formattedData.Content = lessonData.content;
      } else {
        // Send empty content as per backend requirement for video lessons
        formattedData.Content = '';
      }
      
      const result = await API.lessons.update(formattedData);
      return result;
    } catch (error) {
      throw error; // Re-throw to handle in component
    }
  },
  
  /**
   * Delete a lesson by ID
   */
  deleteLesson: async (lessonId: number): Promise<boolean> => {
    try {      await API.lessons.delete(lessonId);
      return true;
    } catch (error) {
      throw error; // Re-throw to handle in component
    }
  }
};