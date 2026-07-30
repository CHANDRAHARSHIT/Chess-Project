import { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  Home,
  Puzzle,
  CircleUserRound,
  Crown,
  GraduationCap,
  BookOpen,
  Bot,
  BookMarked,
  ChevronDown,
  Zap,
  Clock,
  BarChart2,
  Flag,
  Plus,
  Shuffle,
  Video,
  UserCircle2,
  ExternalLink,
  Pencil,
  MoveUp,
  Archive,
} from "lucide-react";
import { useLogoAnimation } from "../hooks/useLogoAnimation";
import { soundManager } from "../utils/SoundManager";
import { useSession } from "../hooks/useSession";
import { AvatarDropdown } from "./AvatarDropdown";
import { AuthModal } from "./AuthModal";
import { MoreMenu } from "./MoreMenu";
import { useNavigate, useLocation } from "react-router";
import { useNavigationStack } from "../hooks/useNavigationStack";

// Hook for clicking outside the custom dropdown
function useOnClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  handler: (event: MouseEvent | TouchEvent) => void,
) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handlerRef.current(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref]);
}

/** Thin horizontal rule dividing sidebar sections */
const Divider = () => (
  <hr className="border-t border-brand-text/10 my-3 mx-4" />
);

/**
 * SidebarLayout Component
 *
 * The main layout wrapper for the application. It provides:
 * - A responsive sidebar navigation (collapsible on desktop, slide-out on mobile)
 * - Dynamic rendering of navigation sections (Explore, Subscriptions, You, etc.)
 * - Management of user "Custom Links", allowing users to save and organize shortcuts
 * - Authentication state handling to show/hide restricted sections
 */
export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"login" | "register">("login");
  const [mobileOpenItem, setMobileOpenItem] = useState<string | null>(null);
  const [isYouOpen, setIsYouOpen] = useState(true);

  const [hoveredSubMenu, setHoveredSubMenu] = useState<{
    items: { name: string; href?: string; icon?: React.ElementType; comingSoon?: boolean }[];
    top: number;
    left: number;
  } | null>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    };
  }, []);

  const { status } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const { push } = useNavigationStack();

  const openModal = (mode: "login" | "register") => {
    setModalMode(mode);
    setIsModalOpen(true);
    setIsMobileOpen(false);
  };

  const { containerRef, logoRef } = useLogoAnimation();

  // Custom Links (active, shown in Explore)
  type CustomLink = {
    id: string;
    name: string;
    url: string;
    isArchived: boolean;
  };
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [moreLinks, setMoreLinks] = useState<CustomLink[]>([]);

  const fetchLinks = async () => {
    if (status !== "authenticated") {
      setCustomLinks([]);
      setMoreLinks([]);
      return;
    }
    try {
      const res = await fetch("/api/custom-links", { credentials: "include" });
      const json = await res.json();
      if (json.status === "success") {
        const links: CustomLink[] = json.data.links;
        setCustomLinks(links.filter((l) => !l.isArchived));
        setMoreLinks(links.filter((l) => l.isArchived));
      }
    } catch (err) {
      console.error("Failed to fetch custom links", err);
    }
  };

  useEffect(() => {
    void (async () => { await fetchLinks(); })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false);
  const [editLinkIndex, setEditLinkIndex] = useState<number | null>(null);
  const [editLinkSection, setEditLinkSection] = useState<"active" | "more">(
    "active",
  );
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("/analysis");
  const [isUrlDropdownOpen, setIsUrlDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(dropdownRef, () => setIsUrlDropdownOpen(false));

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newLinkName && newLinkUrl) {
      if (editLinkIndex !== null) {
        const isMore = editLinkSection === "more";
        const link = isMore
          ? moreLinks[editLinkIndex]
          : customLinks[editLinkIndex];

        // Optimistic update
        const updatedLink = { ...link, name: newLinkName, url: newLinkUrl };
        if (isMore) {
          setMoreLinks((prev) => {
            const arr = [...prev];
            arr[editLinkIndex] = updatedLink;
            return arr;
          });
        } else {
          setCustomLinks((prev) => {
            const arr = [...prev];
            arr[editLinkIndex] = updatedLink;
            return arr;
          });
        }

        try {
          await fetch(`/api/custom-links/${link.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newLinkName, url: newLinkUrl }),
            credentials: "include",
          });
        } catch (err) {
          console.error(err);
          fetchLinks(); // Revert on error
        }
      } else {
        // Optimistic UX (without ID temporarily) is tricky, so we await for create
        try {
          const res = await fetch("/api/custom-links", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: newLinkName,
              url: newLinkUrl,
              isArchived: false,
            }),
            credentials: "include",
          });
          const json = await res.json();
          if (json.status === "success") {
            setCustomLinks((prev) => [...prev, json.data.link]);
          }
        } catch (err) {
          console.error(err);
        }
      }
      setNewLinkName("");
      setNewLinkUrl("/analysis");
      setIsAddLinkModalOpen(false);
      setEditLinkIndex(null);
      setEditLinkSection("active");
    }
  };

  const openEditModal = (
    index: number,
    section: "active" | "more" = "active",
  ) => {
    const link = section === "active" ? customLinks[index] : moreLinks[index];
    setNewLinkName(link.name);
    setNewLinkUrl(link.url);
    setEditLinkIndex(index);
    setEditLinkSection(section);
    setIsAddLinkModalOpen(true);
  };

  const removeCustomLink = async (index: number) => {
    const link = customLinks[index];
    setCustomLinks((prev) => prev.filter((_, i) => i !== index));
    try {
      await fetch(`/api/custom-links/${link.id}`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch (err) {
      console.error(err);
      fetchLinks();
    }
  };

  const removeMoreLink = async (index: number) => {
    const link = moreLinks[index];
    setMoreLinks((prev) => prev.filter((_, i) => i !== index));
    try {
      await fetch(`/api/custom-links/${link.id}`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch (err) {
      console.error(err);
      fetchLinks();
    }
  };

  // Move a link from Explore (active) to More
  const moveToMore = async (index: number) => {
    const link = customLinks[index];
    const updated = { ...link, isArchived: true };
    setMoreLinks((prev) => [...prev, updated]);
    setCustomLinks((prev) => prev.filter((_, i) => i !== index));
    try {
      await fetch(`/api/custom-links/${link.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
        credentials: "include",
      });
    } catch (err) {
      console.error(err);
      fetchLinks();
    }
  };

  // Move a link from More back to Explore (active)
  const moveToActive = async (index: number) => {
    const link = moreLinks[index];
    const updated = { ...link, isArchived: false };
    setCustomLinks((prev) => [...prev, updated]);
    setMoreLinks((prev) => prev.filter((_, i) => i !== index));
    try {
      await fetch(`/api/custom-links/${link.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: false }),
        credentials: "include",
      });
    } catch (err) {
      console.error(err);
      fetchLinks();
    }
  };

  const MOCK_SUBSCRIPTIONS = [
    {
      name: "Epic Chess",
      avatar:
        "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQB-blLJtOasSxbG_PvO7ejDjJEeUGjqKyJe_pUfWfBmQTg2Osx",
      href: "/subscriptions",
    },
    {
      name: "Epic Chess",
      avatar:
        "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQB-blLJtOasSxbG_PvO7ejDjJEeUGjqKyJe_pUfWfBmQTg2Osx",
      href: "/subscriptions",
    },
    {
      name: "Epic Chess",
      avatar:
        "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQB-blLJtOasSxbG_PvO7ejDjJEeUGjqKyJe_pUfWfBmQTg2Osx",
      href: "/subscriptions",
    },
  ];

  const handleLinkClick = (href: string | undefined, e: React.MouseEvent) => {
    e.preventDefault();
    if (!href) return;
    soundManager.playButtonClick();
    setIsMobileOpen(false);

    // Going to Membership (Pricing) — remember where we came from.
    if (href === "/pricing") {
      const pageLabels: Record<string, string> = {
        "/": "Home",
        "/puzzles": "Puzzles",
        "/settings": "Settings",
        "/profile": "Profile",
      };

      push({
        label: pageLabels[location.pathname] ?? "Home",
        path: location.pathname,
      });
    }

    if (href === "/" && location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate(href);
    }
  };

  const handleToggle = () => {
    soundManager.playButtonClick();
    if (window.innerWidth < 768) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  // Nav Items Data
  const baseSection = [
    { name: "Home", href: "/", icon: Home },
    {
      name: "Learn",
      href: "/learn",
      icon: GraduationCap,
      comingSoon: true,
      subItems: [
        { name: "Lessons", href: "/lessons", icon: BookOpen, comingSoon: true },
        {
          name: "Play Coach",
          href: "/play-coach",
          icon: Bot,
          comingSoon: true,
        },
        { name: "Openings", href: "/openings", icon: BookMarked },
      ],
    },
  ];

  const exploreSection = [
    { name: "Quick Game", href: "/play", icon: Zap, comingSoon: true },
    { name: "Lessons", href: "/lessons", icon: BookOpen, comingSoon: true },
    { name: "Puzzles", href: "/puzzles", icon: Puzzle },
    { name: "Variants", href: "/variants", icon: Shuffle, comingSoon: true },
    { name: "Upgrade", href: "/pricing", icon: Crown },
  ];

  const footerLinks = [
    { name: "About", href: "#", comingSoon: true },
    { name: "Copyright", href: "#", comingSoon: true },
    { name: "Contact Us", href: "/contact", comingSoon: false },
    { name: "Creator", href: "#", comingSoon: true },
    { name: "Advertise", href: "#", comingSoon: true },
    { name: "Developers", href: "#", comingSoon: true },
    { name: "Terms", href: "#", comingSoon: true },
    { name: "Privacy Policy & Safety", href: "#", comingSoon: true },
    { name: "How XLChess works", href: "#", comingSoon: true },
  ];

  const youSection = [
    { name: "Stats", href: "/settings?tab=profile", icon: BarChart2 },
    {
      name: "Complete Later",
      href: "/complete-later",
      icon: Clock,
      comingSoon: true,
    },
    {
      name: "Your Content",
      href: "/your-content",
      icon: Video,
      comingSoon: true,
    },
    {
      name: "Your Channel",
      href: "/channel",
      icon: UserCircle2,
      comingSoon: true,
    },
  ];

  const miscSection = [
    { name: "Report", href: "/report", icon: Flag, comingSoon: true },
  ];

  const urlOptions = [
    { label: "Analysis Board", value: "/analysis" },
    { label: "Tournaments", value: "/tournaments" },
    { label: "Leaderboard", value: "/leaderboard" },
    { label: "Streamers", value: "/streamers" },
    { label: "News", value: "/news" },
  ];

  // Helper for rendering a nav link
  // section: 'active' = in Explore section, 'more' = in More section
  type NavItem = {
    name: string;
    href?: string;
    icon?: React.ComponentType<{ className?: string }>;
    avatar?: string;
    subItems?: NavItem[];
    comingSoon?: boolean;
    [key: string]: unknown;
  };

  const renderNavItem = (
    item: NavItem,
    customLinkIndex?: number,
    section: "active" | "more" = "active",
  ) => {
    const Icon = item.icon;
    const currentPathWithSearch = location.pathname + location.search;
    const isActive =
      !item.comingSoon &&
      (currentPathWithSearch === item.href ||
        location.pathname === item.href ||
        item.subItems?.some(
          (s: NavItem) =>
            currentPathWithSearch === s.href || location.pathname === s.href,
        ));

    const isAvatar = item.avatar !== undefined;
    const isCustomLink = customLinkIndex !== undefined;
    const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
    const isSubOpen = mobileOpenItem === item.name;
    const isDisabled = Boolean(item.comingSoon);

    return (
      <div
        key={
          isCustomLink
            ? `custom-${customLinkIndex}-${section}`
            : `${item.name}-${section}`
        }
        className="flex flex-col w-full"
      >
        <div className="relative group/navitem flex items-center">
          <a
            href={isDisabled ? "#" : hasSubItems ? "#" : item.href}
            onMouseEnter={(e) => {
              if (hasSubItems && !isMobileOpen && !isDisabled && item.subItems) {
                if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredSubMenu({
                  items: item.subItems,
                  top: rect.top,
                  left: rect.right + 4,
                });
              }
            }}
            onMouseLeave={() => {
              if (hasSubItems && !isMobileOpen) {
                hoverTimeout.current = setTimeout(() => {
                  setHoveredSubMenu(null);
                }, 150);
              }
            }}
            onClick={(e) => {
              if (isDisabled) {
                e.preventDefault();
                return;
              }
              if (hasSubItems) {
                e.preventDefault();
                if (isMobileOpen) {
                  setMobileOpenItem(isSubOpen ? null : item.name);
                } else if (!isExpanded) {
                  setIsExpanded(true);
                }
              } else {
                handleLinkClick(item.href, e);
              }
            }}
            title={isDisabled ? "Coming soon" : undefined}
            className={`relative w-full flex transition-all duration-200 ${
              isDisabled ? "cursor-not-allowed" : "cursor-pointer"
            } ${
              isExpanded || isMobileOpen
                ? `items-center py-2.5 mx-2 px-3 rounded-xl ${
                    isDisabled
                      ? "opacity-60 select-none text-brand-secondary"
                      : isActive
                        ? "text-brand-accent bg-brand-text/10 font-medium"
                        : "text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 group-hover/navitem:bg-brand-text/5 group-hover/navitem:text-brand-text"
                  }`
                : `flex-col items-center justify-center py-[14px] mx-2 rounded-lg text-center ${
                    isDisabled
                      ? "opacity-60 select-none text-brand-secondary"
                      : isActive
                        ? "text-brand-accent bg-brand-text/10 font-medium"
                        : "text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 group-hover/navitem:bg-brand-text/5 group-hover/navitem:text-brand-text"
                  }`
            }`}
          >
            <div
              className={`flex items-center justify-center shrink-0 ${isExpanded || isMobileOpen ? "w-10" : "w-full"}`}
            >
              {isAvatar ? (
                <img
                  src={item.avatar}
                  alt={item.name}
                  className={`w-6 h-6 rounded-full shrink-0 ${isDisabled ? "grayscale opacity-50" : ""}`}
                />
              ) : Icon ? (
                <Icon
                  className={`w-5 h-5 shrink-0 ${isActive ? "text-brand-accent" : `text-brand-secondary ${!isDisabled ? "group-hover/navitem:text-brand-text" : ""}`}`}
                />
              ) : null}
            </div>

            <span
              className={`font-sans transition-all ${
                isExpanded || isMobileOpen
                  ? "flex-1 text-left text-[14px] ml-2 tracking-wide truncate"
                  : "w-full text-center text-[10px] mt-1.5 leading-[1.15] whitespace-normal tracking-normal line-clamp-2 break-words"
              } ${!(isExpanded || isMobileOpen) && isAvatar ? "hidden" : ""}`}
            >
              {item.name}
            </span>

            {hasSubItems && (isMobileOpen || isExpanded) && (
              <ChevronDown
                className={`w-4 h-4 text-brand-secondary opacity-60 group-hover/navitem:opacity-100 transition-transform shrink-0 ${isSubOpen ? "rotate-180" : ""}`}
              />
            )}
          </a>

          {/* Custom Link Actions */}
          {isCustomLink && (isExpanded || isMobileOpen) && (
            <div
              className={`absolute right-4 flex items-center z-10 bg-brand-bg/80 backdrop-blur-sm rounded-full transition-all ${
                isMobileOpen
                  ? "opacity-100"
                  : "opacity-0 group-hover/navitem:opacity-100"
              }`}
            >
              {/* Move to More / Move to Active */}
              {section === "active" ? (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    moveToMore(customLinkIndex!);
                  }}
                  className="p-1.5 text-brand-secondary hover:text-amber-400 hover:bg-amber-400/10 rounded-full transition-all cursor-pointer"
                  title="Move to More"
                >
                  <Archive className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    moveToActive(customLinkIndex!);
                  }}
                  className="p-1.5 text-brand-secondary hover:text-green-400 hover:bg-green-400/10 rounded-full transition-all cursor-pointer"
                  title="Move to Explore"
                >
                  <MoveUp className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openEditModal(customLinkIndex!, section);
                }}
                className="p-1.5 text-brand-secondary hover:text-blue-400 hover:bg-blue-400/10 rounded-full transition-all cursor-pointer"
                title="Edit Link"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (section === "active") {
                    removeCustomLink(customLinkIndex!);
                  } else {
                    removeMoreLink(customLinkIndex!);
                  }
                }}
                className="p-1.5 text-brand-secondary hover:text-red-400 hover:bg-red-400/10 rounded-full transition-all cursor-pointer"
                title="Remove Link"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Accordion for subitems (Mobile Only) */}
        {hasSubItems && isMobileOpen && (
          <div
            className={`transition-all duration-300 overflow-hidden flex flex-col ml-[72px] mr-2 ${isSubOpen ? "max-h-[500px] mt-1 mb-2 opacity-100" : "max-h-0 opacity-0"}`}
          >
            {item.subItems?.map((subItem: NavItem) => {
              const SubIcon = subItem.icon;
              const currentPathWithSearch = location.pathname + location.search;
              const isSubActive =
                currentPathWithSearch === subItem.href ||
                location.pathname === subItem.href;
              return (
                <a
                  key={subItem.name}
                  href={subItem.comingSoon ? "#" : subItem.href}
                  title={subItem.comingSoon ? "Coming soon" : undefined}
                  onClick={(e) => {
                    if (subItem.comingSoon) {
                      e.preventDefault();
                      return;
                    }
                    handleLinkClick(subItem.href, e);
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-sans transition-colors duration-150 ${
                    subItem.comingSoon
                      ? "opacity-60 cursor-not-allowed select-none"
                      : isSubActive
                        ? "text-brand-accent bg-brand-text/10 font-medium cursor-pointer"
                        : "text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 cursor-pointer"
                  }`}
                >
                  {SubIcon && (
                    <SubIcon
                      className={`w-[16px] h-[16px] shrink-0 ${isSubActive ? "text-brand-accent" : "text-brand-secondary"}`}
                    />
                  )}
                  <span className="tracking-wide">{subItem.name}</span>
                </a>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Divider is defined above SidebarLayout (hoisted to avoid re-declaration on each render)

  return (
    <div className="min-h-screen text-brand-text bg-brand-bg flex flex-col relative select-none">
      {/* ── TOP HEADER ──────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 h-16 z-40 bg-brand-bg/95 backdrop-blur-md flex items-center justify-between pr-4 md:pr-6 border-b border-transparent">
        {/* Left: Hamburger & Logo */}
        <div className="flex items-center h-full">
          <div className="w-20 flex justify-center items-center shrink-0">
            <button
              onClick={handleToggle}
              className="p-2 text-brand-secondary hover:text-brand-text rounded-full hover:bg-brand-text/10 transition-colors cursor-pointer"
              aria-label="Toggle Navigation Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div
            ref={containerRef}
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={(e) => handleLinkClick("/", e)}
          >
            <img
              ref={logoRef}
              src="/logo-without-text.png"
              alt="XLChess logo"
              className="h-10 w-auto object-contain"
              draggable={false}
            />
            <div className="flex flex-col leading-none">
              <h1 className="text-1xl font-bold tracking-wide">XLCHESS</h1>
              <p className="text-xs">Excel at Chess</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {status !== "authenticated" && <MoreMenu />}
          {status === "loading" ? (
            <div className="w-6 h-6 rounded-full border-2 border-brand-accent/30 border-t-brand-accent animate-spin" />
          ) : status === "authenticated" ? (
            <AvatarDropdown />
          ) : (
            <button
              onClick={() => openModal("login")}
              aria-label="Sign In"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-border/50 text-brand-accent hover:bg-brand-accent/10 transition-all duration-200 text-xs sm:text-sm font-sans cursor-pointer"
            >
              <CircleUserRound className="w-5 h-5" strokeWidth={1.8} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* ── MAIN CONTENT CONTAINER ─────────────────────────────────────────── */}
      <div className="flex flex-1 pt-16">
        {/* Desktop Sidebar (Fixed) */}
        <aside
          className={`fixed top-16 left-0 bottom-0 z-30 bg-brand-bg/95 backdrop-blur-md flex-col py-2 transition-all duration-300 md:flex hidden overflow-y-auto overscroll-contain no-scrollbar pb-6 ${
            isExpanded ? "w-64" : "w-20"
          }`}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <nav className="flex-1 flex flex-col space-y-1">
            {/* BASE SECTION */}
            {baseSection.map((item) => renderNavItem(item))}
            <Divider />

            {/* EXPLORE SECTION */}
            {isExpanded && (
              <div className="flex items-center justify-between px-6 py-2">
                <span className="text-[15px] font-semibold text-brand-text">
                  Explore
                </span>
                <button
                  onClick={() => {
                    if (status !== "authenticated") {
                      openModal("login");
                    } else {
                      setNewLinkName("");
                      setNewLinkUrl("/analysis");
                      setEditLinkIndex(null);
                      setIsAddLinkModalOpen(true);
                    }
                  }}
                  className="p-1.5 hover:bg-brand-text/10 rounded-full text-brand-secondary hover:text-brand-text cursor-pointer transition-colors"
                  title="Add custom link"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
            {exploreSection.map((item) => renderNavItem(item))}
            {customLinks.map((link, index) =>
              renderNavItem(
                { name: link.name, href: link.url, icon: ExternalLink },
                index,
              ),
            )}
            <Divider />

            {/* AUTH / SUBSCRIPTIONS SECTION */}
            {status !== "authenticated" ? (
              isExpanded && (
                <>
                  <div className="px-6 py-4">
                    <p className="text-[13px] text-brand-text/80 mb-3 leading-tight">
                      Sign in to access your stats, play games, and follow your
                      favorite creators.
                    </p>
                    <button
                      onClick={() => openModal("login")}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-border/50 text-brand-accent hover:bg-brand-accent/10 transition-all duration-200 text-sm font-sans cursor-pointer w-fit"
                    >
                      <CircleUserRound className="w-5 h-5" />
                      <span>Sign In</span>
                    </button>
                  </div>
                  <Divider />
                </>
              )
            ) : (
              <>
                {isExpanded && (
                  <div className="flex items-center px-6 py-2">
                    <span className="text-[15px] font-semibold text-brand-text">
                      Subscriptions
                    </span>
                  </div>
                )}
                {MOCK_SUBSCRIPTIONS.length > 0
                  ? MOCK_SUBSCRIPTIONS.map((sub) =>
                      renderNavItem({ ...sub, href: sub.href }),
                    )
                  : isExpanded && (
                      <div className="px-6 py-2 text-[13px] text-brand-secondary">
                        No subscriptions yet.
                      </div>
                    )}
                <Divider />

                {/* YOU SECTION */}
                {isExpanded && (
                  <div
                    className="flex items-center justify-between px-6 py-2 cursor-pointer group"
                    onClick={() => setIsYouOpen(!isYouOpen)}
                  >
                    <span className="text-[15px] font-semibold text-brand-text">
                      You
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-brand-secondary transition-transform duration-300 ${isYouOpen ? "rotate-180" : ""} group-hover:text-brand-text`}
                    />
                  </div>
                )}
                <div
                  className={`transition-all duration-300 overflow-hidden ${isYouOpen || !isExpanded ? "max-h-[500px]" : "max-h-0"}`}
                >
                  {youSection.map((item) => renderNavItem(item))}
                </div>
                <Divider />
              </>
            )}

            {/* MISC SECTION */}
            {miscSection.map((item) => renderNavItem(item))}

            {/* MORE SECTION — users can archive unused custom links here */}
            {/* In a future version, an algorithm will auto-move frequently unused links here */}
            {moreLinks.length > 0 && isExpanded && (
              <>
                <div
                  className="flex items-center justify-between px-6 py-2 cursor-pointer group"
                  onClick={() => setIsMoreOpen(!isMoreOpen)}
                >
                  <div className="flex items-center gap-2">
                    <Archive className="w-4 h-4 text-brand-secondary group-hover:text-brand-text transition-colors" />
                    <span className="text-[15px] font-semibold text-brand-text">
                      More
                    </span>
                    <span className="text-[11px] text-brand-secondary bg-brand-text/5 rounded-full px-2 py-0.5 font-mono">
                      {moreLinks.length}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-brand-secondary transition-transform duration-300 ${isMoreOpen ? "rotate-180" : ""} group-hover:text-brand-text`}
                  />
                </div>
                <div
                  className={`transition-all duration-300 overflow-hidden ${isMoreOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}
                >
                  {moreLinks.map((link, index) =>
                    renderNavItem(
                      { name: link.name, href: link.url, icon: ExternalLink },
                      index,
                      "more",
                    ),
                  )}
                  <div className="px-6 pt-2 pb-1">
                    <p className="text-[11px] text-brand-secondary/50 italic leading-snug">
                      Coming soon: Links will be auto-sorted based on usage.
                    </p>
                  </div>
                </div>
                <Divider />
              </>
            )}
            {moreLinks.length > 0 && !isExpanded && (
              <div className="relative group/navitem flex flex-col items-center">
                <button
                  onClick={() => setIsExpanded(true)}
                  className="flex-col items-center justify-center py-[14px] mx-2 rounded-lg text-center w-full text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-all cursor-pointer"
                  title={`More (${moreLinks.length} links)`}
                >
                  <Archive className="w-5 h-5 mx-auto" />
                  <span className="w-full text-center text-[10px] mt-1.5 leading-[1.15]">
                    More
                  </span>
                </button>
              </div>
            )}

            {/* FOOTER */}
            {isExpanded && (
              <div className="mt-auto px-6 py-4 flex flex-col gap-4 text-[12px] text-brand-secondary font-sans border-t border-brand-text/10 pt-6">
                <div className="flex flex-wrap gap-x-4 gap-y-2.5 font-medium tracking-wide">
                  {footerLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.comingSoon ? "#" : link.href}
                      title={link.comingSoon ? "Coming soon" : undefined}
                      onClick={(e) => {
                        if (link.comingSoon) e.preventDefault();
                        else handleLinkClick(link.href, e);
                      }}
                      className={`whitespace-nowrap transition-colors ${link.comingSoon ? "opacity-60 cursor-not-allowed select-none" : "hover:text-brand-text cursor-pointer"}`}
                    >
                      {link.name}
                    </a>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-brand-text/10">
                  <img
                    src="/logo-without-text.png"
                    alt="logo"
                    className="h-4 w-auto opacity-40 grayscale"
                  />
                  <span className="text-brand-text/30 font-medium text-[11px]">
                    © 2026 XLCHESS
                  </span>
                </div>
              </div>
            )}
          </nav>
        </aside>

        {/* Desktop Fixed Hover SubMenu (Portalled out of sidebar) */}
        {hoveredSubMenu && (
          <div
            className="fixed z-[100] w-[14rem] rounded-2xl border border-brand-border/60 py-2 shadow-[0_8px_30px_rgb(0,0,0,0.8)] bg-brand-bg animate-in fade-in zoom-in-95 duration-150"
            style={{ top: hoveredSubMenu.top, left: hoveredSubMenu.left }}
            onMouseEnter={() => {
              if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
            }}
            onMouseLeave={() => {
              hoverTimeout.current = setTimeout(() => {
                setHoveredSubMenu(null);
              }, 150);
            }}
          >
            {hoveredSubMenu.items.map((subItem) => {
              const SubIcon = subItem.icon;
              const currentPathWithSearch = location.pathname + location.search;
              const isSubActive =
                currentPathWithSearch === subItem.href ||
                location.pathname === subItem.href;
              return (
                <a
                  key={subItem.name}
                  href={subItem.comingSoon ? "#" : subItem.href}
                  title={subItem.comingSoon ? "Coming soon" : undefined}
                  onClick={(e) => {
                    if (subItem.comingSoon) {
                      e.preventDefault();
                      return;
                    }
                    setHoveredSubMenu(null);
                    handleLinkClick(subItem.href, e);
                  }}
                  className={`w-full flex items-center gap-4 px-5 py-3 text-[14px] font-sans text-left transition-colors duration-150 ${
                    subItem.comingSoon
                      ? "opacity-60 cursor-not-allowed select-none"
                      : isSubActive
                        ? "text-brand-accent bg-brand-text/[0.06] cursor-pointer font-medium"
                        : "text-brand-secondary hover:text-brand-text hover:bg-brand-text/[0.06] cursor-pointer"
                  }`}
                >
                  {SubIcon && (
                    <SubIcon
                      className={`w-[18px] h-[18px] shrink-0 ${isSubActive ? "text-brand-accent" : subItem.comingSoon ? "text-brand-secondary" : "text-brand-accent/80"}`}
                    />
                  )}
                  <span className="flex-1 tracking-wide">{subItem.name}</span>
                </a>
              );
            })}
          </div>
        )}

        {/* Mobile Sidebar (Slide-out) */}
        <div
          className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
            isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsMobileOpen(false)}
        />
        <aside
          className={`fixed top-0 left-0 bottom-0 w-64 z-50 bg-brand-bg flex flex-col py-2 transition-transform duration-300 ease-in-out md:hidden overflow-y-auto overscroll-contain ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center mb-2 h-14">
            <div className="w-20 flex justify-center items-center shrink-0">
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 text-brand-secondary hover:text-brand-text rounded-full hover:bg-brand-text/10 transition-colors cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <img
                src="/logo-without-text.png"
                alt="XLChess logo"
                className="h-8 w-auto object-contain"
              />
              <div className="flex flex-col leading-none">
                <span className="text-lg font-bold tracking-wide text-brand-text">
                  XLCHESS
                </span>
              </div>
            </div>
          </div>

          <nav className="flex-1 flex flex-col space-y-1 pb-6">
            {/* Base section with accordion for mobile */}
            {baseSection.map((item) => renderNavItem(item))}
            <Divider />

            <div className="mx-2 px-3 py-2 flex items-center justify-between">
              <span className="text-[15px] font-semibold text-brand-text">
                Explore
              </span>
              <button
                onClick={() => {
                  if (status !== "authenticated") {
                    openModal("login");
                  } else {
                    setNewLinkName("");
                    setNewLinkUrl("/analysis");
                    setEditLinkIndex(null);
                    setIsAddLinkModalOpen(true);
                  }
                }}
                className="w-4 h-4 hover:bg-brand-text/10 rounded-full text-brand-secondary hover:text-brand-text cursor-pointer transition-colors flex items-center justify-center"
                title="Add custom link"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {exploreSection.map((item) => renderNavItem(item))}
            {customLinks.map((link, index) =>
              renderNavItem(
                { name: link.name, href: link.url, icon: ExternalLink },
                index,
              ),
            )}

            <Divider />

            {status !== "authenticated" ? (
              <div className="px-4 py-2">
                <p className="text-[13px] text-brand-text/80 mb-3 leading-tight">
                  Sign in to access your stats, play games, and follow your
                  favorite creators.
                </p>
                <button
                  onClick={() => openModal("login")}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-border/50 text-brand-accent hover:bg-brand-accent/10 transition-all duration-200 text-sm cursor-pointer w-fit"
                >
                  <CircleUserRound className="w-5 h-5" />
                  <span>Sign In</span>
                </button>
              </div>
            ) : (
              <>
                <div className="mx-2 px-3 py-2">
                  <span className="text-[15px] font-semibold text-brand-text">
                    Subscriptions
                  </span>
                </div>
                {MOCK_SUBSCRIPTIONS.length > 0 ? (
                  MOCK_SUBSCRIPTIONS.map((sub) =>
                    renderNavItem({ ...sub, href: sub.href }),
                  )
                ) : (
                  <div className="px-6 py-2 text-[13px] text-brand-secondary">
                    No subscriptions yet.
                  </div>
                )}

                <Divider />

                <div
                  className="flex items-center justify-between mx-2 px-3 py-2 cursor-pointer group rounded-xl hover:bg-brand-text/5 transition-colors"
                  onClick={() => setIsYouOpen(!isYouOpen)}
                >
                  <span className="text-[15px] font-semibold text-brand-text">
                    You
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-brand-secondary transition-transform duration-300 ${isYouOpen ? "rotate-180" : ""}`}
                  />
                </div>
                <div
                  className={`transition-all duration-300 overflow-hidden ${isYouOpen ? "max-h-[500px]" : "max-h-0"}`}
                >
                  {youSection.map((item) => renderNavItem(item))}
                </div>
              </>
            )}

            <Divider />
            {miscSection.map((item) => renderNavItem(item))}

            {/* MORE SECTION (Mobile) */}
            {moreLinks.length > 0 && (
              <>
                <Divider />
                <div
                  className="flex items-center justify-between mx-2 px-3 py-2 cursor-pointer group rounded-xl hover:bg-brand-text/5 transition-colors"
                  onClick={() => setIsMoreOpen(!isMoreOpen)}
                >
                  <div className="flex items-center gap-2">
                    <Archive className="w-4 h-4 text-brand-secondary" />
                    <span className="text-[15px] font-semibold text-brand-text">
                      More
                    </span>
                    <span className="text-[11px] text-brand-secondary bg-brand-text/5 rounded-full px-2 py-0.5 font-mono">
                      {moreLinks.length}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-brand-secondary transition-transform duration-300 ${isMoreOpen ? "rotate-180" : ""}`}
                  />
                </div>
                <div
                  className={`transition-all duration-300 overflow-hidden ${isMoreOpen ? "max-h-[600px]" : "max-h-0"}`}
                >
                  {moreLinks.map((link, index) =>
                    renderNavItem(
                      { name: link.name, href: link.url, icon: ExternalLink },
                      index,
                      "more",
                    ),
                  )}
                  <div className="px-6 pb-2">
                    <p className="text-[11px] text-brand-secondary/50 italic leading-snug">
                      Coming soon: Links will be auto-sorted based on usage.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* FOOTER (Mobile) */}
            <div className="mt-auto px-6 py-4 flex flex-col gap-4 text-[12px] text-brand-secondary font-sans border-t border-brand-text/10 pt-6">
              <div className="flex flex-wrap gap-x-4 gap-y-2.5 font-medium tracking-wide">
                {footerLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.comingSoon ? "#" : link.href}
                    title={link.comingSoon ? "Coming soon" : undefined}
                    onClick={(e) => {
                      if (link.comingSoon) e.preventDefault();
                      else handleLinkClick(link.href, e);
                    }}
                    className={`whitespace-nowrap transition-colors ${link.comingSoon ? "opacity-60 cursor-not-allowed select-none" : "hover:text-brand-text cursor-pointer"}`}
                  >
                    {link.name}
                  </a>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-brand-text/10">
                <img
                  src="/logo-without-text.png"
                  alt="logo"
                  className="h-4 w-auto opacity-40 grayscale"
                />
                <span className="text-brand-text/30 font-medium text-[11px]">
                  © 2026 XLCHESS
                </span>
              </div>
            </div>
          </nav>
        </aside>

        <AuthModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialMode={modalMode}
        />

        {/* Add Link Modal */}
        {isAddLinkModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-brand-surface border border-brand-border p-6 rounded-2xl w-full max-w-[22rem] shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-brand-text tracking-wide">
                  {editLinkIndex !== null ? "Edit Link" : "Add Custom Link"}
                </h3>
                <button
                  onClick={() => setIsAddLinkModalOpen(false)}
                  className="text-brand-secondary hover:text-brand-text transition-colors cursor-pointer p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddLink} className="space-y-5">
                <div>
                  <label className="block text-[13px] font-medium text-brand-secondary mb-2">
                    Link Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newLinkName}
                    onChange={(e) => setNewLinkName(e.target.value)}
                    placeholder="e.g. Analysis Board"
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-[14px] text-brand-text placeholder-brand-text/20 focus:outline-none focus:border-brand-accent transition-colors shadow-inner"
                  />
                </div>

                <div className="relative" ref={dropdownRef}>
                  <label className="block text-[13px] font-medium text-brand-secondary mb-2">
                    Internal URL
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsUrlDropdownOpen(!isUrlDropdownOpen)}
                    className={`w-full bg-brand-surface border ${isUrlDropdownOpen ? "border-brand-accent" : "border-brand-border"} rounded-xl px-4 py-3 text-[14px] text-left text-brand-text focus:outline-none transition-colors flex justify-between items-center shadow-inner cursor-pointer`}
                  >
                    <span>
                      {urlOptions.find((o) => o.value === newLinkUrl)?.label ||
                        "Select URL"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-brand-secondary transition-transform ${isUrlDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isUrlDropdownOpen && (
                    <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-brand-surface border border-brand-border rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.8)] z-50 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                      {urlOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setNewLinkUrl(option.value);
                            setIsUrlDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-[14px] transition-colors cursor-pointer ${
                            newLinkUrl === option.value
                              ? "bg-[#2563EB] text-brand-text font-medium"
                              : "text-brand-secondary hover:bg-brand-text/5 hover:text-brand-text"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* More section hint */}
                {editLinkIndex === null && (
                  <div className="flex items-start gap-2 rounded-xl bg-amber-400/5 border border-amber-400/20 px-3 py-2.5">
                    <Archive className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[12px] text-amber-400/80 leading-snug">
                      Links you rarely use can be moved to{" "}
                      <strong className="text-amber-400">More</strong>. In a
                      future update, they'll be sorted automatically.
                    </p>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-brand-accent text-brand-bg font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-accent/90 hover:scale-[1.02] transition-all cursor-pointer text-[14px]"
                  >
                    {editLinkIndex !== null ? "Save Changes" : "Save Link"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MAIN CONTENT WORKSPACE ─────────────────────────────────────────── */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isExpanded ? "md:pl-64" : "md:pl-20"}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
