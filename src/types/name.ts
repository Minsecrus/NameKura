export type FilterId =
  | "all"
  | "双字名"
  | "单字名"
  | "诗意"
  | "清雅"
  | "中性"
  | "峻朗";

export type FilterOption = {
  id: FilterId;
  label: string;
};

export type NameCard = {
  id: string;
  name: string;
  surname: string;
  givenName: string;
  tags: string[];
  likes: number;
  dislikes: number;
  source: "seed" | "user";
};
