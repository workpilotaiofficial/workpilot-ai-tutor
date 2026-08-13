import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
} from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import { Markdown } from '@tiptap/markdown'
import { JSONContent } from '@tiptap/core'
import {
    Bold,
    Code2,
    Italic,
    Link2,
    List,
    ListOrdered,
    Highlighter,
    Minus,
    Quote,
    Undo2,
    Redo2,
    Strikethrough,
    Underline,
} from 'lucide-react'

export type RichNotesEditorRef = {
    getHTML: () => string
    getMarkdown: () => string
    getJSON: () => JSONContent | null
    setHTML: (html: string) => void
    focus: () => void
    clear: () => void
}

export type NotesEditorContent = {
    html: string
    markdown: string
    plainText: string
    json: JSONContent
}

type RichNotesEditorProps = {
    notesMarkdown?: string

    /**
     * Controlled HTML value
     */
    value?: string

    /**
     * Initial HTML when value is not controlled
     */
    defaultValue?: string

    /**
     * Fires on every content update with HTML
     */
    onChange?: (html: string) => void

    /**
     * Fires once per update with every representation needed by the notes API.
     */
    onContentChange?: (content: NotesEditorContent) => void

    /**
     * Fires on every content update with TipTap JSON
     */
    onJSONChange?: (json: JSONContent) => void

    /**
     * Fires when editor is ready
     */
    onReady?: (payload: {
        getHTML: () => string
        getMarkdown: () => string
        getJSON: () => JSONContent | null
        focus: () => void
    }) => void

    editable?: boolean
    placeholder?: string
    className?: string
    contentClassName?: string
    showToolbar?: boolean
    showBubbleMenu?: boolean
}

function normalizeMarkdown(markdown: string) {
    const normalized = markdown
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/^(\s*[-*+]|\s*\d+\.)\S/gm, '$1 ')
    const cleanedLines = normalized
        .split('\n')
        .filter((line) => {
            const trimmed = line.trim()
            if (!trimmed) return true
            if (/^[-*+]\s*$/.test(trimmed)) return false
            if (/^\d+\.\s*$/.test(trimmed)) return false
            if (/^[-*+]\s*[*_`~\s-]*$/.test(trimmed)) return false
            return true
        })

    return cleanedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

function ToolbarButton({
    active,
    disabled,
    label,
    onClick,
    children,
}: {
    active?: boolean
    disabled?: boolean
    label: string
    onClick: () => void
    children: React.ReactNode
}) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            disabled={disabled}
            onClick={onClick}
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all disabled:pointer-events-none disabled:opacity-30 ${active
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
        >
            {children}
        </button>
    )
}

export const NotesEditor = forwardRef<
    RichNotesEditorRef,
    RichNotesEditorProps
>(function NotesEditor(
    {
        notesMarkdown,
        value,
        defaultValue,
        onChange,
        onContentChange,
        onJSONChange,
        onReady,
        editable = true,
        placeholder = 'Start writing your notes...',
        className = '',
        contentClassName = '',
        showToolbar = true,
        showBubbleMenu = true,
    },
    ref,
) {
    const generatedMarkdown = useMemo(() => {
        if (typeof notesMarkdown === 'string' && notesMarkdown.trim()) {
            return normalizeMarkdown(notesMarkdown)
        }
        return ''
    }, [notesMarkdown])

    const initialContent = value ?? defaultValue ?? generatedMarkdown
    const initialContentType =
        value !== undefined || defaultValue !== undefined ? 'html' : 'markdown'

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 4, 5],
                },
                link: {
                    openOnClick: false,
                    autolink: true,
                    HTMLAttributes: {
                        rel: 'noopener noreferrer nofollow',
                        target: '_blank',
                    },
                },
            }),
            Highlight,
            Markdown,
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: initialContent,
        contentType: initialContentType,
        editable,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: [
                    'mx-auto  h-full w-full max-w-full px-2 py-6 pb-24 text-[16px] leading-[1.45] text-foreground caret-primary focus:outline-none  sm:px-5 sm:py-8 sm:pb-24 lg:py-12',
                    '[&_.rich-note-document]:w-full',
                    '[&_h1]:mb-6 [&_h1]:font-sans [&_h1]:text-[2rem] [&_h1]:font-bold [&_h1]:tracking-[0] [&_h1]:text-foreground [&_h1]:leading-[1.3] lg:[&_h1]:text-[2.5rem]',
                    '[&_h2]:mb-4 [&_h2]:mt-12 [&_h2]:border-t [&_h2]:border-border [&_h2]:pt-8 [&_h2]:font-sans [&_h2]:font-bold [&_h2]:tracking-[-0.02em] [&_h2]:text-primary [&_h2]:text-[1.25rem] [&_h2]:leading-[1.25] lg:[&_h2]:text-[1.59rem]',
                    '[&_h1+h2]:mt-6 [&_h1+h2]:border-t-0 [&_h1+h2]:pt-0',
                    '[&_h3]:mb-3 [&_h3]:mt-7 [&_h3]:font-sans [&_h3]:font-bold [&_h3]:tracking-[-0.01em] [&_h3]:text-foreground [&_h3]:text-[1.2rem] [&_h3]:leading-[1.3]',
                    '[&_h4]:mb-2 [&_h4]:mt-5 [&_h4]:font-sans [&_h4]:font-semibold [&_h4]:text-foreground [&_h4]:text-[1.05rem] [&_h4]:leading-[1.35]',
                    '[&_h5]:mb-2 [&_h5]:mt-4 [&_h5]:font-sans [&_h5]:font-semibold [&_h5]:text-foreground [&_h5]:text-[0.95rem] [&_h5]:leading-[1.4]',
                    '[&_p]:my-0 [&_p]:mb-4 [&_p]:text-foreground/80',
                    '[&_h2+p]:mt-0 [&_h3+p]:mt-0 [&_h4+p]:mt-0 [&_h5+p]:mt-0',
                    '[&_ul]:my-4 [&_ol]:my-4',
                    '[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6',
                    '[&_li]:mb-2 [&_li]:pl-1 [&_li]:text-foreground/80 [&_li]:leading-[1.2] [&_li::marker]:font-semibold [&_li::marker]:text-primary',
                    '[&_li_strong]:text-primary [&_li_strong]:font-semibold',
                    '[&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_a]:decoration-primary/40 [&_a]:underline-offset-4',
                    '[&_code]:rounded-md [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.92em] [&_code]:text-foreground',
                    '[&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:border [&_pre]:border-border [&_pre]:bg-zinc-900 [&_pre]:p-4',
                    '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[0.92rem] [&_pre_code]:leading-2 [&_pre_code]:text-zinc-100',
                    '[&_table]:my-8 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-xl [&_table]:border [&_table]:border-border',
                    '[&_thead]:bg-secondary [&_th]:border-b [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-sm [&_th]:font-semibold [&_th]:text-foreground',
                    '[&_td]:border-b [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm [&_td]:text-foreground/80',
                    '[&_ul:empty]:hidden [&_ol:empty]:hidden',
                    '[&_li:empty]:hidden',
                    '[&_blockquote]:my-6 [&_blockquote]:border-0 [&_blockquote]:border-l-4 [&_blockquote]:border-l-primary [&_blockquote]:pl-5 [&_blockquote]:italic',
                    '[&_blockquote_p]:m-0 [&_blockquote_p]:text-[1.05rem] [&_blockquote_p]:leading-2 [&_blockquote_p]:text-primary',
                    '[&_hr]:my-12 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-border',
                    '[&_mark]:rounded-md [&_mark]:bg-primary/15 [&_mark]:px-1 [&_mark]:py-0.5 [&_mark]:text-inherit [&_mark]:text-foreground',
                    contentClassName,
                ].join(' '),
            },
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML()
            const json = editor.getJSON()

            onChange?.(html)
            onJSONChange?.(json)
            onContentChange?.({
                html,
                markdown: editor.getMarkdown(),
                plainText: editor.getText().trim(),
                json,
            })
        },
    })

    useEffect(() => {
        if (!editor) return
        editor.setEditable(editable)
    }, [editor, editable])

    useEffect(() => {
        if (!editor || value === undefined) return
        const current = editor.getHTML()
        if (value !== current) {
            editor.commands.setContent(value, { emitUpdate: false })
        }
    }, [editor, value])

    useEffect(() => {
        if (!editor || value !== undefined) return
        if (!defaultValue && !generatedMarkdown) return

        if (defaultValue) {
            if (editor.getHTML() !== defaultValue) {
                editor.commands.setContent(defaultValue, {
                    emitUpdate: false,
                    contentType: 'html',
                })
            }
            return
        }

        if (editor.getMarkdown() !== generatedMarkdown) {
            editor.commands.setContent(generatedMarkdown, {
                emitUpdate: false,
                contentType: 'markdown',
            })
        }
    }, [editor, defaultValue, generatedMarkdown, value])

    useEffect(() => {
        if (!editor || !onReady) return

        onReady({
            getHTML: () => editor.getHTML(),
            getMarkdown: () => editor.getMarkdown(),
            getJSON: () => editor.getJSON(),
            focus: () => editor.chain().focus().run(),
        })
    }, [editor, onReady])

    useImperativeHandle(
        ref,
        () => ({
            getHTML: () => editor?.getHTML() ?? '',
            getMarkdown: () => editor?.getMarkdown() ?? '',
            getJSON: () => editor?.getJSON() ?? null,
            setHTML: (html: string) => {
                editor?.commands.setContent(html, { emitUpdate: false })
            },
            focus: () => {
                editor?.chain().focus().run()
            },
            clear: () => {
                editor?.commands.clearContent()
            },
        }),
        [editor],
    )

    if (!editor) return null

    const activeHeading = ([1, 2, 3, 4, 5] as const).find((level) =>
        editor.isActive('heading', { level }),
    )

    const updateLink = () => {
        const previousUrl = editor.getAttributes('link').href as string | undefined
        const url = window.prompt('Paste a link', previousUrl ?? 'https://')
        if (url === null) return
        if (!url.trim()) {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
    }

    return (
        <>
            {showToolbar && (
                <div className=" sticky top-0 left-2 right-2 z-20 flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-gray-100/90 p-1.5 shadow-lg backdrop-blur-lg [scrollbar-width:none] sm:bottom-4 sm:left-1/2 sm:right-auto sm:w-max sm:max-w-[calc(100%-2rem)] sm:-translate-x-1/2 [&::-webkit-scrollbar]:hidden">
                    <ToolbarButton label="Undo" disabled={!editor.can().chain().focus().undo().run()} onClick={() => editor.chain().focus().undo().run()}>
                        <Undo2 className="h-[18px] w-[18px]" />
                    </ToolbarButton>
                    <ToolbarButton label="Redo" disabled={!editor.can().chain().focus().redo().run()} onClick={() => editor.chain().focus().redo().run()}>
                        <Redo2 className="h-[18px] w-[18px]" />
                    </ToolbarButton>
                    <span className="mx-1 h-6 w-px shrink-0 bg-border" />
                    <select
                        aria-label="Text style"
                        value={activeHeading ? `h${activeHeading}` : 'paragraph'}
                        onChange={(event) => {
                            const block = event.target.value
                            if (block === 'paragraph') editor.chain().focus().setParagraph().run()
                            else editor.chain().focus().setHeading({ level: Number(block.slice(1)) as 1 | 2 | 3 | 4 | 5 }).run()
                        }}
                        className="h-9 min-w-[118px] cursor-pointer rounded-lg bg-transparent px-2 text-sm font-medium text-foreground outline-none hover:bg-secondary"
                    >
                        <option value="paragraph">Normal text</option>
                        <option value="h1">Title</option>
                        <option value="h2">Heading 1</option>
                        <option value="h3">Heading 2</option>
                        <option value="h4">Heading 3</option>
                        <option value="h5">Small heading</option>
                    </select>
                    <span className="mx-1 h-6 w-px shrink-0 bg-border" />
                    <ToolbarButton label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-[18px] w-[18px]" /></ToolbarButton>
                    <ToolbarButton label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-[18px] w-[18px]" /></ToolbarButton>
                    <ToolbarButton label="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><Underline className="h-[18px] w-[18px]" /></ToolbarButton>
                    <ToolbarButton label="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-[18px] w-[18px]" /></ToolbarButton>
                    <span className="mx-1 h-6 w-px shrink-0 bg-border" />
                    <ToolbarButton label="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-[18px] w-[18px]" /></ToolbarButton>
                    <ToolbarButton label="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-[18px] w-[18px]" /></ToolbarButton>
                    <ToolbarButton label="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-[18px] w-[18px]" /></ToolbarButton>
                    <span className="mx-1 h-6 w-px shrink-0 bg-border" />
                    <ToolbarButton label="Highlight" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()}><Highlighter className="h-[18px] w-[18px]" /></ToolbarButton>
                    <ToolbarButton label="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}><Code2 className="h-[18px] w-[18px]" /></ToolbarButton>
                    <ToolbarButton label={editor.isActive('link') ? 'Edit link' : 'Add link'} active={editor.isActive('link')} onClick={updateLink}><Link2 className="h-[18px] w-[18px]" /></ToolbarButton>
                    <ToolbarButton label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="h-[18px] w-[18px]" /></ToolbarButton>
                </div>

            )}

        <div className={`rich-notes-editor-root relative h-full min-w-0 ${className}`}>
  
            {showBubbleMenu && editable && (
                <BubbleMenu editor={editor}>
                    <div className="flex items-center gap-0.5 rounded-xl border border-border bg-card p-1 shadow-xl">
                        <ToolbarButton label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></ToolbarButton>
                        <ToolbarButton label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></ToolbarButton>
                        <ToolbarButton label="Highlight" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()}><Highlighter className="h-4 w-4" /></ToolbarButton>
                        <ToolbarButton label="Add link" active={editor.isActive('link')} onClick={updateLink}><Link2 className="h-4 w-4" /></ToolbarButton>
                    </div>
                </BubbleMenu>
            )}

            <div data-note-scroll-container className="px-5 pb-24 sm:px-8">
                <EditorContent editor={editor} />
            </div>
        </div>
        </>
    )
})

