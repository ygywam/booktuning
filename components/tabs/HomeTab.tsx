'use client';

import React, { useMemo, useState } from 'react';
import { Book, InsightLog, ReadingLog } from '@/lib/types';

interface HomeTabProps {
  books: Book[];
  myBooks: Book[];
  logs: ReadingLog[];
  insights: InsightLog[];
  loading: boolean;
  currentUserNickname: string;
  // 검색 상태
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searching: boolean;
  searchResults: any[];
  onClearSearchResults: () => void;
  searchApiType: 'aladin' | 'kakao' | 'naver';
  onSearch: () => void;
  onSelectSearchResult: (book: any) => void;
  onOpenManualBook: () => void;
  // 인터랙션
  onSelectBook: (book: Book) => void;
  onGoToFeed: () => void;
  onGoToLibrary: () => void;
}

const SEGMENT_COUNT = 24;

/** 다양한 날짜 형식을 YYYY-MM-DD로 정규화 */
function normalizeDateStr(raw?: string): string {
  if (!raw) return '';
  const cleaned = raw.trim().replace(/\./g, '-').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(cleaned) ? cleaned : '';
}

/**
 * 홈 탭: 도서 검색(종료 고지) + 지금 읽고 있는 책(미완독) + 월간 독서 달력 + 최근 독서기록
 */
export default function HomeTab({
  books,
  myBooks,
  logs,
  insights,
  loading,
  currentUserNickname,
  searchQuery,
  setSearchQuery,
  searching,
  searchResults,
  onClearSearchResults,
  searchApiType,
  onSearch,
  onSelectSearchResult,
  onOpenManualBook,
  onSelectBook,
  onGoToFeed,
  onGoToLibrary,
}: HomeTabProps) {
  // 오늘 날짜 문자열
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // 1. 내가 지금 읽고 있는 책 (진도율 100% 미만)
  const readingBooks = useMemo(() => {
    return myBooks.filter((b) => (b.progressPercent || 0) < 100);
  }, [myBooks]);

  // 2. 월간 독서 달력 상태
  const [viewYearMonth, setViewYearMonth] = useState<string>(todayStr.slice(0, 7));
  const [selectedDate, setSelectedDate] = useState<string>('');

  // 내 기록(로그 & 문장수집) 날짜 매핑
  const { myMonthlyLogs, myMonthlyInsights, recordsByDate } = useMemo(() => {
    const map: Record<string, { logs: ReadingLog[]; insights: InsightLog[] }> = {};
    const mLogs: ReadingLog[] = [];
    const mInsights: InsightLog[] = [];

    logs.forEach((l) => {
      const d = normalizeDateStr(l.readDate);
      if (!d) return;
      if (!map[d]) map[d] = { logs: [], insights: [] };
      map[d].logs.push(l);
      if (d.startsWith(viewYearMonth)) mLogs.push(l);
    });

    insights.forEach((ins) => {
      const d = normalizeDateStr(ins.readDate);
      if (!d) return;
      if (!map[d]) map[d] = { logs: [], insights: [] };
      map[d].insights.push(ins);
      if (d.startsWith(viewYearMonth)) mInsights.push(ins);
    });

    return { myMonthlyLogs: mLogs, myMonthlyInsights: mInsights, recordsByDate: map };
  }, [logs, insights, viewYearMonth]);

  // 월간 독서 통계
  const monthlyStats = useMemo(() => {
    const activeDates = new Set<string>();
    let totalPagesInMonth = 0;

    myMonthlyLogs.forEach((l) => {
      const d = normalizeDateStr(l.readDate);
      if (d) activeDates.add(d);
      totalPagesInMonth += Number(l.readPages) || 0;
    });

    myMonthlyInsights.forEach((i) => {
      const d = normalizeDateStr(i.readDate);
      if (d) activeDates.add(d);
    });

    const myCompletedBooks = myBooks.filter((b) => (b.progressPercent || 0) >= 100);

    return {
      daysCount: activeDates.size,
      pagesCount: totalPagesInMonth,
      completedCount: myCompletedBooks.length,
    };
  }, [myMonthlyLogs, myMonthlyInsights, myBooks]);

  // 달력 그리드 계산
  const calendarDays = useMemo(() => {
    const [y, m] = viewYearMonth.split('-').map(Number);
    const firstDayOfWeek = new Date(y, m - 1, 1).getDay(); // 0: 일요일
    const lastDate = new Date(y, m, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNum: number | null;
      isToday: boolean;
      hasRecord: boolean;
      logCount: number;
      insightCount: number;
    }> = [];

    // 앞쪽 빈 칸
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({
        dateStr: '',
        dayNum: null,
        isToday: false,
        hasRecord: false,
        logCount: 0,
        insightCount: 0,
      });
    }

    for (let d = 1; d <= lastDate; d++) {
      const ds = `${viewYearMonth}-${String(d).padStart(2, '0')}`;
      const rec = recordsByDate[ds];
      days.push({
        dateStr: ds,
        dayNum: d,
        isToday: ds === todayStr,
        hasRecord: Boolean(rec && (rec.logs.length > 0 || rec.insights.length > 0)),
        logCount: rec?.logs.length || 0,
        insightCount: rec?.insights.length || 0,
      });
    }

    return days;
  }, [viewYearMonth, recordsByDate, todayStr]);

  const changeMonth = (diff: number) => {
    const [y, m] = viewYearMonth.split('-').map(Number);
    const newDate = new Date(y, m - 1 + diff, 1);
    const ny = newDate.getFullYear();
    const nm = String(newDate.getMonth() + 1).padStart(2, '0');
    setViewYearMonth(`${ny}-${nm}`);
    setSelectedDate('');
  };

  // 3. 내 최근 독서기록 (일지 + 문장수집 통합 최신 5건)
  const recentFeed = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'log' | 'insight';
      date: string;
      sortKey: string;
      book?: Book;
      bookTitle: string;
      content: string;
      pageLabel: string;
    }> = [];

    logs.forEach((l) => {
      const book = books.find((b) => b.notionPageId === l.bookNotionPageId);
      list.push({
        id: `log-${l.logId}`,
        type: 'log',
        date: l.readDate || '',
        sortKey: `${(l.readDate || '').slice(0, 10)}_${l.createdAt || ''}`,
        book,
        bookTitle: book?.title || '도서',
        content: l.note || `${l.readPages}쪽까지 독서`,
        pageLabel: `${l.readPages}쪽`,
      });
    });

    insights.forEach((ins) => {
      const book = books.find((b) => b.notionPageId === ins.bookNotionPageId);
      list.push({
        id: `ins-${ins.pageLogId}`,
        type: 'insight',
        date: ins.readDate || '',
        sortKey: `${(ins.readDate || '').slice(0, 10)}_${ins.createdAt || ''}`,
        book,
        bookTitle: book?.title || '도서',
        content: ins.notes,
        pageLabel: ins.page ? `${ins.page}쪽` : '문장',
      });
    });

    return list.sort((a, b) => b.sortKey.localeCompare(a.sortKey)).slice(0, 5);
  }, [books, logs, insights]);

  const engineLabel =
    searchApiType === 'kakao'
      ? '카카오+국립중앙도서관'
      : searchApiType === 'aladin'
      ? '알라딘(종료)'
      : '네이버(종료)';

  const selectedDayRecords = selectedDate ? recordsByDate[selectedDate] : null;

  const displayMonthNum = Number(viewYearMonth.split('-')[1] || 1);
  const targetTotal = myBooks.length > 0 ? myBooks.length : (readingBooks.length + monthlyStats.completedCount) || 5;
  const ratio = targetTotal > 0 ? Math.min(1, monthlyStats.completedCount / targetTotal) : 0;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - ratio);
  const remainingCount = Math.max(0, targetTotal - monthlyStats.completedCount);

  return (
    <div className="home-layout">
      {/* 1. 상단 둥근 도서 검색바 */}
      <section className="home-search-bar-wrap" data-tour="search-bar">
        <div className="home-search-pill">
          <span className="home-search-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            placeholder={`책 제목/저자 검색하기 (${engineLabel})`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          />
          <button type="button" className="home-search-submit" onClick={onSearch} disabled={searching}>
            {searching ? '검색 중' : '검색'}
          </button>
        </div>
        <button type="button" className="home-manual-btn" onClick={onOpenManualBook}>
          ✍️ 직접 등록
        </button>
      </section>

      {/* 검색 엔진 현황 알림 배지 (알라딘/네이버 서비스 종료 및 카카오+국립중앙도서관 표준 안내) */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-[11px] text-stone-600">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-extrabold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full text-[10px]">
            표준 검색
          </span>
          <span className="text-stone-700">
            <strong>카카오 도서 검색</strong>(표지·서지정보) + <strong>국립중앙도서관</strong>(총 쪽수 자동 연동)
          </span>
        </div>
        <span className="text-[10px] text-stone-400">
          ※ 알라딘(2026.10.30) · 네이버(2026.07.31) 도서 검색 API 서비스 공식 종료
        </span>
      </div>

      {/* 검색 결과 드롭다운 패널 */}
      {searchResults.length > 0 && (
        <section className="panel search-results-panel">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-extrabold text-stone-800">
                검색 결과 ({searchResults.length}권)
              </h3>
              <p className="text-[11px] text-amber-800 font-medium">
                💡 카카오 도서 검색 결과에 국립중앙도서관(NL) 서지정보 쪽수가 자동 매핑되어 표시됩니다.
              </p>
            </div>
            <button type="button" className="ghost-button text-xs py-1 px-2.5" onClick={onClearSearchResults}>
              닫기
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {searchResults.map((book, index) => (
              <div
                key={index}
                className="flex gap-2.5 bg-white p-2.5 border border-amber-200 rounded-xl items-center shadow-sm"
              >
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt="" className="w-10 h-14 object-cover rounded shadow-sm flex-shrink-0" />
                ) : (
                  <div className="w-10 h-14 bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-800 rounded flex-shrink-0">
                    표지
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs text-stone-900 truncate">{book.title}</p>
                  <p className="text-[11px] text-stone-500 truncate">{book.author} | {book.publisher}</p>
                  <p className="text-[11px] text-amber-800 font-semibold mt-0.5">
                    {book.totalPages > 0 ? `📖 총 ${book.totalPages}쪽 (NL 연동)` : '📄 선택 시 쪽수 자동 확인'}
                  </p>
                </div>
                <button
                  type="button"
                  className="ghost-button text-xs py-1.5 px-2.5 flex-shrink-0"
                  style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
                  onClick={() => onSelectSearchResult(book)}
                >
                  선택
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. PC 2단 / 모바일 1단 대시보드 그리드 */}
      <div className="home-main-grid">
        {/* 좌측 열: 지금 읽는 책 + 최근 독서기록 */}
        <div className="home-col-primary">
          {/* 지금 읽는 책 섹션 */}
          <section className="panel reading-now-panel" data-tour="reading-now">
            <div className="home-section-head">
              <div className="home-section-title">
                <span className="home-bookmark-badge" aria-hidden="true">🔖</span>
                <h2>지금 읽는 책</h2>
                <span className="home-count-pill">{readingBooks.length}</span>
              </div>
              <button type="button" className="home-more-link" onClick={onGoToLibrary}>
                서재 보기 ›
              </button>
            </div>

            {loading && myBooks.length === 0 ? (
              <div className="reading-now-skeleton animate-pulse" />
            ) : readingBooks.length === 0 ? (
              <div className="home-empty-box">
                <p className="home-empty-title">지금 읽고 있는 책이 없습니다</p>
                <p className="home-empty-sub">위 검색창에서 책을 검색하거나 직접 등록해 보세요.</p>
              </div>
            ) : (
              <div className="reading-now-list">
                {readingBooks.map((book) => {
                  const pct = Math.min(100, Math.max(0, book.progressPercent || 0));
                  const filledSegments = Math.round((pct / 100) * SEGMENT_COUNT);
                  return (
                    <article
                      key={book.bookId || book.notionPageId}
                      className="reading-now-card"
                      onClick={() => onSelectBook(book)}
                    >
                      <div className="reading-now-cover">
                        {book.coverUrl ? (
                          <img src={book.coverUrl} alt={book.title} />
                        ) : (
                          <div className="reading-now-cover-fallback">{book.title}</div>
                        )}
                      </div>

                      <div className="reading-now-info">
                        <h3 className="reading-now-book-title">{book.title}</h3>
                        <p className="reading-now-book-author">
                          {book.author || '저자 미상'}
                          {book.publisher ? ` · ${book.publisher}` : ''}
                          {book.nickname ? ` · [${book.nickname}]` : ''}
                        </p>

                        {/* 세그먼트 점선 진행률 바 */}
                        <div className="segment-progress-row">
                          <div className="segment-track" aria-label={`진도율 ${pct}%`}>
                            {Array.from({ length: SEGMENT_COUNT }).map((_, i) => (
                              <span
                                key={i}
                                className={`segment-tick ${i < filledSegments ? 'filled' : ''}`}
                              />
                            ))}
                          </div>
                          <span className="segment-pct">{pct}%</span>
                        </div>

                        <div className="reading-now-pages">
                          현재 페이지 <strong>{book.readPages || 0}</strong> / {book.totalPages || '?'}쪽
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* 최근 독서기록 섹션 */}
          <section className="panel recent-feed-panel" data-tour="recent-feed">
            <div className="home-section-head">
              <div className="home-section-title">
                <span className="home-bookmark-badge" aria-hidden="true">✍️</span>
                <h2>최근 독서기록</h2>
                <span className="home-count-pill">{recentFeed.length}</span>
              </div>
              <button type="button" className="home-more-link" onClick={onGoToFeed}>
                전체 피드 보기 ›
              </button>
            </div>

            {recentFeed.length === 0 ? (
              <div className="home-empty-box">
                <p className="home-empty-title">남겨진 독서 기록이 없습니다</p>
                <p className="home-empty-sub">책을 누르고 독서일지나 문장수집을 남겨보세요.</p>
              </div>
            ) : (
              <div className="recent-feed-list">
                {recentFeed.map((item) => (
                  <article
                    key={item.id}
                    className="recent-feed-item"
                    onClick={() => item.book && onSelectBook(item.book)}
                  >
                    <div className="recent-feed-badge-col">
                      <span className={`recent-feed-type-pill ${item.type === 'log' ? 'is-log' : 'is-insight'}`}>
                        {item.type === 'log' ? '일지' : '문장'}
                      </span>
                      <span className="recent-feed-page-tag">{item.pageLabel}</span>
                    </div>

                    <div className="recent-feed-content-col">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h4 className="recent-feed-book-title truncate">{item.bookTitle}</h4>
                        <time className="recent-feed-date">{item.date}</time>
                      </div>
                      <p className="recent-feed-text line-clamp-2">{item.content}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* 우측 열: 월 독서기록 달력 & 월간 통계 */}
        <div className="home-col-secondary">
          <section className="panel cal-panel" data-tour="calendar">
            <div className="cal-top-bar">
              <div className="cal-title-wrap">
                <span className="cal-paw-icon" aria-hidden="true">🐾</span>
                <h2 className="cal-title">{displayMonthNum}월 독서기록</h2>
                <div className="cal-month-nav">
                  <button type="button" className="cal-nav-arrow" onClick={() => changeMonth(-1)} aria-label="이전 달">‹</button>
                  <span className="cal-ym-label">{viewYearMonth.replace('-', '.')}</span>
                  <button type="button" className="cal-nav-arrow" onClick={() => changeMonth(1)} aria-label="다음 달">›</button>
                </div>
              </div>

              <div className="cal-top-actions">
                <button type="button" className="cal-report-link" onClick={onGoToFeed}>
                  전체 피드 ›
                </button>
              </div>
            </div>

            {/* 본문 2단: 좌측 캘린더 + 우측 이번 달 목표 도넛 */}
            <div className="cal-body-grid">
              {/* 좌측: 캘린더 그리드 */}
              <div className="cal-left-col">
                <div className="cal-summary-row">
                  <span><strong>{monthlyStats.daysCount}일</strong> 읽음</span>
                  <span className="cal-divider">|</span>
                  <span><strong>{monthlyStats.pagesCount}</strong>페이지</span>
                  <span className="cal-divider">|</span>
                  <span><strong>{monthlyStats.completedCount}권</strong> 완독</span>
                </div>

                <div className="cal-weekdays">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, i) => (
                    <span key={i} className={i === 0 ? 'is-sun' : ''}>{w}</span>
                  ))}
                </div>

                <div className="cal-days-grid">
                  {calendarDays.map((cell, idx) => {
                    if (!cell.dayNum) return <div key={`empty-${idx}`} className="cal-day-empty" />;
                    const isSelected = selectedDate === cell.dateStr;
                    return (
                      <button
                        key={cell.dateStr}
                        type="button"
                        onClick={() => setSelectedDate(isSelected ? '' : cell.dateStr)}
                        className={[
                          'cal-day-cell',
                          cell.hasRecord ? 'has-activity' : '',
                          cell.isToday ? 'is-today' : '',
                          isSelected ? 'is-selected' : '',
                        ].filter(Boolean).join(' ')}
                        title={`${cell.dateStr}${cell.hasRecord ? ' (기록 있음)' : ''}`}
                      >
                        {cell.dayNum}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 우측: 이번 달 목표 도넛 차트 */}
              <div className="cal-right-col">
                <div className="cal-goal-header">
                  <span className="cal-goal-title">🎯 이번 달 목표</span>
                </div>

                <div className="cal-donut-wrap">
                  <svg viewBox="0 0 88 88" className="cal-donut-svg">
                    <circle cx="44" cy="44" r={radius} className="cal-donut-track" />
                    <circle
                      cx="44"
                      cy="44"
                      r={radius}
                      className="cal-donut-progress"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      transform="rotate(-90 44 44)"
                    />
                  </svg>
                  <div className="cal-donut-center">
                    <strong>{monthlyStats.completedCount}</strong>
                    <span>/{targetTotal}</span>
                  </div>
                </div>

                <p className="cal-goal-caption">
                  {remainingCount > 0 ? `목표까지 ${remainingCount}권 남았어요` : '모든 목표를 완독했어요! 🎉'}
                </p>
              </div>
            </div>

            {/* 선택한 날짜의 독서 기록 팝오버 */}
            {selectedDate && selectedDayRecords && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-amber-900/10">
                  <h4 className="text-xs font-bold text-amber-950">
                    📌 {selectedDate} 독서 기록 ({selectedDayRecords.logs.length + selectedDayRecords.insights.length}건)
                  </h4>
                  <button
                    type="button"
                    onClick={() => setSelectedDate('')}
                    className="text-[11px] text-stone-500 hover:text-stone-800 px-1 py-0.5"
                    aria-label="기록 닫기"
                  >
                    ✕
                  </button>
                </div>

                <div className="cal-day-detail-list max-h-48 overflow-y-auto pr-1">
                  {selectedDayRecords.logs.map((l) => (
                    <div
                      key={l.logId}
                      className="cal-day-detail-item"
                      onClick={() => {
                        const book = books.find((b) => b.bookId === l.bookNotionPageId || b.notionPageId === l.bookNotionPageId);
                        if (book) onSelectBook(book);
                      }}
                    >
                      <div className="flex items-center justify-between text-[11px] text-stone-500">
                        <span className="cal-tag-log">📖 독서일지</span>
                        <span className="font-mono font-bold text-amber-950">{l.readPages}쪽까지</span>
                      </div>
                      <p className="text-stone-800 text-[11.5px] mt-0.5 font-medium">{l.note}</p>
                    </div>
                  ))}

                  {selectedDayRecords.insights.map((ins) => (
                    <div
                      key={ins.pageLogId}
                      className="cal-day-detail-item"
                      onClick={() => {
                        const book = books.find((b) => b.bookId === ins.bookNotionPageId || b.notionPageId === ins.bookNotionPageId);
                        if (book) onSelectBook(book);
                      }}
                    >
                      <div className="flex items-center justify-between text-[11px] text-stone-500">
                        <span className="cal-tag-insight">💬 문장수집</span>
                        <span className="font-mono font-bold text-amber-950">{ins.page}쪽</span>
                      </div>
                      <p className="text-stone-800 text-[11.5px] mt-0.5 font-serif italic text-amber-950/90">&ldquo;{ins.notes}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
