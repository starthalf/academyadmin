# 학원용 앱 마이그레이션 (v1 → v2)

반-수업 구조 도입. 한 명의 선생님은 본인이 담당하는 반의 학생들만 관리.

---

## 핵심 변경

### 1. 새로운 엔티티
- **Teacher** (선생님): 원장(owner) / 일반 선생님(teacher)
- **Class** (반): 선생님 1명 + 과목 1개 + 학생 N명 + 요일/시간
- **ClassEnrollment** (반-학생 연결): N:M 관계

### 2. 입력 데이터에 컨텍스트 추가
모든 입력 데이터에 `classId` + `teacherId` 추가:
- Attendance, Homework, TeacherFeedback, Score

### 3. 새로 추가된 데이터: ClassMoodFeedback
반 단위 분위기 피드백. 전체 학생을 일일이 입력할 필요 없음.

---

## 화면 구조 변화

### 변경 전 (v1)
```
홈(대시보드) → 오늘 할 일 카운트
출결 페이지 → 학원 전체 학생
숙제 페이지 → 학원 전체 학생 × 전체 과목
피드백 페이지 → 학원 전체 학생
성적 페이지 → 학원 전체 학생
학생 페이지 → 학원 전체
```

### 변경 후 (v2)
```
홈 → 오늘 내 수업 (반 카드 리스트)
  └─ 반 클릭 → 반 상세 페이지
                ├─ [출결] 탭 (그 반 학생만)
                ├─ [숙제] 탭 (그 반 학생만, 그 반 과목만)
                └─ [피드백] 탭
                      ├─ 반 분위기 (필수, 30초)
                      └─ 인상적 학생만 (선택)

성적 → 반 선택 + 점수 일괄 입력
학생 → 내 반 학생 (선생님) / 전체 학생 (원장)
설정 → 선생님 정보 + 반 관리 + 테스트용 선생님 전환
```

---

## 피드백 페이지 UX 개선 (핵심)

### 변경 전
- 학생 1명씩 카드 넘기기
- 학생당 기분/집중/교우 3개 항목 모두 입력 필수
- → 20명 × 3항목 = 60번 터치, 매일 못 함

### 변경 후
- **[반 분위기]** 1번 터치 — 필수, 30초
- **[인상적 학생]** — 선택, 칭찬/걱정되는 학생만 태그
- 결과: 매일 입력 부담 약 1/10 수준으로 감소

---

## 테스트 계정 (mockData)

| 이메일 | 역할 | 담당 반 |
|---|---|---|
| owner@smart.academy | 원장 | 전체 반 조회 |
| math@smart.academy | 수학 선생님 | 초3/4/5 수학A |
| eng@smart.academy | 영어 선생님 | 초3/4 영어A |
| kor@smart.academy | 국어 선생님 | 초4 국어A |

비밀번호는 아무 4자 이상.
설정 페이지에서 "테스트: 선생님 전환"으로 즉시 다른 선생님 시점으로 변경 가능.

---

## 다음 단계 (Step 6: Supabase 연동)

현재 localStorage 기반. Supabase 연동 시 작업할 부분:

1. **Supabase 프로젝트 생성** + 테이블 생성
2. **데이터 모델 그대로 매핑** (이미 DB 구조처럼 짜여 있음)
3. **AuthContext** → Supabase Auth로 교체
4. **DataContext** → Supabase Client로 교체
5. **RLS (Row Level Security)** 설정
   - 선생님: 본인 teacher_id인 classes만 접근
   - 원장: 학원 전체 접근

DB 스키마는 이미 types/index.ts에 맞춰 잡혀 있어서 그대로 옮기면 됨.

---

## localStorage 키 (디버깅용)

| 키 | 용도 |
|---|---|
| academy_auth_v2 | 로그인된 선생님 |
| academy_attendance_v2_YYYY-MM-DD | 일별 출결 |
| academy_feedback_v2_YYYY-MM-DD | 일별 개별 학생 피드백 |
| academy_homework_v2_YYYY-MM-DD | 일별 숙제 |
| academy_class_mood_v2_YYYY-MM-DD | 일별 반 분위기 |
| academy_scores_v2 | 성적 (누적) |

기존 v1 데이터와 충돌 안 되도록 `_v2` 접미사 사용.
