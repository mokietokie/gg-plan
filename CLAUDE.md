## Project
GG-PLAN — 투두만 쓰면 주간보고서가 자동으로 만들어지는 직장인용 업무 관리 서비스

## Tech Stack
- Next.js 16 (App Router) + TypeScript
- shadcn/ui + Tailwind CSS v4
- Supabase (Auth + PostgreSQL)
- 배포: Vercel

## Project Structure
```
next-app/
├── app/
│   ├── (auth)/         # 로그인/회원가입 (최소 레이아웃, 헤더 없음)
│   │   ├── actions.ts  # signup/login/logout 서버 액션
│   │   ├── layout.tsx  # 중앙 정렬 카드 레이아웃
│   │   ├── login/
│   │   └── signup/
│   ├── (protected)/    # 인증 필요 페이지 (Header + 메모 패널 전역 마운트)
│   │   ├── layout.tsx  # async: getMemo() 프리페치 + MemoProvider/MemoHotkey/MemoPanel 마운트
│   │   ├── todos/
│   │   │   ├── page.tsx       # Server Component: 데이터 패칭 + 뷰 분기
│   │   │   ├── actions.ts     # Server Actions: CRUD + 카테고리 관리 + 실행취소(restore)
│   │   │   └── _components/   # 투두 관련 클라이언트 컴포넌트
│   │   ├── stats/
│   │   │   ├── page.tsx       # Server Component: 기간별 투두 쿼리 + 통계 집계 + 보고서 생성
│   │   │   └── _components/   # 통계/보고서 관련 클라이언트 컴포넌트
│   │   ├── archive/
│   │   │   ├── page.tsx       # Server Component: 기간/카테고리/검색 기반 투두 조회
│   │   │   └── _components/   # 아카이브 관련 클라이언트 컴포넌트
│   │   └── memos/
│   │       └── actions.ts     # Server Actions: getMemo, saveMemo(upsert)
│   ├── layout.tsx      # 루트 레이아웃
│   └── page.tsx        # 랜딩 페이지
├── components/
│   ├── header.tsx      # 공통 헤더 (로고+네비+메모버튼+로그아웃)
│   ├── memo/           # 메모 스크래치패드 (플로팅 패널)
│   │   ├── memo-provider.tsx  # Client Context: open/content/savedAt/save/isSaving
│   │   ├── memo-hotkey.tsx    # Client: window keydown M/ㅡ 가드 리스너 (return null)
│   │   ├── memo-button.tsx    # Client: 헤더 메모 아이콘 버튼 (StickyNote + Tooltip)
│   │   └── memo-panel.tsx     # Client: 플로팅 패널 UI (드래그/리사이즈/localStorage)
│   └── ui/             # shadcn/ui 컴포넌트 (dialog, textarea 포함)
├── lib/
│   ├── supabase/       # client.ts (브라우저용), server.ts (서버용)
│   ├── date.ts         # 날짜 유틸 (포맷, 주간/월간/분기 범위, eachDayOfRange 등)
│   ├── report.ts       # 보고서 생성 순수 함수 (generateReport, generateMonthlyReport)
│   ├── stats.ts        # 통계 집계 순수 함수 (completionRate, categoryDistribution, dailyActivity, weeklyActivity)
│   ├── archive.ts      # 주차별 그룹핑(groupTodosByWeek) + CSV 직렬화(todosToCsv)
│   └── utils.ts        # shadcn/ui 유틸
├── types/
│   ├── todo.ts         # Todo, UserCategory, ActionResult, CreateTodoResult
│   ├── stats.ts        # StatsPeriod, CompletionRateData, CategoryData, DailyActivityData, WeeklyActivityData
│   ├── archive.ts      # WeekGroup
│   └── memo.ts         # Memo, SaveMemoResult
├── proxy.ts       # Supabase 세션 갱신 + 라우트 보호
└── public/             # 정적 파일
```

## Rules
- UI는 shadcn/ui 우선
- API는 /app/api Route Handler 또는 Supabase Client 직접 호출
- 컴포넌트는 /components/{feature}/
- 타입은 /types/
- Supabase 클라이언트는 /lib/supabase/ (client.ts, server.ts 분리)

## Auth
- Supabase Auth (이메일+비밀번호 자체 인증)
- 이메일 확인(Confirm email): MVP에서 비활성화
- 세션 관리: proxy.ts에서 쿠키 기반 세션 갱신 (Next.js 16부터 middleware → proxy로 변경)
- 라우트 보호: 미인증→/login 리디렉트, 인증→/todos 리디렉트
- Route Groups: (auth) = 로그인/회원가입, (protected) = 인증 필요 페이지
- 서버 액션: app/(auth)/actions.ts (signup, login, logout)

## DB Schema
- `todos` 테이블: id(uuid), user_id(uuid), title(text), description(text), category(text), date(date), is_completed(boolean), completed_at(timestamptz), created_at(timestamptz)
- `user_categories` 테이블: id(uuid), user_id(uuid), name(text), sort_order(integer), created_at(timestamptz) — UNIQUE(user_id, name)
- `memos` 테이블: user_id(uuid PK, FK→auth.users on delete cascade), content(text default ''), updated_at(timestamptz) — 사용자당 1 row 강제
- RLS 활성화: 세 테이블 모두 본인 데이터만 CRUD 가능 (memos는 select/insert/update 정책만, delete 없음)

## Todos Feature
- 뷰 모드: 일간(daily), 주간(weekly), 월간(monthly) — URL searchParams로 관리 (?date=&view=)
- Server Actions (app/(protected)/todos/actions.ts):
  - Todo CRUD: createTodo(→CreateTodoResult), toggleTodo, updateTodo, deleteTodo(→Todo|null), restoreTodo
  - 카테고리 관리: getCategories, getUserCategories, addUserCategory, deleteUserCategory
- 낙관적 업데이트: React 19 useOptimistic (toggle, delete, 카테고리 추가/삭제 즉시 반영)
- 인라인 편집: 제목 클릭 → Input 전환, Enter 저장, Esc 취소
- 카테고리 프리셋: user_categories 테이블에 자주 쓰는 카테고리 사전 등록, 클릭으로 적용/해제 (Badge 토글)
- 카테고리 입력: 자유 텍스트 + Popover 자동완성 (프리셋 + 기존 투두 카테고리 병합, 최대 20개)
- 카테고리 관리: 톱니(Settings) 버튼 → Popover에서 프리셋 추가/삭제 (CategoryManager 컴포넌트)
- 실행취소(Undo): 등록/삭제 시 bottom-right 토스트 + "실행취소" 버튼 (sonner action)
  - 등록 취소: createTodo가 반환한 id로 deleteTodo 호출
  - 삭제 취소: deleteTodo가 반환한 Todo 데이터로 restoreTodo 호출
- 월간 뷰: 캘린더 그리드 (월요일 시작, 6주 고정), 날짜별 투두 개수/완료율 바, 날짜 클릭 시 일간 뷰로 이동
- 정렬: 미완료 먼저 → 완료 아래로

## Stats Feature (통계 대시보드 + 보고서 통합)
- 페이지: /stats — URL searchParams로 기간 선택 (?period=weekly|monthly|custom&date=YYYY-MM-DD&from=&to=)
- 차트 라이브러리: Recharts (shadcn/ui chart 래퍼) — `components/ui/chart.tsx`
- 통계 집계: `lib/stats.ts` — 순수 함수, DB 저장 없이 매번 실시간 집계
- 집계 함수: computeCompletionRate, computeCategoryDistribution, computeDailyActivity, computeWeeklyActivity
- 데이터 패칭: Server Component에서 현재 + 이전 + 다음 기간 병렬 쿼리 (Promise.all) → 서버사이드 집계 → Client Component에 props 전달
- 메트릭 카드: 완료율(AreaChart 스파크라인) | 총 투두 | 완료 | 미완료
- 차트 구성: 카테고리 비중(PieChart 도넛), 활동량(BarChart — 주간뷰:일별/월간뷰:주간)
- 기간 선택: 주간(getWeekRange) / 월간(getMonthRange) / 기간 선택(커스텀 from~to)
- 기간 선택 모드: from/to 미입력 시 "기간을 선택해주세요" 빈 상태 표시
- 빈 상태: 투두 없는 기간 선택 시 차트 대신 빈 상태 메시지 표시
- chart 색상: globals.css --chart-1~5 컬러 변수 사용 (모노크롬→컬러로 변경)
- null 카테고리: "미지정"으로 표시 (report.ts의 "기타"와 구분)
- 보고서 통합: 대시보드 하단에 아코디언 형태로 보고서 표시 (report-section.tsx)
  - 주간 뷰: 주간보고서 아코디언 1개
  - 월간 뷰: 월간보고서 아코디언 1개
  - 기간 선택: 주간 단위 분할 보고서
  - 내보내기: 각 보고서별 클립보드 복사 + .txt 파일 다운로드
- 보고서 생성: `lib/report.ts` — 순수 함수, DB 저장 없이 매번 실시간 생성
  - `generateReport()`: 주간보고서 (완료/진행 중/다음 주 계획, category별 그룹핑)
  - `generateMonthlyReport()`: 월간보고서 (완료/진행 중/다음 달 계획, category별 그룹핑)

## Memo Feature (글로벌 스크래치패드)
- 진입: 헤더 메모 아이콘 클릭 또는 키보드 `M`/`ㅡ` 한 번 → 플로팅 패널 오픈 (전용 페이지 없음)
- 헤더 아이콘: StickyNote 아이콘 (노란색), Tooltip "빠른 메모 (M)" — memo-button.tsx
- 모델: **사용자당 1개의 긴 텍스트 문서** (`memos.user_id` PK + upsert) — sticky note 멘탈 모델, 메모 목록/다건 아님
- 데이터 흐름: `layout.tsx`(Server, async)가 `getMemo()`로 초기 내용 프리페치 → `MemoProvider` Context에 `initialContent`/`initialUpdatedAt` 주입 → `MemoPanel` 오픈 시 네트워크 대기 없이 즉시 표시
- Server Actions (`app/(protected)/memos/actions.ts`): `getMemo()`, `saveMemo(content)` — upsert `onConflict: user_id`, `updated_at` 반환
- 단축키 가드 (`memo-hotkey.tsx`, `window` keydown):
  - `e.key` ∈ {`m`, `M`}가 아니면 무시 (keydown)
  - `e.key` = `ㅡ`도 지원 (keyup, 한글 IME 대응)
  - `metaKey || ctrlKey || altKey` 조합이면 무시 (브라우저/OS 단축키 회피, `Cmd+M` 최소화 등)
  - `e.isComposing` 이면 무시 (한글 IME "ㅁ" 조합 중)
  - `target`이 `INPUT`/`TEXTAREA`/`[contenteditable]` 이면 무시 (투두·검색 입력 중)
  - 이미 패널 열린 상태면 무시
- 플로팅 패널 (`memo-panel.tsx`):
  - **비모달**: Radix Dialog 사용 안 함. `position: fixed` + 인라인 좌표 style로 직접 렌더. 배경 오버레이 없음 → 네비 탭·투두 리스트 등 뒷 UI와 동시 상호작용 가능
  - **드래그**: 헤더 바 `onPointerDown` → `currentTarget.setPointerCapture(pointerId)` → `onPointerMove`로 좌표 갱신. 드래그 종료 시 `releasePointerCapture`
  - **리사이즈**: 우하단 `nwse-resize` 핸들(SVG 빗금)에 동일한 pointer capture 패턴으로 width/height 갱신
  - **좌표/크기 영속화**: `localStorage` 키 `memo-panel-state-v1`에 `{x, y, width, height}` 저장. `useState` lazy init에서 `typeof window` 체크 후 로드 → **SSR-safe**(useEffect setState 패턴 안 씀, React 19 `react-hooks/set-state-in-effect` 룰 통과)
  - **기본값**: 화면 왼쪽 세로 중앙, `340 × (viewport height × 0.3)` px. 최소 `240×180`
  - **클램프**: 드래그/리사이즈/윈도우 리사이즈 시 `clampState()`로 뷰포트 경계 강제
  - **닫기**: `Esc` 또는 X 버튼. Cmd/Ctrl+Enter는 저장만 (패널 유지, persistent)
  - **저장**: 자동 저장 (별도 저장 버튼 없음). `useTransition`으로 pending 상태, 푸터에 "방금 저장됨 / N분 전 저장됨 / 수정됨 · …" 상대시간 표시
  - **드래프트**: `Esc`로 닫고 재오픈해도 드래프트 유지(Context `content` state). 새로고침 시에만 초기화
  - **탭 전환 시 유지**: `(protected)/layout.tsx`에 마운트되어 있어 Next.js App Router 레이아웃 재사용 덕분에 `/todos` ↔ `/report` 이동해도 패널 state 그대로
- 스타일: 연노란색 sticky note 테마 — `bg-yellow-50`/`100` + `border-yellow-200/300` + 다크 모드 `yellow-950`/`900/40` variants. 헤더·푸터·placeholder·리사이즈 아이콘 모두 노란 톤으로 통일해 배경/네비와 시각적 분리
- 접근성: `role="dialog" aria-label="메모"` (비모달이므로 `aria-modal` 없음)

## Archive Feature (아카이브)
- 페이지: /archive — URL searchParams로 상태 관리 (?from=&to=&category=&q=)
- 기본 기간: from/to 없으면 이번 달로 자동 설정 (getMonthRange)
- 기간 선택: date input 2개 + 프리셋 버튼 3개(이번 달/지난 달/최근 3개월) — archive-period.tsx
- 검색: Spotlight 스타일 rounded-2xl Input, 300ms debounce, router.replace로 q 업데이트 — archive-search.tsx
- 카테고리 필터: 복수 선택 가능(쉼표 구분), "전체" + 카테고리 목록 + "미지정" pill — category-chips.tsx
  - 복수 쿼리: Supabase `.or("category.in.(\"A\",\"B\"),category.is.null")` 사용
  - "미지정"(null)은 `is.null` 절로 별도 OR 합침
- 주차별 아코디언: shadcn Accordion(type="multiple"), 기본 모두 닫힘, 검색/카테고리 필터 시 모두 펼침 — archive-accordion.tsx
- 주차 그룹핑: `lib/archive.ts` `groupTodosByWeek()` — 일~토 기준, 주차 시작일 내림차순, 내부는 날짜 내림차순
- 주차 라벨: "N월 M주차" (시작일 기준 월, `Math.ceil(day / 7)`)
- 아코디언 내부: 해당 주차의 **모든** 투두를 표시 (slice/limit 없음)
- CSV 내보내기: 복사 + 다운로드 2버튼 — export-button.tsx
  - `todosToCsv()`: UTF-8 BOM 포함(Excel 한글 깨짐 방지), CRLF 줄바꿈, 쉼표/따옴표/줄바꿈 이스케이프
  - 컬럼: 날짜, 제목, 카테고리, 상태(완료/미완료), 완료일시
  - 파일명: `gg-plan_archive_{from}_{to}.csv`
  - 0건이면 disabled
- Sticky 필터 영역: 검색바 + 기간 + 카테고리 chips를 상단 고정 (`sticky top-0 backdrop-blur`)
- 수평 스크롤: `scrollbar-hide` 유틸 사용 (globals.css @layer utilities에 정의)

## 주의사항
- [RISK] 주간보고서 자동 생성: 규칙 기반 집계로 시작. category별 그룹핑 + 완료/미완료 분류. 실제 제출 가능 품질인지 초기 피드백 필수
- [RISK] 대기업 사내망 접근: 외부 SaaS 차단 가능성. MVP는 개인 디바이스 기준으로 검증
- [RISK] 투두 입력 습관: 20~50대 전연령대가 수용 가능하도록 입력 허들 최소화. UI 최대한 단순하게
- [RISK] 주간보고서 작성 소요시간: 실제로 얼마나 걸리는지 팀원 확인 필요 (절약 효과 검증)

## Environment Variables
- 환경변수 파일: `.env.local`
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase 프로젝트 URL (클라이언트+서버 공용)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public 키 (클라이언트+서버 공용)
- 사용처: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `proxy.ts`

## 금지사항
- any 타입 금지
- 인라인 스타일 금지 (Tailwind 사용)
- Supabase 서비스 키를 클라이언트에 노출 금지
