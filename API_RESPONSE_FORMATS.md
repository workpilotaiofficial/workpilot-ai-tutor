# Study Set API Response Formats

This document defines the expected API response structures for study set generation and how they are normalized by the frontend.

## Fill in the Blanks (`fill_in_blanks`)

### API Response Format

```json
{
  "study_set_id": "uuid",
  "total_questions": 8,
  "questions": [
    {
      "id": "question-uuid",
      "studySetId": "uuid",
      "userId": "uuid",
      "typeJobId": "uuid",
      "fullSentence": "The Sun contains about ____ of the Solar System's total mass.",
      "displaySentence": "The Sun contains about ____ of the Solar System's total mass.",
      "blanks": [
        {
          "answer": "99.8%",
          "position": 1
        }
      ],
      "topic": "Solar System composition",
      "difficulty": null,
      "position": 1,
      "isDeleted": false,
      "isUserEdited": false,
      "createdAt": "2026-05-30T07:51:40.867Z",
      "updatedAt": "2026-05-30T07:51:40.867Z"
    }
  ]
}
```

### Frontend Normalization

The frontend transforms the API response into the following structure for use in the UI:

```typescript
{
  type: 'fillInTheBlanks',
  items: [
    {
      sentence: "The Sun contains about ____ of the Solar System's total mass.",
      answer: "99.8%",
      explanation: null or string  // optional explanation/hint
    }
  ]
}
```

### Field Mapping

| API Field | UI Field | Notes |
|-----------|----------|-------|
| `displaySentence` or `fullSentence` | `sentence` | The sentence with the blank to fill |
| `blanks[0].answer` | `answer` | The correct answer (extracted from first blank) |
| `blanks[0].hint` or `explanation` | `explanation` | Optional explanation (optional) |

### Important Notes

- **Field naming**: The API can use either camelCase (`displaySentence`, `fullSentence`) or snake_case (`display_sentence`, `full_sentence`). The frontend normalizes both.
- **Blanks array**: Currently only the first blank is used. Multiple blanks per question may be supported in the future.
- **Explanation**: If not provided in the API response, set to `null`. The frontend will handle missing explanations gracefully.
- **Position**: Questions should be ordered by the `position` field if provided.

## Multiple Choice (`multiple_choice` / `quiz`)

### API Response Format

```json
{
  "study_set_id": "uuid",
  "total_questions": 6,
  "questions": [
    {
      "id": "question-uuid",
      "studySetId": "uuid",
      "userId": "uuid",
      "typeJobId": "uuid",
      "questionText": "Which enzyme is secreted in the mouth and begins the chemical digestion of carbohydrates?",
      "options": [
        {
          "id": "a",
          "text": "Amylase"
        },
        {
          "id": "b",
          "text": "Pepsin"
        },
        {
          "id": "c",
          "text": "Lipase"
        },
        {
          "id": "d",
          "text": "Trypsin"
        }
      ],
      "correctOptionId": "a",
      "explanation": "Amylase is found in saliva and begins breaking down carbohydrates in the mouth...",
      "topic": "Enzymes in Digestion",
      "difficulty": "easy",
      "position": 1,
      "isDeleted": false,
      "isUserEdited": false,
      "createdAt": "2026-05-30T07:58:32.769Z",
      "updatedAt": "2026-05-30T07:58:32.769Z"
    }
  ]
}
```

### Frontend Normalization

```typescript
{
  type: 'multipleChoice',
  items: [
    {
      question: "Which enzyme is secreted in the mouth...",
      options: ["Amylase", "Pepsin", "Lipase", "Trypsin"],
      answer: "Amylase",  // text of the correct option
      explanation: "Amylase is found in saliva..."
    }
  ]
}
```

### Field Mapping

| API Field | UI Field | Notes |
|-----------|----------|-------|
| `questionText` | `question` | The question prompt |
| `options[].text` | `options` | Array of option texts only (IDs discarded) |
| Correct option `text` | `answer` | Matched by `correctOptionId` |
| `explanation` | `explanation` | Why the answer is correct |

### Important Notes

- **Field naming**: The API can use camelCase (`questionText`, `correctOptionId`) or snake_case (`question_text`, `correct_option_id`). The frontend normalizes both.
- **Answer matching**: The correct answer is found by matching the `correctOptionId` to an option's `id`, then extracting its `text`.
- **Options order**: Must be preserved as provided in the API response.

## Field Naming Convention

All API responses support **flexible field naming**. The frontend normalization functions automatically handle both:

- **camelCase**: `questionText`, `correctOptionId`, `displaySentence`
- **snake_case**: `question_text`, `correct_option_id`, `display_sentence`

This allows your backend to use either naming convention consistently. Examples:

| camelCase | snake_case | Used For |
|-----------|-----------|----------|
| `questionText` | `question_text` | Multiple choice questions |
| `correctOptionId` | `correct_option_id` | Multiple choice correct answer |
| `displaySentence` | `display_sentence` | Fill-in-the-blanks sentence |
| `fullSentence` | `full_sentence` | Fill-in-the-blanks fallback |
| `titleJobId` | `title_job_id` | Any job identifier |
| `createdAt` | `created_at` | Timestamps |
| `tutorLesson` | `tutor_lesson` | Nested tutor lesson object |

## Summary of All Normalizations

All section types follow a similar pattern:
1. **Extract and flatten** the raw API response into UI-friendly items
2. **Map field names** from either camelCase or snake_case to the UI format
3. **Preserve core content** while discarding metadata not needed by the UI

For detailed normalization logic for all section types (flashcards, written_test, tutor_lesson, podcast, notes), see `components/study-sets/generated-output.ts`.
