'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  AiProvider,
  AiStatusInfo,
  Book,
  Classroom,
  InsightLog,
  MainTabId,
  ReadingLog,
  TimelineItem,
  User,
} from '@/lib/types';
import { LandingGate } from '@/components/LandingGate';
import HomeTab from '@/components/tabs/HomeTab';
import LibraryTab from '@/components/tabs/LibraryTab';
import FeedTab from '@/components/tabs/FeedTab';
import DexTab from '@/components/tabs/DexTab';
import BottomNav from '@/components/BottomNav';
import SpotlightTutorial from '@/components/SpotlightTutorial';
import AppInfoModals from '@/components/AppInfoModals';
import ClassManageModal from '@/components/ClassManageModal';
import { ArrowUp } from 'lucide-react';

export default function Home() {
  const schoolName = process.env.NEXT_PUBLIC_SCHOOL_NAME?.trim() || '';
  const appDisplayTitle = schoolName ? `${schoolName} 북튜닝` : '북튜닝 (Book Tuning)';

  // 1. 유저 및 세션 상태
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState('');
  const [pin, setPin] = useState('');
  const [hasEnteredLibrary, setHasEnteredLibrary] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [theme, setTheme] = useState('theme-forest');
  const [aiProvider, setAiProvider] = useState<AiProvider>('gemini');
  const [aiStatus, setAiStatus] = useState<AiStatusInfo | null>(null);

  // 1-1. 학급(Classroom) 상태
  const [currentClass, setCurrentClass] = useState<Classroom | null>(null);
  const [showClassModal, setShowClassModal] = useState(false);

  // 1-2. 스크롤 탑 플로팅 버튼 상태
  const [showScrollTop, setShowScrollTop] = useState(false);

  // 2. 4대 메인 탭 상태 (기본: 홈)
  const [activeTab, setActiveTab] = useState<MainTabId>('home');

  // 3. 도서 서재 상태
  const [books, setBooks] = useState<Book[]>([]);
  const [allLogs, setAllLogs] = useState<ReadingLog[]>([]);
  const [allInsights, setAllInsights] = useState<InsightLog[]>([]);
  const [loading, setLoading] = useState(true);

  // 4. 도서 검색 상태 (카카오 표준 / 알라딘·네이버 종료 고지)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchApiType, setSearchApiType] = useState<'kakao' | 'aladin' | 'naver'>('kakao');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // 5. 모달 상태
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showManualBookModal, setShowManualBookModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditBookModal, setShowEditBookModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showDevLogModal, setShowDevLogModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showCopyrightModal, setShowCopyrightModal] = useState(false);

  // 6. 선택된 도서 및 상세 뷰 상태
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [detailTab, setDetailTab] = useState<'timeline' | 'ai' | 'my'>('timeline');
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [aiReport, setAiReport] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [myReport, setMyReport] = useState('');
  const [myReportSaving, setMyReportSaving] = useState(false);

  // 인라인 독서일지 / 문장수집 입력 상태
  const [activeDetailForm, setActiveDetailForm] = useState<'none' | 'log' | 'insight'>('none');
  const [inlineLogDate, setInlineLogDate] = useState('');
  const [inlineLogPage, setInlineLogPage] = useState<number | string>('');
  const [inlineLogContent, setInlineLogContent] = useState('');
  const [inlineLogImageUrl, setInlineLogImageUrl] = useState('');
  const [inlineLogOcrLoading, setInlineLogOcrLoading] = useState(false);
  const [submittingInlineLog, setSubmittingInlineLog] = useState(false);

  const [inlineInsightDate, setInlineInsightDate] = useState('');
  const [inlineInsightPage, setInlineInsightPage] = useState<number | string>('');
  const [inlineInsightQuote, setInlineInsightQuote] = useState('');
  const [inlineInsightImageUrl, setInlineInsightImageUrl] = useState('');
  const [inlineInsightOcrLoading, setInlineInsightOcrLoading] = useState(false);
  const [submittingInlineInsight, setSubmittingInlineInsight] = useState(false);

  // 별도 모달 입력 필드 상태
  const [readPages, setReadPages] = useState<number | string>('');
  const [note, setNote] = useState('');
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [logImageUrl, setLogImageUrl] = useState('');
  const [logOcrLoading, setLogOcrLoading] = useState(false);

  const [insightPage, setInsightPage] = useState('');
  const [insightNotes, setInsightNotes] = useState('');
  const [editingPageLogId, setEditingPageLogId] = useState<string | null>(null);
  const [insightImageUrl, setInsightImageUrl] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);

  // 수동 도서 등록 폼
  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthor, setManualAuthor] = useState('');
  const [manualPublisher, setManualPublisher] = useState('');
  const [manualPages, setManualPages] = useState<number | string>('');
  const [manualCover, setManualCover] = useState('');
  const [manualDesc, setManualDesc] = useState('');

  // 7. 로컬스토리지 초기 로드 & 테마 반영
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('app_user');
      const savedNickname = localStorage.getItem('app_nickname') || '';
      const savedTheme = localStorage.getItem('app_theme') || 'theme-forest';
      const savedSearchApi = localStorage.getItem('search_api_type') as any;
      const savedAiProvider = localStorage.getItem('ai_provider') as any;
      const guestEntered = localStorage.getItem('guest_entered') === 'true';

      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          setNickname(parsedUser.nickname || savedNickname);
          setPin(parsedUser.pin || '');
          setHasEnteredLibrary(true);

          if (parsedUser.classId) {
            setCurrentClass({
              id: parsedUser.classId,
              name: parsedUser.className || '소속 학급',
              code: parsedUser.classCode || '',
            });
          }
        } catch {
          if (savedNickname) setNickname(savedNickname);
        }
      } else if (savedNickname) {
        setNickname(savedNickname);
      }

      if (guestEntered) {
        setHasEnteredLibrary(true);
      }

      setTheme(savedTheme);
      document.body.className = savedTheme;

      if (savedSearchApi && ['kakao', 'aladin', 'naver'].includes(savedSearchApi)) {
        setSearchApiType(savedSearchApi);
      }
      if (savedAiProvider && ['gemini', 'exaone'].includes(savedAiProvider)) {
        setAiProvider(savedAiProvider);
      }
    } finally {
      setAuthChecked(true);
    }
  }, []);

  // 서버 환경변수 내 AI 키 연결 상태 조회
  useEffect(() => {
    const fetchAiStatus = async () => {
      try {
        const res = await fetch('/api/ai-status');
        const data = await res.json();
        if (data.ok) {
          setAiStatus({
            geminiConfigured: data.geminiConfigured,
            exaoneConfigured: data.exaoneConfigured,
            geminiModel: data.geminiModel,
            exaoneModel: data.exaoneModel,
            exaoneVisionSupported: data.exaoneVisionSupported,
          });
        }
      } catch (err) {
        console.warn('AI 상태 조회 실패:', err);
      }
    };
    fetchAiStatus();
  }, []);

  // 우측 하단 플로팅 '맨 위로 가기' 스크롤 감지
  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 240);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 도서 목록 및 글로벌 타임라인 데이터 패치
  const fetchBooks = async (targetClassId?: string, overrideRole?: string, targetUser?: User | null) => {
    setLoading(true);
    try {
      const activeUser = targetUser !== undefined ? targetUser : user;
      const activeRole = overrideRole || activeUser?.role || 'student';
      let cId = '';

      if (targetClassId !== undefined) {
        cId = targetClassId;
      } else if (activeRole === 'student') {
        cId = activeUser?.classId || '';
      } else {
        cId = currentClass?.id || 'teachers';
      }

      const params = new URLSearchParams();
      if (cId) params.set('classId', cId);
      if (activeRole) params.set('role', activeRole);

      const url = `/api/books?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok) {
        setBooks(data.books || []);
      }
    } catch (err) {
      console.error('도서 로딩 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalTimeline = async (targetClassId?: string, overrideRole?: string, targetUser?: User | null) => {
    try {
      const activeUser = targetUser !== undefined ? targetUser : user;
      const activeRole = overrideRole || activeUser?.role || 'student';
      let cId = '';

      if (targetClassId !== undefined) {
        cId = targetClassId;
      } else if (activeRole === 'student') {
        cId = activeUser?.classId || '';
      } else {
        cId = currentClass?.id || 'teachers';
      }

      const params = new URLSearchParams({ bookId: 'all' });
      if (cId) params.set('classId', cId);
      if (activeRole) params.set('role', activeRole);

      const res = await fetch(`/api/timeline?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setAllLogs(data.readingLogs || []);
        setAllInsights(data.pageLogs || []);
      }
    } catch (err) {
      console.error('글로벌 피드 로딩 오류:', err);
    }
  };

  useEffect(() => {
    if (hasEnteredLibrary) {
      let cachedUser: User | null = user;
      if (!cachedUser) {
        try {
          const raw = localStorage.getItem('app_user');
          if (raw) cachedUser = JSON.parse(raw);
        } catch {}
      }
      const initialClassId = cachedUser?.classId || currentClass?.id || (cachedUser?.role === 'teacher' ? 'teachers' : '');
      fetchBooks(initialClassId, cachedUser?.role, cachedUser);
      fetchGlobalTimeline(initialClassId, cachedUser?.role, cachedUser);
    }
  }, [hasEnteredLibrary]);

  // 내 도서 목록 계산
  const myBooks = useMemo(() => {
    if (!nickname.trim()) return [];
    return books.filter((b) => {
      const isNameMatch = b.nickname && b.nickname.trim() === nickname.trim();
      const isUserMatch = user?.id && b.userId === user.id;
      return isNameMatch || isUserMatch;
    });
  }, [books, nickname, user?.id]);

  // 도서 소유자 확인
  const checkIsOwner = (book: Book | null) => {
    if (!book) return false;
    if (user?.id && book.userId && book.userId === user.id) return true;
    if (nickname && book.nickname && book.nickname.trim() === nickname.trim()) return true;
    return false;
  };

  // 도서 관리(수정/삭제) 권한 확인 (본인 도서이거나 교사 관리자일 때)
  const canManageBook = (book: Book | null) => {
    if (!book) return false;
    if (user?.role === 'teacher') return true;
    return checkIsOwner(book);
  };

  // 8. 사용자 인증 및 로그인 (LandingGate / 모달 연동)
  const authenticateUser = async (targetNickname: string, targetPin: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: targetNickname.trim(), pin: targetPin.trim() }),
      });
      const data = await res.json();
      if (data.ok && data.user) {
        setUser(data.user);
        setNickname(data.user.nickname);
        setPin(data.user.pin);
        setHasEnteredLibrary(true);
        localStorage.setItem('app_user', JSON.stringify(data.user));
        localStorage.setItem('app_nickname', data.user.nickname);
        localStorage.removeItem('guest_entered');
        setShowLoginModal(false);
        return true;
      } else {
        alert(data.error || '인증에 실패했습니다.');
        return false;
      }
    } catch (err) {
      alert('서버 통신 오류가 발생했습니다.');
      return false;
    }
  };

  const handleBrowseAsGuest = () => {
    localStorage.setItem('guest_entered', 'true');
    setHasEnteredLibrary(true);
  };

  const handleLogout = (forceGateOnly: boolean = false) => {
    if (
      !forceGateOnly &&
      !confirm('로그아웃하시겠습니까?\n현재 브라우저에 저장된 로그인 세션이 초기화되고 입장 화면으로 이동합니다.')
    ) {
      return;
    }
    localStorage.removeItem('app_user');
    localStorage.removeItem('app_nickname');
    localStorage.removeItem('guest_entered');
    setUser(null);
    setNickname('');
    setPin('');
    setHasEnteredLibrary(false);
    setShowLoginModal(false);
    setShowSettingsModal(false);
    setActiveTab('home');
  };

  // 9. 테마 및 환경 설정 변경
  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    document.body.className = newTheme;
    localStorage.setItem('app_theme', newTheme);
  };

  const changeAiProvider = (newProvider: AiProvider) => {
    setAiProvider(newProvider);
    localStorage.setItem('ai_provider', newProvider);
  };

  const changeSearchApiType = (newApi: 'kakao' | 'aladin' | 'naver') => {
    setSearchApiType(newApi);
    localStorage.setItem('search_api_type', newApi);
  };

  // 10. 도서 검색 실행
  const handleSearch = async () => {
    if (!searchQuery.trim()) return alert('검색어를 입력해 주세요.');
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(`/api/search-books?query=${encodeURIComponent(searchQuery)}&type=${searchApiType}`);
      const data = await res.json();
      if (data.ok) {
        if (data.books.length === 0) {
          alert('검색 결과가 없습니다. 도서명을 확인하거나 직접 등록을 이용해 주세요.');
        } else {
          setSearchResults(data.books);
        }
      } else {
        alert(`검색 실패: ${data.error}`);
      }
    } catch (err) {
      alert('도서 검색 통신 오류 발생');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSearchResult = (book: any) => {
    setManualTitle(book.title || '');
    setManualAuthor(book.author || '');
    setManualPublisher(book.publisher || '');
    setManualPages(book.totalPages || '');
    setManualCover(book.coverUrl || '');
    setManualDesc(book.description || '');
    setShowManualBookModal(true);
  };

  const handleOpenManualBook = () => {
    setManualTitle('');
    setManualAuthor('');
    setManualPublisher('');
    setManualPages('');
    setManualCover('');
    setManualDesc('');
    setShowManualBookModal(true);
  };

  // 11. 수동 / 검색 결과 도서 등록
  const handleSubmitManualBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return alert('도서명을 입력하세요.');
    if (!nickname.trim()) {
      alert('도서를 등록하려면 먼저 닉네임으로 입장하거나 프로필을 등록해 주세요.');
      setShowLoginModal(true);
      return;
    }

    try {
      const targetClassId = user?.classId || currentClass?.id || '';
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: manualTitle.trim(),
          author: manualAuthor.trim(),
          publisher: manualPublisher.trim(),
          totalPages: Number(manualPages) || 0,
          coverUrl: manualCover.trim(),
          description: manualDesc.trim(),
          nickname: nickname.trim(),
          userId: user?.id,
          classId: targetClassId,
          role: user?.role || 'student',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        alert('도서가 서재에 등록되었습니다! 📚');
        setShowManualBookModal(false);
        setSearchQuery('');
        setSearchResults([]);
        await Promise.all([fetchBooks(), fetchGlobalTimeline()]);
      } else {
        alert(`도서 등록 실패: ${data.error}`);
      }
    } catch (err) {
      alert('도서 등록 오류 발생');
    }
  };

  // 도서 수정 / 삭제
  const handleUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetBook = selectedBook || activeDetailBook;
    if (!targetBook) return;
    if (!canManageBook(targetBook)) return alert('본인이 등록한 도서 또는 교사 권한으로만 수정할 수 있습니다.');

    const targetBookId = targetBook.bookId || targetBook.notionPageId;
    try {
      const res = await fetch('/api/books', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: targetBookId,
          title: manualTitle.trim(),
          author: manualAuthor.trim(),
          publisher: manualPublisher.trim(),
          totalPages: Number(manualPages) || 0,
          coverUrl: manualCover.trim(),
          description: manualDesc.trim(),
          nickname: nickname.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        alert('도서 정보가 성공적으로 수정되었습니다! (노션 동기화 완료)');
        setShowEditBookModal(false);
        setSelectedBook((prev) =>
          prev
            ? {
                ...prev,
                title: manualTitle.trim(),
                author: manualAuthor.trim(),
                publisher: manualPublisher.trim(),
                totalPages: Number(manualPages) || 0,
                coverUrl: manualCover.trim(),
                description: manualDesc.trim(),
              }
            : null
        );
        await Promise.all([fetchBooks(), fetchGlobalTimeline()]);
      } else alert(`수정 실패: ${data.error}`);
    } catch (err) {
      alert('도서 정보 수정 통신 오류');
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    const targetBook = selectedBook || activeDetailBook;
    if (!targetBook) return;
    if (!canManageBook(targetBook)) return alert('본인이 등록한 도서 또는 교사 권한으로만 삭제할 수 있습니다.');

    if (!confirm('이 도서를 서재에서 완전히 삭제(노션 휴지통 아카이브)하시겠습니까?\n※ 연관된 모든 독서일지와 문장수집도 노션에서 함께 삭제됩니다.')) return;
    try {
      const targetBookId = bookId || targetBook.bookId || targetBook.notionPageId;
      const res = await fetch(`/api/books?bookId=${targetBookId}&nickname=${encodeURIComponent(nickname.trim())}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        alert('도서가 성공적으로 삭제되었습니다.');
        setShowEditBookModal(false);
        setShowDetailModal(false);
        setSelectedBook(null);
        await Promise.all([fetchBooks(), fetchGlobalTimeline()]);
      } else alert(`삭제 실패: ${data.error}`);
    } catch (err) {
      alert('삭제 통신 오류');
    }
  };

  // 12. 공통 OCR 이미지 판독 헬퍼
  const runOcrFromFile = async (
    file: File,
    setBusy: (v: boolean) => void,
    setImageUrl: (url: string) => void,
    onTextExtracted: (text: string) => void
  ) => {
    setBusy(true);
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setImageUrl(base64Data);

      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Data, mimeType: 'image/jpeg', aiProvider }),
      });
      const data = await res.json();
      if (data.ok && data.ocrText) {
        onTextExtracted(data.ocrText);
        const fallbackNote = data.fallbackUsed
          ? '\n(참고: K-EXAONE 2.5는 텍스트 전용 모델이라 이미지 판독은 Gemini 비전으로 자동 처리되었습니다.)'
          : '';
        alert(`${data.usedProviderName || 'AI'}가 사진에서 문장을 성공적으로 추출했습니다! ✨${fallbackNote}`);
      } else {
        alert(data.error || '문장 추출 실패 또는 글자를 찾지 못했습니다.');
      }
    } catch (err) {
      alert('OCR 통신 오류 발생');
    } finally {
      setBusy(false);
    }
  };

  // 13. 도서 상세 및 타임라인 열기
  const openDetail = async (book: Book) => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedBook(book);
    setDetailTab('timeline');
    setActiveDetailForm('none');
    setInlineLogDate(today);
    setInlineLogPage('');
    setInlineLogContent('');
    setInlineLogImageUrl('');
    setInlineInsightDate(today);
    setInlineInsightPage('');
    setInlineInsightQuote('');
    setInlineInsightImageUrl('');
    setShowDetailModal(true);
    fetchTimeline(book.bookId || book.notionPageId);
  };

  const fetchTimeline = async (bookId: string) => {
    setTimelineLoading(true);
    try {
      const res = await fetch(`/api/timeline?bookId=${bookId}`);
      const data = await res.json();
      if (data.ok) {
        setTimelineItems(data.timeline || []);
        setAiReport(data.aiReport || '');
        setMyReport(data.myReport || '');
      }
    } catch (err) {
      console.error('타임라인 로딩 오류:', err);
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('이 독서일지를 삭제하시겠습니까?\n노션 데이터베이스에서도 삭제(아카이브)됩니다.')) return;
    try {
      const res = await fetch(`/api/logs?logId=${logId}&nickname=${encodeURIComponent(nickname.trim())}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        const targetId = activeDetailBook?.bookId || selectedBook?.bookId;
        await Promise.all([
          targetId ? fetchTimeline(targetId) : Promise.resolve(),
          fetchBooks(),
          fetchGlobalTimeline(),
        ]);
      } else {
        alert(data.error || '삭제 실패');
      }
    } catch (err) {
      alert('삭제 실패');
    }
  };

  const handleDeleteInsight = async (pageLogId: string) => {
    if (!confirm('이 문장 수집을 삭제하시겠습니까?\n노션 데이터베이스에서도 삭제(아카이브)됩니다.')) return;
    try {
      const res = await fetch(`/api/insights?pageLogId=${pageLogId}&nickname=${encodeURIComponent(nickname.trim())}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        const targetId = activeDetailBook?.bookId || selectedBook?.bookId;
        await Promise.all([
          targetId ? fetchTimeline(targetId) : Promise.resolve(),
          fetchBooks(),
          fetchGlobalTimeline(),
        ]);
      } else {
        alert(data.error || '삭제 실패');
      }
    } catch (err) {
      alert('삭제 실패');
    }
  };

  // 상세 모달 인라인 독서일지 제출
  const handleSubmitInlineLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetBook = activeDetailBook || selectedBook;
    if (!targetBook) return;
    if (!checkIsOwner(targetBook)) {
      return alert('본인이 등록한 도서에만 독서일지를 작성할 수 있습니다.');
    }
    if (inlineLogPage === '' || !inlineLogContent.trim()) {
      alert('읽은 페이지와 감상 내용을 입력해 주세요.');
      return;
    }

    setSubmittingInlineLog(true);
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookNotionPageId: targetBook.bookId || targetBook.notionPageId,
          readDate: inlineLogDate || new Date().toISOString().split('T')[0],
          readPages: Number(inlineLogPage) || 0,
          note: inlineLogContent.trim(),
          imageUrl: inlineLogImageUrl,
          nickname: nickname.trim(),
          userId: user?.id,
          classId: targetBook.classId || user?.classId || currentClass?.id || '',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        alert('진도와 독서일지가 노션에 실시간 동기화되었습니다! 📚');
        setInlineLogContent('');
        setInlineLogImageUrl('');
        setActiveDetailForm('none');
        await Promise.all([
          fetchTimeline(targetBook.bookId || targetBook.notionPageId),
          fetchBooks(),
          fetchGlobalTimeline(),
        ]);
      } else {
        alert(`저장 실패: ${data.error}`);
      }
    } catch (err) {
      alert('독서일지 저장 통신 오류');
    } finally {
      setSubmittingInlineLog(false);
    }
  };

  // 상세 모달 인라인 문장수집 제출
  const handleSubmitInlineInsight = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetBook = activeDetailBook || selectedBook;
    if (!targetBook) return;
    if (!checkIsOwner(targetBook)) {
      return alert('본인이 등록한 도서에만 문장을 수집할 수 있습니다.');
    }
    if (!inlineInsightQuote.trim()) {
      alert('발췌 문장 또는 감상 내용을 입력해 주세요.');
      return;
    }

    setSubmittingInlineInsight(true);
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookNotionPageId: targetBook.bookId || targetBook.notionPageId,
          page: String(inlineInsightPage || ''),
          notes: inlineInsightQuote.trim(),
          imageUrl: inlineInsightImageUrl,
          nickname: nickname.trim(),
          userId: user?.id,
          classId: targetBook.classId || user?.classId || currentClass?.id || '',
          readDate: inlineInsightDate || new Date().toISOString().split('T')[0],
        }),
      });
      const data = await res.json();
      if (data.ok) {
        alert('감명 깊은 문장이 노션에 수집되었습니다! 💡');
        setInlineInsightQuote('');
        setInlineInsightImageUrl('');
        setActiveDetailForm('none');
        await Promise.all([
          fetchTimeline(targetBook.bookId || targetBook.notionPageId),
          fetchBooks(),
          fetchGlobalTimeline(),
        ]);
      } else {
        alert(`수집 실패: ${data.error}`);
      }
    } catch (err) {
      alert('문장 수집 저장 통신 오류');
    } finally {
      setSubmittingInlineInsight(false);
    }
  };

  // 도서 공감(좋아요) 토글
  const handleToggleBookLike = async (book: Book) => {
    if (!nickname.trim()) {
      alert('공감을 누르려면 로그인이 필요합니다.');
      return;
    }
    const bookId = book.bookId || book.notionPageId;
    if (!bookId) return;

    const myNick = nickname.trim();
    const isCurrentlyLiked = (book.likedUsers || []).includes(myNick);

    // 낙관적 업데이트
    setBooks((prev) =>
      prev.map((b) => {
        if ((b.bookId || b.notionPageId) === bookId) {
          const newLikedUsers = isCurrentlyLiked
            ? (b.likedUsers || []).filter((u) => u !== myNick)
            : [...(b.likedUsers || []), myNick];
          return {
            ...b,
            likes: newLikedUsers.length,
            likedUsers: newLikedUsers,
          };
        }
        return b;
      })
    );

    try {
      const res = await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, nickname: myNick }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(data.error || '공감 저장 실패');
        fetchBooks();
      }
    } catch (err) {
      console.error('도서 공감 오류:', err);
      fetchBooks();
    }
  };

  // 피드(독서일지 / 문장수집) 공감(좋아요) 토글
  const handleToggleFeedItemLike = async (rawId: string, type: 'log' | 'insight') => {
    if (!nickname.trim()) {
      alert('공감을 누르려면 로그인이 필요합니다.');
      return;
    }
    const myNick = nickname.trim();

    // 낙관적 업데이트: allLogs 및 allInsights 갱신
    if (type === 'log') {
      setAllLogs((prev) =>
        prev.map((l) => {
          if (l.logId === rawId) {
            const isCurrentlyLiked = (l.likedUsers || []).includes(myNick);
            const newLikedUsers = isCurrentlyLiked
              ? (l.likedUsers || []).filter((u) => u !== myNick)
              : [...(l.likedUsers || []), myNick];
            return {
              ...l,
              likes: newLikedUsers.length,
              likedUsers: newLikedUsers,
            };
          }
          return l;
        })
      );
    } else {
      setAllInsights((prev) =>
        prev.map((ins) => {
          if (ins.pageLogId === rawId) {
            const isCurrentlyLiked = (ins.likedUsers || []).includes(myNick);
            const newLikedUsers = isCurrentlyLiked
              ? (ins.likedUsers || []).filter((u) => u !== myNick)
              : [...(ins.likedUsers || []), myNick];
            return {
              ...ins,
              likes: newLikedUsers.length,
              likedUsers: newLikedUsers,
            };
          }
          return ins;
        })
      );
    }

    // 도서 상세 모달의 타임라인 목록도 낙관적 갱신
    setTimelineItems((prev) =>
      prev.map((item) => {
        if (item.id === rawId) {
          const isCurrentlyLiked = (item.likedUsers || []).includes(myNick);
          const newLikedUsers = isCurrentlyLiked
            ? (item.likedUsers || []).filter((u) => u !== myNick)
            : [...(item.likedUsers || []), myNick];
          return {
            ...item,
            likes: newLikedUsers.length,
            likedUsers: newLikedUsers,
          };
        }
        return item;
      })
    );

    try {
      const res = await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: rawId, nickname: myNick }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(data.error || '피드 공감 저장 실패');
        fetchGlobalTimeline();
        if (selectedBook) fetchTimeline(selectedBook.bookId || selectedBook.notionPageId);
      }
    } catch (err) {
      console.error('피드 공감 오류:', err);
      fetchGlobalTimeline();
    }
  };

  // AI 1인칭 독서 감상문 초안 생성
  const handleGenerateAiReport = async () => {
    const targetBook = activeDetailBook || selectedBook;
    if (!targetBook) return;

    if (aiProvider === 'exaone' && !aiStatus?.exaoneConfigured) {
      alert('⚠️ LG EXAONE API 키가 서버에 등록되지 않았습니다.\n\n[설정] 모달에서 Google Gemini를 선택해 주시거나 Vercel 환경변수에 EXAONE_API_KEY를 등록해 주세요.');
      return;
    }

    setAiLoading(true);
    try {
      const res = await fetch('/api/ai-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle: targetBook.title,
          author: targetBook.author,
          notionPageId: targetBook.bookId || targetBook.notionPageId,
          aiProvider,
        }),
      });
      const data = await res.json();
      if (data.ok && data.aiReport) {
        setAiReport(data.aiReport);
        setMyReport((prev) => (prev ? prev : data.aiReport));
        alert(`✨ ${data.providerName || 'AI'} 감상문 초안이 생성되었습니다!`);
        fetchTimeline(targetBook.bookId || targetBook.notionPageId);
      } else {
        alert(data.error || 'AI 감상문 생성 실패');
      }
    } catch (err: any) {
      alert(`AI 서버 통신 오류: ${err.message || '네트워크 상태를 확인해 주세요.'}`);
    } finally {
      setAiLoading(false);
    }
  };

  // 나의 감상문 노션 본문 영구 저장
  const handleSaveMyReport = async () => {
    if (!selectedBook) return;
    if (!myReport.trim()) return alert('감상문 내용을 작성해 주세요.');

    setMyReportSaving(true);
    try {
      const res = await fetch('/api/my-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: selectedBook.bookId || selectedBook.notionPageId,
          text: myReport,
          nickname: nickname.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        alert('✍️ 작성하신 독서 감상문이 노션 본문에 안전하게 영구 저장되었습니다!');
      } else {
        alert(`저장 실패: ${data.error}`);
      }
    } catch (err) {
      alert('감상문 저장 오류');
    } finally {
      setMyReportSaving(false);
    }
  };

  const activeDetailBook = useMemo(() => {
    if (!selectedBook) return null;
    return books.find((b) => (b.bookId || b.notionPageId) === (selectedBook.bookId || selectedBook.notionPageId)) || selectedBook;
  }, [books, selectedBook]);

  const sortedTimelineItems = useMemo(() => {
    return [...timelineItems].sort((a, b) => {
      const dateCmp = (b.date || '').localeCompare(a.date || '');
      if (dateCmp !== 0) return dateCmp;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }, [timelineItems]);

  const activeAiName = aiProvider === 'exaone' ? 'LG EXAONE' : 'Google Gemini';

  // 새 로그인/회원가입 성공 핸들러
  const handleLoginSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setNickname(authenticatedUser.nickname);
    setPin(authenticatedUser.pin);
    setHasEnteredLibrary(true);

    localStorage.setItem('app_user', JSON.stringify(authenticatedUser));
    localStorage.setItem('app_nickname', authenticatedUser.nickname);
    localStorage.setItem('guest_entered', 'false');

    const targetClassId = authenticatedUser.classId || '';
    if (authenticatedUser.classId) {
      const cls = {
        id: authenticatedUser.classId,
        name: authenticatedUser.className || '소속 학급',
        code: authenticatedUser.classCode || '',
      };
      setCurrentClass(cls);
    } else if (authenticatedUser.role === 'teacher') {
      setCurrentClass(null);
    }

    // 로그인 직후 authenticatedUser와 targetClassId를 직접 전달하여 비동기 state 딜레이 없이 즉시 도서 및 피드 로딩!
    fetchBooks(targetClassId, authenticatedUser.role, authenticatedUser);
    fetchGlobalTimeline(targetClassId, authenticatedUser.role, authenticatedUser);
  };

  return (
    <>
      {!authChecked ? (
        <div className="min-h-screen bg-[#f9f6f0]" />
      ) : !hasEnteredLibrary ? (
        <LandingGate
          initialNickname={nickname}
          initialPin={pin}
          onLoginSuccess={handleLoginSuccess}
          onBrowseGuest={handleBrowseAsGuest}
          onOpenTutorial={() => setShowTutorialModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenPrivacy={() => setShowPrivacyModal(true)}
          onOpenCopyright={() => setShowCopyrightModal(true)}
        />
      ) : (
        <div className="app">
          {/* 1. 상단 마스트헤드 */}
          <header className="app-header">
            <div>
              <div
                className="app-title-row"
                onClick={() => setActiveTab('home')}
                style={{ cursor: 'pointer' }}
                title="대시보드 홈으로 이동"
              >
                <img src="/icon.svg" className="app-logo-icon" alt="북튜닝 로고" />
                <h1>{appDisplayTitle}</h1>
              </div>
              <p className="subtitle">
                {nickname
                  ? `${nickname}님과 함께 읽고 기록하며 삶의 주파수를 맞춰가는 ${schoolName ? `${schoolName} ` : ''}공유 서재입니다.`
                  : `책을 읽고 기록하며 내 삶과 생각의 주파수를 맞춰가는 ${schoolName ? `${schoolName} ` : ''}공간입니다.`}
              </p>

              {/* 학급 상태 및 교사/학생 서재 전환 배너 */}
              {user && (
                <div className="mt-2 inline-flex items-center flex-wrap gap-2 px-3 py-1.5 rounded-full text-xs bg-white/90 border border-stone-200 shadow-sm">
                  {user.role === 'teacher' ? (
                    currentClass ? (
                      <>
                        <span className="font-bold text-amber-900">👩‍🏫 교사 독서지도</span>
                        <span className="text-stone-300">|</span>
                        <span className="text-stone-700">
                          현재 학급: <strong className="text-emerald-800">{currentClass.name}</strong> 학생 서재
                        </span>
                        {currentClass.code && (
                          <span className="font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[11px] font-bold">
                            코드: {currentClass.code}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentClass(null);
                            fetchBooks('teachers');
                            fetchGlobalTimeline('teachers');
                          }}
                          className="!bg-amber-100 hover:!bg-amber-200 !text-amber-900 border !border-amber-300 text-[11px] font-bold py-1 px-2.5 rounded-lg transition cursor-pointer"
                        >
                          📚 교사 모임 서재로
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowClassModal(true)}
                          className="!bg-stone-100 hover:!bg-stone-200 !text-stone-700 border !border-stone-300 text-[11px] font-bold py-1 px-2 rounded-lg transition cursor-pointer"
                        >
                          ⚙️ 학급 관리
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="font-bold text-amber-900">👩‍🏫 교사 독서모임</span>
                        <span className="text-stone-300">|</span>
                        <span className="text-stone-700 font-medium">
                          교사 간 등록 도서 열람 중
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowClassModal(true)}
                          className="!bg-emerald-600 hover:!bg-emerald-700 !text-white text-[11px] font-bold py-1 px-2.5 rounded-lg transition shadow-sm cursor-pointer"
                        >
                          🏫 학급 학생 서재 보기
                        </button>
                      </>
                    )
                  ) : (
                    <>
                      <span className="font-bold text-emerald-800">🧑‍🎓 우리 반 독서공간</span>
                      <span className="text-stone-300">|</span>
                      <span className="text-stone-700">
                        소속: <strong>{user.className || '우리 반'}</strong> {user.studentNumber ? `(${user.studentNumber})` : ''}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="header-nav-row" data-tour="header-utils">
              <button
                type="button"
                className="ghost-button"
                style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
                onClick={() => setShowTutorialModal(true)}
              >
                📖 사용법
              </button>

              {user?.role === 'teacher' && (
                <button
                  type="button"
                  className="ghost-button"
                  style={{ borderColor: 'var(--accent)', color: 'var(--accent-dark)', fontWeight: 700 }}
                  onClick={() => setShowClassModal(true)}
                >
                  🏫 학급 관리
                </button>
              )}

              {nickname || user ? (
                <button
                  type="button"
                  className="ghost-button"
                  style={{ color: 'var(--danger)', borderColor: '#f2c9c5' }}
                  onClick={() => handleLogout()}
                >
                  🚪 로그아웃
                </button>
              ) : (
                <button
                  type="button"
                  className="ghost-button"
                  style={{ borderColor: 'var(--accent)', color: 'var(--accent-dark)' }}
                  onClick={() => handleLogout(true)}
                >
                  ✨ 로그인 / 입장화면
                </button>
              )}

              <button type="button" className="ghost-button" onClick={() => setShowDevLogModal(true)}>
                📝 개발로그
              </button>
              <button type="button" className="ghost-button" onClick={() => setShowSettingsModal(true)}>
                ⚙️ 설정
              </button>
            </div>
          </header>

          {/* 2. PC 상단 4대 메뉴 탭 네비게이션 */}
          <nav className="desktop-top-nav" data-tour="main-nav" aria-label="메인 탭 네비게이션">
            {[
              {
                id: 'home' as const,
                label: '홈',
                renderIcon: (active: boolean) => (
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 1.8 : 1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5.5v-6.5h-5V21H4a1 1 0 0 1-1-1v-9.5z" />
                  </svg>
                ),
              },
              {
                id: 'library' as const,
                label: '서재',
                renderIcon: (active: boolean) => (
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={active ? 2.1 : 1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5A1.5 1.5 0 0 1 5.5 4h2A1.5 1.5 0 0 1 9 5.5v13A1.5 1.5 0 0 1 7.5 20h-2A1.5 1.5 0 0 1 4 18.5v-13zm5.5 0A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 13 20h-2a1.5 1.5 0 0 1-1.5-1.5v-13zm5.8.6a1.5 1.5 0 0 1 1.1-1.8l1.9-.5a1.5 1.5 0 0 1 1.8 1.1l2.8 12.6a1.5 1.5 0 0 1-1.1 1.8l-1.9.5a1.5 1.5 0 0 1-1.8-1.1L15.3 6.1z" />
                  </svg>
                ),
              },
              {
                id: 'feed' as const,
                label: '피드',
                renderIcon: (active: boolean) => (
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6m-8 8l3.2-2.6H19a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9.4A2 2 0 0 0 5 17.4V20z" />
                  </svg>
                ),
              },
              {
                id: 'dex' as const,
                label: '도감',
                renderIcon: (active: boolean) => (
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 13.5c-2.6 0-5 2-5 4.3 0 1.4 1.1 2.2 2.5 2.2.9 0 1.7-.4 2.5-.4s1.6.4 2.5.4c1.4 0 2.5-.8 2.5-2.2 0-2.3-2.4-4.3-5-4.3z" />
                    <circle cx="7" cy="9.5" r="1.4" />
                    <circle cx="10.2" cy="6.8" r="1.4" />
                    <circle cx="13.8" cy="6.8" r="1.4" />
                    <circle cx="17" cy="9.5" r="1.4" />
                  </svg>
                ),
              },
            ].map((item) => {
              const isActive = activeTab === item.id;
              let badge: number | undefined;
              if (item.id === 'library') {
                const count = myBooks.length > 0 ? myBooks.length : books.length;
                if (count > 0) badge = count;
              } else if (item.id === 'dex') {
                const doneCount = myBooks.filter((b) => (b.progressPercent || 0) >= 100).length;
                if (doneCount > 0) badge = doneCount;
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  data-tour={`nav-${item.id}`}
                  className={`desktop-nav-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <span className="inline-flex items-center justify-center">{item.renderIcon(isActive)}</span>
                  <span>{item.label}</span>
                  {typeof badge === 'number' && (
                    <span className={`desktop-nav-badge ${isActive ? 'active' : ''}`}>{badge}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* 3. 4대 탭 본문 영역 */}
          <main className="app-main-content">
            {activeTab === 'home' && (
              <HomeTab
                books={books}
                myBooks={myBooks}
                logs={allLogs}
                insights={allInsights}
                loading={loading}
                currentUserNickname={nickname}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searching={searching}
                searchResults={searchResults}
                onClearSearchResults={() => setSearchResults([])}
                searchApiType={searchApiType}
                onSearch={handleSearch}
                onSelectSearchResult={handleSelectSearchResult}
                onOpenManualBook={handleOpenManualBook}
                onSelectBook={openDetail}
                onGoToFeed={() => setActiveTab('feed')}
                onGoToLibrary={() => setActiveTab('library')}
              />
            )}

            {activeTab === 'library' && (
              <LibraryTab
                books={books}
                myBooks={myBooks}
                loading={loading}
                currentUserNickname={nickname}
                communityLabel={
                  user?.role === 'student'
                    ? `${user.className || '우리 반'} 서재`
                    : currentClass
                    ? `${currentClass.name} 학생 서재`
                    : '교사 독서모임 서재'
                }
                onSelectBook={openDetail}
                onOpenManualBook={handleOpenManualBook}
                onToggleBookLike={handleToggleBookLike}
              />
            )}

            {activeTab === 'feed' && (
              <FeedTab
                books={books}
                logs={allLogs}
                insights={allInsights}
                loading={loading}
                currentUserNickname={nickname}
                onSelectBook={openDetail}
                onToggleLike={handleToggleFeedItemLike}
              />
            )}

            {activeTab === 'dex' && (
              <DexTab
                myBooks={myBooks}
                onSelectBook={openDetail}
              />
            )}
          </main>

          {/* 4. 모바일 하단 네비게이션 바 */}
          <BottomNav
            activeTab={activeTab}
            onChange={setActiveTab}
            counts={{
              reading: myBooks.filter((b) => (b.progressPercent || 0) < 100).length,
              books: myBooks.length,
              feed: allLogs.length + allInsights.length,
              dex: myBooks.filter((b) => (b.progressPercent || 0) >= 100).length,
            }}
          />

          {/* 5. 노션 바로가기 버튼 (교사에게만 안전 노출) & 푸터 */}
          {user?.role === 'teacher' && process.env.NEXT_PUBLIC_NOTION_DATABASE_URL && (
            <div className="notion-outlink-container">
              <a
                href={process.env.NEXT_PUBLIC_NOTION_DATABASE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="notion-outlink-btn"
                title="선생님 전용 노션 원본 데이터베이스 열기"
              >
                📑 노션 데이터베이스 열기 ↗ (교사 전용)
              </a>
            </div>
          )}

          <footer className="footer text-center mt-12 mb-6">
            <p className="text-xs text-stone-500 mb-2">
              만든이. 기록조율사 서울외고 조용희{' '}
              <a
                href="https://www.instagram.com/record_tuner/"
                target="_blank"
                rel="noreferrer"
                className="text-amber-800 underline"
              >
                @record_tuner
              </a>
            </p>
            <div className="flex justify-center gap-4 text-xs text-stone-400">
              <button
                type="button"
                className="bg-transparent border-0 p-0 text-stone-500 hover:underline"
                onClick={() => setShowPrivacyModal(true)}
              >
                개인정보처리방침
              </button>
              <span>|</span>
              <button
                type="button"
                className="bg-transparent border-0 p-0 text-stone-500 hover:underline"
                onClick={() => setShowCopyrightModal(true)}
              >
                저작권 및 레퍼런스 안내
              </button>
            </div>
          </footer>
        </div>
      )}

      {/* 6. 모달 컴포넌트군 */}
      {/* 6-1. 로그인 / 프로필 설정 모달 */}
      {showLoginModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowLoginModal(false)} />
          <div className="modal-card" style={{ maxWidth: '420px' }}>
            <div className="section-title-row">
              <div>
                <h2>👤 사용자 프로필 / 로그인</h2>
                <p className="subtitle">닉네임과 4자리 PIN으로 입장합니다.</p>
              </div>
              <button type="button" className="ghost-button" onClick={() => setShowLoginModal(false)}>
                닫기
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await authenticateUser(nickname, pin);
              }}
              className="space-y-4"
            >
              <label className="block text-xs font-bold text-stone-700">
                활동 닉네임
                <input
                  type="text"
                  placeholder="닉네임 입력"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="mt-1 w-full"
                  required
                />
              </label>
              <label className="block text-xs font-bold text-stone-700">
                4자리 PIN
                <input
                  type="password"
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="숫자 4자리 비밀번호"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="mt-1 w-full"
                  required
                />
              </label>
              <p className="text-xs text-stone-500 leading-relaxed">
                ※ 동명이인 구분 및 본인 인증을 위해 사용됩니다.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <button type="submit" className="w-full py-3 font-bold">
                  서재 입장하기
                </button>
                {(nickname || user) && (
                  <button
                    type="button"
                    className="ghost-button w-full py-2.5 text-xs"
                    style={{ color: 'var(--danger)', borderColor: '#f2c9c5' }}
                    onClick={() => handleLogout()}
                  >
                    🚪 로그아웃 (입장 화면으로 이동)
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6-2. 수동 / 검색 결과 도서 등록 모달 */}
      {showManualBookModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowManualBookModal(false)} />
          <div className="modal-card" style={{ maxWidth: '600px' }}>
            <div className="section-title-row">
              <div>
                <h2>도서 정보 확인 및 등록</h2>
                <p className="subtitle">검색 결과를 확인하거나 정보를 직접 입력한 뒤 저장합니다.</p>
              </div>
              <button type="button" className="ghost-button" onClick={() => setShowManualBookModal(false)}>
                닫기
              </button>
            </div>
            <form onSubmit={handleSubmitManualBook} className="space-y-3">
              {manualCover && (
                <div className="flex gap-4 items-center p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <img src={manualCover} alt="표지 미리보기" className="w-16 h-22 object-cover rounded shadow-sm" />
                  <div className="text-xs text-stone-600">
                    <p className="font-bold text-amber-900 mb-1">📖 표지 미리보기</p>
                    <p className="truncate max-w-xs">{manualCover}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="block text-xs font-bold text-stone-700">
                  도서 커버이미지 URL
                  <input
                    type="url"
                    placeholder="https://..."
                    value={manualCover}
                    onChange={(e) => setManualCover(e.target.value)}
                    className="mt-1 w-full"
                  />
                </label>
                <label className="block text-xs font-bold text-stone-700">
                  도서명 (필수)
                  <input
                    type="text"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="mt-1 w-full"
                    required
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="block text-xs font-bold text-stone-700">
                  저자
                  <input
                    type="text"
                    value={manualAuthor}
                    onChange={(e) => setManualAuthor(e.target.value)}
                    className="mt-1 w-full"
                  />
                </label>
                <label className="block text-xs font-bold text-stone-700">
                  출판사
                  <input
                    type="text"
                    value={manualPublisher}
                    onChange={(e) => setManualPublisher(e.target.value)}
                    className="mt-1 w-full"
                  />
                </label>
                <label className="block text-xs font-bold text-stone-700">
                  총 쪽수
                  <input
                    type="number"
                    min="0"
                    placeholder="예: 320"
                    value={manualPages}
                    onChange={(e) => setManualPages(e.target.value)}
                    className="mt-1 w-full"
                  />
                </label>
              </div>
              <label className="block text-xs font-bold text-stone-700">
                책 소개 및 메모
                <textarea
                  rows={3}
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  placeholder="도서 소개나 간단한 메모를 입력하세요"
                  className="mt-1 w-full"
                />
              </label>

              <div className="text-right mt-4 pt-3 border-t">
                <button type="submit" className="w-full py-3 font-bold">
                  도서 서재에 등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6-3. 도서 상세 기록 모달 (통합 타임라인 + 인라인 작성 + AI 감상문) */}
      {showDetailModal && activeDetailBook && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowDetailModal(false)} />
          <div className="modal-card detail-modal-card">
            {/* 상단 도서 정보 헤더 */}
            <div
              className="section-title-row flex-wrap gap-3"
              style={{ paddingBottom: '14px', marginBottom: 0, borderBottom: '1px solid var(--line)' }}
            >
              <div className="flex gap-4 items-center min-w-0">
                {activeDetailBook.coverUrl ? (
                  <img
                    src={activeDetailBook.coverUrl}
                    alt={activeDetailBook.title}
                    className="w-16 h-24 object-cover rounded-xl shadow-md border border-stone-200 flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-24 rounded-xl bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center text-[11px] font-bold text-center p-1.5 flex-shrink-0">
                    {activeDetailBook.title}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                      {activeDetailBook.progressPercent || 0}% 완독
                    </span>
                    <span className="text-xs text-stone-500 font-medium detail-header-meta">
                      전체 {activeDetailBook.totalPages || '?'}쪽 ({activeDetailBook.readPages || 0}쪽 읽음)
                    </span>
                    {checkIsOwner(activeDetailBook) ? (
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        ✨ 내 서재
                      </span>
                    ) : (
                      <span className="text-xs bg-stone-100 text-stone-600 font-medium px-2 py-0.5 rounded-full">
                        🔒 {activeDetailBook.nickname}님의 서재
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-stone-900 leading-snug mb-0.5 detail-header-title">
                    {activeDetailBook.title}
                  </h2>
                  <p className="text-xs text-stone-600 detail-header-meta">
                    {[activeDetailBook.author, activeDetailBook.publisher].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* 도서 공감(좋아요) 토글 버튼 */}
                <button
                  type="button"
                  onClick={() => handleToggleBookLike(activeDetailBook)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    (activeDetailBook.likedUsers || []).includes(nickname.trim())
                      ? '!bg-rose-50 !text-rose-600 !border-rose-200 shadow-xs'
                      : '!bg-stone-50 hover:!bg-rose-50 !text-stone-600 hover:!text-rose-600 !border-stone-300'
                  }`}
                  title={(activeDetailBook.likedUsers || []).includes(nickname.trim()) ? '공감 취소' : '공감하기'}
                >
                  <span>{(activeDetailBook.likedUsers || []).includes(nickname.trim()) ? '❤️' : '🤍'}</span>
                  <span>공감 {activeDetailBook.likes || 0}</span>
                </button>

                {canManageBook(activeDetailBook) && (
                  <button
                    type="button"
                    className="ghost-button text-xs"
                    onClick={() => {
                      setSelectedBook(activeDetailBook);
                      setManualTitle(activeDetailBook.title || '');
                      setManualAuthor(activeDetailBook.author || '');
                      setManualPublisher(activeDetailBook.publisher || '');
                      setManualPages(activeDetailBook.totalPages || 0);
                      setManualDesc(activeDetailBook.description || '');
                      setManualCover(activeDetailBook.coverUrl || '');
                      setShowEditBookModal(true);
                    }}
                  >
                    ⚙️ 도서 관리
                  </button>
                )}
                <button
                  type="button"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 transition"
                  onClick={() => setShowDetailModal(false)}
                >
                  닫기
                </button>
              </div>
            </div>

            {/* 탭 네비게이션: 모바일 가로 잘림 방지 3열 그리드 컨테이너 */}
            <div className="grid grid-cols-3 gap-1.5 flex-shrink-0 mt-3 mb-3.5 w-full">
              <button
                type="button"
                className={`w-full py-2 px-1 text-center rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1 ${
                  detailTab === 'timeline'
                    ? '!bg-amber-600 !text-white !border-amber-600 shadow-sm'
                    : '!bg-stone-100 hover:!bg-stone-200 !text-stone-700 !border-stone-200'
                }`}
                onClick={() => setDetailTab('timeline')}
              >
                <span>📅 피드 ({timelineItems.length})</span>
              </button>
              <button
                type="button"
                className={`w-full py-2 px-1 text-center rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1 ${
                  detailTab === 'ai'
                    ? '!bg-amber-600 !text-white !border-amber-600 shadow-sm'
                    : '!bg-stone-100 hover:!bg-stone-200 !text-stone-700 !border-stone-200'
                }`}
                onClick={() => setDetailTab('ai')}
              >
                <span>✨ AI 감상문</span>
              </button>
              <button
                type="button"
                className={`w-full py-2 px-1 text-center rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1 ${
                  detailTab === 'my'
                    ? '!bg-amber-600 !text-white !border-amber-600 shadow-sm'
                    : '!bg-stone-100 hover:!bg-stone-200 !text-stone-700 !border-stone-200'
                }`}
                onClick={() => setDetailTab('my')}
              >
                <span>✍️ 나의 감상문</span>
              </button>
            </div>

            {/* 스크롤 가능한 상세 모달 본문 영역 (모바일에서 폼/버튼이 잘리지 않고 부드럽게 스크롤) */}
            <div className="detail-modal-body flex-1 min-h-0 overflow-y-auto pr-1 pb-6 space-y-4">
              {/* 탭 1. 통합 타임라인 피드 + 인라인 작성 폼 */}
              {detailTab === 'timeline' && (
                <div className="space-y-4">
                  {checkIsOwner(activeDetailBook) && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className={`text-xs px-3.5 py-2 rounded-xl font-bold border transition cursor-pointer ${
                          activeDetailForm === 'log'
                            ? '!bg-amber-600 hover:!bg-amber-700 !text-white !border-amber-600 shadow-sm'
                            : '!bg-white !text-stone-700 !border-stone-300 hover:!bg-stone-50'
                        }`}
                        onClick={() => setActiveDetailForm((prev) => (prev === 'log' ? 'none' : 'log'))}
                      >
                        {activeDetailForm === 'log' ? '✕ 진도 작성 닫기' : '＋ 진도 기록 남기기'}
                      </button>
                      <button
                        type="button"
                        className={`text-xs px-3.5 py-2 rounded-xl font-bold border transition cursor-pointer ${
                          activeDetailForm === 'insight'
                            ? '!bg-emerald-600 hover:!bg-emerald-700 !text-white !border-emerald-600 shadow-sm'
                            : '!bg-white !text-stone-700 !border-stone-300 hover:!bg-stone-50'
                        }`}
                        onClick={() => setActiveDetailForm((prev) => (prev === 'insight' ? 'none' : 'insight'))}
                      >
                        {activeDetailForm === 'insight' ? '✕ 문장수집 닫기' : '＋ 문장 수집 (사진 OCR)'}
                      </button>
                    </div>
                  )}

                  {/* 인라인 진도 기록 폼 */}
                  {activeDetailForm === 'log' && (
                    <form
                      onSubmit={handleSubmitInlineLog}
                      className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-3 shadow-sm w-full max-w-full overflow-hidden"
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-amber-200">
                        <span className="text-xs font-bold text-amber-950">📖 진도 및 감상 기록</span>
                        <span className="text-[11px] text-stone-500 font-medium">
                          전체 {activeDetailBook.totalPages || '?'}쪽 중
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-full min-w-0">
                        <div className="w-full max-w-full min-w-0">
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            읽은 날짜
                          </label>
                          <input
                            type="date"
                            value={inlineLogDate}
                            onChange={(e) => setInlineLogDate(e.target.value)}
                            style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}
                            className="block w-full max-w-full rounded-xl px-3 py-2 text-xs sm:text-sm border border-stone-300 bg-white"
                            required
                          />
                        </div>
                        <div className="w-full max-w-full min-w-0">
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            현재까지 누적 페이지
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={activeDetailBook.totalPages || 9999}
                            placeholder={`예: ${(activeDetailBook.readPages || 0) + 10}`}
                            value={inlineLogPage}
                            onChange={(e) => setInlineLogPage(e.target.value)}
                            style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}
                            className="block w-full max-w-full rounded-xl px-3 py-2 text-xs sm:text-sm border border-stone-300 bg-white"
                            required
                          />
                        </div>
                      </div>

                      <label className="block text-xs font-bold text-stone-700 w-full max-w-full">
                        감상 및 요약 메모
                        <textarea
                          rows={3}
                          value={inlineLogContent}
                          onChange={(e) => setInlineLogContent(e.target.value)}
                          placeholder="오늘 읽은 분량의 생각이나 느낌을 자유롭게 적어보세요..."
                          className="mt-1 w-full max-w-full box-border rounded-xl px-3 py-2 text-xs sm:text-sm border border-stone-300 bg-white"
                          required
                        />
                      </label>

                      <div className="flex justify-end gap-2 pt-2 pb-1 border-t border-amber-200/60 mt-3">
                        <button
                          type="button"
                          className="!bg-stone-100 hover:!bg-stone-200 !text-stone-700 !border !border-stone-300 text-xs py-2 px-3.5 rounded-xl font-bold transition cursor-pointer"
                          onClick={() => setActiveDetailForm('none')}
                        >
                          취소
                        </button>
                        <button
                          type="submit"
                          disabled={submittingInlineLog}
                          className="!bg-amber-600 hover:!bg-amber-700 !text-white text-xs py-2 px-4.5 rounded-xl font-bold transition shadow-sm cursor-pointer"
                        >
                          {submittingInlineLog ? '저장 중...' : '기록 저장'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* 인라인 문장 수집 폼 (사진 OCR 탑재) */}
                  {activeDetailForm === 'insight' && (
                    <form
                      onSubmit={handleSubmitInlineInsight}
                      className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 space-y-3 shadow-sm w-full max-w-full overflow-hidden"
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200">
                        <span className="text-xs font-bold text-emerald-950">💡 감명 깊은 문장 수집</span>
                        <span className="text-[11px] text-stone-500 font-medium">본문 사진 첨부 지원</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-full min-w-0">
                        <div className="w-full max-w-full min-w-0">
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            수집 날짜
                          </label>
                          <input
                            type="date"
                            value={inlineInsightDate}
                            onChange={(e) => setInlineInsightDate(e.target.value)}
                            style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}
                            className="block w-full max-w-full rounded-xl px-3 py-2 text-xs sm:text-sm border border-stone-300 bg-white"
                            required
                          />
                        </div>
                        <div className="w-full max-w-full min-w-0">
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            해당 페이지 번호
                          </label>
                          <input
                            type="text"
                            placeholder="예: 42 또는 105-108"
                            value={inlineInsightPage}
                            onChange={(e) => setInlineInsightPage(e.target.value)}
                            style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}
                            className="block w-full max-w-full rounded-xl px-3 py-2 text-xs sm:text-sm border border-stone-300 bg-white"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-900">
                            📷 페이지 또는 필기 사진 첨부 (AI OCR)
                          </span>
                          {inlineInsightOcrLoading && (
                            <span className="text-xs text-emerald-700 font-bold animate-pulse">
                              텍스트 판독 중...
                            </span>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            runOcrFromFile(file, setInlineInsightOcrLoading, setInlineInsightImageUrl, (ocrText) => {
                              setInlineInsightQuote((prev) => (prev ? `${prev}\n\n${ocrText}` : ocrText));
                            });
                          }}
                          className="text-xs w-full"
                        />
                        {inlineInsightImageUrl && (
                          <div className="flex items-center gap-2 pt-1">
                            <img
                              src={inlineInsightImageUrl}
                              alt="첨부 미리보기"
                              className="w-14 h-14 object-cover rounded border"
                            />
                            <button
                              type="button"
                              className="!bg-stone-100 hover:!bg-stone-200 !text-stone-700 !border !border-stone-300 text-xs py-1 px-2.5 rounded-lg cursor-pointer font-medium"
                              onClick={() => setInlineInsightImageUrl('')}
                            >
                              사진 삭제
                            </button>
                          </div>
                        )}
                      </div>

                      <label className="block text-xs font-bold text-stone-700">
                        발췌 문장 및 생각
                        <textarea
                          rows={3}
                          value={inlineInsightQuote}
                          onChange={(e) => setInlineInsightQuote(e.target.value)}
                          placeholder="마음에 와닿은 문장을 직접 적거나 사진을 올려 텍스트를 추출해 보세요..."
                          className="mt-1 w-full"
                          required
                        />
                      </label>

                      <div className="flex justify-end gap-2 pt-2 pb-1 border-t border-emerald-200/60 mt-3">
                        <button
                          type="button"
                          className="!bg-stone-100 hover:!bg-stone-200 !text-stone-700 !border !border-stone-300 text-xs py-2 px-3.5 rounded-xl font-bold transition cursor-pointer"
                          onClick={() => setActiveDetailForm('none')}
                        >
                          취소
                        </button>
                        <button
                          type="submit"
                          disabled={submittingInlineInsight}
                          className="!bg-emerald-600 hover:!bg-emerald-700 !text-white text-xs py-2 px-4.5 rounded-xl font-bold transition shadow-sm cursor-pointer"
                        >
                          {submittingInlineInsight ? '수집 중...' : '문장 수집'}
                        </button>
                      </div>
                    </form>
                  )}

                {/* 타임라인 항목 목록 */}
                {timelineLoading ? (
                  <div className="p-8 text-center text-xs text-stone-500 animate-pulse">
                    타임라인 기록을 불러오는 중...
                  </div>
                ) : sortedTimelineItems.length === 0 ? (
                  <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-xs">
                    아직 남겨진 독서 기록이 없습니다. 위 버튼을 눌러 첫 기록을 남겨보세요!
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    {sortedTimelineItems.map((item) => {
                      const isOwner = checkIsOwner(activeDetailBook);
                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 rounded-2xl border transition ${
                            item.type === 'insight'
                              ? 'bg-emerald-50/50 border-emerald-200'
                              : 'bg-white border-stone-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                  item.type === 'insight'
                                    ? 'bg-emerald-200/80 text-emerald-950'
                                    : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                {item.type === 'insight' ? '💡 문장수집' : '📅 독서일지'}
                              </span>
                              <span className="text-xs font-bold text-stone-700">
                                {item.page ? `${item.page}쪽` : '쪽수 미상'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-stone-400 text-xs">
                              <time>{item.date}</time>
                              {isOwner && (
                                <button
                                  type="button"
                                  className="text-stone-400 hover:text-rose-600 bg-transparent border-0 p-0 text-xs"
                                  onClick={() =>
                                    item.type === 'log'
                                      ? handleDeleteLog(item.id)
                                      : handleDeleteInsight(item.id)
                                  }
                                >
                                  삭제
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-stone-800 leading-relaxed whitespace-pre-wrap">
                            {item.type === 'insight' ? `“${item.content}”` : item.content}
                          </p>

                          {item.imageUrl && (
                            <div className="mt-2 rounded-xl overflow-hidden border border-stone-200 max-w-xs">
                              <img src={item.imageUrl} alt="첨부 사진" className="w-full h-auto max-h-48 object-cover" />
                            </div>
                          )}

                          {/* 상세 모달 타임라인 아이템 공감(좋아요) 액션 */}
                          <div className="mt-2.5 pt-1.5 border-t border-stone-100 flex items-center justify-between">
                            <span className="text-[10px] text-stone-400">
                              {item.type === 'insight' ? '💡 문장수집' : '📅 독서일지'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleFeedItemLike(item.id, item.type)}
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                                (item.likedUsers || []).includes(nickname.trim())
                                  ? '!bg-rose-50 !text-rose-600 border !border-rose-200'
                                  : '!bg-stone-50 hover:!bg-rose-50 !text-stone-500 hover:!text-rose-600 border !border-stone-200'
                              }`}
                              title={(item.likedUsers || []).includes(nickname.trim()) ? '공감 취소' : '공감하기'}
                            >
                              <span>{(item.likedUsers || []).includes(nickname.trim()) ? '❤️' : '🤍'}</span>
                              <span>공감 {item.likes || 0}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 탭 2. AI 1인칭 감상문 초안 */}
            {detailTab === 'ai' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-amber-950 mb-0.5">
                      ✨ {activeAiName} 1인칭 감상문 초안 생성
                    </h3>
                    <p className="text-[11px] text-stone-600">
                      누적된 진도 일지와 발췌 문장들을 융합해 독자 시점의 깊이 있는 감상문을 작성합니다.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={aiLoading}
                    onClick={handleGenerateAiReport}
                    className="px-4 py-2 text-xs font-bold rounded-xl"
                  >
                    {aiLoading ? 'AI 작성 중...' : `✨ ${activeAiName} 초안 작성`}
                  </button>
                </div>

                {aiReport ? (
                  <div className="p-4 rounded-2xl bg-white border border-stone-200 text-xs leading-relaxed text-stone-800 whitespace-pre-wrap max-h-[50vh] overflow-y-auto">
                    {aiReport}
                  </div>
                ) : (
                  <div className="p-10 text-center text-xs text-stone-400 bg-stone-50 rounded-2xl border border-stone-200">
                    아직 생성된 AI 감상문이 없습니다. 위 버튼을 눌러 초안을 생성해 보세요.
                  </div>
                )}
              </div>
            )}

            {/* 탭 3. 나의 감상문 백업 */}
            {detailTab === 'my' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-stone-800 mb-1">✍️ 나의 최종 감상문 작성</h3>
                  <p className="text-[11px] text-stone-500 mb-2">
                    AI 초안을 다듬거나 직접 느낀 소감을 작성해 노션 도서 페이지 본문에 영구 보관합니다.
                  </p>
                  <textarea
                    rows={12}
                    value={myReport}
                    onChange={(e) => setMyReport(e.target.value)}
                    placeholder="나만의 감상문을 자유롭게 기록해 보세요..."
                    className="w-full text-xs p-3.5 rounded-2xl border border-stone-300 leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={myReportSaving}
                    onClick={handleSaveMyReport}
                    className="px-5 py-2.5 text-xs font-bold rounded-xl"
                  >
                    {myReportSaving ? '노션 저장 중...' : '노션 본문에 저장하기 ↗'}
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* 6-3. 도서 수정/삭제 모달 (서브 모달 z-index 10050) */}
      {showEditBookModal && (selectedBook || activeDetailBook) && (
        <div className="modal modal-sub" style={{ zIndex: 10050 }}>
          <div className="modal-backdrop" onClick={() => setShowEditBookModal(false)} />
          <div className="modal-card max-w-lg w-full">
            <div className="section-title-row">
              <div>
                <h2 className="text-base font-bold text-stone-900">도서 정보 관리 및 수정</h2>
                <p className="subtitle text-xs text-stone-500">{(selectedBook || activeDetailBook)?.title}</p>
              </div>
              <button
                type="button"
                className="ghost-button text-xs"
                onClick={() => setShowEditBookModal(false)}
              >
                닫기
              </button>
            </div>

            <form onSubmit={handleUpdateBook} className="space-y-3 mt-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">도서명 *</label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">저자</label>
                  <input
                    type="text"
                    value={manualAuthor}
                    onChange={(e) => setManualAuthor(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">출판사</label>
                  <input
                    type="text"
                    value={manualPublisher}
                    onChange={(e) => setManualPublisher(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">전체 쪽수(숫자)</label>
                  <input
                    type="number"
                    min="0"
                    value={manualPages}
                    onChange={(e) => setManualPages(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">표지 이미지 URL</label>
                  <input
                    type="url"
                    value={manualCover}
                    onChange={(e) => setManualCover(e.target.value)}
                    placeholder="https://..."
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">책 소개</label>
                <textarea
                  rows={3}
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 leading-relaxed"
                />
              </div>

              <div className="flex justify-between items-center mt-5 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedBook || activeDetailBook;
                    if (target) handleDeleteBook(target.bookId || target.notionPageId);
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-xl !bg-rose-600 hover:!bg-rose-700 !text-white transition cursor-pointer"
                >
                  🗑️ 도서 삭제
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditBookModal(false)}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 transition"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold rounded-xl !bg-emerald-600 hover:!bg-emerald-700 !text-white transition cursor-pointer"
                  >
                    변경사항 저장
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6-4. 사용법 스포트라이트 투어 & 홍보 동영상 */}
      <SpotlightTutorial
        isOpen={showTutorialModal}
        onClose={() => setShowTutorialModal(false)}
        onEnsureHomeTab={() => setActiveTab('home')}
      />

      {/* 6-5. 설정, 개발로그(포스트잇 휠 캐러셀), 개인정보처리방침, 상세 저작권 모달 모음 */}
      <AppInfoModals
        theme={theme}
        onChangeTheme={changeTheme}
        searchApiType={searchApiType}
        onChangeSearchApiType={changeSearchApiType}
        aiProvider={aiProvider}
        onChangeAiProvider={changeAiProvider}
        aiStatus={aiStatus}
        notionPageUrl={process.env.NEXT_PUBLIC_NOTION_DATABASE_URL}
        isTeacher={user?.role === 'teacher'}
        showSettingsModal={showSettingsModal}
        setShowSettingsModal={setShowSettingsModal}
        showDevLogModal={showDevLogModal}
        setShowDevLogModal={setShowDevLogModal}
        showPrivacyModal={showPrivacyModal}
        setShowPrivacyModal={setShowPrivacyModal}
        showCopyrightModal={showCopyrightModal}
        setShowCopyrightModal={setShowCopyrightModal}
      />

      {/* 6-6. 교사 전용 학급 관리 & 학생 PIN 리셋 모달 */}
      {user?.role === 'teacher' && (
        <ClassManageModal
          isOpen={showClassModal}
          onClose={() => setShowClassModal(false)}
          teacherId={user.id}
          teacherName={user.nickname}
          currentClassId={currentClass?.id}
          onSelectClass={(cls) => {
            setCurrentClass(cls);
            fetchBooks(cls.id);
            fetchGlobalTimeline(cls.id);
          }}
        />
      )}

      {/* 7. 우측 하단 플로팅 '맨 위로 가기(Scroll To Top)' 버튼 */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="맨 위로 가기"
          className="scroll-to-top-btn"
          title="맨 위로 이동"
        >
          <ArrowUp className="w-4 h-4" />
          <span>TOP</span>
        </button>
      )}
    </>
  );
}
