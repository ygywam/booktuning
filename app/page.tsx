'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    const savedNick = localStorage.getItem('app_nickname') || '독서가';
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
      alert('검색 중 에러 발생');
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
        alert('노션 DB에 책이 저장되었습니다!');
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

  return (
    <main className="max-w-5xl mx-auto p-6">
      <header className="mb-8">
        <p className="text-amber-700 font-semibold text-sm">NOTION POWERED</p>
        <h1 className="text-3xl font-extrabold text-amber-950">📚 북튜닝 (Book Tuning)</h1>
        <p className="text-stone-600 text-sm mt-1">
          안녕하세요, <b>{nickname}</b>님! 노션 데이터베이스와 직접 연동되는 통합 서재입니다.
        </p>
      </header>

      {/* 도서 검색 */}
      <section className="bg-amber-50/60 border border-amber-200 rounded-2xl p-6 mb-8 shadow-sm">
        <h2 className="text-lg font-bold text-amber-900 mb-2">🔍 도서 검색 및 노션 등록</h2>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 border border-amber-300 rounded-xl px-4 py-2 bg-white outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="책 제목 또는 ISBN 입력..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="bg-amber-800 text-white font-bold px-6 py-2 rounded-xl hover:bg-amber-900 transition"
          >
            검색
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {searchResults.map((book, idx) => (
              <div key={idx} className="flex gap-3 bg-white p-3 border border-amber-200 rounded-xl items-center">
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt="" className="w-12 h-16 object-cover rounded" />
                ) : (
                  <div className="w-12 h-16 bg-amber-100 flex items-center justify-center text-xs text-amber-800">No Cover</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{book.title}</p>
                  <p className="text-xs text-stone-500">{book.author} | {book.publisher}</p>
                </div>
                <button
                  onClick={() => handleRegisterBook(book)}
                  className="bg-amber-700 text-white text-xs font-bold px-3 py-2 rounded-lg"
                >
                  선택
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 도서 갤러리 */}
      <section>
        <h2 className="text-xl font-bold text-amber-950 mb-4">내 노션 서재 ({books.length}권)</h2>
        {loading ? (
          <p className="text-stone-500">노션에서 데이터를 불러오는 중...</p>
        ) : books.length === 0 ? (
          <p className="text-stone-500">아직 등록된 도서가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {books.map((book) => (
              <div key={book.bookId} className="bg-amber-50/40 border border-amber-200 rounded-2xl overflow-hidden flex flex-col">
                <div className="aspect-[3/4] bg-amber-100 relative">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-amber-800 font-bold p-2 text-center text-xs">
                      {book.title}
                    </div>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm line-clamp-1">{book.title}</h3>
                    <p className="text-xs text-stone-500 line-clamp-1">{book.author}</p>
                  </div>
                  <div className="mt-3 text-xs text-amber-800 font-semibold">
                    등록자: {book.nickname}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}