import { API } from "@/lib/api";
import { Quiz, StudentQuizAnswer, QuizScore, StudentQuizProgress } from "@/types/api";

export const QuizService = {  /**
   * Get all quizzes for a specific course
   */  getAllCourseQuizzes: async (courseId: number): Promise<Quiz[]> => {
    try {
      const quizzes = await API.quiz.getAllCourseQuizzes(courseId);
      return Array.isArray(quizzes) ? quizzes : [];
    } catch (error) {
      console.error(`Error fetching quizzes for course ${courseId}:`, error);
      return [];
    }
  },
  /**
   * Get a specific quiz by ID
   */
  getQuizById: async (id: number): Promise<Quiz | null> => {
    try {
      const quiz = await API.quiz.getQuizById(id);
      return (quiz as Quiz) || null;
    } catch (error) {
      console.error(`Error fetching quiz ${id}:`, error);
      return null;
    }
  },  /**
   * Create a new quiz
   */
  addQuiz: async (quizData: {
    question: string;
    optionA: string;
    optionB: string;
    optionC?: string;
    optionD?: string;
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    explanation?: string;
    courseId: number;
    lessonId: number;
  }): Promise<Quiz> => {
    const formattedData = {
      Question: quizData.question,
      OptionA: quizData.optionA,
      OptionB: quizData.optionB,
      OptionC: quizData.optionC || "",
      OptionD: quizData.optionD || "",
      CorrectAnswer: quizData.correctAnswer,
      Explanation: quizData.explanation || "",
      CourseId: quizData.courseId,
      LessonId: quizData.lessonId
    };

    return await API.quiz.addQuiz(formattedData) as Quiz;
  },  /**
   * Update an existing quiz
   */
  updateQuiz: async (quizData: {
    id: number;
    question: string;
    optionA: string;
    optionB: string;
    optionC?: string;
    optionD?: string;
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    explanation?: string;
    courseId: number;
    lessonId: number;
  }): Promise<Quiz> => {
    const formattedData = {
      Id: quizData.id,
      Question: quizData.question,
      OptionA: quizData.optionA,
      OptionB: quizData.optionB,
      OptionC: quizData.optionC || "",
      OptionD: quizData.optionD || "",
      CorrectAnswer: quizData.correctAnswer,
      Explanation: quizData.explanation || "",
      CourseId: quizData.courseId,
      LessonId: quizData.lessonId
    };

    return await API.quiz.updateQuiz(formattedData) as Quiz;
  },

  /**
   * Delete a quiz
   */
  deleteQuiz: async (quizId: number): Promise<void> => {
    try {
      await API.quiz.deleteQuiz(quizId);
    } catch (error) {
      console.error(`Error deleting quiz ${quizId}:`, error);
      throw error;
    }
  },  /**
   * Submit a quiz answer
   */
  submitQuizAnswer: async (quizId: number, selectedAnswer: string): Promise<StudentQuizAnswer> => {
    // Ensure answer is properly formatted as a single uppercase letter
    const formattedAnswer = selectedAnswer.trim().toUpperCase();
    
    const result = await API.studentQuiz.submitAnswer(quizId, formattedAnswer) as StudentQuizAnswer;
    return result;
  },
  /**
   * Get total score for a lesson
   */
  getTotalScore: async (lessonId: number): Promise<QuizScore> => {
    try {
      const score = await API.studentQuiz.getTotalScore(lessonId);
      
      // Handle string format like "3/5"
      if (typeof score === 'string') {
        const [correctStr, totalStr] = score.split('/');
        const correctAnswers = parseInt(correctStr) || 0;
        const totalQuizzes = parseInt(totalStr) || 0;
        const percentage = totalQuizzes > 0 ? (correctAnswers / totalQuizzes) * 100 : 0;
        
        return {
          lessonId,
          totalScore: correctAnswers,
          totalQuizzes,
          correctAnswers,
          percentage: Math.round(percentage)
        };
      }
      
      // Fallback for other formats or if score is already structured
      return (score as QuizScore) || {
        lessonId,
        totalScore: 0,
        totalQuizzes: 0,
        correctAnswers: 0,
        percentage: 0
      };
    } catch (error) {
      console.error(`Error fetching score for lesson ${lessonId}:`, error);
      return {
        lessonId,
        totalScore: 0,
        totalQuizzes: 0,
        correctAnswers: 0,
        percentage: 0
      };
    }
  },  /**
   * Get student's answered quizzes for a lesson
   */
  getStudentQuizzesByLesson: async (lessonId: number): Promise<StudentQuizProgress[]> => {
    try {
      console.log(`=== FETCHING STUDENT QUIZZES FOR LESSON ${lessonId} ===`);
      const response = await API.studentQuiz.getStudentQuizzesByLesson(lessonId);
      console.log('Raw API response:', response);
      console.log('Response type:', typeof response);
      console.log('Is array:', Array.isArray(response));
      
      // Helper function to map StudentQuizAnswer to StudentQuizProgress
      const mapToQuizProgress = (quizAnswer: any): StudentQuizProgress => {
        console.log('Mapping quiz answer:', quizAnswer);
        return {
          quizId: quizAnswer.quizId || quizAnswer.quiz?.id,
          quizTitle: quizAnswer.quiz?.question || `Quiz ${quizAnswer.quizId}`,
          selectedAnswer: quizAnswer.answer,
          correctAnswer: quizAnswer.quiz?.correctAnswer,
          isCorrect: quizAnswer.score === 1, // Convert score (1/0) to boolean
          answeredAt: quizAnswer.takenAt
        };
      };
      
      // Handle case where API returns a single object instead of array
      if (response && typeof response === 'object' && !Array.isArray(response)) {
        console.log('Single object response, mapping to array');
        const mapped = mapToQuizProgress(response);
        console.log('Mapped result:', [mapped]);
        return [mapped];
      }
      
      // If it's already an array, map each item
      if (Array.isArray(response)) {
        console.log('Array response, mapping each item');
        const mapped = response.map(mapToQuizProgress);
        console.log('Mapped results:', mapped);
        return mapped;
      }
      
      // Fallback for unexpected formats
      console.log('Unexpected response format, returning empty array');
      return [];
    } catch (error) {
      console.error(`Error fetching student quizzes for lesson ${lessonId}:`, error);
      return [];
    }
  },/**
   * Get quizzes by lesson ID (for instructors and students)
   */
  getQuizzesByLessonId: async (lessonId: number, courseId?: number): Promise<Quiz[]> => {
    try {
      if (!courseId) {
        // If courseId is not provided, we need to handle this differently
        console.warn(`CourseId not provided for lesson ${lessonId}. Returning empty array.`);
        return [];
      }
      
      console.log(`=== FETCHING QUIZZES FOR LESSON ${lessonId} ===`);
      console.log('Course ID:', courseId);
      
      // Get all course quizzes and filter by lesson
      const allQuizzes = await API.quiz.getAllCourseQuizzes(courseId);
      console.log('All course quizzes:', allQuizzes);
      console.log('All quizzes type:', typeof allQuizzes);
      console.log('Is array:', Array.isArray(allQuizzes));
      
      if (Array.isArray(allQuizzes) && allQuizzes.length > 0) {
        console.log('Sample quiz structure:', allQuizzes[0]);
        console.log('Available properties:', Object.keys(allQuizzes[0]));
      }
      
      const filtered = Array.isArray(allQuizzes) ? allQuizzes.filter((quiz: any) => {
        console.log(`Quiz ${quiz.id}: lessonId=${quiz.lessonId}, LessonId=${quiz.LessonId}, target=${lessonId}`);
        return quiz.lessonId === lessonId || quiz.LessonId === lessonId;
      }) : [];
      
      console.log('Filtered quizzes:', filtered);
      console.log('==============================================');
      
      return filtered;
    } catch (error) {
      console.error(`Error fetching quizzes for lesson ${lessonId}:`, error);
      return [];
    }
  }
};
