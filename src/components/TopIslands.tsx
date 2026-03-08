type TopIslandsProps = {
  filterQuery: string;
  onFilterChange: (value: string) => void;
  onUploadOpen: () => void;
};

export function TopIslands({
  filterQuery,
  onFilterChange,
  onUploadOpen,
}: TopIslandsProps) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-start justify-between p-4 sm:p-6">
      <div className="pointer-events-auto island island-tight">
        <p className="brand-wordmark text-[1.45rem] leading-none tracking-[-0.08em]">
          <span className="text-[#0052CC]">Name</span>
          <span className="text-black">Kura</span>
        </p>
      </div>

      <div className="pointer-events-auto ml-3 mr-3 w-[min(42rem,48vw)]">
        <div className="island flex h-13 items-center rounded-full px-4">
          <svg viewBox="0 0 24 24" className="mr-3 h-4 w-4 shrink-0 text-[#0052CC]/72" fill="none">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M16 16L20 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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

      <button
        type="button"
        className="pointer-events-auto island island-icon text-3xl leading-none text-[#0052CC]"
        onClick={onUploadOpen}
        aria-label="上传名字"
      >
        +
      </button>
    </header>
  );
}
