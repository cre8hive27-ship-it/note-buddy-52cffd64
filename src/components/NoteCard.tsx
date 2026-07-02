import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Note } from "@/types/note";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

interface Props {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export function NoteCard({ note, onEdit, onDelete }: Props) {
  return (
    <Card className="group p-5 flex flex-col gap-3 shadow-soft hover:shadow-elevated transition-all border-border/60 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-base leading-tight line-clamp-2">{note.title}</h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(note)} aria-label="Edit note">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(note)} aria-label="Delete note">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-5 whitespace-pre-wrap min-h-[3rem]">
        {note.content || <span className="italic opacity-70">No content</span>}
      </p>
      <p className="text-xs text-muted-foreground/80 mt-auto pt-1">
        {formatDate(note.created_at)}
      </p>
    </Card>
  );
}
