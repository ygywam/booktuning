'use client';

import React, { useMemo, useState } from 'react';
import { Book, InsightLog, ReadingLog } from '@/lib/types';

interface FeedTabProps {
  books: Book[];
  logs: ReadingLog[];
  insights: InsightLog[];
  loading: boolean;
  currentUserNickname?: string;
  onSelectBook: (book: Book) => void;
  onToggleLike?: (rawId: string, type: 'log' | 'insight') => void;
}

/**
 * 피드 탭: 모든 참여 구성원들의 독서일지와 문장수집을 최신 날짜순으로 통합 제공
 */
export default function FeedTab({
  books,
  logs,
  insights,
  loading,
  currentUserNickname = '',
  onSelectBook,
  onToggleLike,
}: FeedTabProps) {
  const [filterType, setFilterType] = useState<'all' | 'log' | 'insight'>('all');
  const [keyword, setKeyword] = useState('');

  const timelineItems = useMemo(() => {
    const list: Array<{
      id: string;
      rawId: string;
      type: 'log' | 'insight';
      date: string;
      sortKey: string;
      nickname: string;
      book?: Book;
      bookTitle: string;
      content: string;
      pageLabel: string;
      imageUrl?: string;
      likes: number;
      likedUsers: string[];
    }> = [];

    logs.forEach((l) => {
      const book = books.find((b) => b.notionPageId === l.bookNotionPageId);
      list.push({
        id: `log-${l.logId}`,
        rawId: l.logId,
        type: 'log',
        date: l.readDate || '',
        sortKey: `${(l.readDate || '').replace(/\./g, '-').slice(0, 10)}_${l.createdAt || ''}`,
        nickname: l.nickname || book?.nickname || '독자',
        book,
        bookTitle: book?.title || '도서',
        content: l.note || `${l.readPages}쪽까지 읽음`,
        pageLabel: `${l.readPages}쪽`,
        likes: l.likes || 0,
        likedUsers: l.likedUsers || [],
      });
    });

    insights.forEach((ins) => {
      const book = books.find((b) => b.notionPageId === ins.bookNotionPageId);
      list.push({
        id: `ins-${ins.pageLogId}`,
        rawId: ins.pageLogId,
        type: 'insight',
        date: ins.readDate || '',
        sortKey: `${(ins.readDate || '').replace(/\./g, '-').slice(0, 10)}_${ins.createdAt || ''}`,
        nickname: ins.nickname || book?.nickname || '독자',
        book,
        bookTitle: book?.title || '도서',
        content: ins.notes,
        pageLabel: ins.page ? `${ins.page}쪽` : '문장',
        imageUrl: ins.imageUrl,
        likes: ins.likes || 0,
        likedUsers: ins.likedUsers || [],
      });
    });

    const q = keyword.trim().toLowerCase();
    return list
      .filter((item) => {
        if (filterType !== 'all' && item.type !== filterType) return false;
        if (q) {
          const hay = `${item.bookTitle} ${item.content} ${item.nickname}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  }, [logs, insights, books, filterType, keyword]);

  return (
    <section className="tab-section">
      <div className="panel tab-header-card">
        <div className="tab-header-top">
          <div>
            <h2>💬 구성원 독서 피드</h2>
            <p className="subtitle">공유 서재에 참여하는 모든 구성원들의 실시간 독서 기록과 문장 수집입니다.</p>
          </div>
        </div>

        <div className="filter-bar lib-filter-bar mt-3 mb-0">
          <div className="filter-group">
            <button
              type="button"
              className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              전체 ({logs.length + insights.length})
            </button>
            <button
              type="button"
              className={`filter-btn ${filterType === 'log' ? 'active' : ''}`}
              onClick={() => setFilterType('log')}
            >
              독서일지 ({logs.length})
            </button>
            <button
              type="button"
              className={`filter-btn ${filterType === 'insight' ? 'active' : ''}`}
              onClick={() => setFilterType('insight')}
            >
              문장수집 ({insights.length})
            </button>
          </div>

          <input
            type="text"
            placeholder="책 제목, 문장, 닉네임 검색..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="lib-keyword-input"
          />
        </div>
      </div>

      {loading && timelineItems.length === 0 ? (
        <div className="panel text-center py-10 text-xs text-stone-400">기록을 불러오는 중...</div>
      ) : timelineItems.length === 0 ? (
        <div className="panel text-center py-12">
          <p className="text-sm font-bold text-stone-700">표시할 독서 기록이 없습니다</p>
          <p className="text-xs text-stone-500 mt-1">책을 열고 독서일지나 문장을 남기면 여기에 시간순으로 쌓입니다.</p>
        </div>
      ) : (
        <div className="feed-timeline-list">
          {timelineItems.map((item) => (
            <article
              key={item.id}
              className={`panel feed-card ${item.type === 'insight' ? 'is-insight' : ''}`}
              onClick={() => item.book && onSelectBook(item.book)}
            >
              <div className="feed-card-cover">
                {item.book?.coverUrl ? (
                  <img src={item.book.coverUrl} alt={item.bookTitle} />
                ) : (
                  <div className="feed-card-cover-fallback">📖</div>
                )}
              </div>

              <div className="feed-card-body">
                <div className="feed-card-top">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`recent-feed-badge ${item.type === 'insight' ? 'is-insight' : 'is-log'}`}>
                      {item.type === 'insight' ? '💡 문장수집' : '📅 독서일지'}
                    </span>
                    <span className="text-[11px] font-extrabold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-full">
                      {item.nickname}
                    </span>
                  </div>
                  <span className="feed-card-date">{item.date || '날짜 미상'} · {item.pageLabel}</span>
                </div>

                <div className="feed-card-book">《{item.bookTitle}》</div>
                <p className="feed-card-text">
                  {item.type === 'insight' ? `“${item.content}”` : item.content}
                </p>

                {item.imageUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-stone-200 max-w-xs">
                    <img src={item.imageUrl} alt="첨부 사진" className="w-full h-auto max-h-48 object-cover" />
                  </div>
                )}

                {/* 피드 공감(좋아요) 액션 바 */}
                <div className="feed-card-actions mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] text-stone-400">
                    {item.type === 'insight' ? '💡 문장수집' : '📅 독서일지'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLike?.(item.rawId, item.type);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                      currentUserNickname && item.likedUsers.includes(currentUserNickname.trim())
                        ? '!bg-rose-50 !text-rose-600 border !border-rose-200 shadow-xs'
                        : '!bg-stone-50 hover:!bg-rose-50 !text-stone-500 hover:!text-rose-600 border !border-stone-200'
                    }`}
                    title={currentUserNickname && item.likedUsers.includes(currentUserNickname.trim()) ? '공감 취소' : '공감하기'}
                  >
                    <span>{currentUserNickname && item.likedUsers.includes(currentUserNickname.trim()) ? '❤️' : '🤍'}</span>
                    <span>공감 {item.likes || 0}</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
