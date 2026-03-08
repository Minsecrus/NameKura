import type { KeyboardEvent } from "react";
import type { NameCard } from "@/types/name";

const BRAND = "#0052CC";

type HexCardProps = {
  card: NameCard;
  isRippleActive: boolean;
  rippleToken: string;
  onCopy: (card: NameCard) => void | Promise<void>;
  onVote: (id: string, delta: "up" | "down") => void;
};

export function HexCard({
  card,
  isRippleActive,
  rippleToken,
  onCopy,
  onVote,
}: HexCardProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      void onCopy(card);
    }
  };

  return (
    <article
      draggable={false}
      tabIndex={0}
      role="button"
      aria-label={`复制名字 ${card.name}`}
      className="hex-card group"
      onClick={() => void onCopy(card)}
      onKeyDown={handleKeyDown}
    >
      <div className="hex-card-inner">
        <svg
          viewBox="0 0 100 100"
          className="hex-outline"
          aria-hidden="true"
          preserveAspectRatio="none"
        >
          <polygon points="12,0 88,0 100,50 88,100 12,100 0,50" />
        </svg>

        {isRippleActive ? (
          <span key={rippleToken} className="hex-ripple" aria-hidden="true" />
        ) : null}

        <div className="relative z-[1] select-none text-center text-[clamp(1.05rem,1.4vw,1.3rem)] font-medium tracking-[0.18em]">
          <span style={{ color: BRAND }}>{card.surname}</span>
          <span className="text-black">{card.givenName}</span>
        </div>

        <div className="hex-vote-bar">
          <button
            type="button"
            draggable={false}
            className="hex-vote-dot"
            aria-label={`点赞 ${card.name}`}
            title="点赞"
            onClick={(event) => {
              event.stopPropagation();
              onVote(card.id, "up");
            }}
          >
            {card.likes === 0 ? (
              <span className="hex-vote-core" />
            ) : (
              <span className="hex-vote-count">{card.likes}</span>
            )}
          </button>
          <button
            type="button"
            draggable={false}
            className="hex-vote-dot"
            aria-label={`点踩 ${card.name}`}
            title="点踩"
            onClick={(event) => {
              event.stopPropagation();
              onVote(card.id, "down");
            }}
          >
            {card.dislikes === 0 ? (
              <span className="hex-vote-core hex-vote-core-muted" />
            ) : (
              <span className="hex-vote-count hex-vote-count-muted">
                {card.dislikes}
              </span>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
