# 젬베 리듬 게임 업그레이드용 최종 바이브코딩 프롬프트

너는 GPT-5.5급 기획력, 게임 UX 설계력, HTML5 Canvas 개발력, Web Audio API 최적화 능력을 모두 갖춘 시니어 웹 리듬게임 개발자다.
지금부터 기존 “젬베 리듬 게임” 프로토타입을 완성도 높은 웹 리듬게임으로 업그레이드해줘.
목표는 단순 데모가 아니라, 실제로 모바일과 데스크톱에서 재미있게 플레이할 수 있는 “젬베 리듬 트레이너 + 캐주얼 리듬 게임”이다.
반드시 아래 요구사항을 모두 반영하고, 구현 중 애매한 부분은 네가 최고의 제품 결정을 내려서 완성해라. 질문하지 말고 합리적으로 결정해서 구현해라.

────────────────────────────────
1. 최종 결과물 형식
────────────────────────────────

다음 중 하나로 구현해라.

1순위:
- index.html 하나에 HTML, CSS, JavaScript를 모두 포함한다.
- 이미지와 오디오는 assets 폴더에서 불러온다.
- 별도 빌드 도구 없이 Live Server 또는 로컬 HTTP 서버에서 바로 실행된다.

파일 구조 예시:

/index.html
/assets/djembe-bg.png
/assets/djembe-real.png
/assets/icon-djembe.png
/assets/note-bass.png
/assets/note-tone.png
/assets/note-slap.png
/assets/sound-bass.wav
/assets/sound-tone.wav
/assets/sound-slap.wav
/assets/sound-hit.wav
/assets/bgm.wav

단, 사용자가 업로드한 원본 파일명이 한글이거나 공백을 포함할 수 있으므로, 코드 상단에 ASSET_MANIFEST 객체를 만들고 파일명을 쉽게 바꿀 수 있게 해라.

예:

const ASSETS = {
  images: {
    introDrum: "assets/vertical-shot-drum-white.jpg",
    playDrum: "assets/Djembe(크몽)[실사].png",
    hitMap: "assets/젬베 게임 앱 Source.png",
    icon: "assets/젬베_아이콘_크몽__채색_-removebg-preview.png",
    noteBass: "assets/젬베 게임 앱 Source02-1.png",
    noteTone: "assets/젬베 게임 앱 Source02-2.png",
    noteSlap: "assets/젬베 게임 앱 Source02-3.png"
  },
  audio: {
    slap: "assets/Djembe-slap.wav",
    bass: "assets/Djembe-Bass.wav",
    tone: "assets/Djembe_Mid.wav",
    hit: "assets/Djembe_hit20.wav",
    countdown: "generated",
    bgm: "generated"
  }
};

오디오나 이미지 파일이 없으면 게임이 죽지 않게 해라.
- 이미지가 없으면 Canvas로 대체 그래픽을 그린다.
- 오디오가 없으면 Web Audio Oscillator로 대체음을 만든다.
- 콘솔에 어떤 에셋이 누락되었는지 친절히 표시한다.

────────────────────────────────
2. 게임 콘셉트
────────────────────────────────

게임 제목:
- “젬베 리듬”

핵심 경험:
- 화면 위에서 노트가 내려온다.
- 하단의 젬베 판정 라인에 노트가 도착할 때 맞춰 입력한다.
- 입력은 Slap, Bass, Tone 세 가지다.
- 각 입력은 실제 젬베 타법처럼 서로 다른 손 위치와 소리, 이펙트로 느껴져야 한다.
- 사용자는 게임을 하면서 자연스럽게 젬베 기본 리듬을 익힌다.

타법 매핑:
- Slap: 왼쪽 레인, 키보드 D, 날카로운 소리, 손가락 끝 이미지
- Bass: 중앙 레인, 키보드 Space, 묵직한 소리, 손바닥 중앙 이미지
- Tone: 오른쪽 레인, 키보드 K, 맑은 소리, 손바닥 위쪽 또는 손가락 아래 이미지

모바일 입력:
- 화면 왼쪽 1/3 터치: Slap
- 화면 가운데 1/3 터치: Bass
- 화면 오른쪽 1/3 터치: Tone
- 가능하면 실제 레인 버튼 영역을 우선 판정하고, 빈 공간 터치는 3분할 판정으로 처리해라.
- pointerdown을 사용하고, touchstart와 click 중복 입력이 생기지 않게 해라.
- 멀티터치도 대응하되 같은 프레임 중복 판정은 방지해라.

────────────────────────────────
3. 화면 구성
────────────────────────────────

게임은 다음 상태를 가진다.

STATE_BOOT:
- 에셋 로딩 화면
- 흰색 배경
- 중앙에 젬베 아이콘
- “젬베 리듬 준비 중...” 텍스트
- 로딩 진행률 표시

STATE_READY:
- 시작 화면
- 배경은 흰색
- 커다란 젬베 실사 이미지를 중앙 또는 하단에 배치
- 배경 이미지는 너무 강하지 않게 opacity를 낮춰 고급스럽게 표시
- 제목 왼쪽에는 첨부된 젬베 아이콘 사용
- 제목: “젬베 리듬”
- 서브카피: “손끝으로 배우는 아프리카 리듬”
- 큰 시작 버튼: “게임 시작”
- 작은 버튼:
  - “연습 모드”
  - “설정”
  - “조작법”
- 키 안내:
  - D = Slap
  - Space = Bass
  - K = Tone
- 모바일에서는 “화면 왼쪽/가운데/오른쪽을 터치하세요” 표시

STATE_COUNTDOWN:
- 게임 시작 전 3초 카운트다운
- 3, 2, 1, START!
- 각 숫자는 화면 중앙에서 커졌다가 튕기듯 사라지는 애니메이션
- 숫자마다 원형 충격파, 별, 작은 파티클이 퍼진다.
- 카운트다운마다 짧은 사운드 재생
- START에서는 더 밝고 큰 사운드와 화면 플래시
- 카운트다운 중에는 노트가 미리 살짝 보이기 시작해도 되지만 입력 판정은 START 이후부터 활성화한다.

STATE_PLAYING:
- 실제 게임 화면
- 상단 HUD:
  - 왼쪽: 점수 Score
  - 중앙: 콤보 Combo
  - 오른쪽: 정확도 Accuracy
  - 추가로 남은 시간 또는 진행 바
- 중앙:
  - 세 개의 노트 레인
  - 레인 구분선은 은은하게 표시
  - 노트가 위에서 아래로 천천히 내려옴
- 하단:
  - 젬베 이미지
  - 젬베 위에 세 개의 원형 판정 영역
  - Slap/Bass/Tone 라벨
  - 키 힌트 D/Space/K
  - 판정 라인
- 입력 시:
  - 해당 판정 영역이 눌리는 애니메이션
  - 젬베 표면에 빛나는 원형 ripple
  - 손 위치별 glow
  - 작은 진동 느낌의 drum shake
  - 모바일에서는 navigator.vibrate가 가능하면 10~20ms 진동

STATE_RESULT:
- 결과창
- 제목 왼쪽에 젬베 아이콘
- 제목: “게임 종료”
- 결과 표시:
  - 최종 점수
  - 최고 콤보
  - Perfect / Great / Good / Miss 개수
  - 정확도 %
  - 등급 S/A/B/C/D
  - 한 줄 피드백
- 버튼:
  - “다시 하기”
  - “연습 모드”
  - “처음으로”

────────────────────────────────
4. Canvas 렌더링 요구사항
────────────────────────────────

Canvas를 메인 렌더링으로 사용해라.

필수:
- requestAnimationFrame 기반 게임 루프
- deltaTime 기반 이동
- devicePixelRatio 대응
- resize 대응
- 모바일 세로 화면 최적화
- 데스크톱에서는 16:9 또는 중앙 고정형 레이아웃
- Canvas 내부 좌표계와 실제 CSS 크기를 분리해서 고해상도에서도 선명하게 보이게 해라.

추천 기준:
- 내부 기준 해상도: 1080 x 1920 세로형
- 데스크톱에서는 max-width 520px 정도의 모바일 게임 화면처럼 보여도 좋다.
- 게임 플레이 중심은 세로형 모바일 리듬 게임 느낌으로 설계한다.

레이어 구조:
1. Background layer
2. Lane layer
3. Note layer
4. Drum layer
5. Hit zone layer
6. Particle layer
7. HUD layer
8. Overlay layer

코드는 다음 클래스로 구조화해라.

class AssetLoader
class AudioEngine
class Game
class GameStateManager
class InputController
class ChartManager
class NoteManager
class ScoringSystem
class ParticleSystem
class Renderer
class UIManager
class CalibrationManager

하나의 index.html 안에 넣더라도 논리적으로 클래스를 나눠라.

────────────────────────────────
5. 레인과 노트 배치
────────────────────────────────

기존 문제였던 노트 겹침을 완전히 해결해라.

레인:
- Slap lane x = 24%
- Bass lane x = 50%
- Tone lane x = 76%
- 모바일 폭이 좁아도 최소 레인 간격을 유지한다.
- 노트 크기는 화면 폭에 따라 조절하되, 세 노트가 동시에 나와도 절대 겹치지 않게 한다.
- 레인 폭, 노트 반지름, 이미지 크기는 CONFIG에서 조절 가능하게 한다.

예시 CONFIG:

const CONFIG = {
  lanes: {
    slap: { id: "slap", label: "SLAP", key: "KeyD", xRatio: 0.24 },
    bass: { id: "bass", label: "BASS", key: "Space", xRatio: 0.50 },
    tone: { id: "tone", label: "TONE", key: "KeyK", xRatio: 0.76 }
  },
  note: {
    radiusRatio: 0.055,
    minRadius: 34,
    maxRadius: 54,
    approachTimeMs: 2600,
    spawnOffsetY: 120,
    minGlobalGapMs: 420,
    minSameLaneGapMs: 720
  },
  judgement: {
    perfectMs: 45,
    greatMs: 90,
    goodMs: 140,
    missMs: 180
  }
};

노트 낙하:
- 노트는 단순 y += speed가 아니라 “도착 시간 기반”으로 계산한다.
- 각 노트는 hitTimeMs를 가진다.
- 현재 게임 시간 currentTimeMs와 approachTimeMs를 이용해 위치를 계산한다.

공식:
progress = 1 - (note.hitTimeMs - currentTimeMs) / approachTimeMs
y = lerp(spawnY, judgementY, progress)

이 방식으로 프레임 드랍이 있어도 노트와 음악 싱크가 유지되게 해라.

노트 간격:
- 기본적으로 초보자가 칠 수 있게 넉넉하게 벌린다.
- 같은 레인 연타는 최소 720ms 이상 간격을 둔다.
- 서로 다른 레인도 최소 420ms 이상 간격을 둔다.
- 동시에 여러 노트를 치는 패턴은 MVP에서는 넣지 않는다.
- 후반부에 난이도를 올리더라도 겹치는 노트는 금지한다.

────────────────────────────────
6. 리듬 차트 설계
────────────────────────────────

내장 차트를 최소 3개 만들어라.

1. Tutorial
- BPM 72
- 30~40초
- Bass → Tone → Slap을 천천히 익힘
- 거의 모든 노트 간격 1박 이상

2. Groove 1
- BPM 84
- 45~60초
- Bass 중심의 기본 리듬
- Tone과 Slap이 적당히 섞임
- 초보자도 성공 가능

3. Groove 2
- BPM 96
- 60초 내외
- 조금 더 리듬감 있음
- 그래도 노트 겹침은 절대 금지

차트 데이터는 코드 안에서 배열로 관리해라.

예:

const CHARTS = {
  tutorial: {
    title: "Tutorial",
    bpm: 72,
    durationMs: 40000,
    notes: [
      { beat: 4, lane: "bass" },
      { beat: 6, lane: "tone" },
      { beat: 8, lane: "slap" }
    ]
  }
};

beat를 ms로 변환하는 함수를 만들어라.

beatToMs(beat, bpm) = beat * (60000 / bpm)

차트 생성 후 다음 검증 함수를 반드시 실행해라.
- validateChartSpacing(chart)
- validateNoOverlappingNotes(chart)
- validateLaneIds(chart)

검증 실패 시 콘솔 경고를 내고 자동으로 간격을 벌려라.

────────────────────────────────
7. 오디오 엔진
────────────────────────────────

Web Audio API의 AudioContext를 사용해라.

필수:
- 사용자 첫 클릭 또는 터치 후 AudioContext 생성/resume
- 모든 wav/mp3 파일을 fetch → arrayBuffer → decodeAudioData로 미리 디코딩
- 입력 즉시 playBuffer로 소리 재생
- 사운드 재생 지연을 줄이기 위해 HTMLAudioElement 대신 AudioBufferSourceNode 사용
- 각 사운드별 gain 조절
- masterGain, sfxGain, bgmGain 분리
- BGM이 없으면 Web Audio로 간단한 퍼커션 루프를 생성
- 카운트다운 사운드는 파일이 없으면 oscillator로 생성
- 결과창으로 넘어갈 때 불필요한 source 정리

AudioEngine 구조:

class AudioEngine {
  constructor()
  async init()
  async loadBuffer(name, url)
  play(name, options = {})
  playCountdown(step)
  playHit(lane, judgement)
  playMiss()
  startBgm(chart)
  stopBgm()
  getCurrentAudioTimeMs()
}

사운드 매핑:
- slap: D 키, 날카롭고 높은 gain, 짧은 어택
- bass: Space 키, 낮고 묵직한 gain
- tone: K 키, 중간 밝은 소리
- hit: Perfect나 Great일 때 보조 이펙트로 작게 섞어도 됨
- miss: 너무 거슬리지 않는 짧은 muted sound

중요:
- 키를 누를 때마다 해당 젬베 사운드는 항상 즉시 나야 한다.
- 노트 판정 성공 여부와 상관없이 “연주하는 느낌”을 주기 위해 입력음은 재생한다.
- Perfect/Great일 때는 추가 sparkle sound 또는 hit sound를 작게 더한다.
- Miss일 때는 콤보가 끊긴다는 시각적 피드백만 강하게 주고, 소리는 과하지 않게 한다.

싱크:
- 게임 시간은 performance.now() 기준으로 관리하되, 가능하면 audioContext.currentTime과 offset을 맞춘다.
- startGameAtPerformanceMs와 startGameAtAudioMs를 저장한다.
- 판정에는 performance.now() 기반 currentGameTimeMs를 사용하고, 오디오 재생은 AudioContext로 처리한다.

────────────────────────────────
8. 입력과 판정
────────────────────────────────

키보드:
- D 또는 d: slap
- Space: bass
- K 또는 k: tone
- Enter: 시작/결과창에서 다시 시작
- Escape: 일시정지

터치:
- pointerdown 사용
- 이벤트 좌표를 Canvas 좌표로 변환
- 먼저 hitZone 원 안에 들어왔는지 검사
- 아니면 화면 x 좌표 기준 3분할로 lane 결정

입력 처리:
handleInput(laneId, source)

처리 순서:
1. AudioEngine.play(laneId)
2. 해당 레인 시각 피드백 시작
3. 현재 시간 기준으로 가장 가까운 active note 찾기
4. 시간 차이 abs(note.hitTimeMs - currentTimeMs) 계산
5. judgement window에 따라 Perfect/Great/Good/Miss 판정
6. 점수, 콤보, 정확도 업데이트
7. 노트 hit 처리
8. 파티클 생성
9. floating text 표시

판정:
- Perfect: ±45ms, 1000점
- Great: ±90ms, 700점
- Good: ±140ms, 400점
- Miss: ±180ms 밖 또는 지나간 노트, 0점
- 콤보 보너스:
  - combo 10 이상: +5%
  - combo 30 이상: +10%
  - combo 50 이상: +15%
- Miss 시 combo = 0
- Good 이상은 combo 증가

자동 Miss:
- 노트가 judgementY를 지나 missWindowMs 이상 내려가면 자동 Miss 처리
- Miss 텍스트와 레인 흔들림 표시

중복 입력 방지:
- 같은 lane 입력은 50ms 이내 반복 입력을 debounce
- 단, 실제 연타 차트가 생길 수 있으므로 debounce는 너무 길지 않게 한다.

────────────────────────────────
9. 시각 피드백
────────────────────────────────

입력 시:
- 판정 원이 1.0 → 1.16 → 1.0으로 튀는 scale animation
- 해당 레인 하단에 ripple 2~3개 생성
- 젬베 이미지가 1~2px 흔들림
- 손 위치에 glow
- Slap은 날카로운 흰색/빨강 spark
- Bass는 큰 원형 저주파 ripple
- Tone은 맑은 원형 wave

판정 텍스트:
- Perfect: 화면 중앙 아래에 크게, 살짝 위로 떠오르며 사라짐
- Great, Good도 표시
- Miss는 붉은 느낌으로 짧게 흔들림

노트 이미지:
- Bass 노트: 손바닥 중앙 타격 이미지 사용
- Tone 노트: 손바닥 윗부분 타격 이미지 사용
- Slap 노트: 손가락 끝 타격 이미지 사용
- 이미지는 원형 카드 안에 넣고 그림자/테두리/광택을 추가해라.
- 이미지가 없으면 lane별 심볼을 그려라:
  - Bass: B
  - Tone: T
  - Slap: S

노트 상태:
- 아직 멀리 있는 노트는 작고 투명
- 판정선에 가까워질수록 선명
- hit되면 터지면서 사라짐
- miss되면 아래로 살짝 떨어지며 흐려짐

────────────────────────────────
10. 파티클 시스템
────────────────────────────────

노트 히트 시 화려한 파티클을 생성해라.

Particle 종류:
- star
- heart
- circle
- diamond
- spark
- mini hand icon 느낌의 작은 선형 조각

Perfect:
- 24~36개
- 별, 하트, spark 섞기
- 큰 원형 wave 2개
- 랜덤 회전
- gravity 약간
- additive 느낌의 밝은 렌더링

Great:
- 14~22개
- star, circle 중심

Good:
- 8~14개
- circle 중심

Miss:
- 파티클 대신 작은 먼지 또는 흐린 조각 6~10개

ParticleSystem:
class ParticleSystem {
  emitHit(x, y, lane, judgement)
  emitCountdown(x, y, step)
  emitStartBurst()
  update(dt)
  draw(ctx)
}

각 파티클 속성:
- x, y
- vx, vy
- life
- maxLife
- size
- rotation
- rotationSpeed
- shape
- alpha
- color
- gravity
- drag

Canvas에 직접 shape를 그려라.
별과 하트는 path 함수로 직접 그려라.

────────────────────────────────
11. 점수, 콤보, 등급
────────────────────────────────

ScoringSystem:
- score
- combo
- maxCombo
- perfectCount
- greatCount
- goodCount
- missCount
- totalNotes
- hitNotes
- accuracy

정확도 계산:
accuracy = weightedHitScore / maxPossibleHitScore * 100

가중치:
- Perfect = 1.0
- Great = 0.75
- Good = 0.45
- Miss = 0

등급:
- S: 95% 이상
- A: 88% 이상
- B: 78% 이상
- C: 65% 이상
- D: 그 이하

결과 피드백:
- S: “완벽한 그루브! 젬베 마스터에 가까워졌어요.”
- A: “훌륭해요. 리듬이 안정적입니다.”
- B: “좋아요. 몇 박자만 더 정확히 맞춰보세요.”
- C: “기본은 잡혔어요. Bass부터 천천히 연습해봐요.”
- D: “괜찮아요. 연습 모드에서 손 위치를 먼저 익혀봐요.”

────────────────────────────────
12. 일시정지와 재시작
────────────────────────────────

Esc 또는 상단 pause 버튼으로 일시정지.
- 게임 루프는 계속 돌 수 있지만 note/game time은 멈춰야 한다.
- BGM도 suspend 또는 stop 처리한다.
- 재개 시 시간 offset을 보정한다.
- 일시정지 중 입력은 판정하지 않는다.

결과창에서 다시 하기:
- 모든 note, score, particles, timers 초기화
- AudioContext는 재사용
- 에셋 재로딩은 하지 않음

────────────────────────────────
13. 설정 패널
────────────────────────────────

간단한 설정 패널을 구현해라.

설정 항목:
- Master Volume
- SFX Volume
- BGM Volume
- Note Speed: 느림 / 보통 / 빠름
- Input Offset: -150ms ~ +150ms
- Particle Quality: 낮음 / 보통 / 높음
- Reduced Motion: 켜기/끄기
- Show Hit Windows: 켜기/끄기

Note Speed는 실제 hitTime을 바꾸는 게 아니라 approachTimeMs만 바꾼다.
- 느림: 3000ms
- 보통: 2600ms
- 빠름: 2100ms

설정은 localStorage에 저장해라.

────────────────────────────────
14. 연습 모드
────────────────────────────────

연습 모드를 추가해라.

연습 모드:
- 노트 없이 자유롭게 D/Space/K 또는 터치로 젬베를 연주할 수 있다.
- 각 손 위치가 빛나고 소리가 난다.
- 화면에는 “자유 연습 모드” 표시
- 간단한 안내:
  - Bass: 손바닥 중앙으로 묵직하게
  - Tone: 손가락 아래쪽으로 맑게
  - Slap: 손가락 끝으로 날카롭게
- “리듬 따라하기” 미니 기능:
  - 4박 패턴을 화면에 표시
  - 사용자가 따라 치면 체크 표시
- 이 기능이 부담되면 최소한 자유 연습 모드만 구현해도 된다.

────────────────────────────────
15. 접근성 및 사용성
────────────────────────────────

필수:
- 모든 주요 버튼은 키보드로 접근 가능
- Space가 게임 입력으로 쓰일 때 페이지 스크롤 방지
- 모바일에서 더블탭 확대 방지
- 화면이 너무 작으면 “가로보다 세로 화면을 권장합니다” 안내
- Reduced Motion 설정이 켜져 있으면 큰 흔들림과 과한 파티클을 줄임
- 색만으로 레인을 구분하지 말고 라벨과 아이콘도 함께 사용
- 사운드가 꺼져도 시각적 판정으로 게임 가능

────────────────────────────────
16. 성능 최적화
────────────────────────────────

필수:
- 60fps 목표
- Canvas draw 호출 최적화
- 파티클 개수 제한
- note 배열은 active window만 렌더링
- offscreen cache가 필요하면 간단히 사용
- 이미지 drawImage 전에 로딩 여부 확인
- resize 이벤트는 debounce
- 모바일 저사양 기기에서 Particle Quality 자동 낮춤 가능

파티클 최대 개수:
- high: 350
- medium: 220
- low: 100

Note 렌더링:
- currentTime 기준으로 approachTimeMs 이전~missWindow 이후의 노트만 active 처리
- 지나간 노트는 즉시 정리

────────────────────────────────
17. 디버그 도구
────────────────────────────────

개발 편의를 위해 DEBUG 모드를 넣어라.

const DEBUG = false;

DEBUG가 true일 때:
- FPS 표시
- currentGameTime 표시
- hit window 시각화
- 각 note의 hitTime 표시
- input offset 표시
- chart validation 결과 표시

운영 기본값은 false.

────────────────────────────────
18. 구현 단계
────────────────────────────────

반드시 아래 순서로 구현해라.

1단계: 기존 요구사항 분석 및 코드 구조 설계
- 필요한 클래스 목록 작성
- CONFIG와 ASSETS 정의
- 게임 상태 정의

2단계: index.html 기본 구조 생성
- canvas
- overlay UI
- loading screen
- ready screen
- result modal
- settings modal

3단계: AssetLoader 구현
- 이미지 로딩
- 오디오 파일 로딩 요청
- 실패 fallback
- loading progress

4단계: AudioEngine 구현
- AudioContext init
- buffer decode
- play 함수
- countdown sound
- fallback oscillator sound
- volume controls

5단계: Renderer 구현
- DPR 대응
- background
- lanes
- drum
- hit zones
- HUD

6단계: ChartManager와 NoteManager 구현
- chart 데이터
- beatToMs
- note 위치 계산
- no overlap validation
- active note filtering

7단계: InputController 구현
- keyboard
- pointer/touch
- lane mapping
- debounce
- preventDefault

8단계: ScoringSystem 구현
- judgement windows
- score
- combo
- accuracy
- grade
- result data

9단계: ParticleSystem 구현
- star/heart/circle/diamond/spark
- countdown burst
- hit burst
- miss dust

10단계: Game state flow 구현
- boot → ready → countdown → playing → result
- pause/resume
- restart

11단계: 설정과 localStorage 구현
- volume
- note speed
- offset
- particle quality
- reduced motion

12단계: 모바일 최적화
- responsive layout
- safe-area
- touch feedback
- scroll/zoom 방지

13단계: 품질 점검
- 노트 겹침 없음
- 입력 지연 최소화
- BGM 종료 시 결과창
- 3초 카운트다운
- D/Space/K 정상 작동
- 모바일 3분할 터치 정상 작동
- 결과창 통계 정확
- 누락 에셋 fallback 정상

각 단계가 끝날 때마다 코드가 실제로 실행 가능한 상태인지 확인해라.

────────────────────────────────
19. 품질 기준
────────────────────────────────

최종 구현은 아래 기준을 만족해야 한다.

기능 기준:
- 시작 화면이 뜬다.
- 게임 시작 버튼을 누르면 AudioContext가 활성화된다.
- 3초 카운트다운 후 게임이 시작된다.
- 노트가 위에서 아래로 천천히 내려온다.
- Slap/Bass/Tone 레인이 서로 겹치지 않는다.
- 노트 간격이 넉넉하다.
- D, Space, K 입력이 정확히 동작한다.
- 모바일 터치 입력이 동작한다.
- 입력할 때 소리와 시각 피드백이 즉시 발생한다.
- Perfect/Great/Good/Miss 판정이 된다.
- Score와 Combo가 갱신된다.
- 파티클이 화려하게 나온다.
- BGM 또는 chart duration이 끝나면 결과창이 나온다.
- 다시 하기가 동작한다.

UX 기준:
- 첫 화면이 깔끔하고 흰색 배경 위에 젬베 이미지가 크게 보인다.
- 제목 왼쪽에 젬베 아이콘이 보인다.
- 게임 화면에서 젬베를 직접 치는 느낌이 난다.
- Slap, Bass, Tone의 손 위치와 소리가 명확히 구분된다.
- 초보자가 봐도 무엇을 눌러야 하는지 바로 알 수 있다.
- 모바일에서도 손가락으로 편하게 칠 수 있다.

기술 기준:
- 콘솔 에러 없음
- 누락 에셋이 있어도 실행됨
- 60fps에 가깝게 동작
- 코드가 클래스 단위로 정리됨
- CONFIG에서 주요 수치를 쉽게 튜닝 가능
- localStorage 설정 저장
- 재시작 시 메모리 누수 없음

────────────────────────────────
20. 마지막 출력 방식
────────────────────────────────

최종 답변에는 다음을 포함해라.

1. 완성된 index.html 전체 코드
2. assets 폴더에 넣어야 할 파일명 목록
3. 실행 방법
4. 조작법
5. 튜닝 가능한 CONFIG 항목 설명
6. 구현 완료 체크리스트

코드에는 한국어 주석을 충분히 달아라.
코드가 너무 길어도 생략하지 말고 전체를 출력해라.
```

---

# 단계별로 나눠서 개발시키는 추가 프롬프트

한 번에 만들기보다 품질을 높이고 싶다면, 위 “최종 바이브코딩 프롬프트”를 먼저 넣은 뒤 아래 프롬프트를 순서대로 추가하면 됩니다.

## 1단계: 제품 방향 고도화 프롬프트

```text
방금 만든 젬베 리듬 게임을 단순 리듬게임이 아니라 “젬베 입문자가 실제 타법을 익히는 리듬 트레이너”로 고도화해줘.

다음을 추가해라.

1. 시작 화면에서 Slap/Bass/Tone을 짧게 설명하는 카드 3개 추가
2. 각 카드에는 첨부된 손 이미지 노트 아이콘 사용
3. 연습 모드에서 키를 누르면 해당 손 위치 이미지가 확대되며 설명 표시
4. Tutorial 차트에서는 처음 8초 동안 Bass만, 다음 8초 동안 Tone만, 다음 8초 동안 Slap만 연습
5. 이후 세 타법을 섞은 쉬운 패턴 제공
6. 결과창에서 가장 약한 타법을 분석해서 “Slap 타이밍을 더 연습해보세요”처럼 피드백 제공

기존 코드를 망가뜨리지 말고 모듈 구조를 유지해라.
```

## 2단계: 리듬감 개선 프롬프트

```text
노트 차트를 더 음악적으로 개선해줘.

요구사항:
1. Tutorial, Groove 1, Groove 2 총 3개 차트를 유지
2. 모든 차트는 초보자가 칠 수 있게 노트 간격을 넉넉히 유지
3. 같은 레인 연타는 최소 720ms 이상 간격
4. 서로 다른 레인도 최소 420ms 이상 간격
5. Bass는 주로 강박에 배치
6. Tone은 중간 박자에 배치
7. Slap은 포인트 악센트처럼 배치
8. 동시에 여러 노트는 절대 배치하지 않기
9. validateChartSpacing()으로 자동 검증
10. 검증 실패 시 chart load를 중단하지 말고 자동 보정

차트 데이터와 검증 함수를 명확히 분리해라.
```

## 3단계: 타격감 강화 프롬프트

```text
젬베를 실제로 치는 느낌이 더 강하게 나도록 타격감을 강화해줘.

추가할 것:
1. 입력 순간 해당 레인의 판정 원이 눌리는 scale animation
2. 젬베 이미지가 lane별로 다른 방향으로 미세하게 흔들림
3. Bass는 큰 저주파 원형 ripple
4. Tone은 얇고 맑은 wave 2개
5. Slap은 짧고 날카로운 spark burst
6. Perfect 판정 시 별과 하트 파티클이 더 많이 터짐
7. Great/Good/Miss별 이펙트 강도 차등화
8. 모바일에서 navigator.vibrate 가능하면 짧은 햅틱
9. Reduced Motion 설정에서는 흔들림과 파티클을 줄임

ParticleSystem과 Renderer를 분리해서 유지보수하기 쉽게 구현해라.
```

## 4단계: 오디오 싱크 개선 프롬프트

```text
리듬게임에서 가장 중요한 오디오 싱크를 개선해줘.

요구사항:
1. AudioContext.currentTime과 performance.now()의 기준점을 게임 시작 시 저장
2. currentGameTimeMs 계산 함수를 하나로 통합
3. 판정은 currentGameTimeMs 기준으로 수행
4. 노트 위치도 currentGameTimeMs 기준으로 계산
5. BGM 시작 시점과 노트 hitTime이 어긋나지 않게 보정
6. 설정에 Input Offset 슬라이더 추가
7. offset 값은 -150ms ~ +150ms
8. 판정 계산에는 offset을 반영
9. 디버그 모드에서 현재 offset과 판정 차이 ms를 표시
10. 사용자가 Perfect를 내기 어렵지 않도록 기본 판정창은 초보자 친화적으로 유지

코드에 왜 이런 싱크 구조가 필요한지 한국어 주석을 달아라.
```

## 5단계: 모바일 완성도 프롬프트

```text
모바일 웹앱으로 완성도를 높여줘.

요구사항:
1. 세로 화면 기준으로 최적화
2. iPhone Safari와 Android Chrome에서 화면이 흔들리거나 스크롤되지 않게 CSS 처리
3. touch-action: none 적용
4. 100vh 대신 동적 viewport 문제를 고려한 CSS 변수 또는 JS resize 처리
5. safe-area-inset 대응
6. 터치 입력은 pointerdown 기반
7. 터치 좌표를 Canvas 내부 좌표로 정확히 변환
8. 버튼 크기는 최소 44px 이상
9. 시작 화면, 설정창, 결과창이 작은 화면에서도 잘리지 않게 처리
10. 모바일에서 Space 키 안내보다 터치 안내를 더 크게 표시

데스크톱 기능은 유지하면서 모바일 UX만 개선해라.
```

## 6단계: 결과 분석 고도화 프롬프트

```text
결과창을 더 게임답고 교육적으로 개선해줘.

추가할 것:
1. 최종 점수
2. 최고 콤보
3. 정확도
4. Perfect/Great/Good/Miss 개수
5. Slap/Bass/Tone별 성공률
6. 가장 약한 타법 추천
7. 등급 S/A/B/C/D
8. 한 줄 칭찬 문구
9. “다시 하기”, “연습 모드”, “처음으로” 버튼
10. 가능하면 localStorage에 최고 점수와 최고 콤보 저장

결과창 제목 왼쪽에는 첨부된 젬베 아이콘을 사용해라.
```

---

# 코딩 에이전트가 실수하지 않도록 넣을 “강제 규칙”

아래 문장을 프롬프트 마지막에 붙이면 결과가 안정적입니다.

```text
중요한 강제 규칙:

1. Slap, Bass, Tone 노트는 절대 겹치면 안 된다.
2. 세 레인의 x 좌표는 명확히 분리한다.
3. 노트 속도는 너무 빠르게 하지 말고 기본 approachTimeMs는 2600ms로 둔다.
4. 노트 간격은 초보자 기준으로 넉넉히 둔다.
5. Space 키 입력 시 페이지 스크롤이 생기면 안 된다.
6. AudioContext는 사용자 제스처 이후에만 활성화한다.
7. 오디오 파일이 없어도 fallback 사운드로 게임이 실행되어야 한다.
8. 이미지 파일이 없어도 fallback 그래픽으로 게임이 실행되어야 한다.
9. 모바일 pointerdown과 click이 중복 입력되지 않게 한다.
10. 결과창으로 넘어갈 때 requestAnimationFrame 루프와 오디오 상태가 꼬이지 않게 한다.
11. 모든 주요 수치는 CONFIG에 모아서 쉽게 조정 가능하게 한다.
12. 최종 코드는 생략 없이 전체 index.html로 출력한다.
```

---

# 추천 에셋 매핑

현재 첨부 이미지 기준으로는 이렇게 매핑하는 것이 가장 자연스럽습니다.

```text
메인 시작 배경:
- vertical-shot-drum-white.jpg
또는
- Djembe(크몽)[실사].png

게임 중 젬베/판정 안내 이미지:
- 젬베 게임 앱 Source.png

아이콘:
- 젬베_아이콘_크몽__채색_-removebg-preview.png

Bass 노트:
- 젬베 게임 앱 Source02-1.png
  손바닥 중앙 타격 이미지

Tone 노트:
- 젬베 게임 앱 Source02-2.png
  손바닥 윗부분 타격 이미지

Slap 노트:
- 젬베 게임 앱 Source02-3.png
  손가락 끝 타격 이미지

Bass 사운드:
- Djembe-Bass.wav

Tone 사운드:
- Djembe_Mid.wav
또는
- Djembe_Mid_quiet.wav

Slap 사운드:
- Djembe-slap.wav

보조 hit 사운드:
- Djembe_hit20.wav

추가 샘플/BGM 후보:
- Djembe_slice_sample.wav
```

---

# 최종 검수용 프롬프트

개발이 끝난 뒤 아래를 추가로 넣어 품질 검사를 시키세요.

```text
완성된 젬베 리듬 게임을 QA 엔지니어처럼 검수하고 수정해줘.

검수 항목:
1. index.html을 열었을 때 콘솔 에러가 없는가?
2. 누락된 이미지나 오디오가 있어도 fallback으로 실행되는가?
3. 시작 버튼 클릭 전 AudioContext 관련 브라우저 오류가 없는가?
4. 3초 카운트다운이 정상 작동하는가?
5. D/Space/K 입력이 각각 Slap/Bass/Tone으로 정확히 연결되는가?
6. 모바일 터치 3분할 입력이 정상 작동하는가?
7. 노트가 레인별로 겹치지 않는가?
8. 노트 간격이 충분히 넓은가?
9. 판정선과 실제 판정 타이밍이 어색하지 않은가?
10. Score, Combo, Accuracy가 정상 계산되는가?
11. Miss 처리와 콤보 초기화가 정상인가?
12. BGM 또는 차트 시간이 끝나면 결과창이 뜨는가?
13. 다시 하기를 눌렀을 때 이전 노트와 파티클이 남지 않는가?
14. 설정값이 localStorage에 저장되는가?
15. 모바일 화면에서 스크롤, 확대, 터치 지연 문제가 없는가?

문제를 찾으면 직접 수정하고, 마지막에 수정 내역과 남은 개선 후보를 요약해라.
```
