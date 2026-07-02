import { supabase } from "@/integrations/supabase/client";
import type { Note } from "@/types/note";

export async function listNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Note[];
}

export async function createNote(input: { title: string; content: string; user_id: string }): Promise<Note> {
  const { data, error } = await supabase
    .from("notes")
    .insert({ title: input.title, content: input.content, user_id: input.user_id })
    .select()
    .single();
  if (error) throw error;
  return data as Note;
}

export async function updateNote(id: string, input: { title: string; content: string }): Promise<Note> {
  const { data, error } = await supabase
    .from("notes")
    .update({ title: input.title, content: input.content })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Note;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
}
