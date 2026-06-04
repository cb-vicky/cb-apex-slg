import { createPortal } from "react-dom";
import { StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotesStore } from "@/hooks/useNotesStore";

export function NotesFloatingButton() {
  const { drawer, openDrawer, getNewNotesCount } = useNotesStore();

  const newCount = getNewNotesCount();
  const hasNotifications = newCount > 0;

  const handleClick = () => {
    openDrawer({
      customerId: drawer.currentCustomerId ?? undefined,
      customerName: drawer.currentCustomerName ?? undefined,
      location: drawer.currentLocation ?? undefined,
    });
  };

  return createPortal(
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "fixed bottom-6 right-6 z-[50] flex items-center justify-center rounded-full border shadow-lg transition-all duration-200",
        "h-12 w-12",
        hasNotifications
          ? "border-blue-200 bg-white"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-xl",
      )}
      style={{
        animation: hasNotifications ? "pulseGlow 2s ease-in-out infinite" : undefined,
      }}
      aria-label={`Open notes${hasNotifications ? ` (${newCount} new)` : ""}`}
    >
      {/* Shimmer background for notifications */}
      {hasNotifications && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "linear-gradient(110deg, transparent 20%, rgba(59, 130, 246, 0.08) 40%, rgba(59, 130, 246, 0.15) 50%, rgba(59, 130, 246, 0.08) 60%, transparent 80%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 2s linear infinite",
          }}
        />
      )}

      {/* Icon */}
      <StickyNote
        size={20}
        className={cn(
          "relative z-10 transition-colors",
          hasNotifications ? "text-blue-600" : "text-gray-500",
        )}
      />

      {/* Notification badge */}
      {hasNotifications && (
        <span className="absolute -top-1 -right-1 z-20 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white shadow-sm">
          {newCount > 9 ? "9+" : newCount}
        </span>
      )}

      <style>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 4px 14px rgba(59, 130, 246, 0.15), 0 1px 3px rgba(0, 0, 0, 0.08);
          }
          50% {
            box-shadow: 0 4px 20px rgba(59, 130, 246, 0.25), 0 1px 3px rgba(0, 0, 0, 0.08);
          }
        }
      `}</style>
    </button>,
    document.body,
  );
}
