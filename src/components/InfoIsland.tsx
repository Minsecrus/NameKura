type InfoIslandProps = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export function InfoIsland({ isOpen, onOpen, onClose }: InfoIslandProps) {
  return (
    <>
      <button
        type="button"
        className="island island-icon fixed bottom-4 right-4 z-30 text-lg font-semibold text-black/72 sm:bottom-6 sm:right-6"
        onClick={onOpen}
        aria-label="查看项目说明"
      >
        i
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-40 bg-black/8 p-4 backdrop-blur-sm" onClick={onClose}>
          <aside
            className="ml-auto flex h-full w-full max-w-md flex-col rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_28px_100px_rgba(0,0,0,0.12)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-semibold tracking-[-0.08em]">说明</h2>
              <button
                type="button"
                className="rounded-full border border-black/8 px-3 py-1.5 text-sm text-black/55"
                onClick={onClose}
              >
                关闭
              </button>
            </div>

            <div className="mt-8 space-y-4 text-sm leading-7 text-black/58">
              <p>点击复制。</p>
              <p>输入筛选。</p>
              <p>右上添加。</p>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
