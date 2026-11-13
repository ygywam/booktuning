'use client';

import React from 'react';
import { MainTabId } from '@/lib/types';

interface BottomNavProps {
  activeTab: MainTabId;
  onChange: (tab: MainTabId) => void;
  counts?: {
    reading?: number;
    books?: number;
    feed?: number;
    dex?: number;
  };
}

const NAV_ITEMS: Array<{
  id: MainTabId;
  label: string;
  renderIcon: (active: boolean) => React.ReactNode;
}> = [
  {
    id: 'home',
    label: '홈',
    renderIcon: (active) => (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 1.8 : 1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5.5v-6.5h-5V21H4a1 1 0 0 1-1-1v-9.5z" />
      </svg>
    ),
  },
  {
    id: 'library',
    label: '서재',
    renderIcon: (active) => (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={active ? 2.1 : 1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5A1.5 1.5 0 0 1 5.5 4h2A1.5 1.5 0 0 1 9 5.5v13A1.5 1.5 0 0 1 7.5 20h-2A1.5 1.5 0 0 1 4 18.5v-13zm5.5 0A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 13 20h-2a1.5 1.5 0 0 1-1.5-1.5v-13zm5.8.6a1.5 1.5 0 0 1 1.1-1.8l1.9-.5a1.5 1.5 0 0 1 1.8 1.1l2.8 12.6a1.5 1.5 0 0 1-1.1 1.8l-1.9.5a1.5 1.5 0 0 1-1.8-1.1L15.3 6.1z" />
      </svg>
    ),
  },
  {
    id: 'feed',
    label: '피드',
    renderIcon: (active) => (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={active ? 2.1 : 1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    ),
  },
  {
    id: 'dex',
    label: '도감',
    renderIcon: (active) => (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 1.8 : 1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v18l7-4 7 4V3a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z" />
      </svg>
    ),
  },
];

/**
 * 모바일 하단 네비게이션 바 (홈 · 서재 · 피드 · 도감)
 * PC 데스크톱에서는 globals.css 에 의해 자동으로 숨겨집니다 (display: none).
 */
export default function BottomNav({ activeTab, onChange, counts }: BottomNavProps) {
  return (
    <nav className="mobile-bottom-nav" data-tour="main-nav-mobile" aria-label="모바일 메인 탭 네비게이션">
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        let badgeCount: number | undefined;
        if (item.id === 'home' && counts?.reading) badgeCount = counts.reading;
        if (item.id === 'library' && counts?.books) badgeCount = counts.books;
        if (item.id === 'feed' && counts?.feed) badgeCount = counts.feed;
        if (item.id === 'dex' && counts?.dex) badgeCount = counts.dex;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="mobile-nav-icon relative">
              {item.renderIcon(isActive)}
              {badgeCount !== undefined && badgeCount > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 bg-amber-600 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </div>
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
