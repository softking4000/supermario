/**
 * ====================================================================
 * 🎵 [Web Audio API 8비트 레트로 칩튠 사운드 신디사이저 엔진]
 * ====================================================================
 * 외부 MP3/WAV 오디오 파일 일절 없이, 브라우저 순수 Web Audio API의
 * OscillatorNode(사각파, 삼각파, 노이즈)와 GainNode를 결합하여
 * 1980년대 패미컴(NES) 특유의 따뜻하고 찰진 8비트 사운드를 실시간 합성합니다.
 */

class SoundSynthEngine {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.currentBgmStep = 0;
  }

  /**
   * 브라우저의 오디오 컨텍스트를 초기화합니다.
   * (사용자 인터랙션(클릭, 키 입력) 시 자동 활성화)
   */
  initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * 음소거 설정 토글
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBGM();
    } else {
      this.initContext();
      this.startBGM();
    }
    return this.isMuted;
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.isMuted) {
      this.stopBGM();
    }
  }

  /**
   * 단일 주파수 음(Tone)을 생성하여 연주합니다.
   * @param {number} freq - 주파수(Hz)
   * @param {string} type - 오실레이터 파형 ('square', 'triangle', 'sawtooth', 'sine')
   * @param {number} duration - 지속 시간(초)
   * @param {number} startVol - 시작 볼륨 (0~1)
   * @param {number} endVol - 끝 볼륨 (0~1)
   */
  playTone(freq, type = 'square', duration = 0.15, startVol = 0.15, endVol = 0.001) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(startVol, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, endVol), now + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Sound play error:', e);
    }
  }

  /**
   * [1] 점프 사운드 (상승하는 피치 스윕: 150Hz -> 580Hz)
   */
  playJump() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.18);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * [2] 코인 획득 사운드 (고전 시그니처 2단 팅클: B5 987Hz -> E6 1318Hz)
   */
  playCoin() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.setValueAtTime(0.2, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * [3] 파워업 아이템 스폰 사운드 (신비로운 아르페지오)
   */
  playPowerUpSpawn() {
    if (this.isMuted) return;
    const notes = [330, 392, 659, 523, 587, 784];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.08, 0.15, 0.01);
      }, idx * 60);
    });
  }

  /**
   * [4] 파워업 버섯/물약 획득 사운드 (화려한 8음 상승 팡파레)
   */
  playPowerUp() {
    if (this.isMuted) return;
    const notes = [330, 392, 659, 523, 587, 784, 880, 1046];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'square', 0.1, 0.18, 0.01);
      }, idx * 50);
    });
  }

  /**
   * [5] 데미지 피격 / 축소 사운드 (하강 슬라이드)
   */
  playPowerDown() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.3);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * [6] 머리로 블록 타격 시 범프 사운드
   */
  playBump() {
    this.playTone(180, 'triangle', 0.08, 0.22, 0.01);
  }

  /**
   * [7] 일반 벽돌 파괴 사운드 (노이즈 버퍼 기반 크런치 파쇄음)
   */
  playBrickBreak() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const bufferSize = this.audioCtx.sampleRate * 0.15;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1; // 화이트 노이즈
      }

      const whiteNoise = this.audioCtx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 800;

      const gain = this.audioCtx.createGain();
      const now = this.audioCtx.currentTime;
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.15);
    } catch (e) {
      this.playTone(110, 'sawtooth', 0.12, 0.25, 0.01);
    }
  }

  /**
   * [8] 몬스터(사이클롭스) 머리 밟기 사운드
   */
  playStomp() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * [9] 사망 사운드 (비장한 레트로 멜로디)
   */
  playGameOver() {
    this.stopBGM();
    if (this.isMuted) return;
    const notes = [
      { f: 493.88, d: 0.12 }, // B4
      { f: 440.00, d: 0.12 }, // A4
      { f: 392.00, d: 0.12 }, // G4
      { f: 349.23, d: 0.15 }, // F4
      { f: 293.66, d: 0.20 }, // D4
      { f: 220.00, d: 0.40 }, // A3
    ];

    let delay = 0;
    notes.forEach(n => {
      setTimeout(() => {
        this.playTone(n.f, 'square', n.d, 0.22, 0.01);
      }, delay * 1000);
      delay += n.d * 1.1;
    });
  }

  /**
   * [10] 깃대 클리어 & 성 도달 팡파레
   */
  playStageClear() {
    this.stopBGM();
    if (this.isMuted) return;
    const notes = [
      { f: 261.63, d: 0.1 }, // C4
      { f: 329.63, d: 0.1 }, // E4
      { f: 392.00, d: 0.1 }, // G4
      { f: 523.25, d: 0.15 }, // C5
      { f: 659.25, d: 0.15 }, // E5
      { f: 783.99, d: 0.35 }, // G5
    ];

    let delay = 0;
    notes.forEach(n => {
      setTimeout(() => {
        this.playTone(n.f, 'triangle', n.d, 0.25, 0.01);
      }, delay * 1000);
      delay += n.d * 1.05;
    });
  }

  /**
   * [11] 8비트 레트로 메인 배경음악(BGM) 루프
   * 클래식 칩튠 특유의 통통 튀는 멜로디 시퀀서
   */
  startBGM() {
    if (this.isMuted || this.bgmPlaying) return;
    this.initContext();
    this.bgmPlaying = true;

    // 8비트 클래식 메인 테마 멜로디 시퀀스 [주파수, 지속시간]
    const melody = [
      [659.25, 0.12], [659.25, 0.12], [0, 0.12], [659.25, 0.12],
      [0, 0.12], [523.25, 0.12], [659.25, 0.15], [783.99, 0.25],
      [0, 0.2], [392.00, 0.25], [0, 0.2],
      // 섹션 B
      [523.25, 0.18], [0, 0.1], [392.00, 0.18], [0, 0.1], [329.63, 0.18],
      [440.00, 0.15], [493.88, 0.15], [466.16, 0.12], [440.00, 0.18],
      [392.00, 0.15], [659.25, 0.15], [783.99, 0.15], [880.00, 0.2],
      [698.46, 0.12], [783.99, 0.15], [659.25, 0.15], [523.25, 0.15],
      [587.33, 0.15], [493.88, 0.25]
    ];

    let step = 0;
    const playNext = () => {
      if (!this.bgmPlaying || this.isMuted) return;

      const [freq, dur] = melody[step];
      if (freq > 0) {
        this.playTone(freq, 'square', dur, 0.06, 0.005);
      }

      step = (step + 1) % melody.length;
      this.bgmTimer = setTimeout(playNext, (dur + 0.04) * 1000);
    };

    playNext();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

// 싱글톤 사운드 인스턴스 익스포트
export const soundSynth = new SoundSynthEngine();
