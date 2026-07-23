# Adaptive Study Journey — Backend & API Contract

**Product:** Neurova / AI Tutora  
**Target UI:** Study Set overview → Adaptive Study Journey  
**Market context:** Canada-first, Ontario postsecondary-first  
**Contract version:** Draft v1  
**Date:** 23 July 2026

---

## 1. Backend-এর মূল দায়িত্ব

Adaptive Study Journey শুধু generated notes/quiz serve করবে না। Backend-কে একটি continuous learning loop চালাতে হবে:

> context → source understanding → objective map → diagnostic → next best mission → attempt evidence → misconception diagnosis → targeted material → delayed review → readiness update

Backend-এর ছয়টি core responsibility:

1. **Truth:** source, course outline, citation এবং curriculum/assessment context ধরে রাখা।
2. **State:** student কোন objective কতটা জানে এবং তার evidence কী—এটি persist করা।
3. **Decision:** প্রতিবার একটি explainable next best action নির্বাচন করা।
4. **Generation:** objective ও learner state অনুযায়ী small targeted content তৈরি করা।
5. **Evaluation:** answer, confidence, hint use ও delay থেকে evidence strength calculate করা।
6. **Scheduling:** exam date এবং forgetting risk অনুযায়ী review/mission queue তৈরি করা।

UI কোনো mastery, readiness, misconception বা next action নিজে calculate করবে না। UI backend-returned view model render করবে।

---

## 2. API conventions

### Base path

```text
/api/v1
```

### Authentication

বর্তমান authenticated API client ব্যবহার করা যাবে। প্রতিটি request server-side authenticated `user_id` থেকে scope হবে; body থেকে `user_id` trust করা যাবে না।

### Naming

- API payload: `snake_case`
- Database IDs: UUID
- Time: ISO 8601 UTC
- Duration: integer seconds
- Percentage/probability: `0–1` decimal; UI-তে percent conversion
- Locale: BCP 47, যেমন `en-CA`, `fr-CA`
- Province: ISO 3166-2 subdivision, যেমন `CA-ON`, `CA-BC`, `CA-QC`

### Success envelope

```json
{
  "data": {},
  "meta": {
    "contract_version": "2026-07-01",
    "generated_at": "2026-07-23T15:10:00Z"
  },
  "request_id": "req_01J..."
}
```

### Error envelope

```json
{
  "error": {
    "code": "SOURCE_NOT_READY",
    "message": "Two sources are still being processed.",
    "details": {
      "source_ids": ["src_1", "src_2"]
    },
    "retryable": true
  },
  "request_id": "req_01J..."
}
```

Recommended HTTP codes:

| Code | Use |
|---|---|
| 200 | Read/update success |
| 201 | Resource created |
| 202 | Async analysis/generation accepted |
| 400 | Invalid field/state |
| 401/403 | Authentication/ownership/permission |
| 404 | Resource missing |
| 409 | Version conflict, duplicate attempt, invalid state transition |
| 422 | Semantically invalid source/answer/config |
| 429 | Rate limit/generation capacity |
| 503 | Temporary model/provider failure |

### Idempotency

নিচের POST request-এ `Idempotency-Key` header required:

- journey create
- source completion
- diagnostic attempt
- mission attempt
- mission complete
- offline sync

একই key retry হলে একই logical result ফেরত আসবে; double attempt বা double credit charge হবে না।

### Optimistic concurrency

Editable resource-এ `version` integer থাকবে।

```json
{
  "version": 7,
  "daily_minutes": 25
}
```

Stale version হলে `409 VERSION_CONFLICT` এবং current representation ফেরত দিতে হবে।

---

## 3. Required domain model

### 3.1 `study_set`

Existing study set-এর সঙ্গে:

```text
id
user_id
title
journey_status
locale
timezone
created_at
updated_at
version
```

`journey_status`:

```text
draft
sources_processing
scope_confirmation
diagnostic_ready
diagnostic_in_progress
active
paused
completed
```

### 3.2 `learning_context`

```text
study_set_id
country_code
province_code
institution_name
institution_type
course_code
course_title
program_language
goal_type
assessment_title
assessment_at
daily_minutes
weekdays
timezone
accessibility_preferences_json
academic_integrity_mode
version
```

`goal_type`: `understand`, `exam`, `quick_review`, `assignment_guidance`

### 3.3 `source_document` and `source_anchor`

```text
source_document:
  id, study_set_id, kind, filename, mime_type, status, page_count,
  language, content_hash, extraction_version, created_at

source_anchor:
  id, source_id, page, slide, timestamp_start, timestamp_end,
  section_title, block_index, text, bounding_box_json
```

`status`: `uploading`, `processing`, `ready`, `needs_attention`, `failed`

### 3.4 `course_contract`

Course outline/syllabus থেকে extracted এবং student-confirmed:

```text
id
study_set_id
institution
term
course_code
instructor_name
learning_outcomes_json
assessment_components_json
exam_scope_json
weekly_topics_json
rubric_terms_json
ai_policy_json
source_anchor_ids_json
confirmation_status
version
```

### 3.5 `learning_objective`

```text
id
study_set_id
title
description
position
importance_weight
estimated_minutes
prerequisite_objective_ids_json
source_anchor_ids_json
assessment_links_json
status
version
```

### 3.6 `learner_objective_state`

```text
user_id
objective_id
status
mastery_probability
confidence_calibration
forgetting_risk
hint_dependency
attempt_count
last_evidence_at
next_review_at
strongest_evidence_type
state_reason_json
version
```

`status`: `not_started`, `building`, `stable`, `transfer_ready`

### 3.7 `learning_session` and `session_step`

```text
learning_session:
  id, study_set_id, user_id, kind, objective_ids_json, status,
  planned_seconds, started_at, completed_at, plan_reason_json, version

session_step:
  id, session_id, position, type, objective_id, item_id,
  estimated_seconds, status, generation_status
```

`kind`: `diagnostic`, `daily_mission`, `review`, `exam_rehearsal`, `custom`

### 3.8 `learning_item`

সব format-এর common item model:

```text
id
study_set_id
objective_id
type
prompt_json
answer_key_json
rubric_json
difficulty
evidence_type
source_anchor_ids_json
generation_version
quality_status
created_at
```

`type`: `mcq`, `short_answer`, `fill_blank`, `flashcard`, `worked_example`, `teach_back`, `written_response`

### 3.9 `attempt`

```text
id
user_id
study_set_id
session_id
step_id
item_id
objective_id
response_json
is_correct
score
confidence
response_time_ms
hints_used
answer_revealed
evidence_strength
evaluation_json
created_at
```

### 3.10 `misconception`

```text
id
canonical_key
title
description
subject_domain
repair_strategy_json
```

Link table:

```text
learner_misconception:
  user_id, study_set_id, objective_id, misconception_id,
  confidence, occurrence_count, first_seen_at, last_seen_at,
  repair_status, verified_at
```

### 3.11 `review_schedule`

```text
id
user_id
study_set_id
objective_id
due_at
reason
priority
status
source_attempt_id
completed_at
```

### 3.12 `generated_artifact` and `generation_job`

Targeted explanation/variant generation async হলে:

```text
generation_job:
  id, study_set_id, session_id, objective_id, kind, status,
  input_version, provider, model, prompt_version, error_code,
  created_at, completed_at

generated_artifact:
  id, generation_job_id, type, content_json, source_anchor_ids_json,
  quality_result_json, version
```

---

## 4. UI bootstrap endpoint

### `GET /api/v1/study-sets/{study_set_id}/journey`

Study Set overview-এর primary endpoint। UI ideally এক request-এ above-the-fold data পাবে।

Query:

```text
?include=mission,reviews,objectives,week,sources,coach_insight
```

Response:

```json
{
  "data": {
    "study_set_id": "ss_123",
    "journey_status": "active",
    "course": {
      "title": "Introduction to Biology",
      "code": "BIO101",
      "institution": "Example College",
      "assessment_label": "Midterm 2",
      "assessment_at": "2026-08-04T13:00:00-04:00",
      "days_remaining": 12,
      "daily_minutes": 20,
      "locale": "en-CA",
      "timezone": "America/Toronto"
    },
    "readiness": {
      "score": 0.68,
      "change_this_week": 0.09,
      "ready_objectives": 7,
      "total_objectives": 12,
      "label": "Building"
    },
    "mission": {
      "id": "ses_301",
      "status": "planned",
      "eyebrow": "TODAY'S BEST NEXT STEP",
      "title": "Repair cellular respiration",
      "objective_id": "obj_4",
      "objective_title": "Compare aerobic and anaerobic respiration",
      "reason": {
        "summary": "You answered this incorrectly with high confidence.",
        "signals": [
          "high_confidence_incorrect",
          "assessment_weight_high",
          "review_due"
        ]
      },
      "estimated_seconds": 840,
      "completed_steps": 0,
      "steps": [
        {
          "id": "step_1",
          "type": "recall",
          "label": "Quick recall",
          "estimated_seconds": 60,
          "status": "planned"
        },
        {
          "id": "step_2",
          "type": "explain",
          "label": "Focused explanation",
          "estimated_seconds": 180,
          "status": "planned"
        },
        {
          "id": "step_3",
          "type": "guided_practice",
          "label": "Guided practice",
          "estimated_seconds": 240,
          "status": "planned"
        },
        {
          "id": "step_4",
          "type": "independent_check",
          "label": "Independent check",
          "estimated_seconds": 240,
          "status": "planned"
        },
        {
          "id": "step_5",
          "type": "teach_back",
          "label": "Teach it back",
          "estimated_seconds": 120,
          "status": "planned"
        }
      ]
    },
    "coach_insight": {
      "type": "confidence_gap",
      "eyebrow": "COACH INSIGHT",
      "title": "Your confidence is ahead of your evidence",
      "body": "Application questions are causing errors even when you feel certain.",
      "objective_id": "obj_4",
      "action_label": "See the evidence"
    },
    "reviews": [
      {
        "id": "rev_1",
        "objective_id": "obj_2",
        "title": "Cell membrane transport",
        "due_at": "2026-07-23T14:00:00Z",
        "due_label": "Due now",
        "estimated_seconds": 120,
        "urgency": "due"
      }
    ],
    "objectives": [
      {
        "id": "obj_1",
        "title": "Describe ATP production",
        "status": "stable",
        "mastery_probability": 0.82,
        "evidence_label": "Delayed recall passed",
        "source_label": "Lecture 4 · slides 8–16",
        "next_review_at": "2026-07-27T14:00:00Z"
      }
    ],
    "week": [
      {
        "date": "2026-07-23",
        "short_label": "THU",
        "date_label": "23",
        "planned_seconds": 1200,
        "status": "today",
        "focus": "Respiration repair"
      }
    ],
    "source_health": {
      "ready": 6,
      "total": 6,
      "status": "healthy",
      "label": "All 6 sources are ready"
    }
  },
  "meta": {
    "contract_version": "2026-07-01",
    "generated_at": "2026-07-23T15:10:00Z"
  },
  "request_id": "req_01J..."
}
```

### Cache policy

- Browser: `no-store` for user-specific mastery.
- Server-side short cache acceptable only per user/study-set and invalidated after attempt/session/context change.
- Response should be fast; p95 target `< 500 ms`, excluding first generation.

---

## 5. Journey setup APIs

### 5.1 Create learning context

`PUT /api/v1/study-sets/{study_set_id}/learning-context`

```json
{
  "version": 1,
  "country_code": "CA",
  "province_code": "CA-ON",
  "institution_name": "Example College",
  "institution_type": "college",
  "course_code": "BIO101",
  "course_title": "Introduction to Biology",
  "program_language": "en-CA",
  "goal_type": "exam",
  "assessment_title": "Midterm 2",
  "assessment_at": "2026-08-04T13:00:00-04:00",
  "daily_minutes": 20,
  "weekdays": [1, 2, 3, 4, 5, 6],
  "timezone": "America/Toronto",
  "academic_integrity_mode": "learning"
}
```

Response:

```json
{
  "data": {
    "version": 2,
    "journey_status": "sources_processing",
    "recommended_daily_minutes": 22,
    "plan_feasibility": {
      "status": "achievable",
      "estimated_total_minutes": 242,
      "available_total_minutes": 260
    }
  },
  "request_id": "req_..."
}
```

### 5.2 Source upload

Existing `/api/v1/upload/pdf` ও `/api/v1/upload/text` compatibility রাখা যাবে, তবে response-এ `study_set_id`, `source_id`, `source_kind` ও `processing_status` প্রয়োজন।

Recommended direct upload flow:

1. `POST /study-sets/{id}/sources/presign`
2. Client object storage-এ upload
3. `POST /study-sets/{id}/sources/complete`

Presign request:

```json
{
  "filename": "BIO101-course-outline.pdf",
  "mime_type": "application/pdf",
  "size_bytes": 1284220,
  "kind": "course_outline"
}
```

`kind`:

```text
course_outline
lecture
notes
practice_assessment
rubric
mark_scheme
textbook
other
```

Complete request:

```json
{
  "upload_id": "upl_123",
  "storage_key": "private/...",
  "content_hash": "sha256:..."
}
```

Response `202`:

```json
{
  "data": {
    "source_id": "src_123",
    "status": "processing",
    "job_id": "job_123"
  },
  "request_id": "req_..."
}
```

### 5.3 Source status

`GET /api/v1/study-sets/{id}/sources`

Each source-এ extraction warning দিতে হবে:

```json
{
  "id": "src_123",
  "filename": "lecture-04.pdf",
  "kind": "lecture",
  "status": "needs_attention",
  "page_count": 32,
  "language": "en",
  "warnings": [
    {
      "code": "LOW_OCR_CONFIDENCE",
      "message": "Pages 14–16 may be difficult to read.",
      "pages": [14, 15, 16]
    }
  ]
}
```

### 5.4 Analyze course contract and objectives

`POST /api/v1/study-sets/{id}/analysis`

```json
{
  "source_ids": ["src_outline", "src_lecture_1", "src_lecture_2"],
  "extract": [
    "course_contract",
    "learning_objectives",
    "prerequisites",
    "assessment_blueprint"
  ]
}
```

Response `202`:

```json
{
  "data": {
    "job_id": "job_analysis_1",
    "status": "queued"
  }
}
```

### 5.5 Confirm extracted scope

`PUT /api/v1/study-sets/{id}/scope`

```json
{
  "version": 3,
  "course_contract": {
    "assessment_title": "Midterm 2",
    "assessment_weight": 0.2,
    "included_week_ranges": ["week_3", "week_4", "week_5"],
    "ai_policy_acknowledged": true
  },
  "objectives": [
    {
      "id": "obj_1",
      "included": true,
      "title": "Describe ATP production",
      "importance_weight": 0.9
    },
    {
      "id": "obj_2",
      "included": false
    }
  ]
}
```

---

## 6. Diagnostic APIs

### 6.1 Start diagnostic

`POST /api/v1/study-sets/{id}/diagnostics`

```json
{
  "objective_ids": ["obj_1", "obj_2", "obj_3"],
  "target_item_count": 10,
  "max_seconds": 420,
  "include_confidence": true,
  "include_teach_back": true
}
```

Response `201`:

```json
{
  "data": {
    "diagnostic_id": "diag_1",
    "session_id": "ses_diag_1",
    "status": "in_progress",
    "current_item": {
      "id": "item_1",
      "type": "mcq",
      "objective_id": "obj_1",
      "prompt": {
        "stem": "Which statement best explains...?",
        "options": [
          {"id": "opt_a", "text": "..."},
          {"id": "opt_b", "text": "..."}
        ]
      },
      "difficulty": "medium",
      "position": 1,
      "total_estimate": 10,
      "source_citations_hidden_until_submit": true
    }
  }
}
```

### 6.2 Submit diagnostic attempt

`POST /api/v1/study-sets/{id}/diagnostics/{diagnostic_id}/attempts`

```json
{
  "item_id": "item_1",
  "response": {
    "selected_option_id": "opt_b"
  },
  "confidence": 4,
  "response_time_ms": 18320,
  "client_attempt_id": "01J...",
  "accessibility_context": {
    "extended_time": false
  }
}
```

`confidence`: `1=guess`, `2=unsure`, `3=fairly_sure`, `4=certain`

Response:

```json
{
  "data": {
    "attempt_id": "att_1",
    "evaluation": {
      "is_correct": false,
      "score": 0,
      "feedback_mode": "withheld_until_diagnostic_end"
    },
    "diagnostic_progress": {
      "answered": 1,
      "estimated_remaining": 8
    },
    "next_item": {
      "id": "item_2",
      "type": "short_answer",
      "objective_id": "obj_3",
      "prompt": {
        "stem": "In one sentence, explain..."
      }
    }
  }
}
```

### 6.3 Complete diagnostic

`POST /api/v1/study-sets/{id}/diagnostics/{diagnostic_id}/complete`

Response:

```json
{
  "data": {
    "status": "completed",
    "summary": {
      "already_strong": 3,
      "focus_now": 4,
      "not_yet_assessed": 2,
      "confidence_calibration": "overconfident_on_application"
    },
    "objective_states": [
      {
        "objective_id": "obj_1",
        "status": "building",
        "mastery_probability": 0.43,
        "reason": "Recognition succeeded; independent explanation was incomplete."
      }
    ],
    "recommended_mission_id": "ses_301"
  }
}
```

---

## 7. Mission and next-action APIs

### 7.1 Ask for next best session

`POST /api/v1/study-sets/{id}/sessions/next`

```json
{
  "available_seconds": 1200,
  "mode": "recommended",
  "device_context": "desktop",
  "offline_required": false
}
```

Response `201` returns the mission shape used in `GET /journey`.

Decision engine inputs:

- assessment importance
- assessment date
- objective mastery/evidence
- forgetting risk
- prerequisite block
- high-confidence mistake
- due reviews
- recent cognitive load
- available time
- accessibility settings

Response-এর `plan_reason` অবশ্যই explainable:

```json
{
  "plan_reason": {
    "summary": "This is next because it is heavily weighted and your last certain answer was incorrect.",
    "signals": [
      {
        "type": "assessment_weight",
        "value": 0.2
      },
      {
        "type": "high_confidence_incorrect",
        "attempt_id": "att_1"
      }
    ]
  }
}
```

### 7.2 Start/resume session

`POST /api/v1/study-sets/{id}/sessions/{session_id}/start`

```json
{
  "client_started_at": "2026-07-23T15:20:00Z",
  "resume_step_id": null
}
```

Response includes first renderable step:

```json
{
  "data": {
    "session_id": "ses_301",
    "status": "in_progress",
    "current_step": {
      "id": "step_1",
      "type": "recall",
      "objective_id": "obj_4",
      "content": {
        "prompt": "Before reviewing, write what you remember about..."
      },
      "input": {
        "type": "textarea",
        "minimum_characters": 20
      },
      "source_citations": [],
      "position": 1,
      "total_steps": 5
    }
  }
}
```

### 7.3 Generic attempt submission

`POST /api/v1/study-sets/{id}/sessions/{session_id}/attempts`

এই endpoint existing MCQ/flashcard/fill-blank silo endpoint-এর replacement।

Request:

```json
{
  "step_id": "step_3",
  "item_id": "item_44",
  "objective_id": "obj_4",
  "item_type": "short_answer",
  "response": {
    "text": "..."
  },
  "confidence": 4,
  "response_time_ms": 18320,
  "hints_used": 1,
  "client_attempt_id": "01J...",
  "client_sequence": 4
}
```

Response:

```json
{
  "data": {
    "attempt_id": "att_44",
    "evaluation": {
      "is_correct": false,
      "score": 0.35,
      "rubric": [
        {
          "criterion": "Identifies oxygen's role",
          "met": true,
          "feedback": "Correctly identifies oxygen as the final electron acceptor."
        },
        {
          "criterion": "Distinguishes source of released oxygen",
          "met": false,
          "feedback": "The oxygen released in photosynthesis comes from water."
        }
      ],
      "feedback": {
        "what_happened": "You combined two different processes.",
        "why_it_is_tempting": "Both processes mention oxygen and carbon dioxide.",
        "one_thing_to_remember": "Track the molecule, not only the gas name."
      }
    },
    "diagnosis": {
      "category": "misconception",
      "misconception_id": "mis_8",
      "title": "Confuses molecular source and process role",
      "confidence": 0.88,
      "priority": "high"
    },
    "mastery_update": {
      "objective_id": "obj_4",
      "previous_status": "building",
      "current_status": "building",
      "previous_probability": 0.55,
      "current_probability": 0.47,
      "reason": "High-confidence incorrect independent recall"
    },
    "next_action": {
      "type": "contrast_example",
      "status": "generating",
      "generation_job_id": "job_88",
      "reason": "A contrast case is the fastest repair for this misconception."
    },
    "review_schedule": {
      "review_id": "rev_88",
      "due_at": "2026-07-25T15:00:00Z",
      "reason": "misconception_repair_verification"
    },
    "source_citations": [
      {
        "source_id": "src_4",
        "source_title": "Lecture 4",
        "label": "Slide 12",
        "anchor_id": "anc_91",
        "excerpt": "..."
      }
    ]
  }
}
```

### 7.4 Request hint

`POST /api/v1/study-sets/{id}/sessions/{session_id}/steps/{step_id}/hint`

```json
{
  "hint_level": 1,
  "student_work": {
    "text": "..."
  }
}
```

Hint levels:

1. direction/question
2. conceptual clue
3. partially worked step
4. full walkthrough

Response:

```json
{
  "data": {
    "hint_level": 1,
    "content": "Which molecule changes first in the pathway?",
    "remaining_independent_evidence_weight": 0.8
  }
}
```

### 7.5 Reveal answer

`POST /api/v1/study-sets/{id}/sessions/{session_id}/steps/{step_id}/reveal`

Answer reveal event persist করতে হবে; পরে same item correct হলেও independent evidence হিসেবে count হবে না।

### 7.6 Get generated remediation

`GET /api/v1/study-sets/{id}/generation-jobs/{job_id}`

```json
{
  "data": {
    "id": "job_88",
    "status": "completed",
    "artifact": {
      "id": "art_88",
      "type": "contrast_example",
      "content": {
        "title": "Keep these two roles separate",
        "body": "...",
        "comparison": []
      },
      "source_citations": [],
      "quality": {
        "answer_supported": true,
        "citation_coverage": 1,
        "validator_status": "passed"
      }
    }
  }
}
```

### 7.7 Complete mission

`POST /api/v1/study-sets/{id}/sessions/{session_id}/complete`

```json
{
  "client_completed_at": "2026-07-23T15:34:00Z",
  "reflection": {
    "confidence": 3,
    "still_unclear": "How this changes without oxygen"
  }
}
```

Response:

```json
{
  "data": {
    "session_id": "ses_301",
    "status": "completed",
    "summary": {
      "minutes_spent": 13,
      "objectives_improved": 1,
      "misconceptions_repaired": 1,
      "still_building": 1
    },
    "readiness": {
      "previous_score": 0.68,
      "current_score": 0.72,
      "label": "Building"
    },
    "next_review": {
      "due_at": "2026-07-25T15:00:00Z",
      "estimated_seconds": 120
    }
  }
}
```

---

## 8. Review and progress APIs

### 8.1 Review queue

`GET /api/v1/study-sets/{id}/reviews?status=due&limit=20`

```json
{
  "data": [
    {
      "id": "rev_1",
      "objective_id": "obj_2",
      "objective_title": "Cell membrane transport",
      "due_at": "2026-07-23T14:00:00Z",
      "priority": 0.92,
      "reason": "delayed_recall",
      "estimated_seconds": 120
    }
  ],
  "pagination": {
    "next_cursor": null,
    "has_more": false
  }
}
```

### 8.2 Start review session

`POST /api/v1/study-sets/{id}/reviews/sessions`

```json
{
  "review_ids": ["rev_1", "rev_2"],
  "available_seconds": 300
}
```

Returns a normal `learning_session`; attempt endpoint একই থাকবে।

### 8.3 Objective progress

`GET /api/v1/study-sets/{id}/objectives`

Filters:

```text
?status=building&sort=priority&cursor=...
```

Objective detail:

`GET /api/v1/study-sets/{id}/objectives/{objective_id}`

Response-এ evidence timeline:

```json
{
  "data": {
    "id": "obj_4",
    "title": "Compare aerobic and anaerobic respiration",
    "state": {
      "status": "building",
      "mastery_probability": 0.47,
      "forgetting_risk": 0.31,
      "confidence_calibration": -0.22
    },
    "evidence": [
      {
        "attempt_id": "att_44",
        "occurred_at": "2026-07-23T15:26:00Z",
        "evidence_type": "independent_recall",
        "result": "incorrect",
        "confidence": 4,
        "weight": -0.2
      }
    ],
    "source_coverage": {
      "covered_anchor_count": 8,
      "required_anchor_count": 10
    }
  }
}
```

### 8.4 Readiness forecast

`GET /api/v1/study-sets/{id}/readiness`

Readiness শুধু average accuracy নয়।

```json
{
  "data": {
    "score": 0.68,
    "label": "Building",
    "confidence_interval": {
      "low": 0.61,
      "high": 0.74
    },
    "assessment_at": "2026-08-04T13:00:00-04:00",
    "forecast_at_assessment": 0.79,
    "assumptions": {
      "daily_minutes": 20,
      "planned_session_completion_rate": 0.8
    },
    "drivers": [
      {
        "type": "stable_objectives",
        "effect": 0.18,
        "label": "7 of 12 objectives have delayed evidence"
      },
      {
        "type": "transfer_gap",
        "effect": -0.12,
        "label": "Application questions remain weak"
      }
    ],
    "disclaimer": "This is a learning-readiness estimate, not a guaranteed grade."
  }
}
```

---

## 9. Tutor APIs

### 9.1 Create tutor turn

`POST /api/v1/study-sets/{id}/tutor/turns`

```json
{
  "session_id": "ses_301",
  "objective_id": "obj_4",
  "message": "Why does oxygen matter here?",
  "selected_source_anchor_ids": [],
  "requested_mode": "hint_first",
  "locale": "en-CA"
}
```

Response `202`:

```json
{
  "data": {
    "turn_id": "turn_1",
    "stream_url": "/api/v1/study-sets/ss_123/tutor/turns/turn_1/stream"
  }
}
```

SSE event examples:

```text
event: tutor.delta
data: {"turn_id":"turn_1","text":"Start by tracking..."}

event: tutor.citation
data: {"anchor_id":"anc_91","label":"Lecture 4 · slide 12"}

event: tutor.next_prompt
data: {"type":"student_attempt","prompt":"What do you think happens next?"}

event: tutor.completed
data: {"turn_id":"turn_1","direct_answer_revealed":false}
```

Tutor backend policy:

- Ask → Hint → Explain → Attempt → Feedback → Fresh check
- current objective/session/attempt context required
- source-grounded fact-এর citation
- outside-source explanation label
- direct-answer reveal logged
- instructor AI policy respected
- English/French quality pipeline separate

---

## 10. Notes, plan, and preferences APIs

### Notes autosave

`PATCH /api/v1/study-sets/{id}/notes/{note_id}`

```json
{
  "version": 8,
  "content": {
    "type": "doc",
    "content": []
  },
  "plain_text": "..."
}
```

### Update study plan

`PATCH /api/v1/study-sets/{id}/plan`

```json
{
  "version": 4,
  "daily_minutes": 25,
  "weekdays": [1, 2, 3, 4, 6],
  "assessment_at": "2026-08-04T13:00:00-04:00"
}
```

Response includes regenerated week preview and plan feasibility.

### Accessibility preferences

`PATCH /api/v1/users/me/learning-accessibility`

```json
{
  "reduced_motion": true,
  "extended_time_multiplier": 1.5,
  "captions_required": true,
  "prefer_keyboard_interactions": true,
  "display_density": "comfortable"
}
```

These settings hint dependency বা slow-response penalty হিসেবে ব্যবহার করা যাবে না।

---

## 11. Realtime events

Current WebSocket generation infrastructure reuse করা যাবে।

Recommended event types:

```text
source.processing
source.ready
source.failed
analysis.progress
analysis.completed
mission.generated
remediation.generated
readiness.updated
review.due
plan.updated
```

Envelope:

```json
{
  "event_id": "evt_123",
  "type": "readiness.updated",
  "study_set_id": "ss_123",
  "occurred_at": "2026-07-23T15:34:00Z",
  "data": {
    "previous_score": 0.68,
    "current_score": 0.72
  }
}
```

Client reconnect-এ `Last-Event-ID` বা sequence support দরকার, না হলে event miss হলে UI bootstrap endpoint refetch করবে।

---

## 12. Offline support

### Download pack

`POST /api/v1/study-sets/{id}/offline-packs`

```json
{
  "available_seconds": 1200,
  "include_due_reviews": true,
  "expires_in_hours": 24
}
```

Response signed/encrypted package metadata।

### Sync attempts

`POST /api/v1/study-sets/{id}/offline-sync`

```json
{
  "pack_id": "pack_1",
  "base_version": 19,
  "events": [
    {
      "client_event_id": "evt_local_1",
      "type": "attempt.submitted",
      "occurred_at": "2026-07-23T16:00:00-04:00",
      "payload": {}
    }
  ]
}
```

Response:

```json
{
  "data": {
    "accepted_event_ids": ["evt_local_1"],
    "rejected_events": [],
    "new_version": 23,
    "journey_refresh_required": true
  }
}
```

---

## 13. Generation and evaluation architecture

### Generation input contract

Every generation job-এর input:

```json
{
  "objective": {},
  "learner_state": {},
  "recent_attempts": [],
  "misconceptions": [],
  "source_anchors": [],
  "assessment_context": {},
  "pedagogy": {
    "strategy": "contrast_example",
    "guidance_level": 2,
    "target_evidence_type": "transfer"
  },
  "locale": "en-CA"
}
```

### Quality gates

Student-কে item দেওয়ার আগে:

- objective alignment
- source support
- answer validation
- citation coverage
- ambiguity check
- distractor correctness
- duplicate/similarity check
- difficulty check
- answer leakage check
- safety/academic-integrity check

Fail হলে retry with reason; repeated failure হলে student-কে “Needs source clarification” state এবং safe fallback।

### Written evaluation

Client-side keyword matching ব্যবহার করা যাবে না। Evaluation:

1. deterministic checks where possible
2. rubric-based evaluator
3. source support verifier
4. score/feedback consistency pass
5. low-confidence result human-safe wording

Evaluation response-এ `evaluation_confidence` ও `grading_version` থাকতে হবে।

---

## 14. Decision engine v1

প্রথম version rules-based এবং explainable রাখুন।

Suggested priority:

```text
priority =
  assessment_importance * 0.25
  + due_review_urgency * 0.20
  + misconception_priority * 0.20
  + forgetting_risk * 0.15
  + prerequisite_block * 0.10
  + confidence_gap * 0.10
```

Rules:

- `unattempted` = unknown, weak নয়।
- MCQ correct = weak evidence।
- independent short recall = medium evidence।
- written/teach-back/transfer = strong evidence।
- hint/reveal evidence weight কমাবে।
- same-session repeated success stable করবে না।
- delayed independent success stable করতে পারে।
- high-confidence incorrect attempt remediation priority বাড়াবে।
- accessibility extension response-time penalty disable/normalize করবে।

Every state update-এ machine-readable এবং display-safe `reason` persist করুন।

---

## 15. UI-to-API mapping

| UI block/action | API |
|---|---|
| Journey overview bootstrap | `GET /study-sets/{id}/journey` |
| Exam countdown/daily time edit | `PUT /learning-context` or `PATCH /plan` |
| Readiness ring | journey response; detail from `GET /readiness` |
| Today’s Mission | journey response or `POST /sessions/next` |
| “Why this next?” | `mission.reason` from backend |
| Start/continue mission | `POST /sessions/{session_id}/start` |
| Mission answer | generic `POST /sessions/{session_id}/attempts` |
| Hint | `POST /steps/{step_id}/hint` |
| Review queue card | `GET /reviews` |
| Start reviews | `POST /reviews/sessions` |
| Coach insight | journey response; evidence via objective detail |
| Knowledge map | `GET /objectives` |
| Week plan | journey response; edit via `PATCH /plan` |
| Source health | `GET /sources` |
| Notes/resource cards | existing content endpoints |
| Live generation | WebSocket/SSE events |

UI component should depend on a normalized `AdaptiveJourneyViewModel`; API service maps backend `snake_case` response to frontend `camelCase`.

---

## 16. MVP endpoint priority

### P0: UI and closed-loop MVP

1. `GET /study-sets/{id}/journey`
2. `PUT /study-sets/{id}/learning-context`
3. `POST /study-sets/{id}/analysis`
4. `PUT /study-sets/{id}/scope`
5. `POST /study-sets/{id}/diagnostics`
6. `POST /diagnostics/{id}/attempts`
7. `POST /diagnostics/{id}/complete`
8. `POST /study-sets/{id}/sessions/next`
9. `POST /sessions/{id}/start`
10. `POST /sessions/{id}/attempts`
11. `POST /sessions/{id}/complete`
12. `GET /study-sets/{id}/reviews`
13. `GET /study-sets/{id}/objectives`
14. `GET /study-sets/{id}/readiness`

### P1

- hint/reveal
- async targeted remediation
- course-outline contract extraction
- notes durable autosave
- tutor SSE
- plan editing

### P2

- offline packs/sync
- voice teach-back
- exam rehearsal
- French/Québec content pipeline
- cross-study-set misconception memory

---

## 17. Non-functional requirements

### Performance

- Journey bootstrap p95 `< 500 ms`
- Attempt evaluation deterministic/MCQ p95 `< 700 ms`
- AI short-answer feedback p95 `< 4 s`, progressive status after 800 ms
- Tutor first token p95 `< 1.5 s`
- Mission generation p95 `< 8 s`; cached safe fallback required

### Observability

Every generation/evaluation log:

```text
request_id
user_id_hash
study_set_id
session_id
objective_id
item_id
model
prompt_version
generation_version
latency_ms
token/cost
quality_status
error_code
```

Learner answer বা source excerpt raw application log-এ নয়; secure scoped storage-এ।

### Privacy

- Uploaded sources/answers model training-এ default opt-out নয়—default **not used**।
- Account/source/learner-profile delete।
- Data export।
- Retention per data category।
- Subprocessor and cross-border processing disclosure।
- Minor accounts-এর stronger privacy defaults।
- Institution tenants logically isolated।

### Accessibility

- Attempt timing accommodation-aware।
- Timer pause/extension server-enforced।
- Audio content-এর transcript।
- API content semantic blocks-এ ফেরত দেবে; presentation-only HTML নয়।

---

## 18. Migration from current backend

Current reusable assets:

- PDF/text upload
- batch generation jobs
- WebSocket/polling
- MCQ/flashcard/fill-blank attempt persistence
- existing progress endpoint
- notes/content endpoints

Migration steps:

1. Existing responses-এ stable `document_id`, `source_id`, `objective_id`, `item_id` যোগ।
2. Current per-format attempt endpoint request generic `attempt` table-এ dual-write।
3. Existing progress থেকে `learner_objective_state` backfill যেখানে topic mapping reliable।
4. `GET /journey` adapter current data + new learner state compose করবে।
5. New mission flow launch হলেও old formats “Study tools” হিসেবে available থাকবে।
6. Data quality stable হলে UI direct old progress calculation বন্ধ করবে।

---

## 19. Backend acceptance checklist

- [ ] Student ownership every query-তে enforced
- [ ] Unattempted state `unknown`
- [ ] Every generated factual item has source anchor
- [ ] Every next action has explainable reason
- [ ] Duplicate POST idempotent
- [ ] Attempt and state update atomic
- [ ] Answer reveal/hint use evidence-এ reflected
- [ ] Delayed review created after learning evidence
- [ ] Readiness has uncertainty/disclaimer
- [ ] Accessibility accommodation timing-safe
- [ ] Course AI policy visible to tutor/assignment mode
- [ ] Async job retry and terminal failure state
- [ ] Export/delete/retention implemented
- [ ] Contract tests generated from API schema
- [ ] Journey endpoint meets latency target

---

## 20. Recommended backend handoff

Backend implementation শুরু করার আগে এই document থেকে OpenAPI 3.1 schema তৈরি করুন। Frontend এবং backend একই generated TypeScript types ব্যবহার করবে।

সবচেয়ে গুরুত্বপূর্ণ boundary:

> Frontend student interaction capture করবে; backend learner state, diagnosis, next action, readiness এবং scheduling-এর একমাত্র source of truth হবে।

এই boundary রাখলে আজকের mock UI-তে পরে real API বসাতে rendering বা information architecture পুনরায় লিখতে হবে না।

