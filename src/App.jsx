/**
 * ====================================================================
 * 🎮 [슈퍼 검투사 브라더스 (Super Gladiator Bros) - 메인 React 앱]
 * ====================================================================
 * Tailwind CSS 모던 다크모드 게이밍 허브 UI,
 * 8비트 HUD, Lucide 아이콘, Canvas-Confetti 축하 폭죽 및
 * 모바일/터치 온스크린 가상 게임패드가 통합된 메인 컴포넌트입니다.
 */

import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Gamepad2, 
  Heart, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Trophy, 
  Timer, 
  Coins, 
  Tv, 
  Sparkles,
  Play,
  ArrowLeft,
  ArrowRight,
  ArrowUp
} from 'lucide-react';
import { GameEngine } from './game/gameEngine.js';
import { soundSynth } from './game/soundSynth.js';

export default function App() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  // 게임 HUD 상태 관리
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(300);
  const [isMuted, setIsMuted] = useState(false);
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [gameState, setGameState] = useState('PLAYING'); // 'PLAYING', 'CLEARED', 'GAMEOVER'
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('gladiator_high_score') || '0', 10);
  });

  // 게임 엔진 초기화 및 마운트
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 게임 엔진 인스턴스 생성
    const engine = new GameEngine(canvas, {
      onScore: (newScore) => {
        setScore(newScore);
        setHighScore((prev) => {
          if (newScore > prev) {
            localStorage.setItem('gladiator_high_score', newScore.toString());
            return newScore;
          }
          return prev;
        });
      },
      onCoins: (newCoins) => setCoins(newCoins),
      onLives: (newLives) => setLives(newLives),
      onTime: (time) => setTimeLeft(time),
      onClear: (finalScore) => {
        setGameState('CLEARED');
        // 스테이지 클리어 축하 폭죽 (Canvas-Confetti) 발사!
        launchFireworks();
      },
      onGameOver: (finalScore, isTrueGameOver) => {
        setGameState(isTrueGameOver ? 'GAMEOVER' : 'LIFE_LOST');
      }
    });

    engineRef.current = engine;
    engine.start();

    // 키보드 이벤트 리스너 등록
    const handleKeyDown = (e) => {
      // 스페이스바 및 방향키 스크롤 방지
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      engine.handleKeyDown(e.code);
    };

    const handleKeyUp = (e) => {
      engine.handleKeyUp(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      engine.stop();
    };
  }, []);

  // 스테이지 클리어 시 화려한 폭죽 파티클 발사
  const launchFireworks = () => {
    const duration = 3.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#fbbf24']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#fbbf24']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  // 사운드 토글
  const handleToggleSound = () => {
    const muted = soundSynth.toggleMute();
    setIsMuted(muted);
  };

  // 재시작
  const handleRestart = (fullReset = false) => {
    setGameState('PLAYING');
    if (engineRef.current) {
      engineRef.current.restart(fullReset);
      if (fullReset) {
        setScore(0);
        setCoins(0);
        setLives(3);
        setTimeLeft(300);
      }
    }
  };

  // 모바일 가상 패드 터치 컨트롤 핸들러
  const handleVirtualKeyDown = (code) => {
    if (engineRef.current) {
      engineRef.current.handleKeyDown(code);
    }
  };

  const handleVirtualKeyUp = (code) => {
    if (engineRef.current) {
      engineRef.current.handleKeyUp(code);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-2 sm:p-4 text-slate-100 font-sans">
      
      {/* ======================================================== */}
      {/* 🏆 상단 다크모드 게이밍 네비게이션 헤더                     */}
      {/* ======================================================== */}
      <header className="w-full max-w-4xl bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-4 mb-3 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Gamepad2 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-amber-400 via-rose-400 to-amber-200 bg-clip-text text-transparent">
              SUPER GLADIATOR BROS
            </h1>
            <p className="text-xs text-slate-400">100% Canvas 2D + Web Audio API Synth Engine</p>
          </div>
        </div>

        {/* 조작 & 컨트롤 버튼 */}
        <div className="flex items-center gap-2">
          {/* CRT 스캔라인 토글 */}
          <button
            onClick={() => setCrtEnabled(!crtEnabled)}
            className={`p-2.5 rounded-xl border transition-all text-xs font-medium flex items-center gap-1.5 ${
              crtEnabled 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-slate-800/60 border-slate-700 text-slate-400'
            }`}
            title="CRT 레트로 스캔라인 필터 On/Off"
          >
            <Tv className="w-4 h-4" />
            <span className="hidden sm:inline">CRT {crtEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* 사운드 토글 */}
          <button
            onClick={handleToggleSound}
            className={`p-2.5 rounded-xl border transition-all text-xs font-medium flex items-center gap-1.5 ${
              !isMuted 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
            title="사운드 On/Off"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isMuted ? 'MUTE' : 'SOUND'}</span>
          </button>

          {/* 리셋 버튼 */}
          <button
            onClick={() => handleRestart(true)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 text-xs font-medium"
            title="게임 전체 초기화"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">RETRY</span>
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 🕹️ 8비트 레트로 클래식 HUD 대시보드                        */}
      {/* ======================================================== */}
      <div className="w-full max-w-4xl bg-slate-900 border-x border-t border-slate-800 rounded-t-2xl px-6 py-3 flex items-center justify-between text-xs sm:text-sm font-pixel select-none">
        {/* 플레이어 점수 */}
        <div className="flex flex-col">
          <span className="text-amber-400 text-[10px] tracking-wider">GLADIATOR</span>
          <span className="text-white text-base tracking-widest">{score.toString().padStart(6, '0')}</span>
        </div>

        {/* 코인 카운트 */}
        <div className="flex items-center gap-1.5 text-amber-300">
          <Coins className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
          <span className="text-white text-base">x{coins.toString().padStart(2, '0')}</span>
        </div>

        {/* 하트 라이프 */}
        <div className="flex items-center gap-1">
          {[...Array(3)].map((_, i) => (
            <Heart
              key={i}
              className={`w-5 h-5 transition-transform ${
                i < lives 
                  ? 'text-rose-500 fill-rose-500 filter drop-shadow-[0_0_6px_rgba(244,63,94,0.7)]' 
                  : 'text-slate-700'
              }`}
            />
          ))}
        </div>

        {/* 월드 */}
        <div className="hidden sm:flex flex-col items-center">
          <span className="text-emerald-400 text-[10px]">WORLD</span>
          <span className="text-white text-base">1-1</span>
        </div>

        {/* 남은 시간 */}
        <div className="flex flex-col items-end">
          <span className="text-sky-400 text-[10px] flex items-center gap-1">
            <Timer className="w-3 h-3" /> TIME
          </span>
          <span className="text-white text-base">{timeLeft.toString().padStart(3, '0')}</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 📺 메인 게임 캔버스 뷰포트 (CRT 오버레이 포함)             */}
      {/* ======================================================== */}
      <div className="relative w-full max-w-4xl aspect-[800/480] bg-black border-x border-b border-slate-800 rounded-b-2xl overflow-hidden shadow-2xl glow-box">
        {/* 100% Canvas 2D 픽셀 렌더러 */}
        <canvas
          ref={canvasRef}
          width={800}
          height={480}
          className="w-full h-full pixelated block"
        />

        {/* CRT 스캔라인 오버레이 */}
        {crtEnabled && <div className="crt-overlay" />}

        {/* ======================================================== */}
        {/* 🎉 스테이지 클리어 모달 오버레이                         */}
        {/* ======================================================== */}
        {gameState === 'CLEARED' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 z-30 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-400 mb-4 animate-bounce">
              <Trophy className="w-10 h-10" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-pixel text-amber-400 mb-2 glow-text text-center">
              STAGE CLEAR!
            </h2>
            <p className="text-slate-300 text-sm mb-4 text-center">
              위대한 검투사가 성채에 도달하여 승리를 쟁취했습니다! ⚔️
            </p>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 w-full max-w-xs text-center font-pixel text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>FINAL SCORE:</span>
                <span className="text-white">{score}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>HIGH SCORE:</span>
                <span className="text-amber-400">{highScore}</span>
              </div>
            </div>
            <button
              onClick={() => handleRestart(true)}
              className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold font-pixel text-xs rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> PLAY AGAIN
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* 💀 게임 오버 모달 오버레이                                */}
        {/* ======================================================== */}
        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 z-30">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-400 mb-4">
              <RotateCcw className="w-10 h-10 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-pixel text-rose-500 mb-2 glow-text text-center">
              GAME OVER
            </h2>
            <p className="text-slate-400 text-sm mb-6 text-center">
              아레나의 시련을 이겨내지 못했습니다. 다시 도전해 보세요!
            </p>
            <button
              onClick={() => handleRestart(true)}
              className="px-6 py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-bold font-pixel text-xs rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> RESTART GAME
            </button>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 📱 모바일 터치 온스크린 가상 패드 & 키보드 가이드          */}
      {/* ======================================================== */}
      <footer className="w-full max-w-4xl mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* 키보드 조작 가이드 안내 패널 */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-center text-xs text-slate-400">
          <div className="font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
            <Gamepad2 className="w-4 h-4 text-amber-400" />
            <span>키보드 조작 가이드</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div><kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-200">A / D</kbd> 또는 <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-200">← / →</kbd> : 좌우 이동</div>
            <div><kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-200">W / Space</kbd> : 가변 점프</div>
            <div><kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-200">Shift / X</kbd> : 고속 대시</div>
            <div><kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-200">버섯 획득</kbd> : 큰 검투사 & 벽돌 파쇄</div>
          </div>
        </div>

        {/* 모바일/터치용 가상 D-PAD & 점프 버튼 */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between">
          {/* 좌우 이동 방향 버튼 */}
          <div className="flex gap-2">
            <button
              onMouseDown={() => handleVirtualKeyDown('ArrowLeft')}
              onMouseUp={() => handleVirtualKeyUp('ArrowLeft')}
              onTouchStart={() => handleVirtualKeyDown('ArrowLeft')}
              onTouchEnd={() => handleVirtualKeyUp('ArrowLeft')}
              className="w-12 h-12 bg-slate-800 active:bg-amber-600 rounded-xl border border-slate-700 flex items-center justify-center text-slate-200 text-lg shadow-md active:scale-95 select-none"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              onMouseDown={() => handleVirtualKeyDown('ArrowRight')}
              onMouseUp={() => handleVirtualKeyUp('ArrowRight')}
              onTouchStart={() => handleVirtualKeyDown('ArrowRight')}
              onTouchEnd={() => handleVirtualKeyUp('ArrowRight')}
              className="w-12 h-12 bg-slate-800 active:bg-amber-600 rounded-xl border border-slate-700 flex items-center justify-center text-slate-200 text-lg shadow-md active:scale-95 select-none"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>

          {/* 대시 & 점프 액션 버튼 */}
          <div className="flex gap-3">
            <button
              onMouseDown={() => handleVirtualKeyDown('ShiftLeft')}
              onMouseUp={() => handleVirtualKeyUp('ShiftLeft')}
              onTouchStart={() => handleVirtualKeyDown('ShiftLeft')}
              onTouchEnd={() => handleVirtualKeyUp('ShiftLeft')}
              className="w-12 h-12 bg-rose-900/50 active:bg-rose-600 rounded-full border border-rose-600/50 flex flex-col items-center justify-center text-rose-300 font-bold text-xs shadow-md active:scale-95 select-none"
            >
              <span>RUN</span>
              <span className="text-[9px] text-rose-400">B</span>
            </button>
            <button
              onMouseDown={() => handleVirtualKeyDown('Space')}
              onMouseUp={() => handleVirtualKeyUp('Space')}
              onTouchStart={() => handleVirtualKeyDown('Space')}
              onTouchEnd={() => handleVirtualKeyUp('Space')}
              className="w-14 h-14 bg-amber-500 active:bg-amber-400 rounded-full border-2 border-amber-300 flex flex-col items-center justify-center text-slate-950 font-bold text-xs shadow-lg active:scale-95 select-none"
            >
              <ArrowUp className="w-5 h-5 -mb-1" />
              <span>JUMP</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
