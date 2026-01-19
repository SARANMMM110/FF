import { useEffect, useState } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = "info", duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  const colors = {
    success: "from-green-500 to-green-600",
    error: "from-red-500 to-red-600",
    info: "from-[#E50914] to-[#FFD400]",
  };

  // Safety check for React Error #31 (Objects are not valid as a React child)
  // This happens if a Zod error object or other object is passed instead of a string
  const displayMessage = typeof message === 'object' && message !== null
    ? (message as any).message || JSON.stringify(message)
    : String(message);

  return (
    <div
      className={`transition-all duration-300 ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
        }`}
    >
      <div
        className={`bg-gradient-to-r ${colors[type]} text-white rounded-xl shadow-2xl p-4 flex items-center gap-3 min-w-[300px] max-w-[400px]`}
      >
        {icons[type]}
        <p className="flex-1 font-medium">{displayMessage}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="p-1 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function ToastContainer({ toasts, onRemove }: {
  toasts: Array<{ id: string; message: string; type?: ToastType }>;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="fixed top-20 right-6 z-50 space-y-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}
