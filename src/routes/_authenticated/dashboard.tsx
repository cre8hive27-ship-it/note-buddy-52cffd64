import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut, NotebookPen, Plus, StickyNote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { NoteCard } from "@/components/NoteCard";
import { NoteEditorDialog } from "@/components/NoteEditorDialog";
import { listNotes, createNote, updateNote, deleteNote } from "@/services/notes";
import type { Note } from "@/types/note";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My notes — Notely" },
      { name: "description", content: "Your personal notes dashboard." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Note | null>(null);

  const notesQuery = useQuery({ queryKey: ["notes"], queryFn: listNotes });

  const createMut = useMutation({
    mutationFn: (v: { title: string; content: string }) =>
      createNote({ ...v, user_id: user!.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note created");
      setEditorOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (v: { id: string; title: string; content: string }) =>
      updateNote(v.id, { title: v.title, content: v.content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note updated");
      setEditorOpen(false);
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["notes"] });
      const prev = qc.getQueryData<Note[]>(["notes"]);
      qc.setQueryData<Note[]>(["notes"], (old) => (old ?? []).filter((n) => n.id !== id));
      return { prev };
    },
    onError: (e: Error, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["notes"], ctx.prev);
      toast.error(e.message);
    },
    onSuccess: () => toast.success("Note deleted"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });

  async function handleLogout() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  function openNew() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(n: Note) {
    setEditing(n);
    setEditorOpen(true);
  }

  const notes = notesQuery.data ?? [];
  const initials = useMemo(() => (user?.email ?? "?").slice(0, 1).toUpperCase(), [user]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-soft">
              <NotebookPen className="h-4.5 w-4.5" />
            </div>
            <span className="font-semibold tracking-tight">Notely</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-7 w-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-medium">
                {initials}
              </div>
              <span className="max-w-[180px] truncate">{user?.email}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">My notes</h1>
            <p className="text-muted-foreground mt-1">
              {notesQuery.isLoading
                ? "Loading your notes…"
                : `${notes.length} ${notes.length === 1 ? "note" : "notes"}`}
            </p>
          </div>
          <Button onClick={openNew} size="lg" className="shadow-soft">
            <Plus className="h-4 w-4 mr-2" /> New note
          </Button>
        </div>

        {notesQuery.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl py-16 px-6 text-center bg-card/50">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-accent text-primary flex items-center justify-center mb-4">
              <StickyNote className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-semibold">No notes yet</h2>
            <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
              Create your first note to capture ideas, todos, and reminders.
            </p>
            <Button onClick={openNew} className="mt-6">
              <Plus className="h-4 w-4 mr-2" /> Create your first note
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((n) => (
              <NoteCard key={n.id} note={n} onEdit={openEdit} onDelete={setConfirmDelete} />
            ))}
          </div>
        )}
      </main>

      <NoteEditorDialog
        open={editorOpen}
        onOpenChange={(v) => { setEditorOpen(v); if (!v) setEditing(null); }}
        note={editing}
        saving={createMut.isPending || updateMut.isPending}
        onSubmit={async (v) => {
          if (editing) updateMut.mutate({ id: editing.id, ...v });
          else createMut.mutate(v);
        }}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{confirmDelete?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDelete) deleteMut.mutate(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
