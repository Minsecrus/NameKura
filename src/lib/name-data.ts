import { parseChineseName } from "@/lib/name-parser";
import type { FilterOption, NameCard } from "@/types/name";

export const LOAD_BATCH_SIZE = 24;

export const FILTERS: FilterOption[] = [
  { id: "all", label: "全部" },
  { id: "双字名", label: "双字名" },
  { id: "单字名", label: "单字名" },
  { id: "诗意", label: "诗意" },
  { id: "清雅", label: "清雅" },
  { id: "中性", label: "中性" },
  { id: "峻朗", label: "峻朗" },
];

const SURNAMES = [
  "林",
  "周",
  "沈",
  "许",
  "顾",
  "宋",
  "陆",
  "程",
  "徐",
  "江",
  "陈",
  "梁",
  "谢",
  "白",
  "姜",
  "苏",
  "温",
  "叶",
  "何",
  "纪",
];

const GIVEN_PARTS = [
  "知",
  "予",
  "时",
  "序",
  "川",
  "宁",
  "言",
  "舟",
  "遥",
  "岚",
  "清",
  "朗",
  "允",
  "禾",
  "野",
  "朔",
  "安",
  "见",
  "景",
  "衍",
  "弈",
  "礼",
  "望",
  "栖",
  "映",
  "维",
  "然",
  "霁",
  "朝",
  "墨",
  "湛",
  "暄",
  "屿",
  "弦",
  "之",
  "初",
];

const STYLE_TAGS = ["诗意", "清雅", "中性", "峻朗", "温润", "山海"];

function buildSeedCard(seed: number) {
  const surname = SURNAMES[seed % SURNAMES.length];
  const givenLength = seed % 6 === 0 ? 1 : 2;
  const first = GIVEN_PARTS[(seed * 3 + 5) % GIVEN_PARTS.length];
  const second = GIVEN_PARTS[(seed * 5 + 11) % GIVEN_PARTS.length];
  const given = givenLength === 1 ? first : `${first}${second === first ? "宁" : second}`;
  const styleA = STYLE_TAGS[seed % STYLE_TAGS.length];
  const styleB = STYLE_TAGS[(seed + 2) % STYLE_TAGS.length];

  return {
    dislikes: seed % 5,
    givenName: given,
    likes: 18 + (seed % 43),
    name: `${surname}${given}`,
    surname,
    tags: [givenLength === 1 ? "单字名" : "双字名", styleA, styleB],
  };
}

export function generateBatch(page: number, batchSize: number): NameCard[] {
  return Array.from({ length: batchSize }, (_, index) => {
    const seed = page * batchSize + index;
    const card = buildSeedCard(seed);

    return {
      id: `seed-${seed}`,
      source: "seed",
      ...card,
    };
  });
}

export function buildUserCard(name: string): NameCard {
  const parsed = parseChineseName(name);
  const styleA = STYLE_TAGS[name.length % STYLE_TAGS.length];
  const styleB = STYLE_TAGS[(name.length + 3) % STYLE_TAGS.length];

  return {
    id: `user-${Date.now()}`,
    dislikes: 0,
    givenName: parsed.givenName,
    likes: 1,
    name: parsed.fullName,
    source: "user",
    surname: parsed.surname,
    tags: [parsed.givenName.length === 1 ? "单字名" : "双字名", styleA, styleB],
  };
}
