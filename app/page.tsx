'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'my' | 'all' | 'rank'>('my');
  const [statusFilter, setStatusFilter] = useState<'all' | 'reading' | 'done'>('all');
  const [nickname, setNickname] = useState('기록조율사');
  const [theme, setTheme] = useState('theme-base');

  // 모달 상태 관리
  const [showLogModal, setShowLogModal] = useState(false);
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showDevLogModal, setShowDevLogModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showCopyrightModal, setShowCopyrightModal] = useState(false);

  // 선택된 도서 데이터
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [detailTab, setDetailTab] = useState<'logs' | 'ai' | 'my'>('logs');

  // 폼 상태
  const [readDate, setReadDate] = useState('');
  const [readPages, setReadPages] = useState<number | ''>('');
  const [note, setNote] = useState('');

  const [insightPage, setInsightPage] = useState('');
  const [insightNotes, setInsightNotes] = useState('');
  const [insightImageUrl, setInsightImageUrl] = useState('');

  const [aiReport, setAiReport] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [myReport, setMyReport] = useState('');

  useEffect(() => {
    const savedNick = localStorage.getItem('app_nickname') || '기록조율사';
    const savedTheme = localStorage.getItem('app_theme') || 'theme-base';
    setNickname(savedNick);
    setTheme(savedTheme);
    document.body.className = savedTheme;

    const today = new Date().toISOString().split('T')[0];
    setReadDate(today);

    fetchBooks();
  }, []);

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    document.body.className = newTheme;
    localStorage.setItem('app_theme', newTheme);
  };

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

  // 진도 기록 제출
  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;

    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookNotionPageId: selectedBook.notionPageId,
          readDate,
          readPages,
          note,
          nickname,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        alert('진도 기록이 저장되었습니다!');
        setShowLogModal(false);
        setNote('');
        fetchBooks();
      } else {
        alert(`저장 실패: ${data.error}`);
      }
    } catch (err) {
      alert('진도 기록 저장 중 오류가 발생했습니다.');
    }
  };

  // 문장 수집 제출
  const handleSubmitInsight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;

    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookNotionPageId: selectedBook.notionPageId,
          page: insightPage,
          notes: insightNotes,
          imageUrl: insightImageUrl,
          nickname,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        alert('문장 수집이 저장되었습니다!');
        setShowInsightModal(false);
        setInsightPage('');
        setInsightNotes('');
        setInsightImageUrl('');
        fetchBooks();
      } else {
        alert(`저장 실패: ${data.error}`);
      }
    } catch (err) {
      alert('문장 수집 저장 중 오류가 발생했습니다.');
    }
  };

  // Gemini AI 감상문 생성
  const handleGenerateAiReport = async () => {
    if (!selectedBook) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle: selectedBook.title,
          author: selectedBook.author,
          notionPageId: selectedBook.notionPageId,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setAiReport(data.aiReport);
      } else {
        alert(`AI 생성 실패: ${data.error}`);
      }
    } catch (err) {
      alert('AI 감상문 생성 중 오류가 발생했습니다.');
    } finally {
      setAiLoading(false);
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
            onClick={() => setShowTutorialModal(true)}
          >
            📖 사용법
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
          <button onClick={handleSearch}>검색</button>
          <button className="ghost-button" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
            직접 등록
          </button>
        </div>

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
                <button className="text-xs py-2 px-3" onClick={() => handleRegisterBook(book)}>
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
            <p className="subtitle">💡 <b>책 표지 이미지를 클릭</b>하면 타임라인과 <b>AI 감상문</b>을 볼 수 있습니다.</p>
          </div>
        </div>

        <div className="library-tabs">
          <button className={`lib-tab-btn ${activeTab === 'my' ? 'active' : ''}`} onClick={() => setActiveTab('my')}>
            내 서재
          </button>
          <button className={`lib-tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
            커뮤니티 전체
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
          </div>
        )}

        {loading ? (
          <div className="panel text-center py-8 text-stone-500">노션 DB에서 서재를 불러오는 중입니다... 📚</div>
        ) : filteredBooks.length === 0 ? (
          <div className="panel text-center py-8 text-stone-500">조건과 일치하는 도서가 없습니다.</div>
        ) : (
          <div className="book-gallery">
            {filteredBooks.map((book) => (
              <article key={book.bookId} className="book-card">
                <div
                  className="cover-wrap"
                  onClick={() => {
                    setSelectedBook(book);
                    setShowDetailModal(true);
                  }}
                >
                  <div className="cover-badge">기록보기</div>
                  <div className="author-badge">{book.nickname || '익명'}</div>
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-center p-2 text-xs font-bold text-amber-900">
                      {book.title}
                    </div>
                  )}
                </div>
                <div className="book-card-body">
                  <div
                    className="book-title"
                    onClick={() => {
                      setSelectedBook(book);
                      setShowDetailModal(true);
                    }}
                  >
                    {book.title}
                  </div>
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
                    <button
                      onClick={() => {
                        setSelectedBook(book);
                        setShowLogModal(true);
                      }}
                    >
                      진도 기록
                    </button>
                    <button
                      className="insight-btn"
                      onClick={() => {
                        setSelectedBook(book);
                        setShowInsightModal(true);
                      }}
                    >
                      문장 수집
                    </button>
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

      {/* 4. 푸터 (Footer) */}
      <footer className="app-footer">
        <p>Made by <strong>기록조율사 조용희</strong> <a href="https://www.instagram.com/record_tuner/" target="_blank">@record_tuner</a></p>
        <p style={{ marginTop: '8px' }}>
          <a href="#" onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }} style={{ fontSize: '12px', marginRight: '12px' }}>개인정보처리방침</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setShowCopyrightModal(true); }} style={{ fontSize: '12px', marginRight: '12px' }}>저작권 및 이용 안내</a>
          <a href="#" onClick={(e) => { e.preventDefault(); alert('문의 내역을 관리자 노션으로 전송합니다.'); }} style={{ fontSize: '12px' }}>지원/문의</a>
        </p>
      </footer>

      {/* ===================== 모달 (Modals) ===================== */}

      {/* 진도 기록 모달 */}
      {showLogModal && selectedBook && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowLogModal(false)}></div>
          <div className="modal-card">
            <div className="section-title-row">
              <div>
                <h2>진도 기록 추가</h2>
                <p className="subtitle">{selectedBook.title}</p>
              </div>
              <button className="ghost-button" onClick={() => setShowLogModal(false)}>닫기</button>
            </div>
            <form onSubmit={handleSubmitLog}>
              <label>읽은 날짜 <input type="date" value={readDate} onChange={(e) => setReadDate(e.target.value)} required /></label>
              <label style={{ marginTop: '12px' }}>현재까지 읽은 페이지수 <input type="number" min="0" value={readPages} onChange={(e) => setReadPages(Number(e.target.value))} required /></label>
              <label style={{ marginTop: '12px' }}>간단한 감상/요약 <textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)}></textarea></label>
              <div className="mt-4 text-right"><button type="submit">기록 저장 (노션 동기화)</button></div>
            </form>
          </div>
        </div>
      )}

      {/* 문장 수집 모달 */}
      {showInsightModal && selectedBook && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowInsightModal(false)}></div>
          <div className="modal-card">
            <div className="section-title-row">
              <div>
                <h2>인사이트(문장) 수집</h2>
                <p className="subtitle">{selectedBook.title}</p>
              </div>
              <button className="ghost-button" onClick={() => setShowInsightModal(false)}>닫기</button>
            </div>
            <form onSubmit={handleSubmitInsight}>
              <label>해당 페이지 번호 <input type="text" placeholder="예: 105" value={insightPage} onChange={(e) => setInsightPage(e.target.value)} required /></label>
              <label style={{ marginTop: '12px' }}>발췌 문장 및 나의 생각 <textarea rows={5} placeholder="문장이나 생각을 자유롭게 입력하세요..." value={insightNotes} onChange={(e) => setInsightNotes(e.target.value)} required></textarea></label>
              <div className="mt-4 text-right"><button type="submit">인사이트 저장</button></div>
            </form>
          </div>
        </div>
      )}

      {/* 도서 상세 타임라인 및 AI 감상문 모달 */}
      {showDetailModal && selectedBook && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowDetailModal(false)}></div>
          <div className="modal-card detail-modal-card">
            <div className="section-title-row">
              <div>
                <h2>도서 상세 기록</h2>
                <p className="subtitle" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{selectedBook.title}</p>
              </div>
              <button className="ghost-button" onClick={() => setShowDetailModal(false)}>닫기</button>
            </div>

            <div className="detail-tabs">
              <button className={`tab-btn ${detailTab === 'logs' ? 'active' : ''}`} onClick={() => setDetailTab('logs')}>통합 타임라인</button>
              <button className={`tab-btn ${detailTab === 'ai' ? 'active' : ''}`} onClick={() => setDetailTab('ai')}>✨ AI 초안</button>
              <button className={`tab-btn ${detailTab === 'my' ? 'active' : ''}`} onClick={() => setDetailTab('my')}>✍️ 나의 감상문</button>
            </div>

            {detailTab === 'logs' && (
              <div className="timeline-container">
                <div className="timeline-item">
                  <div className="text-xs text-amber-800 font-bold mb-1">📅 최근 진도</div>
                  <div>현재까지 읽은 총 페이지: <b>{selectedBook.readPages || 0}쪽</b></div>
                </div>
              </div>
            )}

            {detailTab === 'ai' && (
              <div>
                <div className="ai-control-box">
                  <p>누적된 진도와 문장 기록을 바탕으로 Gemini AI가 독후감을 작성합니다.</p>
                  <button className="mt-3 w-full" onClick={handleGenerateAiReport} disabled={aiLoading}>
                    {aiLoading ? '🤖 작성 중...' : '✨ Gemini 감상문 생성하기'}
                  </button>
                </div>
                {aiReport && <div className="ai-report-box">{aiReport}</div>}
              </div>
            )}

            {detailTab === 'my' && (
              <div>
                <textarea rows={10} placeholder="나만의 최종 독후감을 직접 입력해 보세요..." value={myReport} onChange={(e) => setMyReport(e.target.value)}></textarea>
                <div className="mt-3 text-right"><button onClick={() => alert('노션으로 저장되었습니다.')}>노션으로 내보내기 & 저장</button></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 설정 모달 */}
      {showSettingsModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowSettingsModal(false)}></div>
          <div className="modal-card">
            <div className="section-title-row">
              <h2>⚙️ 설정</h2>
              <button className="ghost-button" onClick={() => setShowSettingsModal(false)}>닫기</button>
            </div>
            <label>🎨 앱 디자인 테마 선택
              <select value={theme} onChange={(e) => changeTheme(e.target.value)}>
                <option value="theme-base">오리지널 (베이지)</option>
                <option value="theme-notion">노션 스타일 (화이트 & 블루)</option>
                <option value="theme-dark">야간 모드 (다크 그레이)</option>
              </select>
            </label>
            <label style={{ marginTop: '16px' }}>✏️ 닉네임 변경
              <input type="text" value={nickname} onChange={(e) => { setNickname(e.target.value); localStorage.setItem('app_nickname', e.target.value); }} />
            </label>
          </div>
        </div>
      )}

      {/* 사용법 가이드 모달 */}
      {showTutorialModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowTutorialModal(false)}></div>
          <div className="modal-card">
            <div className="section-title-row">
              <h2>📖 북튜닝 가이드</h2>
              <button className="ghost-button" onClick={() => setShowTutorialModal(false)}>닫기</button>
            </div>
            <div className="text-sm space-y-3 leading-relaxed">
              <p><b>1. 책 검색 및 등록:</b> 상단 검색창에서 책을 검색해 내 노션 서재에 추가합니다.</p>
              <p><b>2. 진도 및 인사이트 기록:</b> [진도 기록], [문장 수집] 버튼을 눌러 읽은 쪽수와 인상 깊은 문장을 기록합니다.</p>
              <p><b>3. ✨ AI 감상문:</b> 책 표지를 누른 후 [✨ AI 초안] 탭을 클릭하면 AI가 자동으로 감상문 초안을 작성해 줍니다.</p>
            </div>
          </div>
        </div>
      )}

      {/* 개발로그 모달 */}
      {showDevLogModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowDevLogModal(false)}></div>
          <div className="modal-card">
            <div className="section-title-row">
              <h2>📝 개발 로그</h2>
              <button className="ghost-button" onClick={() => setShowDevLogModal(false)}>닫기</button>
            </div>
            <div className="text-xs space-y-2">
              <p><b>v4.2 (Next.js + Notion API)</b>: 구글 시트 백엔드에서 노션 백엔드 DB로 완전 전환 완료 및 Vercel 배포 연동.</p>
            </div>
          </div>
        </div>
      )}

      {/* 개인정보처리방침 모달 */}
      {showPrivacyModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowPrivacyModal(false)}></div>
          <div className="modal-card">
            <div className="section-title-row">
              <h2>🛡️ 개인정보처리방침</h2>
              <button className="ghost-button" onClick={() => setShowPrivacyModal(false)}>닫기</button>
            </div>
            <p className="text-xs leading-relaxed">본 서비스는 수집된 minimum 닉네임과 독서 기록을 사용자 본인의 노션 DB로 직접 안전하게 백업합니다.</p>
          </div>
        </div>
      )}

      {/* 저작권 모달 */}
      {showCopyrightModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowCopyrightModal(false)}></div>
          <div className="modal-card">
            <div className="section-title-row">
              <h2>⚖️ 저작권 및 이용 안내</h2>
              <button className="ghost-button" onClick={() => setShowCopyrightModal(false)}>닫기</button>
            </div>
            <p className="text-xs leading-relaxed">본 웹앱의 기획 및 디자인 저작권은 '기록조율사 조용희' 선생님에게 있습니다.</p>
          </div>
        </div>
      )}
    </div>
  );
}