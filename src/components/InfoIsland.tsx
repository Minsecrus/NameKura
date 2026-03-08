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
        <div
          className="fixed inset-0 z-40 bg-black/8 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <aside
            className="ml-auto flex h-full w-full max-w-md flex-col rounded-4xl border border-black/6 bg-white p-6 shadow-[0_28px_100px_rgba(0,0,0,0.12)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="brand-wordmark text-[1.5rem] leading-none text-black">
              About
            </h2>

            <div className="mt-8 space-y-4 text-sm leading-7 text-black/58">
              <p>
                NameKura
                是一个极简中文名字画布，用来浏览、复制、上传和轻量评价名字。
              </p>
              <p>
                点击名字卡片可以复制。名字卡片下方蓝点为点赞，灰点为点踩。右上方的新建按钮可以上传名字，点击回车即可提交。
              </p>
              <p>MIT 开源。使用 Limelight 字体。</p>
              <a
                href="https://github.com/Minsecrus/NameKura"
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-[#0052CC] underline underline-offset-4"
              >
                GitHub
              </a>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
