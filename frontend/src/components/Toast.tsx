import { useToastStore, type ToastType } from "../store/useToastStore";

type ToastProps = {
  id: number;
  message: string;
  type: ToastType;
  removing: boolean;
};

export default function Toast({ id, message, type, removing }: ToastProps) {
  const removeToast = useToastStore((state) => state.removeToast);

  const isSuccess = type === "success";
  const accentColor = isSuccess ? "bg-green-500" : "bg-red-500";

  return (
    <div
      className={`flex w-80 items-start overflow-hidden rounded-xl border border-slate-100 bg-white shadow-lg ${
        removing ? "toast-exit" : "toast-enter"
      }`}
    >
      <div className={`w-1 shrink-0 self-stretch ${accentColor}`} />

      <div className={`mx-3 mt-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${accentColor}`}>
        {isSuccess ? "✓" : "✕"}
      </div>

      <p className="flex-1 py-3 pr-2 text-sm font-medium text-slate-800">{message}</p>

      <button
        onClick={() => removeToast(id)}
        aria-label="Закрыть"
        className="mr-3 mt-3 text-slate-300 transition-colors hover:text-slate-500"
      >
        ✕
      </button>
    </div>
  );
}
