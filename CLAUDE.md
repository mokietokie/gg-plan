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
│   │   │   ├── page.tsx            # Server Component: 데이터 패칭 + 뷰 분기 + 공유 투두 통합
│   │   │   ├── actions.ts          # Server Actions: CRUD + 카테고리 관리 + 실행취소(restore)
│   │   │   ├── sharing-actions.ts  # Server Actions: 초대/수락/거절/연결해제/닉네임 관리
│   │   │   └── _components/        # 투두 관련 클라이언트 컴포넌트
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
│   ├── header.tsx      # 공통 헤더 (로고+네비+공유버튼+메모버튼+로그아웃)
│   ├── sharing/        # 공유 관리 (SharingManager 다이얼로그)
│   ├── memo/           # 메모 스크래치패드 (플로팅 패널)
│   └── ui/             # shadcn/ui 컴포넌트
├── lib/
│   ├── supabase/       # client.ts (브라우저용), server.ts (서버용)
│   ├── date.ts         # 날짜 유틸 (포맷, 주간/월간/분기 범위, eachDayOfRange 등)
│   ├── report.ts       # 보고서 생성 순수 함수
│   ├── stats.ts        # 통계 집계 순수 함수
│   ├── archive.ts      # 주차별 그룹핑 + CSV 직렬화
│   └── utils.ts        # shadcn/ui 유틸
├── types/
│   ├── todo.ts         # Todo, UserCategory, ActionResult, CreateTodoResult
│   ├── sharing.ts      # SharingInvitation, SharingConnection, SharedUser, InvitationWithEmail
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
- `profiles` 테이블: id(uuid PK, FK→auth.users on delete cascade), email(text) — auth.users 이메일 조회용, 가입 시 트리거로 자동 생성
- `sharing_invitations` 테이블: id(uuid), from_user_id(uuid), to_user_id(uuid), status(text: pending|accepted|declined), created_at(timestamptz), responded_at(timestamptz) — UNIQUE(from_user_id, to_user_id), CHECK(from≠to)
- `sharing_connections` 테이블: id(uuid), user_a_id(uuid), user_b_id(uuid), user_a_nickname(text), user_b_nickname(text), created_at(timestamptz) — CHECK(user_a_id < user_b_id), UNIQUE(user_a_id, user_b_id)
- RLS: todos는 본인 CRUD + 연결된 사용자 SELECT, sharing 테이블은 본인 데이터만, profiles는 인증 사용자 전체 SELECT

## Todos Feature
- 뷰 모드: 일간(daily), 주간(weekly), 월간(monthly) — URL searchParams로 관리 (?date=&view=)
- Server Actions (app/(protected)/todos/actions.ts):
  - Todo CRUD: createTodo(→CreateTodoResult), toggleTodo, updateTodo, deleteTodo(→Todo|null), restoreTodo
  - 카테고리 관리: getCategories, getUserCategories, addUserCategory, deleteUserCategory
- 낙관적 업데이트: React 19 useOptimistic (toggle, delete, 카테고리 추가/삭제 즉시 반영)
- 인라인 편집: 제목 클릭 → Input 전환, Enter 저장, Esc 취소
- 카테고리 프리셋: user_categories 테이블에 자주 쓰는 카테고리 사전 등록, 클릭으로 적용/해제 (Badge 토글)
- 카테고리 입력: 자유 텍스트 + Popover 자동완성 (프리셋 + 기존 투두 카테고리 병합, 최대 20개)
- 실행취소(Undo): 등록/삭제 시 bottom-right 토스트 + "실행취소" 버튼 (sonner action)
- 월간 뷰: 캘린더 그리드 (월요일 시작, 6주 고정), 날짜별 투두 개수/완료율 바, 날짜 클릭 시 일간 뷰로 이동
- 정렬: 미완료 먼저 → 완료 아래로

## Sharing Feature (투두 공유)
- 진입: 헤더 Users 아이콘 버튼 (파란색) → SharingManager 다이얼로그
- 모델: 이메일로 초대 → 수락 시 **양방향 읽기전용** 공유 성립 (서로의 투두 열람 가능)
- 범위: 투두만 (통계/아카이브/메모 제외)
- DB 구조: sharing_connections의 user_a_id < user_b_id 제약으로 양방향 연결을 단일 row로 관리
- 닉네임: 연결된 동료에게 별명 설정 가능 (user_a_nickname/user_b_nickname). 설정 시 이메일 대신 별명 표시
- Server Actions (sharing-actions.ts): getConnectedUsers, sendInvitation, getPendingInvitations, getSentInvitations, acceptInvitation, declineInvitation, removeConnection, updateNickname, getPendingInvitationCount
- 초대 플로우: 이메일 입력 → profiles에서 대상 조회 → 이미 연결 확인 → 역방향 초대 있으면 자동 수락 → 없으면 초대 생성
- 알림 뱃지: 헤더 아이콘에 대기 초대 수 빨간 뱃지 표시
- 뷰 통합:
  - URL searchParams `?shared=uuid1,uuid2`로 표시할 사용자 선택
  - 동료 투두 필터: 연결된 사용자 체크박스 (SharedUserFilter 컴포넌트)
  - 일간 뷰: 내 투두 아래에 사용자별 그룹핑 + SharedTodoItem (읽기전용, 파란 테두리)
  - 주간/월간 뷰: 내 투두 먼저 → 파란 구분선 → 공유 투두 (이메일 이니셜 표시), 별도 MAX_VISIBLE 카운팅

## Stats Feature (통계 대시보드 + 보고서 통합)
- 페이지: /stats — URL searchParams로 기간 선택 (?period=weekly|monthly|custom&date=YYYY-MM-DD&from=&to=)
- 차트 라이브러리: Recharts (shadcn/ui chart 래퍼) — `components/ui/chart.tsx`
- 통계 집계: `lib/stats.ts` — 순수 함수, DB 저장 없이 매번 실시간 집계
- 데이터 패칭: Server Component에서 현재 + 이전 + 다음 기간 병렬 쿼리 → 서버사이드 집계 → Client Component에 props 전달
- 메트릭 카드: 완료율(AreaChart 스파크라인) | 총 투두 | 완료 | 미완료
- 차트 구성: 카테고리 비중(PieChart 도넛), 활동량(BarChart — 주간뷰:일별/월간뷰:주간)
- 보고서 통합: 대시보드 하단에 아코디언 형태로 보고서 표시, 클립보드 복사 + .txt 다운로드

## Memo Feature (글로벌 스크래치패드)
- 진입: 헤더 메모 아이콘 클릭 또는 키보드 `M`/`ㅡ` → 플로팅 패널 오픈
- 모델: 사용자당 1개의 긴 텍스트 문서 (memos.user_id PK + upsert)
- 비모달 플로팅 패널: 드래그/리사이즈, localStorage로 좌표/크기 영속화
- 자동 저장: useTransition으로 pending 상태, 푸터에 상대시간 표시

## Archive Feature (아카이브)
- 페이지: /archive — URL searchParams로 상태 관리 (?from=&to=&category=&q=)
- 기간 선택: date input 2개 + 프리셋 버튼 3개(이번 달/지난 달/최근 3개월)
- 검색: 300ms debounce, 카테고리 복수 선택 가능
- 주차별 아코디언: groupTodosByWeek()로 그룹핑
- CSV 내보내기: UTF-8 BOM, CRLF, 복사 + 다운로드

## 주의사항
- [RISK] 주간보고서 자동 생성: 규칙 기반 집계로 시작. 실제 제출 가능 품질인지 초기 피드백 필수
- [RISK] 대기업 사내망 접근: 외부 SaaS 차단 가능성. MVP는 개인 디바이스 기준으로 검증
- [RISK] 투두 입력 습관: 20~50대 전연령대가 수용 가능하도록 입력 허들 최소화
- [RISK] 주간보고서 작성 소요시간: 실제로 얼마나 걸리는지 팀원 확인 필요

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase 프로젝트 URL (클라이언트+서버 공용)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public 키 (클라이언트+서버 공용)
- 사용처: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `proxy.ts`

## 금지사항
- any 타입 금지
- 인라인 스타일 금지 (Tailwind 사용)
- Supabase 서비스 키를 클라이언트에 노출 금지
