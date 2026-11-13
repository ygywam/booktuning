'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Book } from '@/lib/types';

interface LibraryTabProps {
  books: Book[];
  myBooks: Book[];
  loading: boolean;
  currentUserNickname: string;
  onSelectBook: (book: Book) => void;
  onOpenManualBook: () => void;
}

/**
 * 서재 탭: [내 서재] / [구성원 전체 서재] 탭 분리 + 마우스 휠 가로 캐러셀 + macOS Dock 물결 확대 서가
 */
export default function LibraryTab({
  books,
  myBooks,
  loading,
  currentUserNickname,
  onSelectBook,
  onOpenManualBook,
}: LibraryTabProps) {
  const [scope, setScope] = useState<'my' | 'community'>(() => (myBooks && myBooks.length > 0 ? 'my' : 'community'));
  const [statusFilter, setStatusFilter] = useState<'all' | 'reading' | 'done'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'progress' | 'title'>('latest');
  const [keyword, setKeyword] = useState('');

  const initialScopeSetRef = useRef(false);
  useEffect(() => {
    if (!initialScopeSetRef.current && myBooks.length > 0) {
      setScope('my');
      initialScopeSetRef.current = true;
    }
  }, [myBooks.length]);

  // Dock & 휠 캐러셀 상태
  const shellRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, scrollLeft: 0, moved: false });

  const displayedBooks = useMemo(() => {
    let list = scope === 'my' ? myBooks : books;

    const q = keyword.trim().toLowerCase();
    return list
      .filter((b) => {
        const pct = b.progressPercent || 0;
        if (statusFilter === 'reading' && pct >= 100) return false;
        if (statusFilter === 'done' && pct < 100) return false;
        if (q) {
          const hay = `${b.title} ${b.author} ${b.publisher} ${b.nickname}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'progress') return (b.progressPercent || 0) - (a.progressPercent || 0);
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [books, myBooks, scope, statusFilter, sortBy, keyword]);

  // 서재 Dock 섹션 위에서 마우스 휠 회전 시 페이지 상하 스크롤을 막고 가로 캐러셀만 이동 (non-passive)
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const onNativeWheel = (e: WheelEvent) => {
      const track = trackRef.current;
      if (!track) return;
      if (Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
        e.preventDefault();
        e.stopPropagation();
        track.scrollLeft += e.deltaY * 1.3;
      }
    };

    shell.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => {
      shell.removeEventListener('wheel', onNativeWheel);
    };
  }, [displayedBooks.length]);

  const scrollByStep = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    setIsDragging(true);
    dragRef.current = { startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft, moved: false };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !trackRef.current) return;
    const x = e.pageX - trackRef.current.offsetLeft;
    const diff = x - dragRef.current.startX;
    if (Math.abs(diff) > 6) dragRef.current.moved = true;
    trackRef.current.scrollLeft = dragRef.current.scrollLeft - diff * 1.2;
  };

  const stopDragging = () => setIsDragging(false);

  // macOS Dock 물결 확대 스타일 계산
  const getDockCardStyle = (index: number): React.CSSProperties => {
    if (hoveredIdx === null) return {};
    const dist = Math.abs(hoveredIdx - index);
    if (dist === 0) {
      return { transform: 'translateY(-18px) scale(1.18)', zIndex: 30 };
    }
    if (dist === 1) {
      return { transform: 'translateY(-8px) scale(1.07)', zIndex: 20 };
    }
    if (dist === 2) {
      return { transform: 'translateY(-2px) scale(1.02)', zIndex: 10 };
    }
    return { opacity: 0.84 };
  };

  const focusedBook = hoveredIdx !== null ? displayedBooks[hoveredIdx] : null;

  return (
    <section className="tab-section">
      <div className="tab-header-card panel">
        <div className="tab-header-top">
          <div>
            <h2>📚 서재</h2>
            <p className="subtitle">
              공유 서재에 등록된 도서를 둘러보고 상세 기록을 열람할 수 있습니다.
            </p>
          </div>
          <button type="button" className="ghost-button tab-add-btn" onClick={onOpenManualBook}>
            ✍️ 직접 등록
          </button>
        </div>

        {/* [내 서재] / [구성원 전체 서재] 탭 스위처 */}
        <div className="lib-scope-row">
          <button
            type="button"
            className={`lib-scope-btn ${scope === 'my' ? 'active' : ''}`}
            onClick={() => {
              setScope('my');
              setHoveredIdx(null);
            }}
          >
            내 서재 ({myBooks.length})
          </button>
          <button
            type="button"
            className={`lib-scope-btn ${scope === 'community' ? 'active' : ''}`}
            onClick={() => {
              setScope('community');
              setHoveredIdx(null);
            }}
          >
            구성원 전체 서재 ({books.length})
          </button>
        </div>

        {/* 필터 & 검색 툴바 */}
        <div className="filter-bar lib-filter-bar">
          <div className="filter-group">
            <button
              type="button"
              className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              전체
            </button>
            <button
              type="button"
              className={`filter-btn ${statusFilter === 'reading' ? 'active' : ''}`}
              onClick={() => setStatusFilter('reading')}
            >
              읽는 중
            </button>
            <button
              type="button"
              className={`filter-btn ${statusFilter === 'done' ? 'active' : ''}`}
              onClick={() => setStatusFilter('done')}
            >
              완독
            </button>
          </div>

          <div className="lib-search-sort">
            <input
              type="text"
              placeholder="제목, 저자, 닉네임 검색..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="lib-keyword-input"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="lib-sort-select"
              aria-label="정렬 기준"
            >
              <option value="latest">최신 등록순</option>
              <option value="progress">진도율순</option>
              <option value="title">도서명순</option>
            </select>
          </div>
        </div>
      </div>

      {loading && displayedBooks.length === 0 ? (
        <div className="library-dock-track">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="library-dock-card animate-pulse" style={{ height: '270px' }} />
          ))}
        </div>
      ) : displayedBooks.length === 0 ? (
        <div className="panel text-center py-12">
          <div className="text-3xl mb-2">📖</div>
          <h3 className="text-sm font-bold text-stone-700 mb-1">
            {scope === 'my' ? '내 서재에 등록된 도서가 없습니다' : '조건에 맞는 도서가 없습니다'}
          </h3>
          <p className="text-xs text-stone-500 mb-3">
            {scope === 'my'
              ? '홈 화면에서 도서를 검색해 등록하거나, 구성원 전체 서재를 둘러보세요.'
              : '검색어나 필터 조건을 변경해 보세요.'}
          </p>
          {scope === 'my' && books.length > 0 && (
            <button
              type="button"
              className="ghost-button text-xs py-1.5 px-3 mx-auto"
              style={{ borderColor: 'var(--accent)', color: 'var(--accent-dark)' }}
              onClick={() => setScope('community')}
            >
              👥 구성원 전체 서재 ({books.length}권) 보러가기
            </button>
          )}
        </div>
      ) : (
        <div ref={shellRef} className="panel library-dock-shell">
          <div className="library-dock-toolbar">
            <div className="library-dock-spotlight">
              {focusedBook ? (
                <>
                  <span className="library-dock-pill">{focusedBook.progressPercent || 0}%</span>
                  <strong className="truncate">{focusedBook.title}</strong>
                  <span className="library-dock-author truncate">· {focusedBook.author || '저자 미상'}</span>
                  {focusedBook.nickname && (
                    <span className="text-[11px] text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded ml-1 font-bold">
                      {focusedBook.nickname}
                    </span>
                  )}
                </>
              ) : (
                <span className="library-dock-hint font-bold text-stone-600">
                  총 {displayedBooks.length}권
                </span>
              )}
            </div>
            <div className="library-dock-arrows">
              <button
                type="button"
                onClick={() => scrollByStep(-1)}
                className="devlog-arrow-btn"
                aria-label="이전 책"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => scrollByStep(1)}
                className="devlog-arrow-btn"
                aria-label="다음 책"
              >
                ›
              </button>
            </div>
          </div>

          <div
            ref={trackRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDragging}
            onMouseLeave={() => {
              stopDragging();
              setHoveredIdx(null);
            }}
            className={`library-dock-track ${isDragging ? 'is-dragging' : ''}`}
          >
            {displayedBooks.map((book, idx) => {
              const isDone = (book.progressPercent || 0) >= 100;
              const isFocused = hoveredIdx === idx;
              return (
                <article
                  key={book.bookId || book.notionPageId || idx}
                  className={`book-card library-dock-card ${isFocused ? 'is-focused' : ''}`}
                  style={getDockCardStyle(idx)}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onClick={() => {
                    if (!dragRef.current.moved) onSelectBook(book);
                  }}
                >
                  <div className="cover-wrap">
                    <div className="cover-badge">기록보기</div>
                    {isDone ? (
                      <div className="author-badge">⭐ 완독</div>
                    ) : book.nickname ? (
                      <div className="author-badge">{book.nickname}</div>
                    ) : null}
                    {book.coverUrl ? (
                      <img src={book.coverUrl} alt={book.title} draggable={false} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-center p-3 text-xs font-bold text-amber-900 bg-amber-100">
                        {book.title}
                      </div>
                    )}
                  </div>

                  <div className="book-card-body">
                    <div className="book-title">{book.title}</div>
                    <div className="book-meta truncate">{book.author || '저자 미상'}</div>

                    <div className="progress-area">
                      <div className="progress-text">
                        <span>{book.readPages || 0} / {book.totalPages || '?'}쪽</span>
                        <span className="text-amber-800 font-bold">{book.progressPercent || 0}%</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.min(100, Math.max(0, book.progressPercent || 0))}%`,
                            background: isDone
                              ? '#10b981'
                              : 'linear-gradient(90deg, var(--accent) 0%, var(--accent-dark) 100%)',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* 하단 나무 책장 선반 느낌의 Dock 받침대 */}
          <div className="library-dock-shelf" aria-hidden="true" />
        </div>
      )}
    </section>
  );
}
