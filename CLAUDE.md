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
├── app/              # App Router 페이지 & 레이아웃
├── components/       # UI 컴포넌트
│   └── ui/           # shadcn/ui 컴포넌트
├── lib/
│   ├── supabase/
│   │   ├── client.ts # 브라우저(클라이언트 컴포넌트)용
│   │   └── server.ts # 서버 컴포넌트/API용
│   └── utils.ts      # shadcn/ui 유틸
├── hooks/            # 커스텀 훅
├── types/            # TypeScript 타입 정의
└── public/           # 정적 파일
```

## Rules
- UI는 shadcn/ui 우선
- API는 /app/api Route Handler 또는 Supabase Client 직접 호출
- 컴포넌트는 /components/{feature}/
- 타입은 /types/
- Supabase 클라이언트는 /lib/supabase/ (client.ts, server.ts 분리)

## DB Schema
- `todos` 테이블: id(uuid), user_id(uuid), title(text), description(text), category(text), date(date), is_completed(boolean), completed_at(timestamptz), created_at(timestamptz)
- RLS 활성화: 본인 데이터만 CRUD 가능

## 주의사항
- [RISK] 주간보고서 자동 생성: 규칙 기반 집계로 시작. category별 그룹핑 + 완료/미완료 분류. 실제 제출 가능 품질인지 초기 피드백 필수
- [RISK] 대기업 사내망 접근: 외부 SaaS 차단 가능성. MVP는 개인 디바이스 기준으로 검증
- [RISK] 투두 입력 습관: 20~50대 전연령대가 수용 가능하도록 입력 허들 최소화. UI 최대한 단순하게
- [RISK] 주간보고서 작성 소요시간: 실제로 얼마나 걸리는지 팀원 확인 필요 (절약 효과 검증)

## 금지사항
- any 타입 금지
- 인라인 스타일 금지 (Tailwind 사용)
- Supabase 서비스 키를 클라이언트에 노출 금지
