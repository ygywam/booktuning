'use client';

import React, { useState, useEffect } from 'react';
import { Book, TimelineItem, User } from '../lib/types';

export default function Home() {
  // 1. 유저 및 세션 상태
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState('기록조율사');
  const [pin, setPin] = useState('0000');
  const [theme, setTheme] = useState('theme-base');

  // 2. 도서 서재 상태
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'all' | 'rank'>('my');
  const [statusFilter, setStatusFilter] = useState<'all' | 'reading' | 'done'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'progress' | 'title' | 'likes'>('latest');

  // 3. 도서 검색 상태
  const [searchQuery, setSearchQuery] = useState('');
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
  // 진도 기록 폼
  const [readDate, setReadDate] = useState('');
  const [readPages, setReadPages] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  // 문장 수집 폼
  const [insightPage, setInsightPage] = useState('');
  const [insightNotes, setInsightNotes] = useState('');
  const [insightImageUrl, setInsightImageUrl] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [editingPageLogId, setEditingPageLogId] = useState<string | null>(null);

  // 도서 직접 등록/수정 폼
  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthor, setManualAuthor] = useState('');
  const [manualPublisher, setManualPublisher] = useState('');
  const [manualPages, setManualPages] = useState<number | ''>('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualCover, setManualCover] = useState('');

  // 튜토리얼 스텝
  const [tutorialStep, setTutorialStep] = useState(0);

  // 7. 초기화 로드
  useEffect(() => {
    // 테마 복원
    const savedTheme = localStorage.getItem('app_theme') || 'theme-base';
    setTheme(savedTheme);
    document.body.className = savedTheme;

    // 오늘 날짜 설정
    const today = new Date().toISOString().split('T')[0];
    setReadDate(today);

    // 저장된 유저 세션 확인
    const savedUserStr = localStorage.getItem('app_user');
    if (savedUserStr) {
      try {
        const parsed = JSON.parse(savedUserStr);
        setUser(parsed);
        setNickname(parsed.nickname);
        setPin(parsed.pin || '0000');
      } catch (e) {
        setNickname('기록조율사');
      }
    } else {
      // 최초 방문 시 로그인 모달 권장
      setShowLoginModal(true);
    }

    fetchBooks();
  }, []);

  // 테마 변경
  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    document.body.className = newTheme;
    localStorage.setItem('app_theme', newTheme);
  };

  // 도서 목록 불러오기
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
        alert(`반갑습니다, ${data.user.nickname}님! 북튜닝 서재에 오신 것을 환영합니다. 📚`);
        fetchBooks();
      } else {
        alert(data.error || '로그인에 실패했습니다.');
      }
    } catch (err) {
      alert('로그인 통신 중 오류가 발생했습니다.');
    }
  };

  // 9. 도서 검색
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/search-books?query=${encodeURIComponent(searchQuery)}`);
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

  // 검색된 도서 등록
  const handleRegisterBook = async (book: any) => {
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...book,
          nickname,
          userId: user?.id,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        alert(`[${book.title}] 도서가 서재에 등록되었습니다! ✨`);
        setSearchResults([]);
        setSearchQuery('');
        fetchBooks();
      } else {
        alert(`등록 실패: ${data.error}`);
      }
    } catch (err) {
      alert('도서 등록 중 오류가 발생했습니다.');
    }
  };

  // 도서 직접(수동) 등록 제출
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
          description: manualDesc.trim() || '직접 등록한 도서입니다.',
          coverUrl: manualCover.trim(),
          nickname,
          userId: user?.id,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        alert('도서가 성공적으로 등록되었습니다!');
        setShowManualBookModal(false);
        setManualTitle('');
        setManualAuthor('');
        setManualPublisher('');
        setManualPages('');
        setManualDesc('');
        setManualCover('');
        fetchBooks();
      } else {
        alert(`등록 실패: ${data.error}`);
      }
    } catch (err) {
      alert('도서 수동 등록 실패');
    }
  };

  // 도서 수정 제출
  const handleUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;

    try {
      const res = await fetch('/api/books', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: selectedBook.bookId,
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
        alert('도서 정보가 수정되었습니다!');
        setShowEditBookModal(false);
        fetchBooks();
      } else {
        alert(`수정 실패: ${data.error}`);
      }
    } catch (err) {
      alert('도서 수정 오류 발생');
    }
  };

  // 도서 삭제
  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('정말 이 책을 서재에서 삭제(아카이브)하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/books?bookId=${bookId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        alert('도서가 삭제되었습니다.');
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

    try {
      if (editingLogId) {
        // 수정
        const res = await fetch('/api/logs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logId: editingLogId,
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
        // 등록
        const res = await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookNotionPageId: selectedBook.bookId,
            readDate,
            readPages: Number(readPages),
            note,
            nickname,
            userId: user?.id,
          }),
        });
        const data = await res.json();
        if (data.ok) {
          alert('오늘의 독서 진도가 노션에 기록되었습니다! 📖');
          setShowLogModal(false);
          setNote('');
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

    try {
      if (editingPageLogId) {
        // 수정
        const res = await fetch('/api/insights', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageLogId: editingPageLogId,
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
        // 등록
        const res = await fetch('/api/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookNotionPageId: selectedBook.bookId,
            page: insightPage,
            notes: insightNotes,
            imageUrl: insightImageUrl,
            nickname,
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

  // 타임라인 내 진도일지 삭제
  const handleDeleteLog = async (logId: string) => {
    if (!confirm('이 진도 기록을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/logs?logId=${logId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        if (selectedBook) fetchTimeline(selectedBook.bookId);
        fetchBooks();
      }
    } catch (err) {
      alert('삭제 실패');
    }
  };

  // 타임라인 내 문장수집 삭제
  const handleDeleteInsight = async (pageLogId: string) => {
    if (!confirm('이 문장 수집 기록을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/insights?pageLogId=${pageLogId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        if (selectedBook) fetchTimeline(selectedBook.bookId);
        fetchBooks();
      }
    } catch (err) {
      alert('삭제 실패');
    }
  };

  // 14. Gemini AI 독서 감상문 생성
  const handleGenerateAi = async () => {
    if (!selectedBook) return;
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

  // 나의 독서 감상문 노션 저장
  const handleSaveMyReport = async () => {
    if (!selectedBook || !myReport.trim()) return alert('감상문 내용을 작성해 주세요.');
    setMyReportSaving(true);
    try {
      const res = await fetch('/api/my-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: selectedBook.bookId,
          text: myReport,
          nickname,
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
      if (activeTab === 'my' && b.nickname !== nickname) return false;
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
  const rankingList = React.useMemo(() => {
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
      {/* 1. 상단 헤더 */}
      <header className="app-header">
        <div>
          <p className="eyebrow">{nickname}님의 독서기록 v4.2 👑</p>
          <h1>북튜닝 (Book Tuning)</h1>
          <p className="subtitle">책을 읽고 기록하며 내 삶과 생각의 주파수를 맞춰가는 공간입니다.</p>
        </div>
        <div className="header-nav-row">
          <button
            className="ghost-button"
            style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
            onClick={() => {
              setTutorialStep(0);
              setShowTutorialModal(true);
            }}
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
            <p className="subtitle">도서명 또는 ISBN 바코드를 입력해 책 정보를 불러옵니다. (국립중앙도서관 쪽수 자동 파싱 연동)</p>
          </div>
          <button
            className="ghost-button"
            style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
            onClick={() => {
              setManualTitle('');
              setManualAuthor('');
              setManualPublisher('');
              setManualPages('');
              setManualDesc('');
              setManualCover('');
              setShowManualBookModal(true);
            }}
          >
            ✍️ 직접 등록
          </button>
        </div>

        <div className="search-row">
          <input
            type="text"
            placeholder="예: 나의 돈키호테 또는 979..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} disabled={searching}>
            {searching ? '검색 중...' : '검색'}
          </button>
        </div>

        {/* 검색 결과 목록 */}
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
                    {book.totalPages > 0 ? `📖 총 ${book.totalPages}쪽 (NL 인증)` : '📄 쪽수 미정 (직접 입력 가능)'}
                  </p>
                </div>
                <button className="text-xs py-2 px-3" onClick={() => handleRegisterBook(book)}>
                  선택 등록
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
          <button className={`lib-tab-btn ${activeTab === 'my' ? 'active' : ''}`} onClick={() => setActiveTab('my')}>
            내 서재 ({books.filter((b) => b.nickname === nickname).length})
          </button>
          <button className={`lib-tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
            커뮤니티 전체 ({books.length})
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
            조건과 일치하는 도서가 없습니다. 상단에서 도서를 검색해 추가해 보세요!
          </div>
        ) : (
          <div className="book-gallery">
            {filteredBooks.map((book) => {
              const hasLiked = book.likedUsers?.includes(nickname);
              return (
                <article key={book.bookId} className="book-card">
                  <div className="cover-wrap" onClick={() => openDetail(book)}>
                    <div className="cover-badge">기록보기</div>
                    <div className="author-badge">{book.nickname || '익명'}</div>
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
                    </div>

                    <div className="card-actions">
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
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. 푸터 */}
      <footer className="app-footer">
        <p>Made with ❤️ by <strong>기록조율사 조용희</strong> <a href="https://www.instagram.com/record_tuner/" target="_blank">@record_tuner</a></p>
        <p style={{ marginTop: '8px' }}>
          <a href="#" onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }} style={{ fontSize: '12px', marginRight: '12px' }}>개인정보처리방침</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setShowCopyrightModal(true); }} style={{ fontSize: '12px', marginRight: '12px' }}>저작권 및 오픈소스 안내</a>
          <a href="#" onClick={(e) => { e.preventDefault(); alert('노션 백엔드와 안전하게 실시간 동기화되고 있습니다.'); }} style={{ fontSize: '12px' }}>서버 상태: 정상 🟢</a>
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
                  placeholder="예: 기록조율사, 북튜너..."
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                />
              </label>
              <label>4자리 비밀번호 (PIN)
                <input
                  type="password"
                  maxLength={4}
                  placeholder="예: 1234 (동명이인 방지 및 본인 인증)"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required
                />
              </label>
              <p className="text-xs text-stone-500">
                ※ 새로운 닉네임이면 노션 사용자 DB에 자동으로 새 사용자 페이지가 생성되어 개인 독서 기록이 연결됩니다.
              </p>
              <div className="text-right mt-4">
                <button type="submit" className="w-full py-3">서재 입장하기</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. 도서 직접 등록 모달 */}
      {showManualBookModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowManualBookModal(false)}></div>
          <div className="modal-card">
            <div className="section-title-row">
              <div>
                <h2>도서 직접 수동 등록</h2>
                <p className="subtitle">검색되지 않는 독립출판물이나 전자책을 직접 등록합니다.</p>
              </div>
              <button className="ghost-button" onClick={() => setShowManualBookModal(false)}>닫기</button>
            </div>
            <form onSubmit={handleSubmitManualBook} className="space-y-3">
              <label>도서명 (필수)<input type="text" value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} required /></label>
              <label>저자<input type="text" value={manualAuthor} onChange={(e) => setManualAuthor(e.target.value)} /></label>
              <label>출판사<input type="text" value={manualPublisher} onChange={(e) => setManualPublisher(e.target.value)} /></label>
              <label>전체 페이지수<input type="number" min="0" value={manualPages} onChange={(e) => setManualPages(Number(e.target.value))} placeholder="예: 320" /></label>
              <label>표지 이미지 URL (선택)<input type="url" value={manualCover} onChange={(e) => setManualCover(e.target.value)} placeholder="https://..." /></label>
              <label>책 소개<textarea rows={3} value={manualDesc} onChange={(e) => setManualDesc(e.target.value)}></textarea></label>
              <div className="text-right mt-4"><button type="submit">서재에 등록하기</button></div>
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
                <h2>도서 상세 기록</h2>
                <p className="subtitle font-bold text-amber-800">{selectedBook.title}</p>
              </div>
              <button className="ghost-button" onClick={() => setShowDetailModal(false)}>닫기</button>
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
                {timelineLoading ? (
                  <div className="text-center py-8 text-stone-500">노션에서 기록을 불러오는 중입니다...</div>
                ) : timelineItems.length === 0 ? (
                  <div className="text-center py-8 text-stone-500">
                    아직 기록된 진도나 문장 수집이 없습니다. 하단의 [진도 기록], [문장 수집]을 눌러보세요!
                  </div>
                ) : (
                  <div className="timeline-container">
                    {timelineItems.map((item) => (
                      <div key={item.id} className={`timeline-item ${item.type === 'insight' ? 'insight-type' : ''}`}>
                        <div className="flex justify-between items-center text-xs text-stone-500 mb-1">
                          <span className="font-bold text-amber-900">
                            {item.type === 'log' ? `📅 [진도] ${item.date} (${item.page}쪽까지)` : `💡 [문장수집] ${item.date} (${item.page}쪽)`}
                          </span>
                          <div className="flex gap-2 items-center">
                            <span className="text-stone-400">by {item.nickname}</span>
                            <button
                              className="text-stone-400 hover:text-red-600 bg-transparent border-0 p-0 text-xs"
                              onClick={() => (item.type === 'log' ? handleDeleteLog(item.id) : handleDeleteInsight(item.id))}
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-stone-800">{item.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI 감상문 탭 */}
            {detailTab === 'ai' && (
              <div>
                <div className="ai-control-box">
                  <p>누적된 진도와 문장 기록들을 바탕으로 Gemini AI가 1인칭 독자의 독서 감상문 초안을 작성합니다.</p>
                  <button className="mt-3 w-full" onClick={handleGenerateAi} disabled={aiLoading}>
                    {aiLoading ? '🤖 Gemini가 감상문을 분석하고 작성 중입니다...' : '✨ Gemini 감상문 생성하기'}
                  </button>
                </div>
                {aiReport && (
                  <div>
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
                )}
              </div>
            )}

            {/* 나의 감상문 탭 */}
            {detailTab === 'my' && (
              <div className="space-y-3">
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

      {/* 7. 설정 모달 */}
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
          </div>
        </div>
      )}

      {/* 8. 사용법 가이드 튜토리얼 모달 */}
      {showTutorialModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowTutorialModal(false)}></div>
          <div className="modal-card">
            <div className="section-title-row">
              <h2>📖 북튜닝 5단계 가이드</h2>
              <button className="ghost-button" onClick={() => setShowTutorialModal(false)}>닫기</button>
            </div>

            {tutorialStep === 0 && (
              <div className="tutorial-slide active space-y-2">
                <h3 className="font-bold text-amber-900 text-base">🤝 1. 프로필 로그인 및 멤버 참여</h3>
                <p className="text-sm leading-relaxed text-stone-600">
                  활동할 닉네임과 4자리 비밀번호(PIN)를 입력하고 서재에 입장하세요. 동명이인이 있더라도 본인의 고유 노션 사용자 페이지와 안전하게 관계형으로 연결됩니다.
                </p>
              </div>
            )}

            {tutorialStep === 1 && (
              <div className="tutorial-slide active space-y-2">
                <h3 className="font-bold text-amber-900 text-base">🔍 2. 도서 검색 및 내 서재 등록</h3>
                <p className="text-sm leading-relaxed text-stone-600">
                  상단 검색창에 도서명이나 ISBN을 입력하세요. 국립중앙도서관 서지정보 API와 연동되어 정확한 총 쪽수가 자동으로 파싱됩니다. 검색되지 않는 책은 [직접 등록]할 수도 있습니다.
                </p>
              </div>
            )}

            {tutorialStep === 2 && (
              <div className="tutorial-slide active space-y-2">
                <h3 className="font-bold text-amber-900 text-base">✍️ 3. 진도 기록 & 📷 문장 사진 OCR</h3>
                <p className="text-sm leading-relaxed text-stone-600">
                  책 카드의 [진도 기록]으로 누적 쪽수를 기록하면 진도율(%)이 올라갑니다. [문장 수집]에서는 책 페이지나 손글씨 사진을 올리면 Gemini AI가 문장을 읽어내 자동으로 입력해 줍니다.
                </p>
              </div>
            )}

            {tutorialStep === 3 && (
              <div className="tutorial-slide active space-y-2">
                <h3 className="font-bold text-amber-900 text-base">✨ 4. 통합 타임라인 & Gemini AI 독후감</h3>
                <p className="text-sm leading-relaxed text-stone-600">
                  책 표지를 누르면 지금까지의 독서 일지와 문장이 날짜순으로 정렬된 타임라인으로 펼쳐집니다. [✨ AI 초안] 탭을 누르면 내가 남긴 기록들을 융합해 AI 감상문을 써주고 노션 본문에 박제해 줍니다.
                </p>
              </div>
            )}

            {tutorialStep === 4 && (
              <div className="tutorial-slide active space-y-2">
                <h3 className="font-bold text-amber-900 text-base">🏆 5. 랭킹보드 & 노션 자체 포트폴리오</h3>
                <p className="text-sm leading-relaxed text-stone-600">
                  랭킹보드에서 모임원들의 완독 권수와 누적 읽은 페이지 수를 확인할 수 있습니다. 노션 앱을 열면 나만의 독서 대시보드가 관계형으로 완벽히 구축되어 있습니다.
                </p>
              </div>
            )}

            <div className="tutorial-dots">
              {[0, 1, 2, 3, 4].map((idx) => (
                <div
                  key={idx}
                  className={`tutorial-dot ${tutorialStep === idx ? 'active' : ''}`}
                  onClick={() => setTutorialStep(idx)}
                ></div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t">
              <button
                className="ghost-button text-xs"
                style={{ visibility: tutorialStep === 0 ? 'hidden' : 'visible' }}
                onClick={() => setTutorialStep((prev) => Math.max(0, prev - 1))}
              >
                이전
              </button>
              {tutorialStep < 4 ? (
                <button className="text-xs" onClick={() => setTutorialStep((prev) => Math.min(4, prev + 1))}>
                  다음 가이드 보기
                </button>
              ) : (
                <button className="text-xs" onClick={() => setShowTutorialModal(false)}>
                  시작하기! 🚀
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 9. 개발로그 모달 */}
      {showDevLogModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowDevLogModal(false)}></div>
          <div className="modal-card">
            <div className="section-title-row">
              <h2>📝 개발 로그</h2>
              <button className="ghost-button" onClick={() => setShowDevLogModal(false)}>닫기</button>
            </div>
            <div className="text-xs space-y-3 leading-relaxed text-stone-700">
              <p><b>v4.2.0 (Notion 단독 백엔드 완전 이관)</b>: 구글 시트를 완전히 제거하고 노션 데이터베이스 4종(도서, 독서일지, 문장수집, 사용자)을 직접 백엔드로 사용하는 Next.js 풀스택 앱 구축 완료.</p>
              <p>• 사용자 DB 신설 및 Relation 연결을 통한 동명이인 식별 보장</p>
              <p>• 진도율(%) 및 최근 쪽수 실시간 롤업 계산 엔진 탑재</p>
              <p>• 국립중앙도서관(NL) 서지정보 API 연동으로 정확한 전체 페이지수 자동 파싱</p>
              <p>• Gemini 2.5 Flash 기반 Vision OCR 및 1인칭 독서 감상문 초안 생성</p>
            </div>
          </div>
        </div>
      )}

      {/* 10. 개인정보처리방침 모달 */}
      {showPrivacyModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowPrivacyModal(false)}></div>
          <div className="modal-card">
            <div className="section-title-row">
              <h2>🛡️ 개인정보처리방침</h2>
              <button className="ghost-button" onClick={() => setShowPrivacyModal(false)}>닫기</button>
            </div>
            <p className="text-xs leading-relaxed text-stone-600">
              본 서비스는 주민등록번호, 연락처 등의 민감한 개인정보를 일절 수집하지 않으며, 사용자가 입력한 활동 닉네임과 PIN 번호, 독서 기록은 안전하게 사용자의 노션 데이터베이스로 직접 저장·관리됩니다.
            </p>
          </div>
        </div>
      )}

      {/* 11. 저작권 모달 */}
      {showCopyrightModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowCopyrightModal(false)}></div>
          <div className="modal-card">
            <div className="section-title-row">
              <h2>⚖️ 저작권 및 이용 안내</h2>
              <button className="ghost-button" onClick={() => setShowCopyrightModal(false)}>닫기</button>
            </div>
            <p className="text-xs leading-relaxed text-stone-600">
              본 웹앱의 기획 및 디자인 저작권은 '기록조율사 조용희' 선생님에게 있으며, 오픈소스 MIT 라이선스에 따라 누구나 자유롭게 복제하여 개인 및 독서 모임용으로 배포해 사용할 수 있습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
