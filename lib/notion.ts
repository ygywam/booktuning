import { Client } from '@notionhq/client';

if (!process.env.NOTION_API_KEY) {
  console.warn("⚠️ NOTION_API_KEY가 설정되지 않았습니다.");
}

export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export const BOOK_DB_ID = process.env.NOTION_BOOK_DB_ID || '';
export const LOG_DB_ID = process.env.NOTION_LOG_DB_ID || '';
export const INSIGHT_DB_ID = process.env.NOTION_INSIGHT_DB_ID || '';