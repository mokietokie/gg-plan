## Project
GG-PLAN — 투두만 쓰면 주간보고서가 자동으로 만들어지는 직장인용 업무 관리 서비스

## Tech Stack
- Next.js 15 (App Router) + TypeScript
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
│   ├── (protected)/    # 인증 필요 페이지 (Header 포함)
│   │   ├── layout.tsx
│   │   ├── todos/
│   │   │   ├── page.tsx       # Server Component: 데이터 패칭 + 뷰 분기
│   │   │   ├── actions.ts     # Server Actions: CRUD + getCategories
│   │   │   └── _components/   # 투두 관련 클라이언트 컴포넌트
│   │   ├── report/
│   │   │   ├── page.tsx       # Server Component: 주간 투두 쿼리 + 보고서 생성
│   │   │   └── _components/   # 보고서 관련 클라이언트 컴포넌트
│   │   └── stats/
│   │       ├── page.tsx       # Server Component: 기간별 투두 쿼리 + 통계 집계
│   │       └── _components/   # 통계 관련 클라이언트 컴포넌트
│   ├── layout.tsx      # 루트 레이아웃
│   └── page.tsx        # 랜딩 페이지
├── components/
│   ├── header.tsx      # 공통 헤더 (로고+네비+로그아웃)
│   └── ui/             # shadcn/ui 컴포넌트
├── lib/
│   ├── supabase/       # client.ts (브라우저용), server.ts (서버용)
│   ├── date.ts         # 날짜 유틸 (포맷, 주간/월간 범위, eachDayOfRange 등)
│   ├── report.ts       # 주간보고서 생성 순수 함수 (generateReport)
│   ├── stats.ts        # 통계 집계 순수 함수 5개
│   └── utils.ts        # shadcn/ui 유틸
├── hooks/              # 커스텀 훅
├── types/
│   ├── todo.ts         # Todo, ActionResult
│   └── stats.ts        # StatsPeriod, CompletionRateData, CategoryData, DailyActivityData, WeeklyTrendData, TopCategoryData
├── middleware.ts       # Supabase 세션 갱신 + 라우트 보호
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
- 세션 관리: middleware.ts에서 쿠키 기반 세션 갱신
- 라우트 보호: 미인증→/login 리디렉트, 인증→/todos 리디렉트
- Route Groups: (auth) = 로그인/회원가입, (protected) = 인증 필요 페이지
- 서버 액션: app/(auth)/actions.ts (signup, login, logout)

## DB Schema
- `todos` 테이블: id(uuid), user_id(uuid), title(text), description(text), category(text), date(date), is_completed(boolean), completed_at(timestamptz), created_at(timestamptz)
- RLS 활성화: 본인 데이터만 CRUD 가능

## Todos Feature
- 뷰 모드: 일간(daily), 주간(weekly), 월간(monthly) — URL searchParams로 관리 (?date=&view=)
- Server Actions: createTodo, toggleTodo, updateTodo, deleteTodo, getCategories (app/(protected)/todos/actions.ts)
- 낙관적 업데이트: React 19 useOptimistic (toggle, delete 즉시 반영)
- 인라인 편집: 제목 클릭 → Input 전환, Enter 저장, Esc 취소
- 카테고리: 자유 텍스트 입력 + 기존 카테고리 Popover 추천
- 월간 뷰: 캘린더 그리드 (월요일 시작, 6주 고정), 날짜별 투두 개수/완료율 바, 날짜 클릭 시 일간 뷰로 이동
- 정렬: 미완료 먼저 → 완료 아래로

## Report Feature (주간보고서)
- 페이지: /report — URL searchParams로 주차 선택 (?date=YYYY-MM-DD)
- 보고서 생성: `lib/report.ts` — 순수 함수 `generateReport()`, DB 저장 없이 매번 실시간 생성
- 생성 규칙: category별 그룹핑(미지정→"기타"), 완료/미완료 분리, 다음 주 투두 자동 포함
- 주차 단위: 일~토 (getWeekRange), 7일 단위 이전/다음 이동
- 내보내기: 클립보드 복사 + .txt 파일 다운로드
- 데이터 패칭: Server Component에서 이번 주 + 다음 주 투두 병렬 쿼리 (Promise.all)

## Stats Feature (통계 대시보드)
- 페이지: /stats — URL searchParams로 기간 선택 (?period=weekly|monthly|custom&date=YYYY-MM-DD&from=&to=)
- 차트 라이브러리: Recharts (shadcn/ui chart 래퍼) — `components/ui/chart.tsx`
- 통계 집계: `lib/stats.ts` — 순수 함수 5개, DB 저장 없이 매번 실시간 집계 (report.ts 패턴과 동일)
- 집계 함수: computeCompletionRate, computeCategoryDistribution, computeDailyActivity, computeWeeklyTrend, computeTopCategories
- 데이터 패칭: Server Component에서 현재 기간 + 이전 기간 병렬 쿼리 (Promise.all) → 서버사이드 집계 → Client Component에 props 전달
- 차트 구성: 완료율(AreaChart 스파크라인), 카테고리 비중(PieChart 도넛), 일별 활동량(BarChart), 주간 추이(LineChart), TOP 카테고리(Tailwind 수평 바)
- 기간 선택: 주간(getWeekRange) / 월간(getMonthRange) / 기간 선택(커스텀 from~to)
- 빈 상태: 투두 없는 기간 선택 시 차트 대신 빈 상태 메시지 표시
- chart 색상: globals.css --chart-1~5 컬러 변수 사용 (모노크롬→컬러로 변경)
- null 카테고리: "미지정"으로 표시 (report.ts의 "기타"와 구분)

## Stats Feature (통계 대시보드)
- 페이지: /stats — URL searchParams로 기간 선택 (?period=weekly|monthly|custom&date=YYYY-MM-DD&from=&to=)
- 차트 라이브러리: Recharts (shadcn/ui chart 래퍼) — `components/ui/chart.tsx`
- 통계 집계: `lib/stats.ts` — 순수 함수 5개, DB 저장 없이 매번 실시간 집계 (report.ts 패턴과 동일)
- 집계 함수: computeCompletionRate, computeCategoryDistribution, computeDailyActivity, computeWeeklyTrend, computeTopCategories
- 데이터 패칭: Server Component에서 현재 기간 + 이전 기간 병렬 쿼리 (Promise.all) → 서버사이드 집계 → Client Component에 props 전달
- 차트 구성: 완료율(AreaChart 스파크라인), 카테고리 비중(PieChart 도넛), 일별 활동량(BarChart), 주간 추이(LineChart), TOP 카테고리(Tailwind 수평 바)
- 기간 선택: 주간(getWeekRange) / 월간(getMonthRange) / 기간 선택(커스텀 from~to)
- 빈 상태: 투두 없는 기간 선택 시 차트 대신 빈 상태 메시지 표시
- chart 색상: globals.css --chart-1~5 컬러 변수 사용 (모노크롬→컬러로 변경)
- null 카테고리: "미지정"으로 표시 (report.ts의 "기타"와 구분)

## 주의사항
- [RISK] 주간보고서 자동 생성: 규칙 기반 집계로 시작. category별 그룹핑 + 완료/미완료 분류. 실제 제출 가능 품질인지 초기 피드백 필수
- [RISK] 대기업 사내망 접근: 외부 SaaS 차단 가능성. MVP는 개인 디바이스 기준으로 검증
- [RISK] 투두 입력 습관: 20~50대 전연령대가 수용 가능하도록 입력 허들 최소화. UI 최대한 단순하게
- [RISK] 주간보고서 작성 소요시간: 실제로 얼마나 걸리는지 팀원 확인 필요 (절약 효과 검증)

## Environment Variables
- 환경변수 파일: `.env.local`
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase 프로젝트 URL (클라이언트+서버 공용)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public 키 (클라이언트+서버 공용)
- 사용처: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `middleware.ts`

## 금지사항
- any 타입 금지
- 인라인 스타일 금지 (Tailwind 사용)
- Supabase 서비스 키를 클라이언트에 노출 금지
