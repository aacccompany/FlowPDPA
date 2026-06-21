import { useMemo } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { marked } from 'marked'
import TurndownService from 'turndown'
import { normalizePolicyMarkdown } from '@/utils/policyMarkdown'
import {
  Bold, Heading1, Heading2, Italic, Link2, List, ListOrdered,
  Quote, Redo2, RemoveFormatting, Undo2,
} from 'lucide-react'

interface LegalPolicyEditorProps {
  value: string
  onChange: (markdown: string) => void
}

const markdownToHtml = (value: string) => marked.parse(normalizePolicyMarkdown(value) || '<p></p>', { async: false }) as string

export function LegalPolicyEditor({ value, onChange }: LegalPolicyEditorProps) {
  const turndown = useMemo(() => {
    const service = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' })
    service.keep(['table', 'thead', 'tbody', 'tr', 'th', 'td'])
    return service
  }, [])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true, defaultProtocol: 'https' }),
    ],
    content: markdownToHtml(value),
    editorProps: { attributes: { class: 'legal-editor-document' } },
    onUpdate: ({ editor: current }) => onChange(normalizePolicyMarkdown(turndown.turndown(current.getHTML()))),
  })

  if (!editor) return <div className="legal-editor-loading">Loading editor...</div>

  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined
    const href = window.prompt('Link URL', previous || 'https://')
    if (href === null) return
    if (!href.trim()) editor.chain().focus().extendMarkRange('link').unsetLink().run()
    else editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run()
  }

  const tools = [
    { label: 'Heading 1', Icon: Heading1, active: editor.isActive('heading', { level: 1 }), run: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: 'Heading 2', Icon: Heading2, active: editor.isActive('heading', { level: 2 }), run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'Bold', Icon: Bold, active: editor.isActive('bold'), run: () => editor.chain().focus().toggleBold().run() },
    { label: 'Italic', Icon: Italic, active: editor.isActive('italic'), run: () => editor.chain().focus().toggleItalic().run() },
    { label: 'Bullet list', Icon: List, active: editor.isActive('bulletList'), run: () => editor.chain().focus().toggleBulletList().run() },
    { label: 'Numbered list', Icon: ListOrdered, active: editor.isActive('orderedList'), run: () => editor.chain().focus().toggleOrderedList().run() },
    { label: 'Quote', Icon: Quote, active: editor.isActive('blockquote'), run: () => editor.chain().focus().toggleBlockquote().run() },
    { label: 'Link', Icon: Link2, active: editor.isActive('link'), run: setLink },
  ]

  return <div className="legal-editor-shell">
    <div className="legal-editor-toolbar" role="toolbar" aria-label="Policy formatting">
      {tools.map(({ label, Icon, active, run }) => <button key={label} type="button" className="legal-editor-tool" data-active={active} onClick={run} title={label} aria-label={label}><Icon /></button>)}
      <span className="legal-editor-divider" />
      <button type="button" className="legal-editor-tool" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear formatting" aria-label="Clear formatting"><RemoveFormatting /></button>
      <button type="button" className="legal-editor-tool" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} title="Undo" aria-label="Undo"><Undo2 /></button>
      <button type="button" className="legal-editor-tool" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} title="Redo" aria-label="Redo"><Redo2 /></button>
    </div>
    <EditorContent editor={editor} />
  </div>
}
