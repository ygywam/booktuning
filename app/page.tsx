'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Book, TimelineItem, User } from '../lib/types';

export default function Home() {
  // 1. 유저 및 세션 상태
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState('');
  const [pin, setPin] = useState('');
  const [theme, setTheme] = useState('theme-base');

  // 2. 도서 서재 상태 (기본: 커뮤니티 전체)
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'rank'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'reading' | 'done'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'progress' | 'title' | 'likes'>('latest');

  // 3. 도서 검색 상태 및 API 선택 (카카오, 알라딘, 네이버)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchApiType, setSearchApiType] = useState<'kakao' | 'aladin' | 'naver'>('kakao');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // 4. 모달 상태
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

  // 5. 선택된 도서 및 상세 뷰 상태
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [detailTab, setDetailTab] = useState<'timeline' | 'ai' | 'my'>('timeline');
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [aiReport, setAiReport] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [myReport, setMyReport] = useState('');
  const [myReportSaving, setMyReportSaving] = useState(false);

  // 6. 폼 상태들
  const [readDate, setReadDate] = useState('');
  const [readPages, setReadPages] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  const [insightPage, setInsightPage] = useState('');
  const [insightNotes, setInsightNotes] = useState('');
  const [insightImageUrl, setInsightImageUrl] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [editingPageLogId, setEditingPageLogId] = useState<string | null>(null);

  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthor, setManualAuthor] = useState('');
  const [manualPublisher, setManualPublisher] = useState('');
  const [manualPages, setManualPages] = useState<number | ''>('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualCover, setManualCover] = useState('');
  const [manualIsbn, setManualIsbn] = useState('');
  const [manualSource, setManualSource] = useState('수동 직접 등록');

  // 도서 소유자 확인 (본인이 등록한 도서인지 검증)
  const checkIsOwner = (b: Book | null) => {
    if (!b || !nickname.trim()) return false;
    if (user?.id && b.userId && user.id === b.userId) return true;
    return nickname.trim() === (b.nickname || '').trim();
  };

  // 7. 초기화 로드
  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme') || 'theme-base';
    setTheme(savedTheme);
    document.body.className = savedTheme;

    const savedApiType = (localStorage.getItem('search_api_type') as any) || 'kakao';
    setSearchApiType(savedApiType);

    const today = new Date().toISOString().split('T')[0];
    setReadDate(today);

    const savedUserStr = localStorage.getItem('app_user');
    const savedNickname = localStorage.getItem('app_nickname');
    if (savedUserStr) {
      try {
        const parsed = JSON.parse(savedUserStr);
        setUser(parsed);
        setNickname(parsed.nickname || savedNickname || '');
        setPin(parsed.pin || '');
      } catch (e) {
        if (savedNickname) setNickname(savedNickname);
      }
    } else if (savedNickname) {
      setNickname(savedNickname);
    }

    fetchBooks();
  }, []);

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    document.body.className = newTheme;
    localStorage.setItem('app_theme', newTheme);
  };

  const changeSearchApiType = (newType: 'kakao' | 'aladin' | 'naver') => {
    setSearchApiType(newType);
    localStorage.setItem('search_api_type', newType);
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/books');
      const data = await res.json();
      if (data.ok) {
        setBooks(data.books || []);
      } else {
        console.error(data.error);
      }
    } catch (err) {
      console.error('도서 목록 로딩 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 8. 사용자 로그인 및 등록
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return alert('활동할 닉네임을 입력해 주세요.');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim(), pin: pin.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setUser(data.user);
        localStorage.setItem('app_user', JSON.stringify(data.user));
        localStorage.setItem('app_nickname', data.user.nickname);
        setShowLoginModal(false);
        alert(`반갑습니다, ${data.user.nickname}님! 북튜닝 서재에 입장하셨습니다. 📚`);
        fetchBooks();
      } else {
        alert(data.error || '로그인에 실패했습니다.');
      }
    } catch (err) {
      alert('로그인 통신 중 오류가 발생했습니다.');
    }
  };

  // 9. 도서 검색 (다각화: kakao, aladin, naver)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/search-books?query=${encodeURIComponent(searchQuery)}&type=${searchApiType}`);
      const data = await res.json();
      if (data.ok) {
        setSearchResults(data.books || []);
      } else {
        alert(`검색 실패: ${data.error}`);
      }
    } catch (err) {
      alert('도서 검색 중 오류가 발생했습니다.');
    } finally {
      setSearching(false);
    }
  };

  // 검색 결과 선택 시 확인 및 등록 폼 열기
  const handleSelectSearchResult = (book: any) => {
    setManualTitle(book.title || '');
    setManualAuthor(book.author || '');
    setManualPublisher(book.publisher || '');
    setManualPages(book.totalPages > 0 ? book.totalPages : '');
    setManualDesc(book.description || '');
    setManualCover(book.coverUrl || '');
    setManualIsbn(book.isbn || '');
    setManualSource(book.source || (searchApiType === 'aladin' ? 'Aladin API' : searchApiType === 'kakao' ? 'Kakao API' : 'Naver API'));
    setShowManualBookModal(true);
  };

  const handleOpenManualBook = () => {
    setManualTitle('');
    setManualAuthor('');
    setManualPublisher('');
    setManualPages('');
    setManualDesc('');
    setManualCover('');
    setManualIsbn('');
    setManualSource('수동 직접 등록');
    setShowManualBookModal(true);
  };

  const handleSubmitManualBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return alert('도서명을 입력해 주세요.');

    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: manualTitle.trim(),
          author: manualAuthor.trim() || '미상',
          publisher: manualPublisher.trim() || '',
          totalPages: Number(manualPages) || 0,
          description: manualDesc.trim() || '등록된 도서입니다.',
          coverUrl: manualCover.trim(),
          isbn: manualIsbn.trim(),
          source: manualSource.trim() || '수동 직접 등록',
          nickname: nickname.trim() || '독서가',
          userId: user?.id,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        alert(`[${manualTitle.trim()}] 도서가 서재에 안전하게 등록되었습니다! ✨`);
        setShowManualBookModal(false);
        setSearchResults([]);
        setSearchQuery('');
        setManualTitle('');
        setManualAuthor('');
        setManualPublisher('');
        setManualPages('');
        setManualDesc('');
        setManualCover('');
        setManualIsbn('');
        setManualSource('수동 직접 등록');
        fetchBooks();
      } else {
        alert(`등록 실패: ${data.error}`);
      }
    } catch (err) {
      alert('도서 등록 중 오류가 발생했습니다.');
    }
  };

  const handleUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;
    if (!checkIsOwner(selectedBook)) {
      return alert('본인이 등록한 도서만 수정할 수 있습니다.');
    }

    try {
      const res = await fetch('/api/books', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: selectedBook.bookId,
          nickname: nickname.trim(),
          title: manualTitle,
          author: manualAuthor,
          publisher: manualPublisher,
          totalPages: Number(manualPages),
          description: manualDesc,
          coverUrl: manualCover,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        alert('도서 정보가 성공적으로 수정되었습니다! (노션 동기화 완료)');
        setShowEditBookModal(false);
        fetchBooks();
      } else {
        alert(`수정 실패: ${data.error}`);
      }
    } catch (err) {
      alert('도서 수정 오류 발생');
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('정말 이 책을 서재에서 삭제(노션 휴지통 아카이브)하시겠습니까?\n※ 연관된 모든 독서일지와 문장수집도 노션에서 함께 삭제됩니다.')) return;
    try {
      const res = await fetch(`/api/books?bookId=${bookId}&nickname=${encodeURIComponent(nickname.trim())}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        alert('도서와 연관 기록이 노션에서 안전하게 삭제되었습니다.');
        setShowDetailModal(false);
        setShowEditBookModal(false);
        fetchBooks();
      } else {
        alert(`삭제 실패: ${data.error}`);
      }
    } catch (err) {
      alert('도서 삭제 오류 발생');
    }
  };

  // 10. 진도 기록 등록/수정
  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;
    if (!checkIsOwner(selectedBook)) {
      return alert('본인이 등록한 도서에만 진도를 기록할 수 있습니다.');
    }

    try {
      if (editingLogId) {
        const res = await fetch('/api/logs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logId: editingLogId,
            nickname: nickname.trim(),
            readDate,
            readPages: Number(readPages),
            note,
          }),
        });
        const data = await res.json();
        if (data.ok) {
          alert('진도 기록이 수정되었습니다.');
          setEditingLogId(null);
          setShowLogModal(false);
          fetchTimeline(selectedBook.bookId);
          fetchBooks();
        } else alert(`수정 실패: ${data.error}`);
      } else {
        const res = await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookNotionPageId: selectedBook.bookId,
            readDate,
            readPages: Number(readPages),
            note,
            nickname: nickname.trim(),
            userId: user?.id,
          }),
        });
        const data = await res.json();
        if (data.ok) {
          alert('오늘의 독서 진도가 노션에 기록되었습니다! 📖');
          setShowLogModal(false);
          setNote('');
          fetchTimeline(selectedBook.bookId);
          fetchBooks();
        } else alert(`저장 실패: ${data.error}`);
      }
    } catch (err) {
      alert('진도 저장 중 오류 발생');
    }
  };

  // 11. 문장 수집 등록/수정 & OCR
  const handleOcrImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setInsightImageUrl(base64Data);
      setOcrLoading(true);
      try {
        const res = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Data, mimeType: file.type }),
        });
        const data = await res.json();
        if (data.ok && data.ocrText) {
          setInsightNotes((prev) => (prev ? `${prev}\n\n${data.ocrText}` : data.ocrText));
          alert('Gemini AI가 사진에서 문장을 성공적으로 추출했습니다! ✨');
        } else {
          alert('문장 추출 실패 또는 글자를 찾지 못했습니다.');
        }
      } catch (err) {
        alert('OCR 통신 오류 발생');
      } finally {
        setOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitInsight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;
    if (!checkIsOwner(selectedBook)) {
      return alert('본인이 등록한 도서에만 문장을 수집할 수 있습니다.');
    }

    try {
      if (editingPageLogId) {
        const res = await fetch('/api/insights', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageLogId: editingPageLogId,
            nickname: nickname.trim(),
            page: insightPage,
            notes: insightNotes,
          }),
        });
        const data = await res.json();
        if (data.ok) {
          alert('문장 수집이 수정되었습니다.');
          setEditingPageLogId(null);
          setShowInsightModal(false);
          fetchTimeline(selectedBook.bookId);
          fetchBooks();
        } else alert(`수정 실패: ${data.error}`);
      } else {
        const res = await fetch('/api/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookNotionPageId: selectedBook.bookId,
            page: insightPage,
            notes: insightNotes,
            imageUrl: insightImageUrl,
            nickname: nickname.trim(),
            userId: user?.id,
          }),
        });
        const data = await res.json();
        if (data.ok) {
          alert('감명 깊은 문장이 노션에 수집되었습니다! 💡');
          setShowInsightModal(false);
          setInsightPage('');
          setInsightNotes('');
          setInsightImageUrl('');
          fetchTimeline(selectedBook.bookId);
          fetchBooks();
        } else alert(`저장 실패: ${data.error}`);
      }
    } catch (err) {
      alert('문장 수집 저장 오류 발생');
    }
  };

  // 12. 공감(좋아요) 토글
  const handleToggleLike = async (bookId: string) => {
    try {
      const res = await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, nickname }),
      });
      const data = await res.json();
      if (data.ok) {
        setBooks((prev) =>
          prev.map((b) =>
            b.bookId === bookId
              ? { ...b, likes: data.likes, likedUsers: data.likedUsers }
              : b
          )
        );
      }
    } catch (err) {
      console.error('좋아요 실패:', err);
    }
  };

  // 13. 도서 상세 및 타임라인 열기
  const openDetail = async (book: Book) => {
    setSelectedBook(book);
    setDetailTab('timeline');
    setShowDetailModal(true);
    fetchTimeline(book.bookId);
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
    if (!confirm('이 진도 기록을 삭제하시겠습니까? (노션에서도 즉시 삭제됩니다)')) return;
    try {
      const res = await fetch(`/api/logs?logId=${logId}&nickname=${encodeURIComponent(nickname.trim())}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        if (selectedBook) fetchTimeline(selectedBook.bookId);
        fetchBooks();
      } else {
        alert(data.error || '삭제 실패');
      }
    } catch (err) {
      alert('삭제 실패');
    }
  };

  const handleDeleteInsight = async (pageLogId: string) => {
    if (!confirm('이 문장 수집 기록을 삭제하시겠습니까? (노션에서도 즉시 삭제됩니다)')) return;
    try {
      const res = await fetch(`/api/insights?pageLogId=${pageLogId}&nickname=${encodeURIComponent(nickname.trim())}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        if (selectedBook) fetchTimeline(selectedBook.bookId);
        fetchBooks();
      } else {
        alert(data.error || '삭제 실패');
      }
    } catch (err) {
      alert('삭제 실패');
    }
  };

  // 14. Gemini AI 독서 감상문 생성
  const handleGenerateAi = async () => {
    if (!selectedBook) return;
    if (!checkIsOwner(selectedBook)) {
      return alert('도서 등록자만 AI 감상문을 생성할 수 있습니다.');
    }
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle: selectedBook.title,
          author: selectedBook.author,
          notionPageId: selectedBook.bookId,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setAiReport(data.aiReport);
        alert('✨ Gemini AI 감상문이 생성되고 노션 본문에 자동 저장되었습니다!');
      } else {
        alert(`AI 생성 실패: ${data.error}`);
      }
    } catch (err) {
      alert('AI 감상문 생성 오류 발생');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveMyReport = async () => {
    if (!selectedBook || !myReport.trim()) return alert('감상문 내용을 작성해 주세요.');
    if (!checkIsOwner(selectedBook)) {
      return alert('도서 등록자만 감상문을 저장할 수 있습니다.');
    }
    setMyReportSaving(true);
    try {
      const res = await fetch('/api/my-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: selectedBook.bookId,
          text: myReport,
          nickname: nickname.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        alert('✍️ 작성하신 독서 감상문이 노션 본문에 콜아웃 블록으로 영구 저장되었습니다!');
      } else {
        alert(`저장 실패: ${data.error}`);
      }
    } catch (err) {
      alert('감상문 저장 오류');
    } finally {
      setMyReportSaving(false);
    }
  };

  // 15. 기존 데이터 ➔ 사용자 DB 원클릭 마이그레이션 실행
  const handleMigrateOldData = async () => {
    if (!confirm('기존 노션 도서/일지/문장 기록의 닉네임을 읽어 사용자 DB에 연결할까요?')) return;
    try {
      const res = await fetch('/api/users/migrate', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        alert(`마이그레이션 완료!\n생성된 사용자: ${data.report.usersCreated}명\n연결된 도서: ${data.report.booksLinked}권\n연결된 일지: ${data.report.logsLinked}건\n연결된 문장: ${data.report.insightsLinked}건`);
        fetchBooks();
      } else {
        alert(`마이그레이션 실패: ${data.error}`);
      }
    } catch (err) {
      alert('마이그레이션 통신 오류');
    }
  };

  // 16. 도서 필터 및 정렬 계산
  const filteredBooks = books
    .filter((b) => {
      if (activeTab === 'my') {
        const isMyBook = (b.nickname && b.nickname.trim() === nickname.trim()) || (user?.id && b.userId === user.id);
        if (!isMyBook) return false;
      }
      if (statusFilter === 'reading') return (b.progressPercent || 0) < 100;
      if (statusFilter === 'done') return (b.progressPercent || 0) >= 100;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'progress') return (b.progressPercent || 0) - (a.progressPercent || 0);
      if (sortBy === 'likes') return (b.likes || 0) - (a.likes || 0);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

  // 17. 랭킹보드 집계
  const rankingList = useMemo(() => {
    const userStats: { [nick: string]: { nickname: string; doneCount: number; totalPagesRead: number; bookCount: number } } = {};

    books.forEach((b) => {
      const nick = b.nickname || '익명';
      if (!userStats[nick]) {
        userStats[nick] = { nickname: nick, doneCount: 0, totalPagesRead: 0, bookCount: 0 };
      }
      userStats[nick].bookCount++;
      userStats[nick].totalPagesRead += b.readPages || 0;
      if ((b.progressPercent || 0) >= 100 || b.checkbox) {
        userStats[nick].doneCount++;
      }
    });

    return Object.values(userStats).sort((a, b) => {
      if (b.doneCount !== a.doneCount) return b.doneCount - a.doneCount;
      return b.totalPagesRead - a.totalPagesRead;
    });
  }, [books]);

  return (
    <div className="app">
      {/* 1. 상단 헤더 (아이콘 + v4.3 표기) */}
      <header className="app-header">
        <div>
          <p className="eyebrow">{nickname ? `${nickname}님의 독서기록 v4.3 👑` : '북튜닝 독서기록 서재 v4.3 👑'}</p>
          <div className="app-title-row">
            <img src="/icon.svg" className="app-logo-icon" alt="북튜닝 로고" />
            <h1>북튜닝 (Book Tuning)</h1>
          </div>
          <p className="subtitle">책을 읽고 기록하며 내 삶과 생각의 주파수를 맞춰가는 공간입니다.</p>
        </div>
        <div className="header-nav-row">
          <button
            className="ghost-button"
            style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
            onClick={() => setShowTutorialModal(true)}
          >
            📖 사용법
          </button>
          <button className="ghost-button" onClick={() => setShowLoginModal(true)}>
            👤 프로필/로그인
          </button>
          <button className="ghost-button" onClick={() => setShowDevLogModal(true)}>
            📝 개발로그
          </button>
          <button className="ghost-button" onClick={() => setShowSettingsModal(true)}>
            ⚙️ 설정
          </button>
        </div>
      </header>

      {/* 2. 도서 검색 패널 */}
      <section className="panel">
        <div className="section-title-row">
          <div>
            <h2>도서 검색 및 추가</h2>
            <p className="subtitle">
              현재 검색 엔진: <b>{searchApiType === 'kakao' ? '카카오 + 국립중앙도서관' : searchApiType === 'aladin' ? '알라딘' : '네이버'}</b> (설정에서 변경 가능)
            </p>
          </div>
          <button
            className="ghost-button"
            style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
            onClick={handleOpenManualBook}
          >
            ✍️ 직접 등록
          </button>
        </div>

        <div className="search-row">
          <input
            type="text"
            placeholder="예: 나는 감이 아니라 또는 979..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} disabled={searching}>
            {searching ? '검색 중...' : '검색'}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {searchResults.map((book, index) => (
              <div key={index} className="flex gap-3 bg-white p-3 border border-amber-200 rounded-xl items-center shadow-sm">
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt="" className="w-12 h-16 object-cover rounded shadow-sm" />
                ) : (
                  <div className="w-12 h-16 bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-800 rounded">
                    No Cover
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{book.title}</p>
                  <p className="text-xs text-stone-500 truncate">{book.author} | {book.publisher}</p>
                  <p className="text-xs text-amber-800 font-semibold mt-1">
                    {book.totalPages > 0 ? `📖 총 ${book.totalPages}쪽` : '📄 쪽수 미정 (확인 후 입력)'}
                  </p>
                </div>
                <button className="text-xs py-2 px-3" onClick={() => handleSelectSearchResult(book)}>
                  선택
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. 통합 독서 갤러리 */}
      <section>
        <div className="section-title-row">
          <div>
            <h2>통합 독서 갤러리</h2>
            <p className="subtitle">💡 <b>책 표지 이미지를 클릭</b>하면 상세 타임라인과 <b>Gemini AI 감상문</b>을 볼 수 있습니다.</p>
          </div>
        </div>

        <div className="library-tabs">
          <button className={`lib-tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
            커뮤니티 전체 ({books.length})
          </button>
          <button className={`lib-tab-btn ${activeTab === 'my' ? 'active' : ''}`} onClick={() => setActiveTab('my')}>
            내 서재 ({books.filter((b) => b.nickname === nickname || b.userId === user?.id).length})
          </button>
          <button className={`lib-tab-btn ${activeTab === 'rank' ? 'active' : ''}`} onClick={() => setActiveTab('rank')}>
            🏆 랭킹보드
          </button>
        </div>

        {activeTab !== 'rank' && (
          <div className="filter-bar">
            <div className="filter-group">
              <button className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>
                전체
              </button>
              <button className={`filter-btn ${statusFilter === 'reading' ? 'active' : ''}`} onClick={() => setStatusFilter('reading')}>
                읽는 중
              </button>
              <button className={`filter-btn ${statusFilter === 'done' ? 'active' : ''}`} onClick={() => setStatusFilter('done')}>
                완독
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-500">정렬:</span>
              <select
                className="text-xs py-1 px-2 border rounded-lg bg-white"
                style={{ width: 'auto' }}
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
              >
                <option value="latest">최신 등록순</option>
                <option value="progress">높은 진도율순</option>
                <option value="likes">공감 많은순</option>
                <option value="title">도서명 가나다순</option>
              </select>
            </div>
          </div>
        )}

        {/* 랭킹보드 탭 뷰 */}
        {activeTab === 'rank' ? (
          <div className="ranking-grid">
            {rankingList.map((st, idx) => (
              <div key={st.nickname} className="rank-card">
                <div className="rank-badge">{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base text-stone-800 truncate">{st.nickname}</p>
                  <p className="text-xs text-stone-500 mt-1">
                    완독 <b>{st.doneCount}권</b> · 누적 <b>{st.totalPagesRead.toLocaleString()}쪽</b> 독서
                  </p>
                  <p className="text-xs text-amber-800 mt-0.5">총 {st.bookCount}권 서재 등록</p>
                </div>
              </div>
            ))}
          </div>
        ) : loading ? (
          <div className="panel text-center py-12 text-stone-500">
            노션 데이터베이스에서 서재를 실시간 동기화하는 중입니다... 📚
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="panel text-center py-12 text-stone-500">
            {activeTab === 'my' ? (
              <div>
                <p className="font-bold mb-2">아직 '{nickname}' 닉네임으로 등록된 책이 없습니다.</p>
                <p className="text-xs text-stone-400 mb-4">상단 [커뮤니티 전체] 탭을 눌러 모임원들의 책을 둘러보거나, 새 책을 검색해 추가해 보세요!</p>
                <button className="ghost-button" onClick={() => setActiveTab('all')}>커뮤니티 전체 서재 보기</button>
              </div>
            ) : (
              '조건과 일치하는 도서가 없습니다.'
            )}
          </div>
        ) : (
          <div className="book-gallery">
            {filteredBooks.map((book) => {
              const hasLiked = book.likedUsers?.includes(nickname);
              const isMyBook = checkIsOwner(book);
              return (
                <article key={book.bookId} className="book-card">
                  <div className="cover-wrap" onClick={() => openDetail(book)}>
                    <div className="cover-badge">기록보기</div>
                    <div className="author-badge">{isMyBook ? '👑 내 책' : (book.nickname || '익명')}</div>
                    {book.coverUrl ? (
                      <img src={book.coverUrl} alt={book.title} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-center p-3 text-xs font-bold text-amber-900 bg-amber-100">
                        {book.title}
                      </div>
                    )}
                  </div>

                  <div className="book-card-body">
                    <div className="book-title" onClick={() => openDetail(book)}>
                      {book.title}
                    </div>
                    <div className="book-meta truncate">{book.author || '저자 미상'}</div>

                    <div className="progress-area">
                      <div className="progress-text">
                        <span>{book.readPages || 0} / {book.totalPages || 0}쪽</span>
                        <span className="text-amber-800 font-bold">{book.progressPercent || 0}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${book.progressPercent || 0}%` }}></div>
                      </div>
                    </div>

                    <div className="like-row">
                      <button
                        className={`like-btn ${hasLiked ? 'liked' : ''}`}
                        onClick={() => handleToggleLike(book.bookId)}
                      >
                        {hasLiked ? '❤️' : '🤍'} {book.likes || 0}
                      </button>
                      {isMyBook ? (
                        <button
                          className="text-xs text-stone-400 hover:text-stone-700 bg-transparent border-0 p-1"
                          onClick={() => {
                            setSelectedBook(book);
                            setManualTitle(book.title);
                            setManualAuthor(book.author);
                            setManualPublisher(book.publisher);
                            setManualPages(book.totalPages);
                            setManualDesc(book.description);
                            setManualCover(book.coverUrl);
                            setShowEditBookModal(true);
                          }}
                        >
                          ⚙️ 관리
                        </button>
                      ) : (
                        <span className="text-xs text-stone-400 font-medium">
                          👤 {book.nickname}
                        </span>
                      )}
                    </div>

                    <div className="card-actions">
                      {isMyBook ? (
                        <>
                          <button
                            onClick={() => {
                              setSelectedBook(book);
                              setEditingLogId(null);
                              setReadPages(book.readPages || '');
                              setNote('');
                              setShowLogModal(true);
                            }}
                          >
                            진도 기록
                          </button>
                          <button
                            className="insight-btn"
                            onClick={() => {
                              setSelectedBook(book);
                              setEditingPageLogId(null);
                              setInsightPage('');
                              setInsightNotes('');
                              setInsightImageUrl('');
                              setShowInsightModal(true);
                            }}
                          >
                            문장 수집
                          </button>
                          <button className="ghost-button" style={{ padding: '6px 0', fontSize: '11px' }} onClick={() => openDetail(book)}>
                            상세보기
                          </button>
                        </>
                      ) : (
                        <button
                          className="ghost-button w-full"
                          style={{ padding: '7px 0', fontSize: '12px', borderColor: 'var(--accent)', color: 'var(--accent-dark)' }}
                          onClick={() => openDetail(book)}
                        >
                          📖 서재 둘러보기 (상세)
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. 노션 데이터베이스 열기 알약 버튼 */}
      <div className="notion-outlink-container">
        <a
          href="https://app.notion.com/p/record-tuner/3699a4211895805181aed93dbd6ca10a"
          target="_blank"
          rel="noopener noreferrer"
          className="notion-outlink-btn"
        >
          <span>📋</span> 노션 데이터베이스 열기 ↗
        </a>
      </div>

      {/* 5. 푸터 */}
      <footer className="app-footer">
        <p>만든이. <strong>기록조율사 서울외고 조용희</strong> <a href="https://www.instagram.com/record_tuner/" target="_blank">@record_tuner</a></p>
        <p style={{ marginTop: '10px' }}>
          <a href="#" onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }} style={{ fontSize: '13px', marginRight: '14px' }}>개인정보처리방침</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setShowCopyrightModal(true); }} style={{ fontSize: '13px', marginRight: '14px' }}>저작권 및 이용 안내</a>
          <a href="#" onClick={(e) => { e.preventDefault(); alert('문의 사항은 @record_tuner 인스타그램 DM 또는 노션 페이지를 통해 접수해 주세요.'); }} style={{ fontSize: '13px' }}>지원/문의</a>
        </p>
      </footer>

      {/* ===================== 모달 (Modals) ===================== */}

      {/* 1. 로그인 / 닉네임 설정 모달 */}
      {showLoginModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowLoginModal(false)}></div>
          <div className="modal-card">
            <div className="section-title-row">
              <div>
                <h2>👤 독서 닉네임 로그인 / 등록</h2>
                <p className="subtitle">활동할 닉네임과 본인 확인용 4자리 비밀번호(PIN)를 입력하세요.</p>
              </div>
              <button className="ghost-button" onClick={() => setShowLoginModal(false)}>닫기</button>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <label>활동할 닉네임
                <input
                  type="text"
                  placeholder="활동할 닉네임을 입력하세요 (예: 책벌레)"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                />
              </label>
              <label>4자리 비밀번호 (PIN)
                <input
                  type="password"
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="숫자 4자리 비밀번호 입력"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required
                />
              </label>
              <p className="text-xs text-stone-500">
                ※ 동명이인 구분 및 본인 인증을 위해 사용됩니다. 기존 사용자는 노션에 등록된 4자리 PIN을 입력하세요.
              </p>
              <div className="text-right mt-4">
                <button type="submit" className="w-full py-3 font-bold">서재 입장하기</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. 도서 확인 및 등록 모달 (검색 결과 선택 및 수동 등록 공용) */}
      {showManualBookModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowManualBookModal(false)}></div>
          <div className="modal-card" style={{ maxWidth: '600px' }}>
            <div className="section-title-row">
              <div>
                <h2>도서 정보 확인 및 등록</h2>
                <p className="subtitle">검색 결과를 확인하거나 정보를 직접 입력한 뒤 저장합니다.</p>
              </div>
              <button className="ghost-button" onClick={() => setShowManualBookModal(false)}>닫기</button>
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
                <label>도서 커버이미지 URL
                  <input
                    type="url"
                    value={manualCover}
                    onChange={(e) => setManualCover(e.target.value)}
                    placeholder="https://..."
                  />
                </label>
                <label>ISBN
                  <input
                    type="text"
                    value={manualIsbn}
                    onChange={(e) => setManualIsbn(e.target.value)}
                    placeholder="예: 97911..."
                  />
                </label>
              </div>

              <label>도서명 (필수)
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="도서명을 입력하세요"
                  required
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label>저자
                  <input
                    type="text"
                    value={manualAuthor}
                    onChange={(e) => setManualAuthor(e.target.value)}
                    placeholder="저자명"
                  />
                </label>
                <label>출판사
                  <input
                    type="text"
                    value={manualPublisher}
                    onChange={(e) => setManualPublisher(e.target.value)}
                    placeholder="출판사명"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label>전체 페이지수 (쪽)
                  <input
                    type="number"
                    min="0"
                    value={manualPages}
                    onChange={(e) => setManualPages(e.target.value ? Number(e.target.value) : '')}
                    placeholder="예: 272"
                    required
                  />
                </label>
                <label>검색 출처
                  <input
                    type="text"
                    value={manualSource}
                    onChange={(e) => setManualSource(e.target.value)}
                    placeholder="예: Aladin API"
                  />
                </label>
              </div>

              <label>책 소개 / 메모
                <textarea
                  rows={3}
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  placeholder="도서 소개나 간단한 메모를 입력하세요"
                ></textarea>
              </label>

              <div className="text-right mt-4 pt-3 border-t">
                <button type="submit" className="w-full py-3 font-bold">도서 서재에 등록</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. 진도 기록 모달 */}
      {showLogModal && selectedBook && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowLogModal(false)}></div>
          <div className="modal-card">
            <div className="section-title-row">
              <div>
                <h2>{editingLogId ? '진도 기록 수정' : '진도 기록 추가'}</h2>
                <p className="subtitle">{selectedBook.title}</p>
              </div>
              <button className="ghost-button" onClick={() => setShowLogModal(false)}>닫기</button>
            </div>
            <form onSubmit={handleSubmitLog} className="space-y-3">
              <label>읽은 날짜<input type="date" value={readDate} onChange={(e) => setReadDate(e.target.value)} required /></label>
              <label>현재까지 읽은 누적 페이지수 (쪽)
                <input type="number" min="0" max={selectedBook.totalPages || 9999} value={readPages} onChange={(e) => setReadPages(Number(e.target.value))} required />
              </label>
              <label>간단한 감상 및 요약 메모<textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="오늘 읽은 분량의 생각이나 핵심을 자유롭게 적어보세요..."></textarea></label>
              <div className="text-right mt-4"><button type="submit">기록 저장 (노션 동기화)</button></div>
            </form>
          </div>
        </div>
      )}

      {/* 4. 문장 수집 모달 + 📷 사진 OCR */}
      {showInsightModal && selectedBook && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowInsightModal(false)}></div>
          <div className="modal-card">
            <div className="section-title-row">
              <div>
                <h2>{editingPageLogId ? '문장 수집 수정' : '인사이트(문장) 수집'}</h2>
                <p className="subtitle">{selectedBook.title}</p>
              </div>
              <button className="ghost-button" onClick={() => setShowInsightModal(false)}>닫기</button>
            </div>
            <form onSubmit={handleSubmitInsight} className="space-y-3">
              <label>해당 페이지 번호<input type="text" placeholder="예: 105" value={insightPage} onChange={(e) => setInsightPage(e.target.value)} required /></label>
              
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-amber-900">📷 책 페이지 또는 손글씨 사진 첨부 (AI 자동 추출)</span>
                <input type="file" accept="image/*" onChange={handleOcrImageUpload} className="text-xs" />
                {ocrLoading && <p className="text-xs text-amber-700 animate-pulse">🤖 Gemini AI가 사진 속 문장을 읽어내는 중입니다...</p>}
                {insightImageUrl && (
                  <div className="flex items-center gap-2 mt-2">
                    <img src={insightImageUrl} alt="미리보기" className="w-16 h-16 object-cover rounded border" />
                    <button type="button" className="ghost-button text-xs py-1 px-2" onClick={() => setInsightImageUrl('')}>사진 취소</button>
                  </div>
                )}
              </div>

              <label>발췌 문장 및 나의 생각
                <textarea rows={5} placeholder="문장을 직접 입력하거나 사진을 업로드해 텍스트를 추출하세요..." value={insightNotes} onChange={(e) => setInsightNotes(e.target.value)} required></textarea>
              </label>

              <div className="text-right mt-4"><button type="submit">인사이트 저장</button></div>
            </form>
          </div>
        </div>
      )}

      {/* 5. 도서 상세 기록 (통합 타임라인, AI 감상문, 나의 감상문) */}
      {showDetailModal && selectedBook && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowDetailModal(false)}></div>
          <div className="modal-card detail-modal-card">
            <div className="section-title-row">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2>도서 상세 기록</h2>
                  {checkIsOwner(selectedBook) ? (
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">✨ 내 서재</span>
                  ) : (
                    <span className="text-xs bg-stone-100 text-stone-600 font-medium px-2 py-0.5 rounded-full">🔒 {selectedBook.nickname}님의 서재 (읽기 전용)</span>
                  )}
                </div>
                <p className="subtitle font-bold text-amber-800">{selectedBook.title}</p>
              </div>
              <div className="flex items-center gap-2">
                {checkIsOwner(selectedBook) && (
                  <button
                    className="ghost-button text-xs"
                    onClick={() => {
                      setManualTitle(selectedBook.title);
                      setManualAuthor(selectedBook.author);
                      setManualPublisher(selectedBook.publisher);
                      setManualPages(selectedBook.totalPages);
                      setManualDesc(selectedBook.description);
                      setManualCover(selectedBook.coverUrl);
                      setShowEditBookModal(true);
                    }}
                  >
                    ⚙️ 도서 관리
                  </button>
                )}
                <button className="ghost-button" onClick={() => setShowDetailModal(false)}>닫기</button>
              </div>
            </div>

            <div className="detail-tabs">
              <button className={`tab-btn ${detailTab === 'timeline' ? 'active' : ''}`} onClick={() => setDetailTab('timeline')}>
                통합 타임라인 ({timelineItems.length})
              </button>
              <button className={`tab-btn ${detailTab === 'ai' ? 'active' : ''}`} onClick={() => setDetailTab('ai')}>
                ✨ AI 초안
              </button>
              <button className={`tab-btn ${detailTab === 'my' ? 'active' : ''}`} onClick={() => setDetailTab('my')}>
                ✍️ 나의 감상문
              </button>
            </div>

            {/* 타임라인 탭 */}
            {detailTab === 'timeline' && (
              <div>
                {checkIsOwner(selectedBook) ? (
                  <div className="flex gap-2 mb-4">
                    <button
                      className="flex-1 text-xs py-2"
                      onClick={() => {
                        setEditingLogId(null);
                        setReadPages(selectedBook.readPages || '');
                        setNote('');
                        setShowLogModal(true);
                      }}
                    >
                      + 진도 기록 추가
                    </button>
                    <button
                      className="flex-1 text-xs py-2 insight-btn"
                      onClick={() => {
                        setEditingPageLogId(null);
                        setInsightPage('');
                        setInsightNotes('');
                        setInsightImageUrl('');
                        setShowInsightModal(true);
                      }}
                    >
                      + 문장 수집 추가
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 mb-4 flex items-center gap-2">
                    <span>🔒</span>
                    <span>이 도서는 <strong>{selectedBook.nickname}</strong>님의 도서입니다. 타인의 도서에는 진도나 문장을 추가할 수 없으며, 열람 및 공감(❤️)만 가능합니다.</span>
                  </div>
                )}

                {timelineLoading ? (
                  <div className="text-center py-8 text-stone-500">노션에서 기록을 불러오는 중입니다...</div>
                ) : timelineItems.length === 0 ? (
                  <div className="text-center py-8 text-stone-500">
                    {checkIsOwner(selectedBook)
                      ? '아직 기록된 진도나 문장 수집이 없습니다. 상단의 [+ 진도 기록 추가] 또는 [+ 문장 수집 추가]를 눌러보세요!'
                      : '아직 등록된 진도나 문장 수집이 없습니다.'}
                  </div>
                ) : (
                  <div className="timeline-container">
                    {timelineItems.map((item) => {
                      const canDelete = checkIsOwner(selectedBook) || (nickname && item.nickname && nickname.trim() === item.nickname.trim());
                      return (
                        <div key={item.id} className={`timeline-item ${item.type === 'insight' ? 'insight-type' : ''}`}>
                          <div className="flex justify-between items-center text-xs text-stone-500 mb-1">
                            <span className="font-bold text-amber-900">
                              {item.type === 'log' ? `📅 [진도] ${item.date} (${item.page}쪽까지)` : `💡 [문장수집] ${item.date} (${item.page}쪽)`}
                            </span>
                            <div className="flex gap-2 items-center">
                              <span className="text-stone-400">by {item.nickname}</span>
                              {canDelete && (
                                <button
                                  className="text-stone-400 hover:text-red-600 bg-transparent border-0 p-0 text-xs"
                                  onClick={() => (item.type === 'log' ? handleDeleteLog(item.id) : handleDeleteInsight(item.id))}
                                >
                                  삭제
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap text-stone-800">{item.content}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* AI 감상문 탭 */}
            {detailTab === 'ai' && (
              <div>
                {checkIsOwner(selectedBook) ? (
                  <div className="ai-control-box">
                    <p>누적된 진도와 문장 기록들을 바탕으로 Gemini AI가 1인칭 독자의 독서 감상문 초안을 작성합니다.</p>
                    <button className="mt-3 w-full" onClick={handleGenerateAi} disabled={aiLoading}>
                      {aiLoading ? '🤖 Gemini가 감상문을 분석하고 작성 중입니다...' : '✨ Gemini 감상문 생성하기'}
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600 mb-3">
                    💡 도서 등록자(<strong>{selectedBook.nickname}</strong>님)만 AI 감상문을 생성 및 갱신할 수 있습니다.
                  </div>
                )}

                {aiReport ? (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-amber-900">생성된 AI 독후감</span>
                      <button
                        className="ghost-button text-xs py-1 px-2"
                        onClick={() => {
                          navigator.clipboard.writeText(aiReport);
                          alert('클립보드에 감상문이 복사되었습니다!');
                        }}
                      >
                        📋 초안 복사하기
                      </button>
                    </div>
                    <div className="ai-report-box">{aiReport}</div>
                  </div>
                ) : !checkIsOwner(selectedBook) ? (
                  <div className="text-center py-8 text-stone-500 text-sm">
                    아직 등록자({selectedBook.nickname}님)가 생성한 AI 감상문이 없습니다.
                  </div>
                ) : null}
              </div>
            )}

            {/* 나의 감상문 탭 */}
            {detailTab === 'my' && (
              <div className="space-y-3">
                {checkIsOwner(selectedBook) ? (
                  <>
                    <p className="text-xs text-stone-500">나만의 최종 감상문을 작성해 보세요. 저장 시 노션 도서 본문에 콜아웃 블록으로 박제됩니다.</p>
                    <textarea
                      rows={10}
                      placeholder="이 책을 읽고 느낀 나만의 생각을 자유롭게 적어주세요..."
                      value={myReport}
                      onChange={(e) => setMyReport(e.target.value)}
                    ></textarea>
                    <div className="text-right">
                      <button onClick={handleSaveMyReport} disabled={myReportSaving}>
                        {myReportSaving ? '노션으로 저장 중...' : '노션으로 내보내기 & 저장'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600 mb-3">
                      💡 <strong>{selectedBook.nickname}</strong>님이 작성한 최종 독서 감상문입니다. (읽기 전용)
                    </div>
                    {myReport ? (
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-stone-800 text-sm whitespace-pre-wrap leading-relaxed">
                        {myReport}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-stone-500 text-sm">
                        아직 등록자({selectedBook.nickname}님)가 작성한 감상문이 없습니다.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. 도서 수정/삭제 모달 */}
      {showEditBookModal && selectedBook && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowEditBookModal(false)}></div>
          <div className="modal-card">
            <div className="section-title-row">
              <div>
                <h2>도서 정보 관리 및 수정</h2>
                <p className="subtitle">{selectedBook.title}</p>
              </div>
              <button className="ghost-button" onClick={() => setShowEditBookModal(false)}>닫기</button>
            </div>
            <form onSubmit={handleUpdateBook} className="space-y-3">
              <label>도서명<input type="text" value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} required /></label>
              <label>저자<input type="text" value={manualAuthor} onChange={(e) => setManualAuthor(e.target.value)} /></label>
              <label>출판사<input type="text" value={manualPublisher} onChange={(e) => setManualPublisher(e.target.value)} /></label>
              <label>전체 페이지수<input type="number" min="0" value={manualPages} onChange={(e) => setManualPages(Number(e.target.value))} /></label>
              <label>표지 이미지 URL<input type="url" value={manualCover} onChange={(e) => setManualCover(e.target.value)} /></label>
              <label>책 소개<textarea rows={3} value={manualDesc} onChange={(e) => setManualDesc(e.target.value)}></textarea></label>
              
              <div className="flex justify-between items-center mt-5 pt-3 border-t">
                <button
                  type="button"
                  style={{ background: 'var(--danger)' }}
                  onClick={() => handleDeleteBook(selectedBook.bookId)}
                >
                  도서 삭제
                </button>
                <button type="submit">변경사항 저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. 설정 모달 (이미지 3 검색 API 설정 복원) */}
      {showSettingsModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowSettingsModal(false)}></div>
          <div className="modal-card space-y-4">
            <div className="section-title-row">
              <h2>⚙️ 설정</h2>
              <button className="ghost-button" onClick={() => setShowSettingsModal(false)}>닫기</button>
            </div>

            <label>🎨 앱 디자인 테마 선택
              <select value={theme} onChange={(e) => changeTheme(e.target.value)}>
                <option value="theme-base">오리지널 (따뜻한 베이지)</option>
                <option value="theme-notion">노션 스타일 (화이트 & 블루)</option>
                <option value="theme-dark">야간 모드 (다크 그레이)</option>
              </select>
            </label>

            {/* 🛠️ 도서 검색 API 설정 (이미지 3 원형 복원) */}
            <div className="pt-3 border-t">
              <h3 className="font-bold text-sm text-stone-800 mb-2">🛠️ 도서 검색 API 설정</h3>
              <label>검색 API 선택
                <select
                  value={searchApiType}
                  onChange={(e: any) => changeSearchApiType(e.target.value)}
                >
                  <option value="kakao">카카오 + 국립중앙도서관 (추천 / 쪽수 연동)</option>
                  <option value="aladin">알라딘 검색 (쪽수 자동 제공)</option>
                  <option value="naver">네이버 검색 (고화질 표지)</option>
                </select>
              </label>
              <p className="text-xs text-stone-500 mt-1">
                ※ 선택하신 API 키가 Vercel 환경변수 또는 로컬 환경변수에 등록되어 있어야 작동합니다.
              </p>
            </div>

            <div className="pt-3 border-t">
              <span className="text-xs font-bold text-stone-600 block mb-2">👤 현재 로그인 프로필</span>
              <div className="p-3 bg-amber-50 border rounded-xl flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm">{nickname}</p>
                  <p className="text-xs text-stone-500">PIN: {pin}</p>
                </div>
                <button className="ghost-button text-xs" onClick={() => { setShowSettingsModal(false); setShowLoginModal(true); }}>
                  프로필 변경
                </button>
              </div>
            </div>

            <div className="pt-3 border-t">
              <span className="text-xs font-bold text-amber-900 block mb-1">🔄 기존 데이터 사용자 관계형 자동 연결</span>
              <p className="text-xs text-stone-500 mb-3">
                과거 구글 시트/노션에 등록된 기존 도서와 일지의 닉네임을 읽어, 새 사용자 DB에 페이지를 만들고 관계형(Relation)으로 묶어줍니다.
              </p>
              <button className="w-full text-xs py-2 bg-stone-700" onClick={handleMigrateOldData}>
                기존 데이터 자동 마이그레이션 실행
              </button>
            </div>

            <div className="pt-4 border-t">
              <button
                type="button"
                className="w-full py-3 font-bold"
                onClick={() => {
                  localStorage.setItem('app_theme', theme);
                  localStorage.setItem('search_api_type', searchApiType);
                  alert('✅ 설정이 안전하게 저장되었습니다.');
                  setShowSettingsModal(false);
                }}
              >
                설정 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. 공식 사용법 가이드 모달 (Book Tuning Guide.html 원문 100% 반영) */}
      {showTutorialModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowTutorialModal(false)}></div>
          <div className="modal-card" style={{ maxWidth: '640px' }}>
            <div className="section-title-row">
              <div>
                <span className="text-xs bg-amber-800 text-white font-bold px-2 py-0.5 rounded-full inline-block mb-1">Book Tuning v4.3</span>
                <h2 style={{ color: 'var(--accent-dark)' }}>📚 북튜닝 (Book Tuning) 공식 사용자 가이드</h2>
              </div>
              <button className="ghost-button" onClick={() => setShowTutorialModal(false)}>닫기</button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 text-sm leading-relaxed text-stone-700">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <p>책을 읽고 기록하며 내 삶과 생각의 주파수를 맞춰가는 공간입니다.<br />독서 기록부터 AI 감상문 생성, 노션(Notion) 자동 백업까지의 상세 안내를 확인하세요.</p>
              </div>

              <div>
                <h3 className="font-bold text-base text-amber-900 border-l-4 border-amber-800 pl-2 mb-2">🤝 1. 시작하기 (온보딩 및 멤버 참여)</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>서재 입장하기:</strong> 활동할 닉네임과 4자리 비밀번호(PIN)를 입력하고 입장합니다. 동명이인이 있더라도 고유 노션 사용자 페이지와 안전하게 관계형으로 연결됩니다.</li>
                  <li><strong>다중 사용자 서재:</strong> [내 서재]에서는 내가 읽는 책들을, [커뮤니티 전체]에서는 모임원들이 함께 기록 중인 서재를 둘러볼 수 있습니다.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-base text-amber-900 border-l-4 border-amber-800 pl-2 mb-2">🔍 2. 도서 검색 및 스마트 API 연동</h3>
                <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-1 mb-2">
                  <h4 className="font-bold text-amber-800">💡 카카오 + 국립중앙도서관 API (추천 하이브리드 모드)</h4>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li><strong>작동 원리:</strong> 카카오 Book API를 이용해 도서 제목, 저자, 출판사, 표지, 책 소개를 실시간으로 검색하고, 카카오에서 제공하지 않는 <b>전체 쪽수</b>는 ISBN을 바탕으로 <b>국립중앙도서관 서지정보 API</b>에서 자동으로 보완하여 불러옵니다.</li>
                    <li><strong>알라딘 & 네이버 검색:</strong> [⚙️ 설정] 메뉴에서 알라딘 TTB 검색(쪽수 자동 지원) 또는 네이버 도서 검색으로 자유롭게 전환하여 사용할 수 있습니다.</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-base text-amber-900 border-l-4 border-amber-800 pl-2 mb-2">📝 3. 독서 기록하기 & 타임라인 (v4.3 신기능)</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>📅 진도 기록:</strong> 읽은 날짜, 현재까지 누적해서 읽은 페이지 수, 간단한 소감을 남깁니다.</li>
                  <li><strong>💡 인사이트 (문장 수집 & 사진 OCR):</strong>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                      <li>감명 깊었던 특정 페이지 번호와 발췌 문장, 나의 생각을 기록합니다.</li>
                      <li><strong>📷 사진 첨부 & AI OCR:</strong> 책 본문이나 손글씨 필기 노트를 사진 찍어 올리면, <b>Google Gemini AI</b>가 이미지 속 글자를 자동으로 판독하여 입력창에 넣어줍니다.</li>
                      <li><strong>노션 본문 사진 첨부:</strong> 사진이 첨부된 문장수집은 노션 DB 동기화 시 해당 페이지의 <b>본문 이미지 블록</b>으로 자동 삽입됩니다.</li>
                    </ul>
                  </li>
                  <li><strong>📈 스마트 진도율 계산:</strong> 진도기록에 입력한 페이지와 문장수집에 적은 페이지 중 <b>더 큰 쪽수(최댓값)를 기준으로 진도율이 자동 연산</b>되어 프로그레스 바와 랭킹에 즉시 반영됩니다.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-base text-amber-900 border-l-4 border-amber-800 pl-2 mb-2">🤖 4. Gemini AI 감상문 & 노션(Notion) 동기화</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>✨ Gemini AI 1인칭 감상문:</strong> 도서 상세 화면의 [✨ AI 초안] 탭에서 누적된 진도 일지와 문장들을 분석하여 1인칭 독자 어조의 깊이 있는 감상문 초안을 5~10초 만에 작성해 줍니다.</li>
                  <li><strong>✍️ 나의 감상문 백업:</strong> 직접 작성한 최종 감상문을 입력하고 <b>[노션으로 내보내기 & 저장]</b>을 클릭하면, 내 노션 데이터베이스 페이지 내에 실시간 블록으로 안전하게 영구 저장됩니다.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-base text-amber-900 border-l-4 border-amber-800 pl-2 mb-2">🏆 5. 커뮤니티, 공감 & 랭킹보드</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>❤️ 공감 (좋아요):</strong> 모임원이 독서 중인 책에 하트를 눌러 응원 메시지를 전달해 보세요.</li>
                  <li><strong>🏆 독서 랭킹보드:</strong> 모임 내에서 누가 가장 많은 페이지를 읽었는지 실시간 독서량 랭킹을 확인할 수 있습니다.</li>
                </ul>
              </div>
            </div>

            <div className="text-right pt-3 border-t mt-4">
              <button onClick={() => setShowTutorialModal(false)}>가이드 닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* 9. 개발로그 모달 (backup Index.html 개발로그 원문 100% 반영) */}
      {showDevLogModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowDevLogModal(false)}></div>
          <div className="modal-card" style={{ maxWidth: '600px' }}>
            <div className="section-title-row">
              <div><h2 style={{ color: 'var(--accent-dark)' }}>📝 개발 로그 (Release Notes)</h2></div>
              <button className="ghost-button" onClick={() => setShowDevLogModal(false)}>닫기</button>
            </div>
            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2 text-xs leading-relaxed text-stone-700">
              <div className="border-b pb-3">
                <h4 className="font-bold text-sm text-amber-900 mb-1">v4.3 (현재 버전 - 노션 단독 백엔드 완전 이관)</h4>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li>구글 시트를 완전히 제거하고 노션 데이터베이스 4종(도서, 독서일지, 문장수집, 사용자)을 단독 Primary DB로 완전 이관</li>
                  <li>사용자 DB 신설 및 관계형(Relation) 연결을 통한 동명이인 식별 보장</li>
                  <li>도서 검색 API 선택 기능 복원 (카카오+국립중앙도서관, 알라딘, 네이버 자유 선택)</li>
                  <li>푸터에 '노션 데이터베이스 열기 ↗' 바로가기 알약 버튼 복원</li>
                  <li>브라우저 탭 파비콘, 앱 로고 아이콘 및 모바일 홈 화면 추가(PWA) 지원</li>
                </ul>
              </div>

              <div className="border-b pb-3">
                <h4 className="font-bold text-sm text-stone-800 mb-1">v4.2</h4>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li>문장수집(인사이트) 페이지 번호를 진도율 계산에 통합 반영 (진도기록과 문장수집 중 더 큰 쪽수 기준 자동 계산)</li>
                  <li>문장수집 시 도서 본문 및 손글씨 메모 사진 첨부(업로드) 기능 추가</li>
                  <li>Google Gemini AI 기반 실시간 OCR(문자 인식) 텍스트 자동 추출 및 손쉬운 편집 기능 지원</li>
                  <li>노션(Notion) 문장수집 데이터베이스 동기화 시 업로드된 사진을 페이지 본문 이미지 블록으로 자동 첨부</li>
                </ul>
              </div>

              <div className="border-b pb-3">
                <h4 className="font-bold text-sm text-stone-800 mb-1">v4.1</h4>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li>카카오(Kakao) 도서 검색 API 연동 추가</li>
                  <li>신규 사용자를 위한 슬라이드형 튜토리얼(온보딩) 가이드 도입</li>
                  <li>설정창 내 각종 API 키(도서검색, Gemini, Notion) 발급 안내 링크 추가</li>
                  <li>마스터 전용 노션 템플릿 배포 및 관리자 복제 기능 추가</li>
                  <li>모임 개설 시 비밀번호 인증 로직 및 커스텀 알림창 UI 개선</li>
                </ul>
              </div>

              <div className="border-b pb-3">
                <h4 className="font-bold text-sm text-stone-800 mb-1">v4.0</h4>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li>SaaS형 다중 그룹 아키텍처 도입 (개별 구글 시트 독립 연동)</li>
                  <li>상황별 동적 로딩 메시지 및 노션 하이퍼링크 기능 통합 적용</li>
                </ul>
              </div>

              <div className="border-b pb-3">
                <h4 className="font-bold text-sm text-stone-800 mb-1">v3.2</h4>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li>알라딘 / 네이버 도서 검색 API 자유 선택(스위칭) 기능 추가</li>
                  <li>사용자 취향에 맞춰 '자동 쪽수(알라딘)' 또는 '고화질 표지(네이버)' 선택 가능</li>
                </ul>
              </div>

              <div className="border-b pb-3">
                <h4 className="font-bold text-sm text-stone-800 mb-1">v3.1</h4>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li>문장 수집용 노션 독립 데이터베이스 연동 기능 추가</li>
                  <li>모달 창 겹침(z-index) 및 뒤로 숨는 UI 버그 수정</li>
                  <li>스크립트 오타(수정 버튼 비활성화) 및 독서일지 규격 오류 해결</li>
                  <li>개발 로그(Release Notes) 확인 기능 신설</li>
                </ul>
              </div>

              <div className="border-b pb-3">
                <h4 className="font-bold text-sm text-stone-800 mb-1">v3.0</h4>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li>도서 검색 API 전면 교체 (알라딘 방화벽 ➔ 카카오 ➔ 네이버 API 정착)</li>
                  <li>동일 도서 다중 등록 허용 (ISBN + 닉네임 동시 식별 로직 추가)</li>
                  <li>노션 동기화 시 커버 이미지 화질 개선 및 속성(체크박스) 자동화</li>
                </ul>
              </div>

              <div className="border-b pb-3">
                <h4 className="font-bold text-sm text-stone-800 mb-1">v2.5</h4>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li>커뮤니티 기능 추가 (다중 접속 및 타인 기록 열람 허용)</li>
                  <li>랭킹보드 신설 및 도서 공감(좋아요) 기능 도입</li>
                  <li>내 서재 / 커뮤니티 전체 서재 탭 분리</li>
                </ul>
              </div>

              <div className="border-b pb-3">
                <h4 className="font-bold text-sm text-stone-800 mb-1">v2.0</h4>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li>Notion API 연동 (도서 DB 및 독서일지 DB 자동 동기화 구축)</li>
                  <li>앱 내 기록 시 노션 페이지 내 실시간 블록 생성 기능 추가</li>
                </ul>
              </div>

              <div className="border-b pb-3">
                <h4 className="font-bold text-sm text-stone-800 mb-1">v1.5</h4>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li>Gemini AI API 도입</li>
                  <li>누적된 진도 및 문장 수집 데이터를 바탕으로 한 AI 1인칭 자동 감상문 초안 생성 기능 추가</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-sm text-stone-800 mb-1">v1.0</h4>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li>구글 앱스 스크립트(GAS) 기반 독서기록 웹앱 초기 버전 출시</li>
                  <li>알라딘 API 연동 도서 검색 및 기본 기록 구글 시트 저장 기능 구현</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. 개인정보처리방침 모달 (backup Index.html 원문 1~8조항 100% 반영) */}
      {showPrivacyModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowPrivacyModal(false)}></div>
          <div className="modal-card" style={{ maxWidth: '580px' }}>
            <div className="section-title-row">
              <div><h2 style={{ color: 'var(--accent-dark)' }}>🛡️ 개인정보처리방침</h2></div>
              <button className="ghost-button" onClick={() => setShowPrivacyModal(false)}>닫기</button>
            </div>
            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-2 text-xs leading-relaxed text-stone-700">
              <p><strong>1. 수집하는 개인정보 항목 및 수집 방법</strong><br />본 앱은 서비스 제공을 위해 최소한의 개인정보인 '닉네임' 및 '독서 기록(진도, 감상문, 인사이트)'을 수집합니다. 닉네임은 가명 사용을 권장합니다.</p>
              <p><strong>2. 개인정보의 수집 및 이용 목적</strong><br />수집된 정보는 모임 내에서 개인의 독서 기록을 식별하고, AI(Gemini)를 통한 맞춤형 독서 감상문 초안 작성을 위해 이용됩니다.</p>
              <p><strong>3. 개인정보의 보유 및 이용 기간</strong><br />사용자의 개인정보는 모임 운영 기간 동안 또는 사용자가 삭제를 요청할 때까지 보관됩니다. 불필요해진 정보는 즉시 파기합니다.</p>
              <p><strong>4. 제3자 제공 및 취급 위탁</strong><br />사용자가 작성한 기록은 AI 감상문 작성을 위해 'Google Gemini API'에 제공되며, 데이터 영구 저장을 위해 'Notion API'에 기록됩니다. 수탁자는 해당 목적 외에는 정보를 사용하지 않습니다.</p>
              <p><strong>5. 정보주체의 권리 및 행사 방법 (열람, 정정, 삭제)</strong><br />사용자는 앱 내 기능(삭제 버튼 등)을 이용하여 본인의 기록을 언제든지 확인, 수정, 삭제할 수 있습니다.</p>
              <p><strong>6. 아동 개인정보 보호</strong><br />본 앱은 학생 등 아동의 개인정보를 수집할 때 법정대리인의 동의 절차나 가명 처리를 통해 보호 조치를 다합니다.</p>
              <p><strong>7. 개인정보 보호책임자</strong><br />해당 모임의 마스터 관리자(선생님)가 보호책임자 역할을 수행하며, 문의 사항은 앱 내 '지원/문의' 게시판을 통해 접수합니다.</p>
              <p><strong>8. 개인정보의 안전성 확보 조치</strong><br />앱 접근을 위한 고유 승인 코드 시스템 등을 통해 비인가자의 접근을 차단하여 안전하게 관리합니다.</p>
            </div>
          </div>
        </div>
      )}

      {/* 11. 저작권 및 이용 안내 모달 (backup Index.html 원문 1~4항 100% 반영) */}
      {showCopyrightModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowCopyrightModal(false)}></div>
          <div className="modal-card" style={{ maxWidth: '560px' }}>
            <div className="section-title-row">
              <div><h2 style={{ color: 'var(--accent-dark)' }}>⚖️ 저작권 및 이용 안내</h2></div>
              <button className="ghost-button" onClick={() => setShowCopyrightModal(false)}>닫기</button>
            </div>
            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-2 text-xs leading-relaxed text-stone-700">
              <p><strong>1. 권리자 (소유권)</strong><br />본 앱의 기획, 화면 설계 및 핵심 프롬프트(비법) 구조에 대한 모든 권리는 '기록조율사 서울외고 조용희 선생님'에게 있습니다.</p>
              <p><strong>2. 이용 허락 범위</strong><br />누구나 접속하여 이용할 수 있으나, 그룹 개설은 교사만 가능합니다. 앱 코드를 참고하는 것은 가능하지만, 무단으로 복제하여 재배포하거나 동일한 서비스를 상업적으로 운영하는 것은 금지됩니다.</p>
              <p><strong>3. AI 학습 및 크롤링 제한</strong><br />권리자의 사전 허락 없이 본 앱의 소스 코드나 핵심 로직을 AI 모델 학습(Training)에 무단으로 사용하는 것을 제한합니다.</p>
              <p><strong>4. 외부 API 라이선스 준수</strong><br />본 앱은 네이버, 알라딘, 카카오 API 등을 비상업적·교육적 목적으로 안전하게 이용하고 있습니다.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
