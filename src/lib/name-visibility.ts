import type { NameCard } from "@/types/name";

export function shouldDisplayName(card: Pick<NameCard, "likes" | "dislikes">) {
  return !(
    card.dislikes > card.likes * 3 &&
    card.dislikes - card.likes > 5
  );
}
