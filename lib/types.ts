export type UserRole = 'teacher' | 'student';

export interface Classroom {
  id: string; // 노션 학급 페이지 ID
  name: string; // 학급명 (예: 3학년 2반 독서방)
  code: string; // 6자리 고유 초대코드 (예: SFL-302)
  teacherId?: string;
  teacherName?: string;
  studentIds?: string[];
  createdAt?: string;
}

export interface User {
  id: string; // 노션 사용자 페이지 ID
  nickname: string;
  pin: string;
  role: UserRole;
  studentNumber?: string; // 학생 학번 (예: 30215), 교사는 선택사항
  classId?: string; // 소속 학급 ID
  className?: string; // 소속 학급명
  classCode?: string; // 소속 학급 초대코드
  bio?: string;
  createdAt?: string;
}

export interface Book {
  bookId: string; // 노션 도서 페이지 ID
  notionPageId: string;
  title: string;
  author: string;
  publisher: string;
  totalPages: number;
  description: string;
  nickname: string;
  userId?: string;
  classId?: string; // 소속 학급 ID (데이터 격리 기준)
  coverUrl: string;
  likes: number;
  likedUsers: string[];
  checkbox: boolean;
  readPages: number;
  progressPercent: number;
  myReport?: string;
  aiReport?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReadingLog {
  logId: string;
  bookNotionPageId: string;
  readDate: string;
  readPages: number;
  note: string;
  nickname: string;
  userId?: string;
  classId?: string;
  createdAt?: string;
}

export interface InsightLog {
  pageLogId: string;
  bookNotionPageId: string;
  page: string;
  notes: string;
  imageUrl?: string;
  nickname: string;
  userId?: string;
  classId?: string;
  readDate: string;
  createdAt?: string;
}

export interface TimelineItem {
  type: 'log' | 'insight';
  id: string;
  date: string;
  page: number | string;
  content: string;
  imageUrl?: string;
  nickname: string;
  userId?: string;
  classId?: string;
  createdAt?: string;
}

export type MainTabId = 'home' | 'library' | 'feed' | 'dex';

export type AiProvider = 'gemini' | 'exaone';

export interface AiStatusInfo {
  geminiConfigured: boolean;
  exaoneConfigured: boolean;
  geminiModel: string;
  exaoneModel: string;
  exaoneVisionSupported: boolean;
}

export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
}
