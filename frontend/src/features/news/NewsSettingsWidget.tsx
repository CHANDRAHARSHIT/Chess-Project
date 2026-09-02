import { Link } from "react-router";

export interface NewsSettingsWidgetProps {
  title: string;
  linkHref: string;
  isFirst: boolean;
  isLast: boolean;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export default function NewsSettingsWidget({
  title,
  linkHref,
  isFirst,
  isLast,
  isMenuOpen,
  onToggleMenu,
  onMoveUp,
  onMoveDown,
}: NewsSettingsWidgetProps) {
  return (
    <header className="flex items-start justify-between gap-[14px] pb-[14px] border-b border-[#d4d4d4]">
      <div>
        <h2 className="m-0 text-[22px] font-bold leading-[1.1] text-[#111111]">
          {title}
        </h2>
        <Link
          to={linkHref}
          className="inline-block mt-[7px] text-[#666666] hover:text-[#111111] text-[13px] font-[650] no-underline transition-colors"
        >
          View Page &gt;
        </Link>
      </div>

      <div className="settings-wrap relative shrink-0">
        <button
          type="button"
          aria-label={`${title} settings`}
          aria-expanded={isMenuOpen}
          onClick={(e) => {
            e.stopPropagation();
            onToggleMenu();
          }}
          className={`w-[36px] h-[36px] border-0 rounded-[8px] grid place-items-center text-[22px] cursor-pointer transition-all duration-150 active:scale-[0.96] ${
            isMenuOpen
              ? "bg-white text-[#111111]"
              : "bg-transparent text-[#666666] hover:bg-white hover:text-[#111111]"
          }`}
        >
          ⚙
        </button>

        {isMenuOpen && (
          <div className="settings-menu absolute top-[42px] right-0 w-[180px] p-[7px] bg-white border border-[#cfcfcf] rounded-[9px] shadow-[0_12px_28px_rgba(0,0,0,0.14)] z-20">
            <button
              type="button"
              disabled={isFirst}
              onClick={onMoveUp}
              style={{ opacity: isFirst ? 0.38 : 1 }}
              className={`menu-button move-up w-full border-0 rounded-[6px] bg-transparent text-[#222222] p-[10px_11px] text-left text-[14px] transition-colors duration-150 ${
                isFirst
                  ? "cursor-not-allowed"
                  : "cursor-pointer hover:bg-[#4a4945] hover:text-white"
              }`}
            >
              ↑ Move Up
            </button>
            <button
              type="button"
              disabled={isLast}
              onClick={onMoveDown}
              style={{ opacity: isLast ? 0.38 : 1 }}
              className={`menu-button move-down w-full border-0 rounded-[6px] bg-transparent text-[#222222] p-[10px_11px] text-left text-[14px] transition-colors duration-150 ${
                isLast
                  ? "cursor-not-allowed"
                  : "cursor-pointer hover:bg-[#4a4945] hover:text-white"
              }`}
            >
              ↓ Move Down
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
