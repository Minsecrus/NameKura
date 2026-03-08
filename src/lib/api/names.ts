import { parseChineseName } from "@/lib/name-parser";
import { supabase } from "@/lib/supabase";
import { getSessionId } from "@/lib/session";
import type { NameCard } from "@/types/name";

type NameFeedRow = {
  id: string;
  surname: string;
  given_name: string;
  full_name: string;
  tags: string[] | null;
  source: "seed" | "user";
  upvotes_count: number;
  downvotes_count: number;
};

function mapNameRow(row: NameFeedRow): NameCard {
  return {
    id: row.id,
    dislikes: row.downvotes_count,
    givenName: row.given_name,
    likes: row.upvotes_count,
    name: row.full_name,
    source: row.source,
    surname: row.surname,
    tags: row.tags ?? [],
  };
}

export async function fetchPublishedNames(limit = 320) {
  const { data, error } = await supabase
    .from("name_feed")
    .select("id, surname, given_name, full_name, tags, source, upvotes_count, downvotes_count")
    .order("score", { ascending: false })
    .order("created_at", { ascending: false })
    .range(0, limit - 1);

  if (error) {
    throw error;
  }

  return (data satisfies NameFeedRow[]).map(mapNameRow);
}

export async function createName(fullName: string) {
  const parsed = parseChineseName(fullName);
  const user = (await supabase.auth.getUser()).data.user;

  const { data, error } = await supabase
    .from("names")
    .insert({
      given_name: parsed.givenName,
      source: "user",
      status: "published",
      submitted_by: user?.id ?? null,
      submitted_session_id: user ? null : getSessionId(),
      surname: parsed.surname,
      tags: [],
    })
    .select("id, surname, given_name, full_name, tags, source, upvotes_count, downvotes_count")
    .single();

  if (error) {
    throw error;
  }

  return mapNameRow(data satisfies NameFeedRow);
}

export async function voteName(nameId: string, direction: "up" | "down") {
  const { data, error } = await supabase.rpc("vote_name", {
    target_name_id: nameId,
    target_session_id: getSessionId(),
    target_value: direction === "up" ? 1 : -1,
  });

  if (error) {
    throw error;
  }

  return mapNameRow(data satisfies NameFeedRow);
}

export async function recordCopy(nameId: string) {
  const { error } = await supabase.rpc("record_copy", {
    target_name_id: nameId,
    target_session_id: getSessionId(),
  });

  if (error) {
    throw error;
  }
}
