import { describe, expect, it } from 'vitest'
import {
  isAllowedNotesUrl,
  markdownToPlainText,
} from './notes-content'

describe('notes content helpers', () => {
  it('extracts readable text from mixed English and Bangla Markdown', () => {
    const markdown = [
      '# Photosynthesis',
      '',
      'বাংলা ব্যাখ্যা with **important** context.',
      '',
      '- Light',
      '- [Source](https://example.com)',
      '',
      '| Term | Meaning |',
      '| --- | --- |',
      '| ATP | Energy |',
    ].join('\n')

    expect(markdownToPlainText(markdown)).toBe(
      [
        'Photosynthesis',
        '',
        'বাংলা ব্যাখ্যা with important context.',
        '',
        'Light',
        'Source',
        '',
        'Term\tMeaning',
        'ATP\tEnergy',
      ].join('\n'),
    )
  })

  it('only accepts safe note link protocols', () => {
    expect(isAllowedNotesUrl('https://neurova.ai')).toBe(true)
    expect(isAllowedNotesUrl('mailto:support@neurova.ai')).toBe(true)
    expect(isAllowedNotesUrl('/dashboard/study-sets')).toBe(true)
    expect(isAllowedNotesUrl('#revision')).toBe(true)
    expect(isAllowedNotesUrl('javascript:alert(1)')).toBe(false)
    expect(isAllowedNotesUrl('data:text/html,test')).toBe(false)
  })
})

