import { describe, expect, it } from 'vitest'
import { convertLegacyTipTapToMarkdown } from './legacy-notes-migration'

describe('legacy notes migration', () => {
  it('converts the supported TipTap document without losing visible text', async () => {
    const result = await convertLegacyTipTapToMarkdown({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Biology Notes' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Cells are ', marks: [{ type: 'bold' }] },
            { type: 'text', text: 'living systems.' },
          ],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'বাংলা উদাহরণ' }],
                },
              ],
            },
          ],
        },
      ],
    })

    expect(result.markdown).toContain('# Biology Notes')
    expect(result.markdown).toContain('**Cells are **living systems.')
    expect(result.markdown).toContain('বাংলা উদাহরণ')
    expect(result.plainText).toContain('Cells are living systems.')
  })

  it('rejects unknown legacy nodes instead of silently overwriting them', async () => {
    await expect(
      convertLegacyTipTapToMarkdown({
        type: 'doc',
        content: [{ type: 'customInteractiveQuiz', attrs: { id: 'quiz-1' } }],
      }),
    ).rejects.toThrow('Unsupported legacy note node')
  })
})

