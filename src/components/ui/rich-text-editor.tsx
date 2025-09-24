'use client'

import React, { useCallback, useEffect } from 'react'
import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, Type } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null
  }

  return (
    <div className="border-b border-border px-3 py-2 flex items-center gap-1">
      <Button
        type="button"
        variant={editor.isActive('bold') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className="h-8 w-8 p-0"
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={editor.isActive('italic') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className="h-8 w-8 p-0"
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1" />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setHardBreak().run()}
        className="h-8 px-2"
        title="Line Break"
      >
        <Type className="h-4 w-4 mr-1" />
        Break
      </Button>
    </div>
  )
}

export function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "Enter text...", 
  className,
  disabled = false 
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        dropcursor: false,
        gapcursor: false,
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
    },
    editable: !disabled,
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false)
    }
  }, [editor, content])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Allow Shift+Enter to insert a hard break
    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault()
      editor?.chain().focus().setHardBreak().run()
    }
  }, [editor])

  return (
    <div className={cn("border border-border rounded-md bg-background", className)}>
      <MenuBar editor={editor} />
      <div 
        className="prose prose-sm max-w-none p-3 min-h-[100px] focus-within:outline-none"
        onKeyDown={handleKeyDown}
      >
        <EditorContent 
          editor={editor} 
          className="outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[80px] [&_.ProseMirror]:p-0"
        />
        {!content && (
          <div className="absolute inset-0 top-12 left-3 text-muted-foreground pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  )
}

// Component for displaying formatted content
interface FormattedTextProps {
  content: string
  className?: string
}

export function FormattedText({ content, className }: FormattedTextProps) {
  if (!content || content === '<p></p>') {
    return null
  }

  return (
    <div 
      className={cn("prose prose-sm max-w-none", className)}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}