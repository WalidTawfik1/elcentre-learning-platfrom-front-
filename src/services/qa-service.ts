import { apiRequest } from "./api";

export interface Question {
  id: number;
  question: string;
  createdAt: string;
  createdById: string;
  createdByName: string;
  creatorImage?: string;
  isInstructor: boolean;
  isEdited: boolean;
  editedAt?: string;
  lessonId: number;
  isPinned: boolean;
}

export interface Answer {
  id: number;
  answer: string;
  createdAt: string;
  createdById: string;
  createdByName: string;
  creatorImage?: string;
  isInstructor: boolean;
  isEdited: boolean;
  editedAt?: string;
  questionId: number;
}

export const QAService = {
  /**
   * Get all questions for a specific lesson
   */
  getAllLessonQuestions: async (lessonId: number): Promise<Question[]> => {
    try {
      const questions = await apiRequest<Question[]>(`/Q_A/get-all-lesson-questions/${lessonId}`);
      // Validate and clean the data
      const validQuestions = Array.isArray(questions) ? questions.filter(question => 
        question && 
        typeof question.id === 'number' && 
        typeof question.question === 'string' &&
        typeof question.lessonId === 'number'
      ) : [];
      return validQuestions;
    } catch (error) {
      console.error("Error fetching lesson questions:", error);
      return [];
    }
  },

  /**
   * Get all answers for a specific question
   */
  getAllQuestionAnswers: async (questionId: number): Promise<Answer[]> => {
    try {
      const answers = await apiRequest<Answer[]>(`/Q_A/get-all-question-answers/${questionId}`);
      // Validate and clean the data
      const validAnswers = Array.isArray(answers) ? answers.filter(answer => 
        answer && 
        typeof answer.id === 'number' && 
        typeof answer.answer === 'string' &&
        typeof answer.questionId === 'number'
      ) : [];
      return validAnswers;
    } catch (error) {
      console.error("Error fetching question answers:", error);
      return [];
    }
  },

  /**
   * Add a new question
   */
  addQuestion: async (question: string, lessonId: number): Promise<Question> => {
    return apiRequest<Question>(`/Q_A/add-question?question=${encodeURIComponent(question)}&lessonId=${lessonId}`, {
      method: "POST",
    });
  },

  /**
   * Add a new answer
   */
  addAnswer: async (answer: string, questionId: number): Promise<Answer> => {
    return apiRequest<Answer>(`/Q_A/add-answer?answer=${encodeURIComponent(answer)}&questionId=${questionId}`, {
      method: "POST",
    });
  },

  /**
   * Delete a question
   */
  deleteQuestion: async (questionId: number): Promise<void> => {
    return apiRequest<void>(`/Q_A/delete-question/${questionId}`, {
      method: "DELETE",
    });
  },

  /**
   * Delete an answer
   */
  deleteAnswer: async (answerId: number): Promise<void> => {
    return apiRequest<void>(`/Q_A/delete-answer/${answerId}`, {
      method: "DELETE",
    });
  },

  /**
   * Update a question
   */
  updateQuestion: async (questionId: number, question: string): Promise<Question> => {
    return apiRequest<Question>(`/Q_A/update-question/${questionId}?question=${encodeURIComponent(question)}`, {
      method: "PUT",
    });
  },

  /**
   * Update an answer
   */
  updateAnswer: async (answerId: number, answer: string): Promise<Answer> => {
    return apiRequest<Answer>(`/Q_A/update-answer/${answerId}?answer=${encodeURIComponent(answer)}`, {
      method: "PUT",
    });
  },

  /**
   * Pin or unpin a question (instructor only)
   */
  pinQuestion: async (questionId: number, isPinned: boolean): Promise<void> => {
    return apiRequest<void>(`/Q_A/pin-question/${questionId}`, {
      method: "PUT",
      body: JSON.stringify({ isPinned }),
    });
  },
};
