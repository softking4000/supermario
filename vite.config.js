import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite 개발 서버 설정 파일입니다.
// React 플러그인을 활성화하여 최신 React 컴포넌트를 빠르게 빌드 및 HMR(핫 모듈 리플레이스먼트)합니다.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false
  }
});
