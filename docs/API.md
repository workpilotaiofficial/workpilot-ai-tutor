# Personalized AI Question and Answer API

The web client uses structured questions and answers. It does not send or consume the legacy merged `instructions` string.

All endpoints require `Authorization: Bearer <access_token>` and return JSON. Admin routes must reject non-admin users with `403`.

## Shared objects

Question fields:

```json
{
  "id": "question-uuid",
  "question": "How do you prefer difficult topics to be explained?",
  "description": "Describe the level of detail and examples that help you.",
  "is_required": true,
  "is_active": true,
  "display_order": 0,
  "created_at": "2026-08-01T10:00:00Z",
  "updated_at": "2026-08-01T10:00:00Z",
  "archived_at": null
}
```

Student answer fields:

```json
{
  "id": "answer-uuid",
  "question_id": "question-uuid",
  "answer": "Start with a simple example, then explain the technical details.",
  "moderation_status": "approved",
  "moderation_reason": null,
  "created_at": "2026-08-01T10:05:00Z",
  "updated_at": "2026-08-01T10:05:00Z"
}
```

Validation limits used by the client:

- `question`: required, trimmed, maximum 500 characters.
- `description`: optional, maximum 1,000 characters.
- `display_order`: non-negative integer.
- `answer`: maximum 2,500 characters. Required questions must have a non-empty trimmed answer.

## Admin endpoints

### List all questions

`GET /api/v1/admin/personalization/questions?include_archived=true`

Response:

```json
{
  "questions": [
    {
      "id": "question-uuid",
      "question": "How do you prefer difficult topics to be explained?",
      "description": null,
      "is_required": true,
      "is_active": true,
      "display_order": 0,
      "created_at": "2026-08-01T10:00:00Z",
      "updated_at": "2026-08-01T10:00:00Z",
      "archived_at": null
    }
  ]
}
```

Results must be ordered by `display_order`, with a stable `id` tie-breaker. When `include_archived` is true, archived questions must remain in the result.

### Create a question

`POST /api/v1/admin/personalization/questions`

```json
{
  "question": "How do you prefer difficult topics to be explained?",
  "description": "Optional helper text.",
  "is_required": true,
  "is_active": true,
  "display_order": 0
}
```

Return the created question, either directly or under `data`. New questions default to required and active when those fields are omitted.

### Update a question

`PATCH /api/v1/admin/personalization/questions/{question_id}`

Accept any subset of the create fields. Updating wording keeps the same question ID and existing answers. Setting `is_active` to `true` on an archived question restores it and clears `archived_at`.

### Archive a question

`DELETE /api/v1/admin/personalization/questions/{question_id}`

This is a soft delete. Set `is_active` to false and `archived_at` to the current time. Do not delete student answers. Archived questions must be excluded from student responses and AI context.

Return `204 No Content` or a JSON success response.

## Student endpoints

### Get active questions and the current user's answers

`GET /api/v1/personalization/questions`

Response:

```json
{
  "questions": [
    {
      "id": "question-uuid",
      "question": "How do you prefer difficult topics to be explained?",
      "description": "Optional helper text.",
      "is_required": true,
      "is_active": true,
      "display_order": 0,
      "created_at": "2026-08-01T10:00:00Z",
      "updated_at": "2026-08-01T10:00:00Z",
      "archived_at": null,
      "answer": {
        "id": "answer-uuid",
        "question_id": "question-uuid",
        "answer": "Start with a simple example.",
        "moderation_status": "approved",
        "moderation_reason": null,
        "created_at": "2026-08-01T10:05:00Z",
        "updated_at": "2026-08-01T10:05:00Z"
      }
    }
  ]
}
```

`answer` is `null` when the current user has not answered. Never expose another user's answer. Only active, non-archived questions are returned.

### Atomically save the current user's answers

`PUT /api/v1/personalization/answers`

```json
{
  "answers": [
    {
      "question_id": "question-uuid",
      "answer": "Start with a simple example, then add technical detail."
    },
    {
      "question_id": "optional-question-uuid",
      "answer": ""
    }
  ]
}
```

Behavior:

- Process the full batch in one database transaction.
- Upsert on the unique key `(user_id, question_id)`.
- Reject duplicate, unknown, inactive, or archived question IDs.
- Reject an empty answer for a required question.
- An empty answer for an optional question removes that user's existing answer for the question.
- Moderate each non-empty answer. A rejected answer must not be used for AI personalization.
- On any validation or moderation failure, roll back the entire batch.
- Return the same `{ "questions": [...] }` shape as the student GET endpoint after saving.

For a question-specific error, return `422` with a field identifier the UI can display:

```json
{
  "message": "One or more personalization answers are invalid.",
  "errors": [
    {
      "question_id": "question-uuid",
      "code": "moderation_rejected",
      "message": "Please revise this answer."
    }
  ]
}
```

## Onboarding completion

The existing endpoint remains in use:

`PATCH /api/v1/auth/onboarding`

```json
{
  "onboarding": true
}
```

The client calls it only after the answer batch succeeds. If there are no active questions, the client marks onboarding complete without sending an answer batch. Adding a new question does not reset onboarding for existing users.

## Persistence and AI context

- Questions and answers must be stored as separate records; do not persist a combined prompt or `instructions` field.
- At generation time, load approved non-empty answers whose questions are active, sort by `display_order`, and construct the model context in memory.
- Treat answers as user-provided preference data, not as trusted system instructions.
- Account deletion must delete that user's answer records. Archiving a question must preserve its answers.

## Legacy migration

1. Seed the current nine fixed questions as active, required questions in their existing order.
2. Map each non-empty legacy structured preference column to an answer for its seeded question.
3. Remove generated preference-label lines from legacy `instructions`; migrate only genuine remaining guidance to a seeded optional question.
4. Make the migration idempotent using the `(user_id, question_id)` unique key.
5. Preserve every user's existing onboarding flag.

The legacy `GET/PUT /api/v1/personalization` contract can remain temporarily for rollback, but the new frontend does not call it.
