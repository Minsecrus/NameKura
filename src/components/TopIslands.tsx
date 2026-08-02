type TopIslandsProps = {
  filterQuery: string;
  isKuraLarge: boolean;
  onFilterChange: (value: string) => void;
  onThemeShuffle: () => void;
  onKuraSizeToggle: () => void;
  onUploadOpen: () => void;
};

export function TopIslands({
  filterQuery,
  isKuraLarge,
  onFilterChange,
  onThemeShuffle,
  onKuraSizeToggle,
  onUploadOpen,
}: TopIslandsProps) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-start justify-between p-4 sm:p-6">
      {/* Logo Island */}
      <div className="pointer-events-auto island island-tight shrink-0">
        <p className="brand-wordmark flex whitespace-nowrap text-[1.2rem] leading-none tracking-[-0.08em] sm:text-[1.45rem]">
          <button
            type="button"
            className="cursor-pointer text-[var(--theme-color)] outline-none transition-[color,transform] duration-300 ease-out hover:-translate-y-[1px]"
            onClick={onThemeShuffle}
            aria-label="切换主题色"
          >
            Name
          </button>
          <button
            type="button"
            className={`cursor-pointer text-black outline-none transition-[font-size,transform] duration-300 ease-out hover:-translate-y-[1px] ${
              isKuraLarge
                ? "text-[clamp(1.3rem,1.7vw,1.65rem)]"
                : "text-[clamp(1.05rem,1.4vw,1.3rem)]"
            }`}
            onClick={onKuraSizeToggle}
            aria-label="切换 Kura 字号"
          >
            Kura
          </button>
        </p>
      </div>

      {/* Filter Island */}
      <div className="pointer-events-auto mx-2 min-w-0 flex-1 sm:mx-3 sm:w-[min(42rem,48vw)] sm:flex-none">
        <div className="island flex h-13 items-center rounded-full px-3 sm:px-4">
          <svg
            viewBox="0 0 24 24"
            className="mr-2 h-4 w-4 shrink-0 text-[rgb(var(--theme-rgb)/0.72)] transition-[color] duration-500 ease-out sm:mr-3"
            fill="none"
          >
            <circle
              cx="11"
              cy="11"
              r="6.5"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M16 16L20 20"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <input
            value={filterQuery}
            onChange={(event) => onFilterChange(event.target.value)}
            className="w-full bg-transparent text-sm text-black outline-none placeholder:text-black/26"
            placeholder="筛选"
            aria-label="筛选名字"
          />
        </div>
      </div>

      {/* Upload Island */}
      <button
        type="button"
        className="pointer-events-auto island island-icon shrink-0 text-3xl leading-none text-[var(--theme-color)] transition-[color,transform] duration-300 ease-out hover:-translate-y-[1px]"
        onClick={onUploadOpen}
        aria-label="上传名字"
      >
        +
      </button>
    </header>
  );
}
