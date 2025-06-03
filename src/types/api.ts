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
  durationInHours: number;
  categoryId: number;
  categoryName?: string;
  rating?: number;
  instructorId?: string;
  instructorName?: string;
  instructorImage?: string;
  enrollmentCount?: number;
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

// Pagination related types
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
