import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import "@/new_index.css";

type TabType = "classical" | "rapid" | "blitz";
type WidgetId = "news" | "ratings";

interface RatingRow {
  rank: number;
  player: string;
  elo: string;
  change: string;
}

const RATING_DATA: Record<TabType, [string, string, string][]> = {
  classical: [
    ["Magnus Carlsen", "2823.0", ""],
    ["Hikaru Nakamura", "2792.0", ""],
    ["Fabiano Caruana", "2788.9", "-3.1"],
    ["Javokhir Sindarov", "2777.9", "+0.9"],
    ["Wesley So", "2773.5", "+8.5"],
    ["Vincent Keymer", "2764.0", "-3.0"],
    ["Nodirbek Abdusattorov", "2762.0", ""],
    ["Praggnanandhaa R.", "2761.3", "+11.3"],
  ],
  rapid: [
    ["Magnus Carlsen", "2828", ""],
    ["Alireza Firouzja", "2786", "+4"],
    ["Hikaru Nakamura", "2779", "-2"],
    ["Jan-Krzysztof Duda", "2768", "+6"],
    ["Wesley So", "2752", ""],
    ["Nodirbek Abdusattorov", "2747", "+3"],
    ["Fabiano Caruana", "2738", "-1"],
    ["Vincent Keymer", "2729", "+2"],
  ],
  blitz: [
    ["Magnus Carlsen", "2885", ""],
    ["Hikaru Nakamura", "2862", "+5"],
    ["Alireza Firouzja", "2826", "-2"],
    ["Jan-Krzysztof Duda", "2807", "+7"],
    ["Nodirbek Abdusattorov", "2799", ""],
    ["Fabiano Caruana", "2784", "+1"],
    ["Wesley So", "2765", "-4"],
    ["Praggnanandhaa R.", "2757", "+3"],
  ],
};

const NEWS_ITEMS = [
  "Caruana Survives To Lead Praggnanandhaa By 6; Keymer Leads So In 3rd-Place Match",
  "GothamChess Signs With BASILISK As Head Of Chess, Joins Giri & Keymer",
  "Caruana Leads Praggnanandhaa In Final Match, Keymer-So Stays Even",
  "Duda Takes 2026 Wins Lead In Titled Tuesday",
  "Carlsen, Caruana Lead 18 Confirmed Players For Total Chess Pilot In Budapest",
];

export default function NewsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("classical");
  const [widgets, setWidgets] = useState<WidgetId[]>(["news", "ratings"]);
  const [openMenu, setOpenMenu] = useState<WidgetId | null>(null);
  const rightColumnRef = useRef<HTMLElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".settings-wrap")) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const moveWidget = (id: WidgetId, direction: "up" | "down") => {
    setWidgets((prev) => {
      const idx = prev.indexOf(id);
      if (idx === -1) return prev;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(targetIdx, 0, item);
      return copy;
    });
    setOpenMenu(null);
  };

  const ratingsList: RatingRow[] = RATING_DATA[activeTab].map(
    ([player, elo, change], index) => ({
      rank: index + 1,
      player,
      elo,
      change,
    })
  );

  return (
    <div
      className="min-h-screen bg-white text-[#111111] p-[18px] max-[650px]:p-0"
      style={{
        fontFamily: "Inter, Arial, Helvetica, sans-serif",
      }}
    >
      <main className="w-[min(1500px,100%)] mx-auto grid grid-cols-[minmax(0,2.25fr)_minmax(320px,0.9fr)] max-[950px]:grid-cols-1 gap-[26px] max-[650px]:gap-[14px] items-start">
        {/* Left Column */}
        <section className="flex flex-col gap-[26px] max-[650px]:gap-[14px]">
          {/* Featured Hero Card */}
          <article className="bg-[#f3f3f3] rounded-[8px] max-[650px]:rounded-none overflow-hidden relative">
            <div className="min-h-[465px] max-[950px]:min-h-[380px] max-[650px]:min-h-[290px] grid place-items-center bg-[#f0f0f0] border-2 border-dashed border-[#bdbdbd] text-[#888888] text-[22px] font-bold select-none">
              Large image / event placeholder
            </div>
            <div className="p-[22px_28px]">
              <h2 className="m-0 text-[25px] font-bold text-[#111111]">
                Featured chess event
              </h2>
              <p className="mt-[12px] mb-0 text-[#666666] text-[16px] leading-normal font-normal">
                Event information, status and timing can go here.
              </p>
            </div>
          </article>

          {/* Left News Grid Card */}
          <article className="bg-[#f3f3f3] rounded-[8px] max-[650px]:rounded-none overflow-hidden relative p-[22px_26px_26px]">
            <h2 className="m-0 text-[25px] font-bold text-[#111111]">News</h2>
            <div className="mt-[18px] grid grid-cols-3 max-[650px]:grid-cols-1 gap-[18px]">
              {[1, 2, 3].map((item) => (
                <div key={item} className="min-w-0">
                  <div className="aspect-video rounded-[7px] bg-[#efefef] border-2 border-dashed border-[#bdbdbd] grid place-items-center text-[#888888] font-bold text-[14px] select-none">
                    Image placeholder
                  </div>
                  <h3 className="mt-[14px] mb-[8px] text-[20px] font-bold leading-[1.25] text-[#111111]">
                    News story title
                  </h3>
                  <p className="m-0 text-[#666666] leading-[1.45] text-[14px] font-normal">
                    Short description placeholder for the article.
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>

        {/* Right Column (Widgets) */}
        <aside
          ref={rightColumnRef}
          id="rightColumn"
          className="flex flex-col gap-[26px] max-[650px]:gap-[14px]"
        >
          {widgets.map((widgetId, index) => {
            const isFirst = index === 0;
            const isLast = index === widgets.length - 1;
            const isMenuOpen = openMenu === widgetId;

            if (widgetId === "news") {
              return (
                <section
                  key="news"
                  data-widget="news"
                  className="bg-[#f3f3f3] rounded-[8px] max-[650px]:rounded-none overflow-hidden relative p-[18px_18px_16px] max-[650px]:p-[16px] transition-all duration-200"
                >
                  <header className="flex items-start justify-between gap-[14px] pb-[14px] border-b border-[#d4d4d4]">
                    <div>
                      <h2 className="m-0 text-[22px] font-bold leading-[1.1] text-[#111111]">
                        News
                      </h2>
                      <Link
                        to="/news#news-page"
                        className="inline-block mt-[7px] text-[#666666] hover:text-[#111111] text-[13px] font-[650] no-underline transition-colors"
                      >
                        View Page &gt;
                      </Link>
                    </div>

                    <div className="settings-wrap relative shrink-0">
                      <button
                        type="button"
                        aria-label="News settings"
                        aria-expanded={isMenuOpen}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenu(isMenuOpen ? null : "news");
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
                            onClick={() => moveWidget("news", "up")}
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
                            onClick={() => moveWidget("news", "down")}
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

                  <div className="news-list pt-[4px]">
                    {NEWS_ITEMS.map((item, i) => (
                      <div
                        key={i}
                        className={`news-item py-[13px] px-[5px] text-[#222222] text-[16px] leading-[1.36] font-normal ${
                          i > 0 ? "border-t border-[rgba(255,255,255,0.035)]" : ""
                        }`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            if (widgetId === "ratings") {
              return (
                <section
                  key="ratings"
                  data-widget="ratings"
                  className="bg-[#f3f3f3] rounded-[8px] max-[650px]:rounded-none overflow-hidden relative p-[18px_18px_16px] max-[650px]:p-[16px] transition-all duration-200"
                >
                  <header className="flex items-start justify-between gap-[14px] pb-[14px] border-b border-[#d4d4d4]">
                    <div>
                      <h2 className="m-0 text-[22px] font-bold leading-[1.1] text-[#111111]">
                        Live Ratings
                      </h2>
                      <Link
                        to="/news#ratings-page"
                        className="inline-block mt-[7px] text-[#666666] hover:text-[#111111] text-[13px] font-[650] no-underline transition-colors"
                      >
                        View Page &gt;
                      </Link>
                    </div>

                    <div className="settings-wrap relative shrink-0">
                      <button
                        type="button"
                        aria-label="Live Ratings settings"
                        aria-expanded={isMenuOpen}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenu(isMenuOpen ? null : "ratings");
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
                            onClick={() => moveWidget("ratings", "up")}
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
                            onClick={() => moveWidget("ratings", "down")}
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

                  {/* Rating Controls */}
                  <div className="rating-controls mt-[12px]">
                    <select
                      aria-label="Player group"
                      defaultValue="All Players"
                      className="rating-select w-full min-h-[42px] border border-[#cccccc] rounded-[7px] bg-white text-[#222222] px-[11px] text-[16px] outline-none cursor-pointer"
                    >
                      <option value="All Players">All Players</option>
                      <option value="Women">Women</option>
                      <option value="Juniors">Juniors</option>
                    </select>
                  </div>

                  {/* Rating Tabs */}
                  <div
                    className="rating-tabs grid grid-cols-3 mt-[14px] border-b border-[#d0d0d0]"
                    role="tablist"
                    aria-label="Rating type"
                  >
                    {(["classical", "rapid", "blitz"] as const).map((tab) => {
                      const isActive = activeTab === tab;
                      return (
                        <button
                          key={tab}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          onClick={() => setActiveTab(tab)}
                          className={`rating-tab relative p-[11px_12px_13px] text-left font-bold cursor-pointer border-t border-l border-r border-[#d8d8d8] rounded-t-[8px] mr-[6px] text-[15px] capitalize transition-colors
                            before:content-[''] before:absolute before:left-[12px] before:right-[12px] before:-top-[1px] before:h-[1px] before:bg-[#f3f3f3]
                            ${
                              isActive
                                ? "active text-[#111111] bg-[#fafafa] after:content-[''] after:absolute after:h-[3px] after:left-[10px] after:right-[10px] after:-bottom-[2px] after:bg-[#D4AF6E] after:rounded-[3px]"
                                : "text-[#666666] bg-transparent hover:text-[#111111]"
                            }`}
                        >
                          {tab}
                        </button>
                      );
                    })}
                  </div>

                  {/* Rating List */}
                  <ol className="rating-list list-none p-0 mt-[7px] m-0">
                    {ratingsList.map((row) => {
                      const isNegative = row.change.startsWith("-");
                      const hasChange = row.change && row.change !== "0";

                      return (
                        <li
                          key={row.rank}
                          className="rating-row grid grid-cols-[28px_minmax(0,1fr)_70px_52px] max-[650px]:grid-cols-[24px_minmax(0,1fr)_62px_45px] gap-[8px] items-center min-h-[46px] text-[15px]"
                        >
                          <span className="rank text-[#aaaaaa] text-center font-normal">
                            {row.rank}
                          </span>
                          <span className="player font-[650] truncate text-[#111111]">
                            {row.player}
                          </span>
                          <span className="elo text-right text-[#111111] font-normal">
                            {row.elo}
                          </span>
                          <span
                            className={`change text-right font-normal ${
                              !hasChange
                                ? "empty-change text-transparent select-none"
                                : isNegative
                                ? "negative text-[#d74a4a]"
                                : "text-[#16a34a]"
                            }`}
                          >
                            {row.change || "0"}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              );
            }

            return null;
          })}
        </aside>
      </main>
    </div>
  );
}
