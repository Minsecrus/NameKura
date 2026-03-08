type ToastPillProps = {
  text: string | null;
};

export function ToastPill({ text }: ToastPillProps) {
  if (!text) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed left-1/2 top-24 z-40 -translate-x-1/2 rounded-full border border-[#0052CC]/12 bg-white/96 px-4 py-2 text-sm font-medium text-[#0052CC] shadow-[0_14px_50px_rgba(0,82,204,0.16)] backdrop-blur">
      {text}
    </div>
  );
}
