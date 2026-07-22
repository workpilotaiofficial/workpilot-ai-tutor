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
import { JSONContent } from '@tiptap/core'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSanitize from 'rehype-sanitize'
import rehypeHighlight from 'rehype-highlight'
import rehypeStringify from 'rehype-stringify'
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
    getJSON: () => JSONContent | null
    setHTML: (html: string) => void
    focus: () => void
    clear: () => void
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
     * Fires on every content update with TipTap JSON
     */
    onJSONChange?: (json: JSONContent) => void

    /**
     * Fires when editor is ready
     */
    onReady?: (payload: {
        getHTML: () => string
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

function buildMarkdownHtml(markdown: string) {
    const normalized = normalizeMarkdown(markdown)
    if (!normalized) {
        return ''
    }

    const rendered = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeSanitize)
        .use(rehypeHighlight)
        .use(rehypeStringify)
        .processSync(normalized)
        .toString()

    return `<div class="rich-note-document markdown-note-document">${rendered}</div>`
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
                    ? 'bg-[#e9eafd] text-[#4e57c9] shadow-sm'
                    : 'text-[#536071] hover:bg-[#f1f3f7] hover:text-[#121926]'
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
    const generatedHtml = useMemo(() => {
        if (typeof notesMarkdown === 'string' && notesMarkdown.trim()) {
            return buildMarkdownHtml(notesMarkdown)
        }
        return ''
    }, [notesMarkdown])

    const initialContent = value ?? defaultValue ?? generatedHtml

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
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: initialContent,
        editable,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: [
                    'prose prose-stone mx-auto min-h-[700px] w-full max-w-[920px] px-1 py-8 text-[17px] leading-[1.8] text-[#273244] caret-primary focus:outline-none sm:px-5 lg:py-12',
                    '[&_.rich-note-document]:w-full',
                    '[&_h1]:mb-8 [&_h1]:font-sans [&_h1]:text-[2.25rem] [&_h1]:font-extrabold [&_h1]:tracking-[-0.035em] [&_h1]:text-[#111827] [&_h1]:leading-[1.12] lg:[&_h1]:text-[3.25rem]',
                    '[&_h2]:m-0 [&_h2]:mb-5 [&_h2]:font-sans [&_h2]:font-bold [&_h2]:tracking-[-0.025em] [&_h2]:text-[#172033] [&_h2]:text-[1.75rem] [&_h2]:leading-[1.2] lg:[&_h2]:text-[2.15rem]',
                    '[&_h3]:m-0 [&_h3]:mb-3 [&_h3]:font-sans [&_h3]:font-bold [&_h3]:tracking-[-0.015em] [&_h3]:text-[#1d293d] [&_h3]:text-[1.3rem] [&_h3]:leading-[1.3] lg:[&_h3]:text-[1.55rem]',
                    '[&_h4]:m-0 [&_h4]:mb-2 [&_h4]:font-serif [&_h4]:text-[1.15rem] [&_h4]:leading-[1.3] lg:[&_h4]:text-[1.25rem]',
                    '[&_h5]:m-0 [&_h5]:mb-2 [&_h5]:font-serif [&_h5]:text-[1.02rem] [&_h5]:leading-[1.35] lg:[&_h5]:text-[1.1rem]',
                    '[&_p]:my-0 [&_p]:mb-5 [&_p]:text-[#334155]',
                    '[&_h2]:mt-10 [&_h3]:mt-7 [&_h4]:mt-5 [&_h5]:mt-4',
                    '[&_p+h2]:mt-10 [&_p+h3]:mt-7 [&_p+h4]:mt-5 [&_p+h5]:mt-4',
                    '[&_h2+p]:mt-0 [&_h3+p]:mt-0 [&_h4+p]:mt-0 [&_h5+p]:mt-0',
                    '[&_ul]:my-4 [&_ol]:my-4',
                    '[&_ul]:list-disc [&_ul]:pl-7 [&_ol]:list-decimal [&_ol]:pl-7',
                    '[&_li]:mb-2.5 [&_li]:pl-1 [&_li]:text-[#334155] [&_li]:leading-[1.75] [&_li::marker]:font-semibold [&_li::marker]:text-[#6973e4]',
                    '[&_a]:font-semibold [&_a]:text-[#5865e8] [&_a]:underline [&_a]:decoration-[#aeb4f5] [&_a]:underline-offset-4',
                    '[&_code]:rounded-md [&_code]:bg-[#f6eee7] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.92em] [&_code]:text-[#5c3926]',
                    '[&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:border [&_pre]:border-[#ead8ca] [&_pre]:bg-[#221c19] [&_pre]:p-4',
                    '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[0.92rem] [&_pre_code]:leading-7 [&_pre_code]:text-[#f7efe8]',
                    '[&_table]:my-8 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-xl [&_table]:border [&_table]:border-[#e8d7c8]',
                    '[&_thead]:bg-[#f8eee6] [&_th]:border-b [&_th]:border-[#e8d7c8] [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-sm [&_th]:font-semibold [&_th]:text-[#523b2d]',
                    '[&_td]:border-b [&_td]:border-[#f1e4d9] [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm [&_td]:text-[#4a372b]',
                    '[&_ul:empty]:hidden [&_ol:empty]:hidden',
                    '[&_li:empty]:hidden',
                    '[&_[data-note-eyebrow=true]]:mb-3 [&_[data-note-eyebrow=true]]:text-xs [&_[data-note-eyebrow=true]]:font-semibold [&_[data-note-eyebrow=true]]:uppercase [&_[data-note-eyebrow=true]]:tracking-[0.24em] [&_[data-note-eyebrow=true]]:text-[#9a6d50]',
                    '[&_[data-note-overview=true]]:mb-16 [&_[data-note-overview=true]]:rounded-[30px] [&_[data-note-overview=true]]:border [&_[data-note-overview=true]]:border-[#edd7c7] [&_[data-note-overview=true]]:bg-[#fff7f0] [&_[data-note-overview=true]]:px-7 [&_[data-note-overview=true]]:py-6',
                    '[&_[data-note-overview-body=true]]:text-[1.08rem] [&_[data-note-overview-body=true]]:leading-9 [&_[data-note-overview-body=true]]:text-[#403128]',
                    '[&_[data-note-section]]:scroll-mt-24 [&_[data-note-section]]:mt-16 [&_[data-note-section]]:border-t [&_[data-note-section]]:border-[#f1e2d7] [&_[data-note-section]]:pt-12',
                    '[&_[data-note-section-header=true]]:mb-8',
                    '[&_[data-note-lead=true]]:mt-4 [&_[data-note-lead=true]]:text-[1.2rem] [&_[data-note-lead=true]]:leading-9 [&_[data-note-lead=true]]:text-[#3d2d22]',
                    '[&_[data-note-body=true]_p]:mb-6 [&_[data-note-body=true]_p]:text-[1.08rem] [&_[data-note-body=true]_p]:leading-9 [&_[data-note-body=true]_p]:text-[#47382e]',
                    '[&_blockquote]:my-8 [&_blockquote]:border-0 [&_blockquote]:border-l-4 [&_blockquote]:border-l-[#6570df] [&_blockquote]:bg-[#f7f8ff] [&_blockquote]:px-6 [&_blockquote]:py-4 [&_blockquote]:not-italic',
                    '[&_blockquote_p]:m-0 [&_blockquote_p]:font-medium [&_blockquote_p]:text-[#303b55]',
                    '[&_hr]:my-12 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-[#e3e7ee]',
                    '[&_h1+blockquote]:mt-2 [&_h1+blockquote]:mb-9 [&_h1+blockquote]:rounded-none [&_h1+blockquote]:border-0 [&_h1+blockquote]:bg-transparent [&_h1+blockquote]:px-0 [&_h1+blockquote]:py-0',
                    '[&_h1+blockquote_p]:m-0 [&_h1+blockquote_p]:text-[1.15rem] [&_h1+blockquote_p]:leading-8 [&_h1+blockquote_p]:text-[#54453a]',
                    '[&_h2+blockquote]:mt-2 [&_h2+blockquote]:mb-9 [&_h2+blockquote]:rounded-none [&_h2+blockquote]:border-0 [&_h2+blockquote]:bg-transparent [&_h2+blockquote]:px-0 [&_h2+blockquote]:py-0',
                    '[&_h2+blockquote_p]:m-0 [&_h2+blockquote_p]:text-[1.15rem] [&_h2+blockquote_p]:leading-8 [&_h2+blockquote_p]:text-[#54453a]',
                    '[&_[data-note-subtitle=true]]:mt-2 [&_[data-note-subtitle=true]]:mb-9 [&_[data-note-subtitle=true]]:rounded-none [&_[data-note-subtitle=true]]:border-0 [&_[data-note-subtitle=true]]:bg-transparent [&_[data-note-subtitle=true]]:px-0 [&_[data-note-subtitle=true]]:py-0',
                    '[&_[data-note-subtitle=true]_p]:m-0 [&_[data-note-subtitle=true]_p]:text-[1.15rem] [&_[data-note-subtitle=true]_p]:leading-8 [&_[data-note-subtitle=true]_p]:text-[#54453a]',
                    '[&_[data-note-callout=true]_p]:text-[1.05rem] [&_[data-note-callout=true]_p]:leading-8 [&_[data-note-callout=true]_p]:text-[#614631]',
                    '[&_[data-note-highlights=true]]:mt-8 [&_[data-note-highlights=true]]:flex [&_[data-note-highlights=true]]:flex-wrap [&_[data-note-highlights=true]]:gap-3',
                    '[&_mark]:rounded-md [&_mark]:bg-[#fff0a8] [&_mark]:px-1 [&_mark]:py-0.5 [&_mark]:text-inherit [&_mark]:text-[#263044]',
                    '[&_[data-note-closing=true]]:mt-20 [&_[data-note-closing=true]]:border-t [&_[data-note-closing=true]]:border-[#f1e2d7] [&_[data-note-closing=true]]:pt-10',
                    '[&_[data-note-closing=true]_p:last-child]:text-[1.08rem] [&_[data-note-closing=true]_p:last-child]:leading-9 [&_[data-note-closing=true]_p:last-child]:text-[#47382e]',
                    contentClassName,
                ].join(' '),
            },
        },
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML())
            onJSONChange?.(editor.getJSON())
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
        if (!defaultValue && !generatedHtml) return

        const current = editor.getHTML()
        const next = defaultValue ?? generatedHtml
        if (next && current !== next) {
            editor.commands.setContent(next, { emitUpdate: false })
        }
    }, [editor, defaultValue, generatedHtml, value])

    useEffect(() => {
        if (!editor || !onReady) return

        onReady({
            getHTML: () => editor.getHTML(),
            getJSON: () => editor.getJSON(),
            focus: () => editor.chain().focus().run(),
        })
    }, [editor, onReady])

    useImperativeHandle(
        ref,
        () => ({
            getHTML: () => editor?.getHTML() ?? '',
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
        <div className={`rich-notes-editor-root min-h-full bg-[#fbfcfe] ${className}`}>
            {showToolbar && (
                <div className="sticky top-0 z-20 border-b border-[#e4e7ed] bg-white/95 px-3 py-3 shadow-[0_8px_30px_rgba(22,30,50,0.06)] backdrop-blur-xl sm:px-6">
                    <div className="mx-auto flex max-w-[1120px] items-center gap-1 overflow-x-auto rounded-xl border border-[#dfe3ea] bg-white p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <ToolbarButton label="Undo" disabled={!editor.can().chain().focus().undo().run()} onClick={() => editor.chain().focus().undo().run()}>
                            <Undo2 className="h-[18px] w-[18px]" />
                        </ToolbarButton>
                        <ToolbarButton label="Redo" disabled={!editor.can().chain().focus().redo().run()} onClick={() => editor.chain().focus().redo().run()}>
                            <Redo2 className="h-[18px] w-[18px]" />
                        </ToolbarButton>
                        <span className="mx-1 h-6 w-px shrink-0 bg-[#dfe3ea]" />
                        <select
                            aria-label="Text style"
                            value={activeHeading ? `h${activeHeading}` : 'paragraph'}
                            onChange={(event) => {
                                const block = event.target.value
                                if (block === 'paragraph') editor.chain().focus().setParagraph().run()
                                else editor.chain().focus().setHeading({ level: Number(block.slice(1)) as 1 | 2 | 3 | 4 | 5 }).run()
                            }}
                            className="h-9 min-w-[118px] cursor-pointer rounded-lg bg-transparent px-2 text-sm font-medium text-[#344054] outline-none hover:bg-[#f4f5f8]"
                        >
                            <option value="paragraph">Normal text</option>
                            <option value="h1">Title</option>
                            <option value="h2">Heading 1</option>
                            <option value="h3">Heading 2</option>
                            <option value="h4">Heading 3</option>
                            <option value="h5">Small heading</option>
                        </select>
                        <span className="mx-1 h-6 w-px shrink-0 bg-[#dfe3ea]" />
                        <ToolbarButton label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-[18px] w-[18px]" /></ToolbarButton>
                        <ToolbarButton label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-[18px] w-[18px]" /></ToolbarButton>
                        <ToolbarButton label="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><Underline className="h-[18px] w-[18px]" /></ToolbarButton>
                        <ToolbarButton label="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-[18px] w-[18px]" /></ToolbarButton>
                        <span className="mx-1 h-6 w-px shrink-0 bg-[#dfe3ea]" />
                        <ToolbarButton label="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-[18px] w-[18px]" /></ToolbarButton>
                        <ToolbarButton label="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-[18px] w-[18px]" /></ToolbarButton>
                        <ToolbarButton label="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-[18px] w-[18px]" /></ToolbarButton>
                        <span className="mx-1 h-6 w-px shrink-0 bg-[#dfe3ea]" />
                        <ToolbarButton label="Highlight" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()}><Highlighter className="h-[18px] w-[18px]" /></ToolbarButton>
                        <ToolbarButton label="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}><Code2 className="h-[18px] w-[18px]" /></ToolbarButton>
                        <ToolbarButton label={editor.isActive('link') ? 'Edit link' : 'Add link'} active={editor.isActive('link')} onClick={updateLink}><Link2 className="h-[18px] w-[18px]" /></ToolbarButton>
                        <ToolbarButton label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="h-[18px] w-[18px]" /></ToolbarButton>
                    </div>
                </div>
            )}

            {showBubbleMenu && editable && (
                <BubbleMenu editor={editor}>
                    <div className="flex items-center gap-0.5 rounded-xl border border-[#dfe3ea] bg-white p-1 shadow-xl">
                        <ToolbarButton label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></ToolbarButton>
                        <ToolbarButton label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></ToolbarButton>
                        <ToolbarButton label="Highlight" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()}><Highlighter className="h-4 w-4" /></ToolbarButton>
                        <ToolbarButton label="Add link" active={editor.isActive('link')} onClick={updateLink}><Link2 className="h-4 w-4" /></ToolbarButton>
                    </div>
                </BubbleMenu>
            )}

            <div data-note-scroll-container className="px-5 pb-24 sm:px-8 lg:px-12">
                <EditorContent editor={editor} />
            </div>
        </div>
    )
})
