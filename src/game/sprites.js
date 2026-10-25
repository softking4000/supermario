/**
 * ====================================================================
 * 🎨 [제로 에셋 순수 Canvas 2D 픽셀 스프라이트 렌더링 엔진]
 * ====================================================================
 * 외부 PNG/GIF/JPG 이미지를 일절 사용하지 않고, 
 * HTML5 Canvas 2D 컨텍스트의 `ctx.fillRect` 및 정밀 좌표 드로잉을 통해
 * 8비트 레트로 도트 그래픽을 100% 브라우저 순수 코드로 직접 렌더링합니다.
 * 
 * [캐릭터 레퍼런스 반영]
 * - 작은/큰 검투사: 붉은 깃털 볏 투구, 청동/황금 갑주, 붉은 망토, 검과 방패
 * - 몬스터: 뿔 달린 사이클롭스 오거(갈색 바디, 붉은 외눈, 2프레임 뒤뚱 걷기, 밟힘 압축)
 */

export const Sprites = {
  /**
   * [1] 검투사 (Gladiator) 렌더링
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} x - 중심 하단 X
   * @param {number} y - 바닥 접지 Y
   * @param {boolean} isBig - 큰 검투사 여부 (버섯 파워업 상태)
   * @param {number} facing - 바라보는 방향 (1: 오른쪽, -1: 왼쪽)
   * @param {string} state - 'idle', 'run', 'jump', 'die'
   * @param {number} animFrame - 달리기 프레임 카운터 (0, 1, 2)
   * @param {boolean} isInvincible - 피격 무적 깜빡임 상태 여부
   */
  drawGladiator(ctx, x, y, isBig, facing, state, animFrame, isInvincible = false) {
    if (isInvincible && Math.floor(Date.now() / 80) % 2 === 0) {
      // 무적 시간 동안 점멸(깜빡임) 효과
      return;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing, 1);

    // 픽셀 스케일 배율 (작은 검투사: 1.8배, 큰 검투사: 2.6배 및 황금 광택)
    const scale = isBig ? 2.5 : 1.7;
    const p = scale; // 1픽셀 크기

    // 색상 팔레트 (레퍼런스 이미지 기반)
    const cRedPlume = isBig ? '#dc2626' : '#ef4444'; // 볏/망토 진홍색
    const cPlumeDark = '#991b1b';
    const cGoldHelm = isBig ? '#fde047' : '#d97706'; // 투구/갑옷 (황금/청동)
    const cGoldLight = isBig ? '#fef08a' : '#f59e0b';
    const cBronzeDark = isBig ? '#ca8a04' : '#92400e';
    const cSkin = '#ffedd5'; // 피부톤
    const cSteelBlade = '#f1f5f9'; // 검 날
    const cSteelDark = '#64748b';
    const cBelt = '#78350f'; // 가죽 허리띠

    // 달리기 애니메이션에 따른 다리/망토 오프셋
    let legOffset = 0;
    let capeSway = 0;
    if (state === 'run') {
      const f = animFrame % 3;
      if (f === 1) { legOffset = 2; capeSway = -3; }
      else if (f === 2) { legOffset = -2; capeSway = 3; }
    } else if (state === 'jump') {
      legOffset = 3;
      capeSway = -4; // 점프 시 망토가 뒤로 펄럭임
    } else if (state === 'die') {
      // 쓰러진 상태
      ctx.rotate(-Math.PI / 2);
    }

    // --- [1] 등 뒤 붉은 망토 (Cape) ---
    ctx.fillStyle = cPlumeDark;
    ctx.fillRect(-6 * p + capeSway, -14 * p, 4 * p, 10 * p);
    ctx.fillStyle = cRedPlume;
    ctx.fillRect(-5 * p + capeSway, -13 * p, 3 * p, 9 * p);

    // --- [2] 다리 및 샌들 (Legs & Greaves) ---
    // 왼다리
    ctx.fillStyle = cBronzeDark;
    ctx.fillRect(-4 * p + legOffset, -6 * p, 3 * p, 6 * p);
    ctx.fillStyle = cBelt;
    ctx.fillRect(-5 * p + legOffset, -2 * p, 4 * p, 2 * p); // 발
    // 오른다리
    ctx.fillStyle = cGoldHelm;
    ctx.fillRect(1 * p - legOffset, -6 * p, 3 * p, 6 * p);
    ctx.fillStyle = cBelt;
    ctx.fillRect(0 * p - legOffset, -2 * p, 4 * p, 2 * p); // 발

    // --- [3] 갑옷 몸통 & 스커트 (Torso, Cuirass, Pteruges) ---
    ctx.fillStyle = cBelt;
    ctx.fillRect(-4 * p, -8 * p, 8 * p, 3 * p); // 허리 가죽 스커트
    ctx.fillStyle = cGoldHelm;
    ctx.fillRect(-4 * p, -14 * p, 8 * p, 6 * p); // 청동 흉갑
    ctx.fillStyle = cGoldLight;
    ctx.fillRect(-2 * p, -13 * p, 4 * p, 4 * p); // 흉갑 하이라이트

    // 큰 검투사 전용: 가슴에 황금 사자 문양 픽셀 디테일
    if (isBig) {
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-1 * p, -12 * p, 2 * p, 2 * p);
    }

    // --- [4] 얼굴 & 투구 (Spartan Helmet) ---
    // 턱과 목
    ctx.fillStyle = cSkin;
    ctx.fillRect(-2 * p, -16 * p, 4 * p, 2 * p);

    // 청동 투구 본체
    ctx.fillStyle = cGoldHelm;
    ctx.fillRect(-5 * p, -22 * p, 10 * p, 7 * p);
    ctx.fillStyle = cBronzeDark;
    // T자형 바이저 안쪽 (페이스 슬릿)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-1 * p, -19 * p, 3 * p, 3 * p); // 십자형 눈/코 틈
    ctx.fillRect(-3 * p, -19 * p, 6 * p, 1 * p); // 눈 슬릿

    // 눈 틈 사이로 번뜩이는 전사의 눈빛
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(0, -19 * p, 1 * p, 1 * p);

    // 투구 뺨 가호대
    ctx.fillStyle = cGoldLight;
    ctx.fillRect(-4 * p, -18 * p, 2 * p, 3 * p);

    // --- [5] 투구 위의 붉은 볏 (Plume / Crest) ---
    ctx.fillStyle = cPlumeDark;
    ctx.fillRect(-5 * p, -25 * p, 10 * p, 3 * p);
    ctx.fillStyle = cRedPlume;
    ctx.fillRect(-4 * p, -26 * p, 8 * p, 3 * p);
    ctx.fillRect(-2 * p, -27 * p, 5 * p, 2 * p); // 최고 정점 깃털

    // --- [6] 왼손 청동 방패 (Scutum / Round Shield) ---
    // 원형 방패 (픽셀 스텝으로 둥글게 표현)
    ctx.fillStyle = cBronzeDark;
    ctx.fillRect(-8 * p, -15 * p, 3 * p, 8 * p);
    ctx.fillRect(-9 * p, -14 * p, 5 * p, 6 * p);
    ctx.fillStyle = cGoldHelm;
    ctx.fillRect(-8 * p, -13 * p, 3 * p, 4 * p);
    ctx.fillStyle = isBig ? '#fef08a' : '#ffffff';
    ctx.fillRect(-7 * p, -12 * p, 1 * p, 2 * p); // 방패 중앙 보스(돌기)

    // --- [7] 오른손 검 (Gladius Sword) ---
    // 손잡이
    ctx.fillStyle = cBelt;
    ctx.fillRect(4 * p, -11 * p, 2 * p, 2 * p);
    // 칼날
    ctx.fillStyle = cSteelBlade;
    ctx.fillRect(6 * p, -15 * p, 2 * p, 7 * p);
    ctx.fillRect(7 * p, -16 * p, 1 * p, 2 * p); // 칼끝
    ctx.fillStyle = cSteelDark;
    ctx.fillRect(5 * p, -14 * p, 1 * p, 5 * p); // 칼날 그림자

    // 큰 검투사 상태일 때 칼날에 번뜩이는 마법 오라
    if (isBig) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.fillRect(6 * p, -17 * p, 2 * p, 10 * p);
    }

    ctx.restore();
  },

  /**
   * [2] 몬스터: 사이클롭스 오거 (Cyclops Ogre) 렌더링
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} x - 중심 하단 X
   * @param {number} y - 바닥 접지 Y
   * @param {number} animFrame - 0 or 1 (뒤뚱거리는 2프레임 걷기)
   * @param {boolean} isSquashed - 밟혀서 납작해진 상태 여부
   * @param {number} facing - 바라보는 방향 (1 or -1)
   */
  drawMonster(ctx, x, y, animFrame, isSquashed = false, facing = -1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing, 1);

    const p = 1.7; // 픽셀 배율

    if (isSquashed) {
      // ============================================
      // [납작하게 밟힌 프레임 (Squished Frame)]
      // ============================================
      // 높이는 납작해지고 좌우로 퍼짐
      ctx.fillStyle = '#451a03'; // 어두운 갈색 털
      ctx.fillRect(-10 * p, -6 * p, 20 * p, 6 * p);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-8 * p, -5 * p, 16 * p, 4 * p);
      
      // X자로 감긴 패배한 눈
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-2 * p, -4 * p, 4 * p, 2 * p);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1 * p, -3 * p, 2 * p, 1 * p);

      // 양옆으로 부러져 누운 뿔
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-11 * p, -4 * p, 3 * p, 2 * p);
      ctx.fillRect(8 * p, -4 * p, 3 * p, 2 * p);

      ctx.restore();
      return;
    }

    // ============================================
    // [뒤뚱뒤뚱 2프레임 걷기 애니메이션 (Walking)]
    // ============================================
    const step = animFrame % 2; // 0 or 1
    const bodyTilt = step === 0 ? -1 : 1;
    const legOffset1 = step === 0 ? 2 : -2;
    const legOffset2 = step === 0 ? -2 : 2;

    // --- 다리 (Legs & Claws) ---
    ctx.fillStyle = '#451a03'; // 짙은 갈색 털
    ctx.fillRect(-6 * p + legOffset1, -4 * p, 4 * p, 4 * p);
    ctx.fillRect(2 * p + legOffset2, -4 * p, 4 * p, 4 * p);
    // 발톱
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-7 * p + legOffset1, -1 * p, 2 * p, 1 * p);
    ctx.fillRect(4 * p + legOffset2, -1 * p, 2 * p, 1 * p);

    // --- 몸체 (Body / Fur) ---
    ctx.fillStyle = '#572608';
    ctx.fillRect(-7 * p + bodyTilt, -15 * p, 14 * p, 11 * p);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-6 * p + bodyTilt, -14 * p, 12 * p, 9 * p);

    // 어깨 가죽/철 견갑 (Shoulder Armor)
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-9 * p, -14 * p, 3 * p, 5 * p);
    ctx.fillRect(6 * p, -14 * p, 3 * p, 5 * p);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-8 * p, -13 * p, 1 * p, 2 * p); // 견갑 리벳

    // 가죽 팬츠 / 허리띠
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(-5 * p, -6 * p, 10 * p, 2 * p);

    // --- 붉은 외눈 (Red Cyclops Eye) ---
    // 눈구멍
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(-3 * p + bodyTilt, -12 * p, 6 * p, 5 * p);
    // 붉은 홍채
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-2 * p + bodyTilt, -11 * p, 4 * p, 3 * p);
    // 동공 및 하이라이트
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1 * p + bodyTilt, -11 * p, 1 * p, 1 * p);
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(0 + bodyTilt, -10 * p, 1 * p, 2 * p);

    // --- 큰 입과 송곳니 (Fangs & Mouth) ---
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-4 * p + bodyTilt, -6 * p, 8 * p, 2 * p);
    // 아래에서 솟아난 송곳니
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-3 * p + bodyTilt, -7 * p, 2 * p, 2 * p);
    ctx.fillRect(1 * p + bodyTilt, -7 * p, 2 * p, 2 * p);

    // --- 머리 위의 뿔 (Horns) ---
    ctx.fillStyle = '#cbd5e1';
    // 왼쪽 뿔
    ctx.fillRect(-7 * p, -18 * p, 3 * p, 4 * p);
    ctx.fillRect(-8 * p, -19 * p, 2 * p, 2 * p);
    // 오른쪽 뿔
    ctx.fillRect(4 * p, -18 * p, 3 * p, 4 * p);
    ctx.fillRect(6 * p, -19 * p, 2 * p, 2 * p);

    ctx.restore();
  },

  /**
   * [3] 물음표 (?) 블록 렌더링
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} x - 블록 좌상단 X
   * @param {number} y - 블록 좌상단 Y
   * @param {number} size - 타일 크기 (보통 32px)
   * @param {boolean} isEmpty - 이미 타격되어 비어있는 블록인지 여부
   * @param {number} bounceY - 아래에서 쳤을 때 위로 튀는 오프셋
   */
  drawQuestionBlock(ctx, x, y, size, isEmpty, bounceY = 0) {
    const drawY = y + bounceY;

    if (isEmpty) {
      // 타격 후 비어있는 갈색 금속 블록
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x, drawY, size, size);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(x + 2, drawY + 2, size - 4, size - 4);
      // 네 모서리 리벳
      ctx.fillStyle = '#b45309';
      ctx.fillRect(x + 4, drawY + 4, 3, 3);
      ctx.fillRect(x + size - 7, drawY + 4, 3, 3);
      ctx.fillRect(x + 4, drawY + size - 7, 3, 3);
      ctx.fillRect(x + size - 7, drawY + size - 7, 3, 3);
      return;
    }

    // 반짝이는 황금 물음표 블록
    const pulse = (Math.sin(Date.now() / 200) + 1) / 2; // 0 ~ 1 진동
    const baseColor = pulse > 0.5 ? '#f59e0b' : '#d97706';
    const lightColor = '#fef08a';
    const darkColor = '#92400e';

    // 테두리 및 그림자
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x, drawY, size, size);

    // 블록 면
    ctx.fillStyle = baseColor;
    ctx.fillRect(x + 2, drawY + 2, size - 4, size - 4);

    // 상단/좌측 하이라이트
    ctx.fillStyle = lightColor;
    ctx.fillRect(x + 2, drawY + 2, size - 4, 3);
    ctx.fillRect(x + 2, drawY + 2, 3, size - 4);

    // 하단/우측 림 그림자
    ctx.fillStyle = darkColor;
    ctx.fillRect(x + 2, drawY + size - 5, size - 4, 3);
    ctx.fillRect(x + size - 5, drawY + 2, 3, size - 4);

    // 네 모서리 리벳 못
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + 5, drawY + 5, 2, 2);
    ctx.fillRect(x + size - 7, drawY + 5, 2, 2);
    ctx.fillRect(x + 5, drawY + size - 7, 2, 2);
    ctx.fillRect(x + size - 7, drawY + size - 7, 2, 2);

    // 중앙 물음표 (?) 도트 드로잉
    ctx.fillStyle = '#451a03';
    const cx = x + size / 2;
    const cy = drawY + size / 2;

    // ? 상단 둥근 고리
    ctx.fillRect(cx - 5, cy - 8, 10, 3);
    ctx.fillRect(cx - 6, cy - 6, 3, 4);
    ctx.fillRect(cx + 3, cy - 6, 3, 5);
    ctx.fillRect(cx - 1, cy - 2, 4, 4);
    // ? 하단 점
    ctx.fillRect(cx - 1, cy + 5, 4, 4);
  },

  /**
   * [4] 일반 벽돌 (Brick Block) 렌더링
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} x 
   * @param {number} y 
   * @param {number} size 
   * @param {number} bounceY 
   */
  drawBrick(ctx, x, y, size, bounceY = 0) {
    const drawY = y + bounceY;

    // 적갈색 벽돌
    ctx.fillStyle = '#451a03'; // 몰탈(줄눈) 어두운 선
    ctx.fillRect(x, drawY, size, size);

    ctx.fillStyle = '#b45309'; // 벽돌 주황 갈색
    ctx.fillRect(x + 1, drawY + 1, size - 2, size - 2);

    // 벽돌 텍스처 줄눈 패턴
    const midY = drawY + size / 2;
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x, midY - 1, size, 2); // 수평선

    // 윗단 세로 줄눈
    ctx.fillRect(x + size / 2 - 1, drawY, 2, size / 2);
    // 아랫단 엇갈린 세로 줄눈
    ctx.fillRect(x + size / 4 - 1, midY, 2, size / 2);
    ctx.fillRect(x + (size * 3) / 4 - 1, midY, 2, size / 2);

    // 각 벽돌 상단 하이라이트
    ctx.fillStyle = '#d97706';
    ctx.fillRect(x + 2, drawY + 2, size / 2 - 4, 2);
    ctx.fillRect(x + size / 2 + 2, drawY + 2, size / 2 - 4, 2);
    ctx.fillRect(x + 2, midY + 2, size / 4 - 3, 2);
    ctx.fillRect(x + size / 4 + 2, midY + 2, size / 2 - 4, 2);
  },

  /**
   * [5] 지면/흙 타일 (Ground Tile)
   */
  drawGround(ctx, x, y, size) {
    // 윗면 초록 잔디 또는 청동 아레나 바닥
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x, y, size, size);

    // 흙 본체
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x, y + 4, size, size - 4);

    // 상단 녹색/황금 잔디 층
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(x, y, size, 5);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(x, y, size, 2);

    // 흙 안쪽 돌멩이 픽셀 디테일
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + 6, y + 10, 4, 3);
    ctx.fillRect(x + 18, y + 16, 5, 4);
    ctx.fillRect(x + 10, y + 24, 3, 3);
  },

  /**
   * [6] 녹색 원근 파이프 (Warp Pipe)
   */
  drawPipe(ctx, x, y, width, height, isTopPart = false) {
    // 파이프 짙은 녹색 테두리
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(x, y, width, height);

    // 파이프 본체 그라데이션 시뮬레이션 (3D 원통 입체감)
    // 좌측 어두운 림
    ctx.fillStyle = '#047857';
    ctx.fillRect(x + 2, y, 6, height);
    // 밝은 하이라이트 반사광
    ctx.fillStyle = '#34d399';
    ctx.fillRect(x + 8, y, 8, height);
    // 중간 녹색
    ctx.fillStyle = '#10b981';
    ctx.fillRect(x + 16, y, width - 24, height);
    // 우측 깊은 그림자
    ctx.fillStyle = '#065f46';
    ctx.fillRect(x + width - 8, y, 6, height);

    // 입구 테두리 하단 그림자 (탑 부분인 경우)
    if (isTopPart) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(x, y + height - 4, width, 4);
    }
  },

  /**
   * [7] 회전하는 황금 코인 (Spinning Coin)
   */
  drawCoin(ctx, x, y, size = 20) {
    const frame = Math.floor(Date.now() / 120) % 4; // 0, 1, 2, 3
    const widthScale = [1.0, 0.6, 0.25, 0.6][frame];

    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);
    ctx.scale(widthScale, 1);

    const r = size / 2;
    // 외곽 테두리
    ctx.fillStyle = '#92400e';
    ctx.fillRect(-r, -r, size, size);

    // 금화 바탕
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-r + 2, -r + 2, size - 4, size - 4);

    // 금빛 하이라이트
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-r + 4, -r + 4, 3, size - 8);

    // 중앙 슬릿
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-1, -r + 6, 2, size - 12);

    ctx.restore();
  },

  /**
   * [8] 파워업 버섯 (Super Mushroom / Elixir)
   */
  drawMushroom(ctx, x, y, size = 30) {
    ctx.save();
    ctx.translate(x, y);

    // 갓 (Red Cap)
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(3, 2, size - 6, size * 0.6);
    ctx.fillRect(1, 6, size - 2, size * 0.45);

    // 흰색 도트 무늬
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(size * 0.35, 4, size * 0.3, size * 0.35); // 중앙 도트
    ctx.fillRect(2, 8, 4, 8); // 좌측 도트
    ctx.fillRect(size - 6, 8, 4, 8); // 우측 도트

    // 자루 (Stem)
    ctx.fillStyle = '#ffedd5';
    ctx.fillRect(5, size * 0.55, size - 10, size * 0.45);

    // 귀여운 눈
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(8, size * 0.65, 3, 5);
    ctx.fillRect(size - 11, size * 0.65, 3, 5);

    ctx.restore();
  },

  /**
   * [9] 부서진 벽돌 파편 파티클 (Brick Debris)
   */
  drawDebris(ctx, x, y, size = 8, rot = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    ctx.fillStyle = '#451a03';
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-size / 2 + 1, -size / 2 + 1, size - 2, size - 2);

    ctx.restore();
  },

  /**
   * [10] 깃대 & 깃발 (Flagpole & Flag)
   */
  drawFlagpole(ctx, x, y, poleHeight, flagY) {
    // 깃대 꼭대기 황금 구슬
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x - 5, y - 10, 14, 10);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x - 3, y - 8, 6, 6);

    // 청동/철 깃대 기둥
    ctx.fillStyle = '#334155';
    ctx.fillRect(x - 2, y, 8, poleHeight);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x, y, 4, poleHeight);

    // 펄럭이는 삼각 깃발 (Flag)
    ctx.fillStyle = '#10b981'; // 승리의 에메랄드 그린
    ctx.beginPath();
    ctx.moveTo(x + 4, flagY);
    ctx.lineTo(x + 36, flagY + 12);
    ctx.lineTo(x + 4, flagY + 24);
    ctx.closePath();
    ctx.fill();

    // 깃발 테두리
    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 깃발 속 황금 별 문양
    ctx.fillStyle = '#fde047';
    ctx.fillRect(x + 12, flagY + 9, 6, 6);
  },

  /**
   * [11] 성채 (Castle)
   */
  drawCastle(ctx, x, y, width = 120, height = 140) {
    // 메인 성벽
    ctx.fillStyle = '#334155';
    ctx.fillRect(x, y + 40, width, height - 40);

    // 성벽 윗부분 총안(성가퀴 - Battlements)
    const bWidth = 16;
    for (let bx = x; bx < x + width; bx += bWidth * 1.5) {
      ctx.fillRect(bx, y + 20, bWidth, 20);
    }

    // 중앙 탑
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 35, y, 50, 40);
    for (let tx = x + 35; tx < x + 85; tx += 14) {
      ctx.fillRect(tx, y - 12, 8, 12);
    }

    // 아치형 성문 (입구)
    ctx.fillStyle = '#020617';
    ctx.fillRect(x + 45, y + height - 55, 30, 55);
    ctx.beginPath();
    ctx.arc(x + 60, y + height - 55, 15, Math.PI, 0);
    ctx.fill();

    // 성문 쇠창살
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    for (let gx = x + 50; gx < x + 75; gx += 6) {
      ctx.beginPath();
      ctx.moveTo(gx, y + height - 55);
      ctx.lineTo(gx, y + height);
      ctx.stroke();
    }
  }
};
