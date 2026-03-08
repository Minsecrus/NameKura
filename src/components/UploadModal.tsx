import type { KeyboardEvent } from "react";

type UploadModalProps = {
  isOpen: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function UploadModal({
  isOpen,
  value,
  onChange,
  onClose,
  onSubmit,
}: UploadModalProps) {
  if (!isOpen) {
    return null;
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#0052CC]/8 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[1.8rem] border border-black/6 bg-white p-4 shadow-[0_28px_100px_rgba(0,0,0,0.12)]"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          autoFocus
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-[1.2rem] border border-black/8 bg-transparent px-4 py-4 text-base font-medium outline-none transition placeholder:text-black/22 focus:border-[#0052CC]"
        />
      </div>
    </div>
  );
}
