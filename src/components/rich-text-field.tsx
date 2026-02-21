import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Markdown } from 'tiptap-markdown';
import { Pencil, Check, Bold, Italic, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RichTextFieldProps {
  value: string;
  onChange: (md: string) => void;
  canEdit: boolean;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

export function RichTextField({
  value,
  onChange,
  canEdit,
  placeholder,
  className,
  compact = false,
}: RichTextFieldProps) {
  const [editing, setEditing] = useState(false);
  const suppressUpdateRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline' },
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
      }),
    ],
    content: value,
    editable: false,
    onUpdate: ({ editor: ed }) => {
      if (suppressUpdateRef.current) return;
      const md = ed.storage.markdown.getMarkdown();
      onChange(md);
    },
  });

  // Sync external value changes (e.g. AI generate)
  useEffect(() => {
    if (!editor) return;
    const currentMd = editor.storage.markdown.getMarkdown();
    if (value !== currentMd) {
      suppressUpdateRef.current = true;
      editor.commands.setContent(value);
      suppressUpdateRef.current = false;
    }
  }, [value, editor]);

  const startEditing = useCallback(() => {
    if (!canEdit || !editor) return;
    setEditing(true);
    editor.setEditable(true);
    requestAnimationFrame(() => editor.commands.focus('end'));
  }, [canEdit, editor]);

  const stopEditing = useCallback(() => {
    if (!editor) return;
    setEditing(false);
    editor.setEditable(false);
  }, [editor]);

  const toggleLink = useCallback(() => {
    if (!editor) return;
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt('URL');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  const isEmpty = !value || value.trim() === '';

  return (
    <div
      className={cn(
        'tiptap-editor group/rtf relative',
        compact ? '' : 'rounded-md border',
        editing && !compact && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
        className,
      )}
    >
      {/* Toolbar (non-compact only, when editing) */}
      {editing && !compact && (
        <div className="flex items-center gap-0.5 border-b px-2 py-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className={cn(editor.isActive('bold') && 'bg-accent')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className={cn(editor.isActive('italic') && 'bg-accent')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className={cn(editor.isActive('link') && 'bg-accent')}
            onClick={toggleLink}
          >
            <LinkIcon className="size-3.5" />
          </Button>
          <div className="flex-1" />
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={stopEditing}
          >
            <Check className="size-3.5" />
            Done
          </Button>
        </div>
      )}

      {/* Editor content */}
      <div
        className={cn(
          compact ? 'py-1' : 'px-3 py-2',
          !editing && 'cursor-default',
          !editing && canEdit && 'cursor-pointer',
        )}
        onClick={!editing && canEdit ? startEditing : undefined}
      >
        {isEmpty && !editing && (
          <span className="text-sm text-muted-foreground">{placeholder || 'Click to edit...'}</span>
        )}
        <EditorContent
          editor={editor}
          className={cn(isEmpty && !editing && 'hidden')}
        />
      </div>

      {/* Pencil overlay (non-compact, view mode) */}
      {!editing && canEdit && !compact && (
        <button
          type="button"
          className="absolute top-2 right-2 opacity-0 group-hover/rtf:opacity-100 transition-opacity p-1 rounded hover:bg-accent"
          onClick={startEditing}
        >
          <Pencil className="size-3.5 text-muted-foreground" />
        </button>
      )}

      {/* Compact: done button */}
      {editing && compact && (
        <button
          type="button"
          className="absolute top-0.5 right-0.5 p-0.5 rounded hover:bg-accent"
          onClick={stopEditing}
        >
          <Check className="size-3 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
