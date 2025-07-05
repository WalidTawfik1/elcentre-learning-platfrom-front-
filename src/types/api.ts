// Auth related types
export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  gender: string;
  dateOfBirth: string;
  userType: string;
}

export interface UserDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  gender: string;
  userType: string;
  dateOfBirth: string;
  isActive: boolean;
  name?: string;
  avatar?: string;
  bio?: string;
  profilePicture?: string;
}

// Course related types
export interface Category {
  id: number;
  name: string;
}

export interface Course {
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
  courseStatus?: string; // Added to track admin approval status
  requirements?: string; // Optional requirements as string
}

export interface CourseModule {
  id: number;
  title: string;
  description: string;
  isPublished: boolean;
  courseId: number;
  orderIndex: number;
}

export interface Lesson {
  id: number;
  title: string;
  content: string;
  contentType: string;
  durationInMinutes: number;
  description: string;
  isPublished: boolean;
  moduleId: number;
  orderIndex: number;
}

export interface CourseReview {
  id: number;
  rating: number;
  reviewContent: string;
  createdAt: string;
  userId: string;
  courseId: number;
  userName: string;
  studentName?: string;
  studentImage?: string;
}

export interface Enrollment {
  id: number;
  enrollmentDate: string;
  completionDate: string | null;
  progress: number;
  status: string;
  studentId: string;
  courseId: number;
  courseName?: string;
  courseDescription?: string;
  courseThumbnail?: string;
  studentName?: string;
  studentImage?: string;
}

// Admin-specific interfaces
export interface PendingCourse extends Course {
  submissionDate: string;
  rejectionReason?: string;
}

export interface CourseApprovalRequest {
  decision: 'approve' | 'reject';
  rejectionReason?: string;
}

// Pagination related types
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// Quiz related types
export interface Quiz {
  id?: number; // Optional for creation, required for updates
  question: string;
  optionA: string;
  optionB: string;
  optionC?: string;
  optionD?: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  courseId: number;
  lessonId: number;
}

export interface StudentQuizAnswer {
  id: number;
  studentId: string;
  quizId: number;
  quiz: Quiz;
  answer: 'A' | 'B' | 'C' | 'D';
  score: number; // 1 for correct, 0 for incorrect
  takenAt: string;
}

// For compatibility with existing code that expects isCorrect boolean
export interface StudentQuizResponse {
  id: number;
  quizId: number;
  studentId: string;
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
  answeredAt: string;
}

export interface QuizScore {
  lessonId: number;
  totalScore: number;
  totalQuizzes: number;
  correctAnswers: number;
  percentage: number;
}

export interface StudentQuizProgress {
  quizId: number;
  quizTitle: string;
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
  answeredAt: string;
}
