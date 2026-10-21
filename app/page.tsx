'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'my' | 'all' | 'rank'>('my');
  const [statusFilter, setStatusFilter] = useState<'all' | 'reading' | 'done'>('all');
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    const savedNick = localStorage.getItem('app_nickname') || '기록조율사';
    setNickname(savedNick);
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/books');
      const data = await res.json();
      if (data.ok) {
        setBooks(data.books);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`/api/search-books?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.ok) {
        setSearchResults(data.books);
      }
    } catch (err) {
      alert('검색 중 에러가 발생했습니다.');
    }
  };

  const handleRegisterBook = async (book: any) => {
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...book, nickname }),
      });
      const data = await res.json();
      if (data.ok) {
        alert('노션 데이터베이스에 저장이 완료되었습니다!');
        setSearchResults([]);
        setSearchQuery('');
        fetchBooks();
      } else {
        alert(`저장 실패: ${data.error}`);
      }
    } catch (err) {
      alert('저장 실패');
    }
  };

  const filteredBooks = books.filter((b) => {
    if (activeTab === 'my' && b.nickname !== nickname) return false;
    if (statusFilter === 'reading') return (b.progressPercent || 0) < 100;
    if (statusFilter === 'done') return (b.progressPercent || 0) >= 100;
    return true;
  });

  return (
    <div className="app">
      {/* 상단 헤더 */}
      <header className="app-header">
        <div>
          <p className="eyebrow">{nickname}님의 독서기록 v4.2 👑</p>
          <h1>북튜닝 (Book Tuning)</h1>
          <p className="subtitle">책을 읽고 기록하며 내 삶과 생각의 주파수를 맞춰가는 공간입니다.</p>
        </div>
        <div className="header-nav-row">
          <button className="ghost-button" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
            📖 사용법
          </button>
          <button className="ghost-button">📝 개발로그</button>
          <button className="ghost-button">⚙️ 설정</button>
        </div>
      </header>

      {/* 도서 검색 패널 */}
      <section className="panel">
        <div className="section-title-row">
          <div>
            <h2>도서 검색</h2>
            <p className="subtitle">도서명 또는 ISBN을 입력해 책 정보를 불러옵니다.</p>
          </div>
        </div>

        <div className="search-row">
          <input
            type="text"
            placeholder="예: 나의 돈키호테 또는 979..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn-primary" onClick={handleSearch}>
            검색
          </button>
          <button className="ghost-button" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
            직접 등록
          </button>
        </div>

        {/* 검색 결과 목록 */}
        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {searchResults.map((book, index) => (
              <div key={index} className="flex gap-3 bg-white p-3 border border-amber-200 rounded-xl items-center">
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt="" className="w-12 h-16 object-cover rounded" />
                ) : (
                  <div className="w-12 h-16 bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-800">
                    No Cover
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{book.title}</p>
                  <p className="text-xs text-stone-500">{book.author} | {book.publisher}</p>
                </div>
                <button className="btn-primary text-xs py-2 px-3" onClick={() => handleRegisterBook(book)}>
                  선택
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 통합 독서 갤러리 */}
      <section>
        <div className="section-title-row">
          <div>
            <h2>통합 독서 갤러리</h2>
            <p className="subtitle">💡 <b>책 표지 이미지를 클릭</b>하면 타임라인과 <b>AI 감상문</b>을 볼 수 있습니다.</p>
          </div>
        </div>

        {/* 탭 버튼 */}
        <div className="library-tabs">
          <button
            className={`lib-tab-btn ${activeTab === 'my' ? 'active' : ''}`}
            onClick={() => setActiveTab('my')}
          >
            내 서재
          </button>
          <button
            className={`lib-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            커뮤니티 전체
          </button>
          <button
            className={`lib-tab-btn ${activeTab === 'rank' ? 'active' : ''}`}
            onClick={() => setActiveTab('rank')}
          >
            🏆 랭킹보드
          </button>
        </div>

        {/* 필터 및 정렬 */}
        {activeTab !== 'rank' && (
          <div className="filter-bar">
            <div className="filter-group">
              <button
                className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                전체
              </button>
              <button
                className={`filter-btn ${statusFilter === 'reading' ? 'active' : ''}`}
                onClick={() => setStatusFilter('reading')}
              >
                읽는 중
              </button>
              <button
                className={`filter-btn ${statusFilter === 'done' ? 'active' : ''}`}
                onClick={() => setStatusFilter('done')}
              >
                완독
              </button>
            </div>
          </div>
        )}

        {/* 도서 갤러리 카드 리스트 */}
        {loading ? (
          <div className="panel text-center py-8 text-stone-500">노션 DB에서 서재를 불러오는 중입니다... 📚</div>
        ) : filteredBooks.length === 0 ? (
          <div className="panel text-center py-8 text-stone-500">조건과 일치하는 도서가 없습니다.</div>
        ) : (
          <div className="book-gallery">
            {filteredBooks.map((book) => (
              <article key={book.bookId} className="book-card">
                <div className="cover-wrap">
                  <div className="cover-badge">기록보기</div>
                  <div className="author-badge">{book.nickname || '익명'}</div>
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} />
                  ) : (
                    <div className="cover-placeholder">{book.title}</div>
                  )}
                </div>
                <div className="book-card-body">
                  <div className="book-title">{book.title}</div>
                  <div className="book-meta">{book.author || '-'}</div>

                  <div className="progress-area">
                    <div className="progress-text">
                      <span>{book.readPages || 0} / {book.totalPages || 0}쪽</span>
                      <span>{book.progressPercent || 0}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${book.progressPercent || 0}%` }}></div>
                    </div>
                  </div>

                  <div className="card-actions">
                    <button>진도 기록</button>
                    <button className="insight-btn">문장 수집</button>
                    <button className="ghost-button" style={{ padding: '6px 0', fontSize: '11px' }}>
                      수정
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}