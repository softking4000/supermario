/**
 * ====================================================================
 * ⚙️ [플랫폼 물리 엔진 & 60FPS 게임 루프 (GameEngine.js)]
 * ====================================================================
 * requestAnimationFrame 기반으로 동작하며, 가변 점프, 지면 마찰,
 * AABB 블록 타일맵 충돌 판정, 몬스터 상호작용, 카메라 횡스크롤을
 * 100% 자바스크립트로 정밀하게 시뮬레이션합니다.
 */

import { Sprites } from './sprites.js';
import { soundSynth } from './soundSynth.js';

export class GameEngine {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks; // onScore, onCoins, onLives, onClear, onGameOver 등

    // 가상 해상도 (레트로 8비트 뷰포트: 가로 800 x 세로 480)
    this.width = 800;
    this.height = 480;
    this.tileSize = 32;

    // 게임 상태: 'TITLE', 'PLAYING', 'FLAGPOLE', 'CLEARED', 'GAMEOVER'
    this.state = 'PLAYING';
    this.score = 0;
    this.coins = 0;
    this.lives = 3;
    this.timeLeft = 300;
    this.timeCounter = 0;

    // 카메라 뷰포트
    this.cameraX = 0;

    // 입력 키 상태
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      run: false
    };

    // 파티클 & 동적 오브젝트 리스트
    this.particles = [];
    this.items = []; // 버섯, 튀어오르는 코인 등
    this.enemies = [];

    // 플레이어 초기화
    this.initPlayer();

    // 레벨 타일맵 생성
    this.initLevel();

    // 애니메이션 프레임 루프 ID
    this.rafId = null;
    this.lastTime = 0;
  }

  /**
   * 플레이어(검투사) 초기 상태 설정
   */
  initPlayer() {
    this.player = {
      x: 80,
      y: 350,
      vx: 0,
      vy: 0,
      width: 24,
      height: 36, // 작은 상태 높이
      isBig: false,
      facing: 1, // 1: 오른쪽, -1: 왼쪽
      onGround: false,
      isJumping: false,
      jumpHeld: false,
      jumpTimer: 0,
      invincibleTimer: 0, // 피격 무적 시간 프레임
      animFrame: 0,
      animTimer: 0,
      state: 'idle', // 'idle', 'run', 'jump', 'die', 'climb'
      isDead: false,
      slidingDownPole: false,
      autoWalkingToCastle: false
    };
  }

  /**
   * 레벨 1-1 스테이지 타일 및 엔티티 생성
   */
  initLevel() {
    this.levelWidth = 240 * this.tileSize; // 넓은 횡스크롤 맵 (약 7680px)
    this.groundY = 416; // 지면 바닥 Y 좌표 (13번째 타일 라인)

    // 블록 맵: 'Q' (물음표 블록), 'B' (일반 벽돌), 'G' (지면 흙)
    this.blocks = [];

    // [1] 기본 바닥 타일 채우기 (구덩이 구간 고려)
    for (let col = 0; col < 240; col++) {
      // 구덩이 구간 (낙사 지점)
      if ((col >= 38 && col <= 40) || (col >= 82 && col <= 85) || (col >= 148 && col <= 150)) {
        continue; // 바닥 없음
      }

      // 지면 바닥 2줄
      this.blocks.push({
        type: 'G',
        x: col * this.tileSize,
        y: this.groundY,
        width: this.tileSize,
        height: this.tileSize
      });
      this.blocks.push({
        type: 'G',
        x: col * this.tileSize,
        y: this.groundY + this.tileSize,
        width: this.tileSize,
        height: this.tileSize
      });
    }

    // [2] 물음표 및 벽돌 블록 구조물 배치
    const blockLayout = [
      // 초반 맛보기 블록들
      { col: 14, row: 8, type: 'Q', content: 'coin' },
      { col: 18, row: 8, type: 'B' },
      { col: 19, row: 8, type: 'Q', content: 'mushroom' }, // 슈퍼 머쉬룸
      { col: 20, row: 8, type: 'B' },
      { col: 21, row: 8, type: 'Q', content: 'coin' },
      { col: 22, row: 8, type: 'B' },

      // 상공 고층 블록 (점프해서 칠 수 있는)
      { col: 20, row: 4, type: 'Q', content: 'coin' },

      // 파이프 사이 벽돌 구간
      { col: 46, row: 8, type: 'B' },
      { col: 47, row: 8, type: 'Q', content: 'mushroom' },
      { col: 48, row: 8, type: 'B' },
      { col: 53, row: 4, type: 'B' },
      { col: 54, row: 4, type: 'B' },
      { col: 55, row: 4, type: 'B' },
      { col: 56, row: 4, type: 'B' },
      { col: 57, row: 4, type: 'B' },

      // 연속 물음표 코인 보너스 존
      { col: 88, row: 8, type: 'Q', content: 'coin' },
      { col: 89, row: 8, type: 'B' },
      { col: 90, row: 8, type: 'Q', content: 'coin' },
      { col: 91, row: 4, type: 'Q', content: 'coin' },

      // 후반 벽돌 롱 플랫폼
      { col: 110, row: 8, type: 'B' },
      { col: 111, row: 8, type: 'B' },
      { col: 112, row: 8, type: 'Q', content: 'mushroom' },
      { col: 113, row: 8, type: 'B' },
      { col: 118, row: 4, type: 'B' },
      { col: 119, row: 4, type: 'B' },
      { col: 120, row: 4, type: 'B' },
    ];

    blockLayout.forEach(b => {
      this.blocks.push({
        type: b.type,
        content: b.content || 'empty',
        x: b.col * this.tileSize,
        y: b.row * this.tileSize,
        width: this.tileSize,
        height: this.tileSize,
        isEmpty: false,
        bounceY: 0,
        bounceVy: 0
      });
    });

    // [3] 계단식 피라미드 블록 (깃대 앞 클래식 계단)
    const buildStairs = (startCol, height, direction = 1) => {
      for (let h = 1; h <= height; h++) {
        for (let step = 0; step < h; step++) {
          const c = direction === 1 ? startCol + (h - 1) : startCol + (height - h);
          const r = 12 - step;
          this.blocks.push({
            type: 'B',
            x: c * this.tileSize,
            y: r * this.tileSize,
            width: this.tileSize,
            height: this.tileSize,
            isStair: true
          });
        }
      }
    };
    buildStairs(126, 4, 1);
    buildStairs(132, 4, -1);
    buildStairs(160, 8, 1); // 깃대 바로 앞 8단 계단

    // [4] 녹색 원근 파이프 배치 (col, 높이 타일 수)
    this.pipes = [
      { col: 26, heightTiles: 2 },
      { col: 34, heightTiles: 3 },
      { col: 42, heightTiles: 4 },
      { col: 64, heightTiles: 2 },
      { col: 102, heightTiles: 3 },
      { col: 140, heightTiles: 2 }
    ].map(p => {
      const width = this.tileSize * 1.8;
      const height = p.heightTiles * this.tileSize;
      const x = p.col * this.tileSize;
      const y = this.groundY - height;
      return { x, y, width, height };
    });

    // [5] 깃대 & 성채 (클리어 골인 지점)
    this.flagpole = {
      x: 178 * this.tileSize,
      y: 130,
      height: 286,
      flagY: 140,
      isReached: false
    };

    this.castle = {
      x: 185 * this.tileSize,
      y: this.groundY - 140,
      width: 140,
      height: 140
    };

    // [6] 적 (사이클롭스 오거) 스폰 배치
    this.enemies = [
      { x: 22 * this.tileSize, y: this.groundY, vx: -1.0 },
      { x: 30 * this.tileSize, y: this.groundY, vx: -1.0 },
      { x: 45 * this.tileSize, y: this.groundY, vx: -1.0 },
      { x: 50 * this.tileSize, y: this.groundY, vx: -1.0 },
      { x: 72 * this.tileSize, y: this.groundY, vx: -1.0 },
      { x: 76 * this.tileSize, y: this.groundY, vx: -1.0 },
      { x: 96 * this.tileSize, y: this.groundY, vx: -1.0 },
      { x: 114 * this.tileSize, y: this.groundY, vx: -1.0 },
      { x: 117 * this.tileSize, y: this.groundY, vx: -1.0 },
      { x: 144 * this.tileSize, y: this.groundY, vx: -1.0 },
    ].map(e => ({
      x: e.x,
      y: e.y,
      vx: e.vx,
      vy: 0,
      width: 26,
      height: 28,
      facing: -1,
      isSquashed: false,
      squashTimer: 0,
      isDead: false,
      animFrame: 0,
      animTimer: 0
    }));

    // 코인 및 버섯 아이템 초기화
    this.items = [];
    this.particles = [];
  }

  /**
   * 키보드 이벤트 핸들러 바인딩
   */
  handleKeyDown(code) {
    if (this.state === 'GAMEOVER' || this.state === 'CLEARED') return;

    soundSynth.initContext(); // 사용자 인터랙션 시 오디오 컨텍스트 웜업

    if (code === 'ArrowLeft' || code === 'KeyA') this.keys.left = true;
    if (code === 'ArrowRight' || code === 'KeyD') this.keys.right = true;
    if (code === 'ArrowUp' || code === 'KeyW' || code === 'Space') {
      if (!this.keys.jump && this.player.onGround) {
        this.keys.jump = true;
        this.player.vy = -9.2; // 초기 점프 속도
        this.player.onGround = false;
        this.player.isJumping = true;
        this.player.jumpTimer = 14; // 가변 점프 유지 프레임 카운트
        soundSynth.playJump();
      }
    }
    if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyX') {
      this.keys.run = true;
    }
  }

  handleKeyUp(code) {
    if (code === 'ArrowLeft' || code === 'KeyA') this.keys.left = false;
    if (code === 'ArrowRight' || code === 'KeyD') this.keys.right = false;
    if (code === 'ArrowUp' || code === 'KeyW' || code === 'Space') {
      this.keys.jump = false;
      this.player.jumpTimer = 0; // 점프 키를 일찍 떼면 상승 멈춤 (가변 점프)
    }
    if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyX') {
      this.keys.run = false;
    }
  }

  /**
   * 60FPS 고정 물리 업데이트 루프
   */
  update() {
    if (this.state === 'GAMEOVER') {
      // 사망 연출 (위로 살짝 튀었다가 화면 아래로 떨어짐)
      this.player.vy += 0.4;
      this.player.y += this.player.vy;
      return;
    }

    if (this.state === 'FLAGPOLE') {
      this.updateFlagpoleSequence();
      return;
    }

    if (this.state === 'CLEARED') {
      return;
    }

    // 시간 카운트다운
    this.timeCounter++;
    if (this.timeCounter % 60 === 0 && this.timeLeft > 0) {
      this.timeLeft--;
      if (this.callbacks.onTime) this.callbacks.onTime(this.timeLeft);
      if (this.timeLeft === 0) {
        this.playerDie();
        return;
      }
    }

    const p = this.player;

    // 무적 시간 감소
    if (p.invincibleTimer > 0) p.invincibleTimer--;

    // ============================================
    // [1] 수평 이동 및 마찰력 물리 연산
    // ============================================
    const maxSpeed = this.keys.run ? 4.8 : 3.2;
    const accel = p.onGround ? 0.42 : 0.28;
    const friction = p.onGround ? 0.84 : 0.94;

    if (this.keys.left) {
      p.vx -= accel;
      p.facing = -1;
      p.state = 'run';
    } else if (this.keys.right) {
      p.vx += accel;
      p.facing = 1;
      p.state = 'run';
    } else {
      p.vx *= friction;
      if (Math.abs(p.vx) < 0.1) p.vx = 0;
      p.state = 'idle';
    }

    // 최고 속도 제한
    p.vx = Math.max(-maxSpeed, Math.min(maxSpeed, p.vx));

    // 수평 이동 적용
    p.x += p.vx;

    // 카메라 왼쪽 벽 제한 (클래식 슈퍼마리오 룰: 뒤로 되돌아가지 못함)
    if (p.x - p.width / 2 < this.cameraX) {
      p.x = this.cameraX + p.width / 2;
      p.vx = 0;
    }

    // 수평 블록 & 파이프 충돌 검사
    this.checkHorizontalCollisions();

    // ============================================
    // [2] 수직 이동 및 중력, 가변 점프 연산
    // ============================================
    const gravity = 0.45;
    if (this.keys.jump && p.jumpTimer > 0) {
      // 점프 키를 계속 누르고 있으면 추가 상승력 부여 (가변 점프)
      p.vy -= 0.35;
      p.jumpTimer--;
    }

    p.vy += gravity;
    p.vy = Math.min(10, p.vy); // 최대 낙하 속도 제한

    p.y += p.vy;
    p.onGround = false;

    // 수직 블록 & 파이프 충돌 검사
    this.checkVerticalCollisions();

    // 점프 중 상태
    if (!p.onGround) {
      p.state = 'jump';
    }

    // 달리기 애니메이션 타이머
    if (p.state === 'run') {
      p.animTimer += Math.abs(p.vx) * 0.15;
      p.animFrame = Math.floor(p.animTimer) % 3;
    } else {
      p.animFrame = 0;
    }

    // 낙사 체크 (구덩이에 빠짐)
    if (p.y > this.height + 60) {
      this.playerDie();
      return;
    }

    // ============================================
    // [3] 카메라 뷰포트 스무스 추적
    // ============================================
    // 플레이어가 화면 45%를 넘어서면 카메라 전진
    const targetCamX = p.x - this.width * 0.45;
    if (targetCamX > this.cameraX) {
      this.cameraX = targetCamX;
    }
    // 맵 끝 제한
    this.cameraX = Math.min(this.levelWidth - this.width, Math.max(0, this.cameraX));

    // ============================================
    // [4] 블록 바운스 애니메이션 복원 업데이트
    // ============================================
    this.blocks.forEach(b => {
      if (b.bounceY !== 0 || b.bounceVy !== 0) {
        b.bounceY += b.bounceVy;
        b.bounceVy += 0.8; // 복원 중력
        if (b.bounceY >= 0) {
          b.bounceY = 0;
          b.bounceVy = 0;
        }
      }
    });

    // ============================================
    // [5] 몬스터 업데이트 & 충돌 판정
    // ============================================
    this.updateEnemies();

    // ============================================
    // [6] 아이템(버섯, 코인) 및 파티클 업데이트
    // ============================================
    this.updateItems();
    this.updateParticles();

    // ============================================
    // [7] 깃대 클리어 판정
    // ============================================
    if (!this.flagpole.isReached && p.x >= this.flagpole.x - 8 && p.x <= this.flagpole.x + 16) {
      if (p.y < this.groundY) {
        this.triggerFlagpole();
      }
    }
  }

  /**
   * 수평 블록 및 파이프 충돌
   */
  checkHorizontalCollisions() {
    const p = this.player;
    const pLeft = p.x - p.width / 2;
    const pRight = p.x + p.width / 2;
    const pTop = p.y - p.height;
    const pBottom = p.y;

    // 파이프와 충돌
    for (const pipe of this.pipes) {
      if (pRight > pipe.x && pLeft < pipe.x + pipe.width && pBottom > pipe.y && pTop < pipe.y + pipe.height) {
        if (p.vx > 0) {
          p.x = pipe.x - p.width / 2;
          p.vx = 0;
        } else if (p.vx < 0) {
          p.x = pipe.x + pipe.width + p.width / 2;
          p.vx = 0;
        }
      }
    }

    // 블록과 수평 충돌
    for (const b of this.blocks) {
      if (pRight > b.x && pLeft < b.x + b.width && pBottom > b.y + 4 && pTop < b.y + b.height - 4) {
        if (p.vx > 0) {
          p.x = b.x - p.width / 2;
          p.vx = 0;
        } else if (p.vx < 0) {
          p.x = b.x + b.width + p.width / 2;
          p.vx = 0;
        }
      }
    }
  }

  /**
   * 수직 블록 및 파이프 충돌 (착지 및 머리 헤딩)
   */
  checkVerticalCollisions() {
    const p = this.player;
    const pLeft = p.x - p.width / 2 + 2;
    const pRight = p.x + p.width / 2 - 2;
    const pTop = p.y - p.height;
    const pBottom = p.y;

    // 파이프 상단 착지
    for (const pipe of this.pipes) {
      if (pRight > pipe.x && pLeft < pipe.x + pipe.width) {
        if (p.vy >= 0 && pBottom >= pipe.y && pBottom <= pipe.y + 12) {
          p.y = pipe.y;
          p.vy = 0;
          p.onGround = true;
        }
      }
    }

    // 블록들과 충돌
    for (let i = this.blocks.length - 1; i >= 0; i--) {
      const b = this.blocks[i];

      if (pRight > b.x && pLeft < b.x + b.width) {
        // [A] 아래로 떨어져 블록 상단에 착지
        if (p.vy >= 0 && pBottom >= b.y && pBottom <= b.y + 14) {
          p.y = b.y;
          p.vy = 0;
          p.onGround = true;
        }
        // [B] 점프하여 블록 하단을 머리로 타격 (헤딩)
        else if (p.vy < 0 && pTop <= b.y + b.height && pTop >= b.y + b.height - 12) {
          p.y = b.y + b.height + p.height;
          p.vy = 0;
          this.hitBlock(b, i);
        }
      }
    }
  }

  /**
   * 머리로 블록을 쳤을 때의 동작 처리
   */
  hitBlock(block, index) {
    if (block.type === 'Q') {
      if (!block.isEmpty) {
        block.isEmpty = true;
        block.bounceY = -8;
        block.bounceVy = -4;

        if (block.content === 'mushroom') {
          // 파워업 버섯 스폰
          soundSynth.playPowerUpSpawn();
          this.items.push({
            type: 'mushroom',
            x: block.x + 2,
            y: block.y - 28,
            vx: 1.5,
            vy: -3,
            width: 26,
            height: 26
          });
        } else {
          // 코인 스폰
          soundSynth.playCoin();
          this.addCoins(1);
          this.addScore(200);

          // 튀어오르는 코인 파티클
          this.particles.push({
            type: 'coin_pop',
            x: block.x + 8,
            y: block.y - 16,
            vy: -6,
            timer: 30
          });
        }
      } else {
        soundSynth.playBump();
      }
    } else if (block.type === 'B') {
      if (this.player.isBig) {
        // 큰 검투사는 일반 벽돌을 4조각으로 산산조각 냄!
        soundSynth.playBrickBreak();
        this.addScore(50);
        this.blocks.splice(index, 1);

        // 4개의 파편 비산 파티클
        const bx = block.x + 8;
        const by = block.y + 8;
        this.particles.push({ type: 'debris', x: bx, y: by, vx: -3, vy: -6, rot: 0, rotSpeed: -0.2 });
        this.particles.push({ type: 'debris', x: bx + 16, y: by, vx: 3, vy: -6, rot: 0, rotSpeed: 0.2 });
        this.particles.push({ type: 'debris', x: bx, y: by + 16, vx: -2, vy: -3, rot: 0, rotSpeed: -0.15 });
        this.particles.push({ type: 'debris', x: bx + 16, y: by + 16, vx: 2, vy: -3, rot: 0, rotSpeed: 0.15 });
      } else {
        // 작은 검투사는 통 튕기기만 함
        soundSynth.playBump();
        block.bounceY = -6;
        block.bounceVy = -3;
      }
    }
  }

  /**
   * 몬스터 (사이클롭스 오거) 물리 및 충돌 처리
   */
  updateEnemies() {
    const p = this.player;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      if (e.isDead) continue;

      if (e.isSquashed) {
        e.squashTimer++;
        if (e.squashTimer > 35) {
          e.isDead = true;
        }
        continue;
      }

      // 카메라 시야 근처(화면 밖 200px)에 있을 때만 활성화
      if (e.x > this.cameraX + this.width + 200 || e.x < this.cameraX - 200) {
        continue;
      }

      // 걷기 애니메이션
      e.animTimer += 0.08;
      e.animFrame = Math.floor(e.animTimer) % 2;

      // 좌우 이동 및 장애물 반전
      e.x += e.vx;

      // 파이프와 충돌 시 방향 전환
      for (const pipe of this.pipes) {
        if (e.x + e.width / 2 > pipe.x && e.x - e.width / 2 < pipe.x + pipe.width && e.y > pipe.y) {
          e.vx = -e.vx;
          e.facing = e.vx > 0 ? 1 : -1;
          e.x += e.vx * 2;
        }
      }

      // ============================================
      // 플레이어와 적의 정밀 AABB 충돌 판정
      // ============================================
      const pLeft = p.x - p.width / 2;
      const pRight = p.x + p.width / 2;
      const pTop = p.y - p.height;
      const pBottom = p.y;

      const eLeft = e.x - e.width / 2;
      const eRight = e.x + e.width / 2;
      const eTop = e.y - e.height;
      const eBottom = e.y;

      if (pRight > eLeft && pLeft < eRight && pBottom > eTop && pTop < eBottom) {
        // [1] 상단에서 적 머리를 밟았을 때! (플레이어가 하강 중)
        if (p.vy > 0 && pBottom <= eTop + 14) {
          e.isSquashed = true;
          soundSynth.playStomp();
          p.vy = -7.5; // 위로 통 튀어오르는 반동
          this.addScore(200);

          // 팝업 점수 텍스트 파티클
          this.particles.push({
            type: 'score_text',
            text: '200',
            x: e.x,
            y: e.y - 20,
            vy: -1.5,
            timer: 40
          });
        }
        // [2] 측면/몸통 충돌 (피격)
        else if (p.invincibleTimer <= 0) {
          if (p.isBig) {
            // 큰 검투사는 작은 검투사로 축소되며 무적 시간 부여
            p.isBig = false;
            p.height = 36;
            p.invincibleTimer = 90;
            soundSynth.playPowerDown();
          } else {
            // 작은 검투사는 사망
            this.playerDie();
          }
        }
      }
    }
  }

  /**
   * 아이템 (버섯 등) 물리 및 획득 처리
   */
  updateItems() {
    const p = this.player;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];

      if (item.type === 'mushroom') {
        item.vy += 0.4;
        item.y += item.vy;
        item.x += item.vx;

        // 바닥/블록 착지
        if (item.y >= this.groundY - 26) {
          item.y = this.groundY - 26;
          item.vy = 0;
        }

        // 파이프 충돌 시 반전
        for (const pipe of this.pipes) {
          if (item.x + item.width > pipe.x && item.x < pipe.x + pipe.width && item.y + item.height > pipe.y) {
            item.vx = -item.vx;
          }
        }

        // 플레이어와 버섯 충돌 -> 파워업!
        const pLeft = p.x - p.width / 2;
        const pRight = p.x + p.width / 2;
        const pTop = p.y - p.height;
        const pBottom = p.y;

        if (pRight > item.x && pLeft < item.x + item.width && pBottom > item.y && pTop < item.y + item.height) {
          this.items.splice(i, 1);
          soundSynth.playPowerUp();
          p.isBig = true;
          p.height = 54; // 신장 확대!
          this.addScore(1000);

          this.particles.push({
            type: 'score_text',
            text: '1000',
            x: item.x,
            y: item.y - 10,
            vy: -1.5,
            timer: 40
          });
        }
      }
    }
  }

  /**
   * 파티클 애니메이션 업데이트
   */
  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];

      if (pt.type === 'coin_pop') {
        pt.y += pt.vy;
        pt.vy += 0.4;
        pt.timer--;
        if (pt.timer <= 0) this.particles.splice(i, 1);
      } else if (pt.type === 'debris') {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.4;
        pt.rot += pt.rotSpeed;
        if (pt.y > this.height + 50) this.particles.splice(i, 1);
      } else if (pt.type === 'score_text') {
        pt.y += pt.vy;
        pt.timer--;
        if (pt.timer <= 0) this.particles.splice(i, 1);
      }
    }
  }

  /**
   * 깃대 도달 시 슬라이딩 시네마틱 시작
   */
  triggerFlagpole() {
    this.flagpole.isReached = true;
    this.state = 'FLAGPOLE';
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.x = this.flagpole.x;
    this.player.slidingDownPole = true;
    soundSynth.stopBGM();
    soundSynth.playStageClear();
    this.addScore(5000);
  }

  /**
   * 깃대 슬라이딩 및 성채 입성 시퀀스
   */
  updateFlagpoleSequence() {
    const p = this.player;

    if (p.slidingDownPole) {
      // 플레이어와 깃발이 아래로 슬라이딩
      if (p.y < this.groundY) {
        p.y += 3.5;
        this.flagpole.flagY = Math.min(this.groundY - 40, this.flagpole.flagY + 3.5);
      } else {
        // 바닥에 도착 -> 성채를 향해 오른쪽으로 걸어가기
        p.y = this.groundY;
        p.slidingDownPole = false;
        p.autoWalkingToCastle = true;
        p.facing = 1;
      }
    } else if (p.autoWalkingToCastle) {
      p.x += 1.8;
      p.state = 'run';
      p.animTimer += 0.15;
      p.animFrame = Math.floor(p.animTimer) % 3;

      // 성문 안으로 들어감
      if (p.x >= this.castle.x + 60) {
        this.state = 'CLEARED';
        if (this.callbacks.onClear) {
          this.callbacks.onClear(this.score);
        }
      }
    }
  }

  /**
   * 플레이어 사망 처리
   */
  playerDie() {
    if (this.player.isDead) return;
    this.player.isDead = true;
    this.state = 'GAMEOVER';
    this.player.vy = -9; // 위로 튀어오름
    soundSynth.playGameOver();

    this.lives--;
    if (this.callbacks.onLives) this.callbacks.onLives(this.lives);

    setTimeout(() => {
      if (this.callbacks.onGameOver) {
        this.callbacks.onGameOver(this.score, this.lives <= 0);
      }
    }, 2800);
  }

  addScore(pts) {
    this.score += pts;
    if (this.callbacks.onScore) this.callbacks.onScore(this.score);
  }

  addCoins(num) {
    this.coins += num;
    if (this.callbacks.onCoins) this.callbacks.onCoins(this.coins);
  }

  /**
   * 전체 캔버스 2D 렌더링 루틴
   */
  render() {
    const ctx = this.ctx;

    // 화면 지우기 (레트로 하늘색 배경)
    ctx.fillStyle = '#60a5fa'; // 맑은 8비트 하늘색
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    // 카메라 좌표만큼 X축 이동
    ctx.translate(-Math.floor(this.cameraX), 0);

    // [1] 배경 장식 (구름 및 아늑한 산 픽셀 실루엣)
    this.renderBackground(ctx);

    // [2] 깃대 & 성채 렌더링
    Sprites.drawFlagpole(ctx, this.flagpole.x, this.flagpole.y, this.flagpole.height, this.flagpole.flagY);
    Sprites.drawCastle(ctx, this.castle.x, this.castle.y, this.castle.width, this.castle.height);

    // [3] 파이프 렌더링
    for (const pipe of this.pipes) {
      // 상단 림 입구
      Sprites.drawPipe(ctx, pipe.x - 3, pipe.y, pipe.width + 6, 24, true);
      // 하단 원통 기둥
      Sprites.drawPipe(ctx, pipe.x, pipe.y + 24, pipe.width, pipe.height - 24, false);
    }

    // [4] 블록 및 지면 타일 렌더링 (카메라 뷰포트 내 타일만 렌더링하여 성능 극대화)
    const viewLeft = this.cameraX - 60;
    const viewRight = this.cameraX + this.width + 60;

    for (const b of this.blocks) {
      if (b.x + b.width < viewLeft || b.x > viewRight) continue;

      if (b.type === 'G') {
        Sprites.drawGround(ctx, b.x, b.y, b.width);
      } else if (b.type === 'Q') {
        Sprites.drawQuestionBlock(ctx, b.x, b.y, b.width, b.isEmpty, b.bounceY);
      } else if (b.type === 'B') {
        Sprites.drawBrick(ctx, b.x, b.y, b.width, b.bounceY);
      }
    }

    // [5] 아이템 (버섯 등) 렌더링
    for (const item of this.items) {
      if (item.type === 'mushroom') {
        Sprites.drawMushroom(ctx, item.x, item.y, item.width);
      }
    }

    // [6] 몬스터 렌더링
    for (const e of this.enemies) {
      if (e.isDead) continue;
      if (e.x + 50 < viewLeft || e.x - 50 > viewRight) continue;
      Sprites.drawMonster(ctx, e.x, e.y, e.animFrame, e.isSquashed, e.facing);
    }

    // [7] 플레이어 렌더링
    const p = this.player;
    if (this.state !== 'CLEARED' || p.x < this.castle.x + 60) {
      Sprites.drawGladiator(
        ctx,
        p.x,
        p.y,
        p.isBig,
        p.facing,
        p.state,
        p.animFrame,
        p.invincibleTimer > 0
      );
    }

    // [8] 파티클 렌더링
    for (const pt of this.particles) {
      if (pt.type === 'coin_pop') {
        Sprites.drawCoin(ctx, pt.x, pt.y, 22);
      } else if (pt.type === 'debris') {
        Sprites.drawDebris(ctx, pt.x, pt.y, 9, pt.rot);
      } else if (pt.type === 'score_text') {
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText(pt.text, pt.x, pt.y);
      }
    }

    ctx.restore();
  }

  /**
   * 8비트 배경 풍경 드로잉
   */
  renderBackground(ctx) {
    // 먼 산 실루엣
    for (let i = 0; i < 20; i++) {
      const mx = i * 400 + 40;
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(mx, this.groundY);
      ctx.lineTo(mx + 70, this.groundY - 60);
      ctx.lineTo(mx + 140, this.groundY);
      ctx.closePath();
      ctx.fill();

      // 산 하이라이트
      ctx.fillStyle = '#34d399';
      ctx.fillRect(mx + 66, this.groundY - 60, 8, 8);
    }

    // 뭉게구름
    for (let c = 0; c < 25; c++) {
      const cx = c * 320 + 80;
      const cy = 70 + (c % 3) * 35;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(cx, cy, 54, 18);
      ctx.fillRect(cx + 10, cy - 10, 34, 14);
      ctx.fillRect(cx + 42, cy - 4, 16, 12);
    }
  }

  /**
   * 게임 루프 시작
   */
  start() {
    const loop = (timestamp) => {
      this.update();
      this.render();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
    soundSynth.startBGM();
  }

  /**
   * 게임 루프 정지
   */
  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    soundSynth.stopBGM();
  }

  /**
   * 스테이지 재시작 (라이프 유지 또는 전체 리셋)
   */
  restart(fullReset = false) {
    this.stop();
    if (fullReset) {
      this.lives = 3;
      this.score = 0;
      this.coins = 0;
    }
    this.timeLeft = 300;
    this.cameraX = 0;
    this.state = 'PLAYING';
    this.initPlayer();
    this.initLevel();
    this.start();
  }
}
