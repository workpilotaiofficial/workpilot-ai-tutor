'use client'

import type { ForwardedRef } from 'react'
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  ChangeCodeMirrorLanguage,
  CodeToggle,
  ConditionalContents,
  CreateLink,
  DiffSourceToggleWrapper,
  HighlightToggle,
  InsertCodeBlock,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  MDXEditor,
  type MDXEditorMethods,
  type MDXEditorProps,
  Separator,
  StrikeThroughSupSubToggles,
  UndoRedo,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from '@mdxeditor/editor'
import { isAllowedNotesUrl } from './notes-content'

export type InitializedMDXNotesEditorProps = Omit<
  MDXEditorProps,
  'plugins' | 'suppressHtmlProcessing'
> & {
  baselineMarkdown: string
  editorRef: ForwardedRef<MDXEditorMethods>
}

export default function InitializedMDXNotesEditor({
  baselineMarkdown,
  editorRef,
  ...props
}: InitializedMDXNotesEditorProps) {
  return (
    <MDXEditor
      {...props}
      ref={editorRef}
      suppressHtmlProcessing
      plugins={[
        headingsPlugin({
          allowedHeadingLevels: [1, 2, 3, 4, 5],
        }),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        linkPlugin({ validateUrl: isAllowedNotesUrl }),
        linkDialogPlugin(),
        tablePlugin(),
        codeBlockPlugin({ defaultCodeBlockLanguage: 'text' }),
        codeMirrorPlugin({
          autoLoadLanguageSupport: true,
          codeBlockLanguages: {
            text: 'Plain text',
            js: 'JavaScript',
            jsx: 'JavaScript React',
            ts: 'TypeScript',
            tsx: 'TypeScript React',
            json: 'JSON',
            css: 'CSS',
            html: 'HTML',
            python: 'Python',
            java: 'Java',
            c: 'C',
            cpp: 'C++',
            sql: 'SQL',
            bash: 'Shell',
          },
        }),
        diffSourcePlugin({
          diffMarkdown: baselineMarkdown,
          viewMode: 'rich-text',
          readOnlyDiff: true,
        }),
        toolbarPlugin({
          toolbarPosition: 'bottom',
          toolbarClassName: 'neurova-mdx-toolbar',
          toolbarContents: () => (
            <DiffSourceToggleWrapper>
              <UndoRedo />
              <Separator />
              <BlockTypeSelect />
              <Separator />
              <BoldItalicUnderlineToggles options={['Bold', 'Italic']} />
              <StrikeThroughSupSubToggles options={['Strikethrough']} />
              <HighlightToggle />
              <CodeToggle />
              <CreateLink />
              <Separator />
              <ListsToggle options={['bullet', 'number', 'check']} />
              <InsertTable />
              <InsertThematicBreak />
              <ConditionalContents
                options={[
                  {
                    when: (editor) => editor?.editorType === 'codeblock',
                    contents: () => <ChangeCodeMirrorLanguage />,
                  },
                  {
                    fallback: () => <InsertCodeBlock />,
                  },
                ]}
              />
            </DiffSourceToggleWrapper>
          ),
        }),
        markdownShortcutPlugin(),
      ]}
    />
  )
}
