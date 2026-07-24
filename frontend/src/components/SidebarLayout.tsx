import { useState } from "react";
import {
  Menu,
  X,
  Home,
  Puzzle,
  CreditCard,
  CircleUserRound,
  Crown,
  GraduationCap,
  BookOpen,
  Bot,
  BookMarked,
  ChevronDown,
} from "lucide-react";
import { useLogoAnimation } from "../hooks/useLogoAnimation";
import { soundManager } from "../utils/SoundManager";
import { useSession } from "../hooks/useSession";
import { AvatarDropdown } from "./AvatarDropdown";
import { AuthModal } from "./AuthModal";
import { MoreMenu } from "./MoreMenu";
import { useNavigate, useLocation } from "react-router";

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
  const { status } = useSession();

  const navigate = useNavigate();
  const location = useLocation();

  const openModal = (mode: "login" | "register") => {
    setModalMode(mode);
    setIsModalOpen(true);
    setIsMobileOpen(false);
  };

  const { containerRef, logoRef } = useLogoAnimation();

  const menuItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Puzzles", href: "/puzzles", icon: Puzzle },
    {
      name: "Learn",
      href: "/learn",
      icon: GraduationCap,
      subItems: [
        { name: "Lessons", href: "/lessons", icon: BookOpen, comingSoon: true },
        { name: "Play Coach", href: "/play-coach", icon: Bot, comingSoon: true },
        { name: "Openings", href: "/openings", icon: BookMarked },
      ],
    },
    { name: "Pricing", href: "/pricing", icon: CreditCard },
    { name: "Premium", href: "/premium", icon: Crown },
  ];

  const handleLinkClick = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    soundManager.playButtonClick();
    setIsMobileOpen(false);

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

  return (
    <div className="min-h-screen text-brand-text bg-brand-bg flex flex-col relative select-none">
      {/* ── TOP HEADER ──────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 h-16 z-40 bg-[#080B14]/85 backdrop-blur-md flex items-center justify-between px-4 md:px-6">
        {/* Left: Hamburger & Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleToggle}
            className="p-2 text-brand-secondary hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            ref={containerRef}
            className="flex items-center gap-2 cursor-pointer select-none"
            style={{ perspective: "600px" }}
            onClick={(e) => handleLinkClick("/", e)}
            role="link"
            tabIndex={0}
            aria-label="XLChess Home"
          >
            <img
              ref={logoRef}
              src="/logo-without-text.png"
              alt="XLChess logo"
              className="h-10 w-auto object-contain"
              draggable={false}
              style={{
                willChange: "transform, filter",
                transformStyle: "preserve-3d",
                transformOrigin: "center center",
              }}
            />
            <div className="flex flex-col leading-none">
              <h1 className="text-1xl font-bold tracking-wide">XLCHESS</h1>

              <p className="text-xs">Excel at Chess</p>
            </div>
          </div>
        </div>

        {/* Right: More Menu & Auth Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Three-dot More menu (contains sound toggle + settings) */}
          {status !== "authenticated" && <MoreMenu />}

          {status === "loading" ? (
            <div className="w-6 h-6 rounded-full border-2 border-brand-accent/30 border-t-brand-accent animate-spin" />
          ) : status === "authenticated" ? (
            <AvatarDropdown />
          ) : (
            /* Logged-out: icon + label Sign In button */
            <button
              onClick={() => openModal("login")}
              aria-label="Sign In"
              className="flex items-center gap-2 px-3 py-1.5 rounded-[80px] border border-brand-border/50 text-brand-secondary hover:text-white hover:border-brand-accent/50 hover:bg-white/5 transition-all duration-200 text-xs sm:text-sm font-sans cursor-pointer"
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
          className={`fixed top-16 left-0 bottom-0 z-30 bg-[#080B14]/90 backdrop-blur-md border-r border-brand-border flex flex-col py-4 transition-all duration-300 hidden md:flex ${
            isExpanded ? "w-64" : "w-20"
          }`}
        >
          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.href ||
                item.subItems?.some((sub) => location.pathname === sub.href);

              return (
                <div key={item.name} className="relative group/navitem">
                  <a
                    href={item.subItems ? "#" : item.href}
                    onClick={(e) => {
                      if (item.subItems) {
                        e.preventDefault();
                      } else {
                        handleLinkClick(item.href, e);
                      }
                    }}
                    className={`b1 relative flex transition-all duration-200 cursor-pointer ${
                      isExpanded
                        ? `items-center gap-4 px-4 py-3 mx-3 rounded-xl ${
                            isActive
                              ? "text-brand-accent bg-brand-accent/10 font-medium shadow-[inset_1px_0_0_rgba(212,175,110,0.1)]"
                              : "text-brand-secondary hover:text-white hover:bg-white/5 group-hover/navitem:bg-white/5 group-hover/navitem:text-white"
                          }`
                        : `flex-col items-center justify-center py-2.5 mx-2 rounded-lg text-center ${
                            isActive
                              ? "text-brand-accent bg-brand-accent/10 border-brand-accent font-medium"
                              : "text-brand-secondary hover:text-white hover:bg-white/5 group-hover/navitem:bg-white/5 group-hover/navitem:text-white"
                          }`
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 transition-transform duration-200 group-hover/navitem:scale-105 ${isActive ? "text-brand-accent" : "text-brand-secondary group-hover/navitem:text-white"}`}
                    />
                    <span
                      className={`font-sans tracking-wide transition-all ${
                        isExpanded ? "text-sm" : "text-[10px] mt-1"
                      }`}
                    >
                      {item.name}
                    </span>
                  </a>

                  {item.subItems && (
                    <div
                      className="absolute left-full top-0 hidden group-hover/navitem:block z-[100] animate-in fade-in slide-in-from-left-2 duration-150"
                      style={{ paddingLeft: "8px" }}
                    >
                      <div
                        className="w-52 rounded-xl border border-brand-border py-1.5 shadow-2xl"
                        style={{
                          background: "#0A0E1A",
                          boxShadow:
                            "0 8px 32px rgba(0,0,0,0.85), 0 0 0 1px rgba(212,175,110,0.10)",
                        }}
                      >
                        {item.subItems.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive =
                            location.pathname === subItem.href;
                          const isComingSoon = subItem.comingSoon;
                          return (
                            <a
                              key={subItem.name}
                              href={isComingSoon ? "#" : subItem.href}
                              onClick={(e) => {
                                if (isComingSoon) {
                                  e.preventDefault();
                                  return;
                                }
                                handleLinkClick(subItem.href, e);
                              }}
                              title={isComingSoon ? "Coming Soon" : undefined}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-left transition-colors duration-150 ${
                                isComingSoon
                                  ? "opacity-40 cursor-not-allowed select-none"
                                  : isSubActive
                                  ? "text-brand-accent bg-white/[0.06] cursor-pointer"
                                  : "text-brand-secondary hover:text-white hover:bg-white/[0.06] cursor-pointer"
                              }`}
                            >
                              <SubIcon
                                className={`w-4 h-4 shrink-0 transition-colors duration-150 ${isSubActive ? "text-brand-accent" : "text-brand-accent/70 group-hover/sub:text-brand-accent"}`}
                              />
                              <span className="flex-1">{subItem.name}</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        <AuthModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialMode={modalMode}
        />

        {/* Mobile Sidebar (Slide-out Overlay Drawer) */}
        {/* Backdrop overlay */}
        <div
          className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
            isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsMobileOpen(false)}
        />

        {/* Drawer itself */}
        <aside
          className={`fixed top-0 left-0 bottom-0 w-64 z-50 bg-[#080B14] border-r border-brand-border flex flex-col py-4 transition-transform duration-300 ease-in-out md:hidden ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-4 pb-4 border-b border-brand-border/40">
            <span className="font-display font-medium text-lg text-brand-accent tracking-wide">
              Navigation
            </span>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-2 text-brand-secondary hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 mt-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.href ||
                item.subItems?.some((sub) => location.pathname === sub.href);
              const isSubOpen = mobileOpenItem === item.name;

              return (
                <div key={item.name} className="flex flex-col">
                  <button
                    onClick={(e) => {
                      if (item.subItems) {
                        // Toggle nested list; don't navigate
                        setMobileOpenItem(isSubOpen ? null : item.name);
                      } else {
                        handleLinkClick(
                          item.href,
                          e as unknown as React.MouseEvent,
                        );
                      }
                    }}
                    className={`group w-full flex items-center gap-4 px-4 py-3 mx-3 rounded-xl transition-all duration-200 cursor-pointer text-left ${
                      isActive
                        ? "text-brand-accent bg-brand-accent/10 font-medium"
                        : "text-brand-secondary hover:text-white hover:bg-white/5"
                    }`}
                    style={{ width: "calc(100% - 1.5rem)" }}
                  >
                    <Icon
                      className={`w-5 h-5 shrink-0 ${isActive ? "text-brand-accent" : "text-brand-secondary group-hover:text-white"}`}
                    />
                    <span className="font-sans text-sm tracking-wide flex-1">
                      {item.name}
                    </span>
                    {item.subItems && (
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                          isSubOpen
                            ? "rotate-180 text-brand-accent"
                            : "text-brand-secondary/60"
                        }`}
                      />
                    )}
                  </button>

                  {item.subItems && isSubOpen && (
                    <div className="flex flex-col ml-12 mr-3 mt-1 mb-1 space-y-1">
                      {item.subItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = location.pathname === subItem.href;
                        const isComingSoon = subItem.comingSoon;
                        return (
                          <a
                            key={subItem.name}
                            href={isComingSoon ? "#" : subItem.href}
                            onClick={(e) => {
                              if (isComingSoon) {
                                e.preventDefault();
                                return;
                              }
                              handleLinkClick(subItem.href, e);
                            }}
                            title={isComingSoon ? "Coming Soon" : undefined}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                              isComingSoon
                                ? "opacity-40 cursor-not-allowed select-none"
                                : isSubActive
                                ? "text-brand-accent bg-brand-accent/5 font-medium cursor-pointer"
                                : "text-brand-secondary hover:text-white hover:bg-white/5 cursor-pointer"
                            }`}
                          >
                            <SubIcon
                              className={`w-4 h-4 ${isSubActive ? "text-brand-accent" : "text-brand-secondary"}`}
                            />
                            <span className="font-sans text-sm">
                              {subItem.name}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* ── MAIN CONTENT WORKSPACE ─────────────────────────────────────────── */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
            isExpanded ? "md:pl-64" : "md:pl-20"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
