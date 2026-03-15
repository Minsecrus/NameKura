type ToastPillProps = {
  text: string | null;
};

export function ToastPill({ text }: ToastPillProps) {
  if (!text) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed left-1/2 top-24 z-40 -translate-x-1/2 rounded-full border border-[rgb(var(--theme-rgb)/0.12)] bg-white/96 px-4 py-2 text-sm font-medium text-[var(--theme-color)] shadow-[0_14px_50px_rgb(var(--theme-rgb)/0.16)] backdrop-blur transition-[color,border-color,box-shadow] duration-500 ease-out">
      {text}
    </div>
  );
}
