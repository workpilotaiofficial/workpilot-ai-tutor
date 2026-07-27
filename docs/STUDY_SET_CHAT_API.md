# Study-set chat API

The browser uses this contract whether chat is served by the temporary Next.js
route or the future standalone backend:

```text
POST /api/v1/study-sets/{study_set_id}/chat/messages
GET  /api/v1/study-sets/{study_set_id}/chat/messages
```

## Send a message

```json
{
  "conversation_id": null,
  "client_message_id": "4a41f488-8cd9-4e3e-b15b-061698307859",
  "text": "Why is option A the correct answer?",
  "context": {
    "section_type": "multipleChoice",
    "item_id": "question-uuid",
    "item_index": 0
  },
  "language": "auto"
}
```

Success:

```json
{
  "data": {
    "conversation_id": "conversation-uuid",
    "user_message": {
      "id": "user-message-uuid",
      "role": "user",
      "text": "Why is option A the correct answer?",
      "created_at": "2026-07-27T12:30:10.000Z"
    },
    "assistant_message": {
      "id": "assistant-message-uuid",
      "role": "assistant",
      "text": "Option A is correct because...",
      "created_at": "2026-07-27T12:30:12.000Z",
      "citations": [
        {
          "source_type": "study_item",
          "source_id": "question-uuid",
          "label": "multipleChoice · Item 1"
        }
      ]
    },
    "usage": {
      "credits_used": 0,
      "input_tokens": 0,
      "output_tokens": 0
    }
  },
  "meta": {
    "request_id": "request-uuid"
  }
}
```

## Load history

```text
GET /api/v1/study-sets/{study_set_id}/chat/messages?conversation_id={id}&limit=30&cursor={cursor}
```

```json
{
  "data": {
    "conversation_id": "conversation-uuid",
    "messages": [],
    "pagination": {
      "next_cursor": null,
      "has_more": false
    }
  },
  "meta": {
    "request_id": "request-uuid"
  }
}
```

## Error envelope

```json
{
  "error": {
    "code": "CHAT_MESSAGE_INVALID",
    "message": "Some submitted chat fields are invalid.",
    "details": {}
  },
  "request_id": "request-uuid"
}
```

## Temporary Next.js implementation

- The Gemini key is read only on the server from `GEMINI_API_KEY`.
- The active study item is loaded from the authenticated study-set backend;
  source content and answer data are not accepted from the browser.
- Conversations and idempotency records use a bounded in-memory adapter. They
  survive local hot reloads but are not durable across process restarts or
  serverless instances.
- Gemini conversation state uses the Gemini Interactions API.

## Moving to the standalone backend

Implement the same endpoints and JSON shapes in the backend, persist
conversations/messages there, and set:

```bash
NEXT_PUBLIC_CHAT_API_BASE_URL=https://api.example.com
```

No component or request-shape change is required. The backend should replace
the temporary `credits_used: 0` value with actual credit accounting.
