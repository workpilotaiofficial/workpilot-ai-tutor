# Study-set chat API

Study-set chat uses the same authenticated backend and `apiClient` flow as the
other study-set APIs.

```text
POST /api/v1/study-sets/{study_set_id}/chat
GET  /api/v1/study-sets/{study_set_id}/chat/sessions
GET  /api/v1/study-sets/{study_set_id}/chat/sessions/{conversation_id}
```

## Send a message

```json
{
  "context": {
    "section_type": "multiple_choice",
    "item_id": "123e4567-e89b-12d3-a456-426614174000",
    "item_index": 0
  },
  "text": "Why is option A the correct answer?",
  "client_message_id": "4a41f488-8cd9-4e3e-b15b-061698307859",
  "conversation_id": null,
  "language": "auto"
}
```

Supported `section_type` values:

- `multiple_choice`
- `flashcards`
- `written_test`
- `fill_in_the_blanks`
- `notes`
- `tutor_lesson`

Success:

```json
{
  "data": {
    "conversation_id": "123e4567-e89b-12d3-a456-426614174000",
    "user_message": {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "serial_number": 1,
      "role": "user",
      "text": "Why is option A the correct answer?",
      "created_at": "2026-07-30T06:31:05.675Z"
    },
    "assistant_message": {
      "id": "123e4567-e89b-12d3-a456-426614174002",
      "serial_number": 2,
      "role": "assistant",
      "text": "Option A is correct because...",
      "created_at": "2026-07-30T06:31:06.675Z"
    }
  }
}
```

## List sessions

```text
GET /api/v1/study-sets/{study_set_id}/chat/sessions
```

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "contextType": "multiple_choice",
      "contextItemId": "123e4567-e89b-12d3-a456-426614174010",
      "lastMessageAt": "2026-07-30T06:31:06.675Z",
      "createdAt": "2026-07-30T06:31:05.675Z"
    }
  ]
}
```

## Load a conversation

```text
GET /api/v1/study-sets/{study_set_id}/chat/sessions/{conversation_id}
```

```json
{
  "data": {
    "session": {},
    "messages": []
  }
}
```

The frontend normalizes documented camelCase and snake_case aliases at the API
boundary. The chat panel restores the most recently selected valid backend
session, falls back to the latest session, and provides a new-conversation
option. Gemini credentials and provider conversation state are not stored or
used by the frontend application.
