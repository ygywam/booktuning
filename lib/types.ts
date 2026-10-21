export interface User {
  id: string; // 노션 사용자 페이지 ID
  nickname: string;
  pin: string;
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
}

export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
}
