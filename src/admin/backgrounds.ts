export interface BackgroundPreset {
  id: string;
  label: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  css: string;
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { id: 'classic-ivory', label: '클래식 아이보리', backgroundColor: '#fffaf0', textColor: '#3d3028', accentColor: '#a26d52', css: 'linear-gradient(135deg,#fffaf0,#f7eadb)' },
  { id: 'navy-gold', label: '네이비 골드', backgroundColor: '#101d36', textColor: '#fff8dc', accentColor: '#d5ad55', css: 'linear-gradient(135deg,#101d36,#243b62)' },
  { id: 'botanical-green', label: '보태니컬 그린', backgroundColor: '#edf3e8', textColor: '#243b2d', accentColor: '#668b68', css: 'radial-gradient(circle at 20% 20%,#dcebd6,#edf3e8 55%)' },
  { id: 'floral-pink', label: '플로럴 핑크', backgroundColor: '#fff2f5', textColor: '#5a2e3e', accentColor: '#d17c99', css: 'radial-gradient(circle at 80% 20%,#ffdce6,#fff2f5 60%)' },
  { id: 'modern-blue', label: '모던 블루', backgroundColor: '#edf5fb', textColor: '#18314a', accentColor: '#4f86ad', css: 'linear-gradient(135deg,#edf5fb,#d5e7f5)' },
  { id: 'natural-beige', label: '내추럴 베이지', backgroundColor: '#f4eee4', textColor: '#473b2e', accentColor: '#a88d69', css: 'linear-gradient(135deg,#f4eee4,#e9dbc8)' },
  { id: 'burgundy-classic', label: '버건디 클래식', backgroundColor: '#3d1724', textColor: '#fff2e0', accentColor: '#d69a64', css: 'linear-gradient(135deg,#3d1724,#642c3e)' },
  { id: 'lavender-pastel', label: '라벤더 파스텔', backgroundColor: '#f3effa', textColor: '#403451', accentColor: '#8d78ad', css: 'linear-gradient(135deg,#f3effa,#e2d8f2)' },
  { id: 'festival', label: '페스티벌', backgroundColor: '#fff7df', textColor: '#3d2c15', accentColor: '#d66f3d', css: 'linear-gradient(120deg,#fff7df 0 45%,#f5c6a2 45% 60%,#b5d3c0 60%)' },
  { id: 'black-premium', label: '블랙 프리미엄', backgroundColor: '#141414', textColor: '#f7f0e2', accentColor: '#d6b271', css: 'linear-gradient(135deg,#141414,#343434)' },
  { id: 'sky-blue', label: '스카이 블루', backgroundColor: '#eefaff', textColor: '#183b52', accentColor: '#60a8c9', css: 'linear-gradient(135deg,#eefaff,#caeefa)' },
  { id: 'traditional-hanji', label: '전통 한지', backgroundColor: '#f5eddb', textColor: '#443528', accentColor: '#987255', css: 'radial-gradient(#ead9b8 1px,transparent 1px),#f5eddb' },
];

export const getBackground = (id?: string) => BACKGROUND_PRESETS.find((preset) => preset.id === id) || BACKGROUND_PRESETS[0];
