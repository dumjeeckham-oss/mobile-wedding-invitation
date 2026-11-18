import { FontId } from './types.ts';

export const FONT_OPTIONS: { id: FontId; label: string; family: string }[] = [
  { id: 'noto-serif-kr', label: 'Noto Serif KR', family: 'Noto Serif KR, serif' },
  { id: 'nanum-myeongjo', label: '나눔명조', family: 'Nanum Myeongjo, serif' },
  { id: 'gowun-batang', label: '고운바탕', family: 'Gowun Batang, serif' },
  { id: 'hahmlet', label: '함렛', family: 'Hahmlet, serif' },
  { id: 'noto-sans-kr', label: 'Noto Sans KR', family: 'Noto Sans KR, sans-serif' },
  { id: 'pretendard', label: 'Pretendard', family: 'Pretendard, sans-serif' },
  { id: 'ibm-plex-sans-kr', label: 'IBM Plex Sans KR', family: 'IBM Plex Sans KR, sans-serif' },
  { id: 'nanum-gothic', label: '나눔고딕', family: 'Nanum Gothic, sans-serif' },
  { id: 'gowun-dodum', label: '고운돋움', family: 'Gowun Dodum, sans-serif' },
  { id: 'jua', label: '주아', family: 'Jua, sans-serif' },
  { id: 'gaegu', label: '가애구', family: 'Gaegu, sans-serif' },
  { id: 'nanum-brush-script', label: '나눔손글씨 붓', family: 'Nanum Brush Script, cursive' },
];

export const getFont = (id: FontId) => FONT_OPTIONS.find((font) => font.id === id) || FONT_OPTIONS[0];
