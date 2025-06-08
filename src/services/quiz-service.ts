import { API } from "@/lib/api";
import { Quiz, StudentQuizAnswer, QuizScore, StudentQuizProgress } from "@/types/api";

export const QuizService = {  /**
   * Get all quizzes for a specific course
   */
  getAllCourseQuizzes: async (courseId: number): Promise<Quiz[]> => {
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
  },
  /**
   * Submit a quiz answer
   */
  submitQuizAnswer: async (quizId: number, selectedAnswer: 'A' | 'B' | 'C' | 'D'): Promise<StudentQuizAnswer> => {
    const formattedData = {
      QuizId: quizId,
      SelectedAnswer: selectedAnswer
    };

    return await API.studentQuiz.submitAnswer(formattedData) as StudentQuizAnswer;
  },

  /**
   * Get total score for a lesson
   */
  getTotalScore: async (lessonId: number): Promise<QuizScore> => {
    try {
      const score = await API.studentQuiz.getTotalScore(lessonId);
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
  },

  /**
   * Get student's answered quizzes for a lesson
   */
  getStudentQuizzesByLesson: async (lessonId: number): Promise<StudentQuizProgress[]> => {
    try {
      const quizzes = await API.studentQuiz.getStudentQuizzesByLesson(lessonId);
      return Array.isArray(quizzes) ? quizzes : [];
    } catch (error) {
      console.error(`Error fetching student quizzes for lesson ${lessonId}:`, error);
      return [];
    }
  },  /**
   * Get quizzes by lesson ID (for instructors and students)
   */
  getQuizzesByLessonId: async (lessonId: number, courseId?: number): Promise<Quiz[]> => {
    try {
      if (!courseId) {
        // If courseId is not provided, we need to handle this differently
        console.warn(`CourseId not provided for lesson ${lessonId}. Returning empty array.`);
        return [];
      }
      
      // Get all course quizzes and filter by lesson
      const allQuizzes = await API.quiz.getAllCourseQuizzes(courseId);
      return Array.isArray(allQuizzes) ? allQuizzes.filter((quiz: any) => quiz.lessonId === lessonId) : [];
    } catch (error) {
      console.error(`Error fetching quizzes for lesson ${lessonId}:`, error);
      return [];
    }
  }
};
