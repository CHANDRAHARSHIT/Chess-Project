import React, { useState, useEffect } from "react";
import {
  Calendar,
  Mail,
  Trophy,
  Gamepad2,
  Award,
  Settings,
  Link2,
  AlertCircle,
  Lock,
  ChevronRight,
  Share2
} from "lucide-react";
import { useSession } from "../hooks/useSession";
import { useNavigate } from "react-router";
import { PaymentService } from "../services/payment";

interface PlatformButtonProps {
  name: string;
  icon: React.ReactNode;
  brandColor: string;
}

const PlatformButton: React.FC<PlatformButtonProps> = ({ name, icon, brandColor }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => alert(`${name} connection coming in the next release!`)}
      className="flex items-center justify-center gap-2.5 bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/10 hover:border-brand-accent/40 rounded-xl py-3 px-4 transition-all duration-200 cursor-pointer text-sm font-sans font-medium text-brand-secondary hover:text-white group relative overflow-hidden w-full"
      style={{
        boxShadow: hovered ? `0 0 12px ${brandColor}15` : 'none',
      }}
    >
      <div
        className="w-5 h-5 transition-transform duration-200 group-hover:scale-110 flex items-center justify-center"
        style={{
          color: hovered ? brandColor : 'currentColor',
          fill: hovered ? brandColor : 'currentColor',
        }}
      >
        {icon}
      </div>
      <span>{name}</span>
    </button>
  );
};

const PLATFORMS = [
  {
    name: "Discord",
    brandColor: "#5865F2",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
      </svg>
    )
  },
  {
    name: "Twitch",
    brandColor: "#9146FF",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
      </svg>
    )
  },
  {
    name: "YouTube",
    brandColor: "#FF0000",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    )
  },
  {
    name: "TikTok",
    brandColor: "#FE0979",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    )
  },
  {
    name: "Reddit",
    brandColor: "#FF4500",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485l-2.286 2.286C.775 23.225 1.097 24 1.738 24H12c6.627 0 12-5.373 12-12S18.627 0 12 0Zm4.388 3.199c1.104 0 1.999.895 1.999 1.999 0 1.105-.895 2-1.999 2-.946 0-1.739-.657-1.947-1.539v.002c-1.147.162-2.032 1.15-2.032 2.341v.007c1.776.067 3.4.567 4.686 1.363.473-.363 1.064-.58 1.707-.58 1.547 0 2.802 1.254 2.802 2.802 0 1.117-.655 2.081-1.601 2.531-.088 3.256-3.637 5.876-7.997 5.876-4.361 0-7.905-2.617-7.998-5.87-.954-.447-1.614-1.415-1.614-2.538 0-1.548 1.255-2.802 2.803-2.802.645 0 1.239.218 1.712.585 1.275-.79 2.881-1.291 4.64-1.365v-.01c0-1.663 1.263-3.034 2.88-3.207.188-.911.993-1.595 1.959-1.595Zm-8.085 8.376c-.784 0-1.459.78-1.506 1.797-.047 1.016.64 1.429 1.426 1.429.786 0 1.371-.369 1.418-1.385.047-1.017-.553-1.841-1.338-1.841Zm7.406 0c-.786 0-1.385.824-1.338 1.841.047 1.017.634 1.385 1.418 1.385.785 0 1.473-.413 1.426-1.429-.046-1.017-.721-1.797-1.506-1.797Zm-3.703 4.013c-.974 0-1.907.048-2.77.135-.147.015-.241.168-.183.305.483 1.154 1.622 1.964 2.953 1.964 1.33 0 2.47-.81 2.953-1.964.057-.137-.037-.29-.184-.305-.863-.087-1.795-.135-2.769-.135Z" />
      </svg>
    )
  },
  {
    name: "Steam",
    brandColor: "#66C0F4",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z" />
      </svg>
    )
  }
];

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
  accounts: Array<{ provider: string }>;
  subscriptions?: Array<{
    id: string;
    status: string;
    currentPeriodEnd: string;
    product: {
      name: string;
      billingInterval: string;
    };
  }>;
}
export default function ProfileContent() {
  const navigate = useNavigate();
const { signOut } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [managingBilling, setManagingBilling] = useState(false);

  const handleManageSubscription = async () => {
    setManagingBilling(true);
    try {
      const res = await PaymentService.createBillingPortalSession();
      if (res.status === "success" && res.portalUrl) {
        window.location.href = res.portalUrl;
      } else {
        alert(res.message || "Failed to load customer billing portal. Please try again later.");
      }
    } catch (e) {
      console.error("[ProfilePage] Customer billing portal load error:", e);
      alert("An unexpected error occurred while loading billing portal. Please try again.");
    } finally {
      setManagingBilling(false);
    }
  };

  const handleLogoutAll = async () => {
    if (window.confirm("Are you sure you want to sign out from all devices? This will invalidate all your active sessions.")) {
      setLoggingOutAll(true);
      try {
        const res = await fetch("/api/users/logout-all", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (res.ok) {
          signOut();
        } else {
          const json = await res.json();
          alert(json.message || "Failed to sign out from all devices.");
        }
      } catch (err) {
        console.error(err);
        alert("A network error occurred while signing out from all devices.");
      } finally {
        setLoggingOutAll(false);
      }
    }
  };

  const fetchProfile = async () => {
    setLoadingProfile(true);
    setError(null);
    try {
      const res = await fetch("/api/users/profile");
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Unauthorized. Please log in.");
        }
        throw new Error("Failed to load user profile information.");
      }
      const json = await res.json();
      if (json.status === "success" && json.data?.user) {
        setProfile(json.data.user);
      } else {
        throw new Error(json.message || "Failed to load user profile.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while loading profile.");
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Clean date formatter
  const formatJoinDate = (isoString?: string) => {
    if (!isoString) return "Joined July 2026";
    try {
      const date = new Date(isoString);
      const formatter = new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      });
      return `Joined ${formatter.format(date)}`;
    } catch (e) {
      return "Joined July 2026";
    }
  };
         
        return (
               <>
  {/* LOADING STATE (Skeleton card) */}
          {loadingProfile && (
            <div className="w-full bg-gradient-to-br from-brand-surface/60 via-brand-surface/40 to-brand-bg/80 border border-brand-border/60 shadow-2xl backdrop-blur-xl rounded-2xl p-6 sm:p-10 relative overflow-hidden animate-pulse">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8 pb-8 border-b border-brand-border/20">
                <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-brand-surface/80 flex-shrink-0" />
                <div className="flex-1 w-full flex flex-col items-center md:items-start gap-3 mt-2">
                  <div className="h-9 w-48 bg-brand-surface/80 rounded-lg" />
                  <div className="h-5 w-64 bg-brand-surface/80 rounded-lg" />
                  <div className="h-4 w-36 bg-brand-surface/80 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-28 bg-brand-surface/40 border border-brand-border/10 rounded-xl" />
                ))}
              </div>
            </div>
          )}
  
          {/* ERROR STATE */}
          {!loadingProfile && error && (
            <div className="w-full bg-gradient-to-br from-red-950/20 via-brand-surface/40 to-brand-bg/80 border border-red-500/20 shadow-2xl backdrop-blur-xl rounded-2xl p-8 text-center flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-sans font-bold text-lg text-white">Could not load profile</h3>
              <p className="font-sans text-brand-secondary text-sm max-w-md">{error}</p>
              <button
                onClick={fetchProfile}
                className="mt-2 font-sans font-semibold text-sm bg-brand-accent hover:bg-brand-accent/80 text-white px-5 py-2.5 rounded-lg border border-brand-accent/30 transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-md shadow-brand-accent/20"
              >
                Try Again
              </button>
            </div>
          )}
  
          {/* SUCCESS STATE */}
          {!loadingProfile && !error && profile && (
            <div className="w-full bg-gradient-to-br from-brand-surface/60 via-brand-surface/40 to-brand-bg/80 border border-brand-border/60 shadow-2xl backdrop-blur-xl rounded-2xl p-6 sm:p-10 relative overflow-hidden">
              {/* Background Glows for visual excellence */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-brand-accent/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
  
              {/* Profile Info Header */}
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8 pb-8 border-b border-brand-border/20">
                {/* Profile Picture */}
                <div className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden border border-brand-accent/40 shadow-lg shadow-brand-bg/80 flex-shrink-0 bg-brand-surface relative group">
                  {profile.image ? (
                    <img
                      src={profile.image}
                      alt={profile.name || "User Avatar"}
                      className="w-full h-full object-cover"
                      draggable={false}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-accent to-indigo-600 text-white font-sans font-bold text-4xl select-none">
                      {profile.name ? profile.name.charAt(0).toUpperCase() : "?"}
                    </div>
                  )}
                  {/* Visual outline overlay */}
                  <div className="absolute inset-0 border border-brand-accent/20 rounded-full pointer-events-none" />
                </div>
  
                {/* User detail lines */}
                <div className="flex-1 text-center md:text-left mt-2 select-text">
                  <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-3">
                    <h2 className="text-3xl sm:text-4xl font-sans font-extrabold text-white tracking-tight leading-none">
                      {profile.name || "Anonymous Player"}
                    </h2>
                    {profile.subscriptions?.[0] && (profile.subscriptions[0].status === "ACTIVE" || profile.subscriptions[0].status === "TRIALING") && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-accent/20 border border-brand-accent/40 text-brand-accent text-[10px] font-mono font-bold tracking-wider uppercase select-none shadow-[0_0_15px_rgba(212,175,110,0.15)] mt-2 md:mt-0">
                        <Award className="w-3.5 h-3.5 fill-current" />
                        Premium
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 mt-4 justify-center md:justify-start">
                    <div className="flex items-center gap-2 text-brand-secondary font-sans text-sm">
                      <Mail className="w-4 h-4 text-brand-accent/80" />
                      <span>{profile.email}</span>
                    </div>
                    <div className="hidden sm:block text-brand-border/40">|</div>
                    <div className="flex items-center gap-2 text-brand-secondary font-sans text-sm">
                      <Calendar className="w-4 h-4 text-brand-accent/80" />
                      <span>{formatJoinDate(profile.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
  
              {/* Future Readiness Placeholder Layout Grid */}
              <div className="pt-8">
                <h3 className="text-lg font-sans font-bold text-white mb-6 tracking-wide flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2 text-center sm:text-left">
                  <span>Chess Profile & Statistics</span>
                  <span className="text-[10px] uppercase font-sans font-semibold bg-brand-accent/15 text-brand-accent px-2 py-0.5 rounded-full tracking-wider">
                    Future Upgrades
                  </span>
                </h3>
  
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* Membership & Billing Status Card */}
                  <div className="bg-brand-surface/30 border border-brand-border/40 hover:border-brand-border/80 transition-all duration-200 rounded-xl p-5 relative overflow-hidden group select-none">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-sans font-semibold text-brand-secondary uppercase tracking-wider">Membership</h4>
                        <p className="text-xs text-brand-secondary/50 font-sans mt-0.5">
                          {profile.subscriptions?.[0] && (profile.subscriptions[0].status === "ACTIVE" || profile.subscriptions[0].status === "TRIALING") 
                            ? `${profile.subscriptions[0].product.name}`
                            : "Free Plan"}
                        </p>
                      </div>
                    </div>
                    
                    {profile.subscriptions?.[0] && (profile.subscriptions[0].status === "ACTIVE" || profile.subscriptions[0].status === "TRIALING") ? (
                      <div className="space-y-3 mt-4">
                        <div className="flex items-center justify-between text-xs font-sans">
                          <span className="text-brand-secondary">Status</span>
                          <span className="font-semibold text-emerald-400 font-mono uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[10px]">
                            {profile.subscriptions[0].status.toLowerCase()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-sans">
                          <span className="text-brand-secondary">Renews on</span>
                          <span className="text-white font-mono text-[10px]">
                            {new Date(profile.subscriptions[0].currentPeriodEnd).toLocaleDateString("en-US", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <button
                          onClick={handleManageSubscription}
                          disabled={managingBilling}
                          className="w-full mt-2 py-2 px-3 bg-brand-accent/15 hover:bg-brand-accent/25 border border-brand-accent/30 text-brand-accent hover:text-white rounded-lg font-mono text-[9px] uppercase tracking-widest font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 text-center"
                        >
                          {managingBilling ? "Loading Portal..." : "Manage Billing"}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 mt-4">
                        <div className="flex items-center justify-between text-xs font-sans">
                          <span className="text-brand-secondary">Status</span>
                          <span className="font-semibold text-brand-secondary/60 font-mono uppercase bg-white/5 px-2 py-0.5 rounded border border-white/5 text-[10px]">
                            Free Tier
                          </span>
                        </div>
                        <button
                          onClick={() => navigate("/pricing")}
                          className="w-full mt-4 py-2.5 px-3 bg-brand-accent text-brand-bg hover:bg-brand-accent/90 rounded-lg font-mono text-[9px] uppercase tracking-widest font-bold transition-all duration-200 cursor-pointer text-center"
                        >
                          Upgrade to Premium
                        </button>
                      </div>
                    )}
                  </div>
                  {/* Rating Placeholder */}
                  <div className="bg-brand-surface/30 border border-brand-border/40 hover:border-brand-border/80 transition-all duration-200 rounded-xl p-5 relative overflow-hidden group select-none">
                    <div className="absolute top-3 right-3 text-brand-secondary/20">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-sans font-semibold text-brand-secondary uppercase tracking-wider">Chess Rating</h4>
                        <p className="text-xs text-brand-secondary/50 font-sans mt-0.5">Rating coming soon</p>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-2xl font-sans font-bold text-white/50">----</span>
                      <span className="text-[10px] text-brand-secondary/40 font-mono">ELO</span>
                    </div>
                  </div>
  
                  {/* Game Stats Placeholder */}
                  <div className="bg-brand-surface/30 border border-brand-border/40 hover:border-brand-border/80 transition-all duration-200 rounded-xl p-5 relative overflow-hidden group select-none">
                    <div className="absolute top-3 right-3 text-brand-secondary/20">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                        <Gamepad2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-sans font-semibold text-brand-secondary uppercase tracking-wider">Games Played</h4>
                        <p className="text-xs text-brand-secondary/50 font-sans mt-0.5">Game logger pending</p>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-2">
                      <div>
                        <span className="block text-xl font-sans font-bold text-white/50">0</span>
                        <span className="text-[9px] text-brand-secondary/40 font-sans uppercase">Played</span>
                      </div>
                      <div>
                        <span className="block text-xl font-sans font-bold text-white/50">0%</span>
                        <span className="text-[9px] text-brand-secondary/40 font-sans uppercase">Wins</span>
                      </div>
                    </div>
                  </div>
  
                  {/* Achievements Placeholder */}
                  <div className="bg-brand-surface/30 border border-brand-border/40 hover:border-brand-border/80 transition-all duration-200 rounded-xl p-5 relative overflow-hidden group select-none">
                    <div className="absolute top-3 right-3 text-brand-secondary/20">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-sans font-semibold text-brand-secondary uppercase tracking-wider">Achievements</h4>
                        <p className="text-xs text-brand-secondary/50 font-sans mt-0.5">Trophy case locked</p>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-2xl font-sans font-bold text-white/50">0</span>
                      <span className="text-xs text-brand-secondary/40 font-sans">unlocked</span>
                    </div>
                  </div>
  
                  {/* Bio & Username Placeholder */}
                  <div className="bg-brand-surface/30 border border-brand-border/40 hover:border-brand-border/80 transition-all duration-200 rounded-xl p-5 relative overflow-hidden sm:col-span-2 select-none">
                    <div className="absolute top-3 right-3 text-brand-secondary/20">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <Settings className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-sans font-semibold text-brand-secondary uppercase tracking-wider">Personal Bio & Preferences</h4>
                        <p className="text-xs text-brand-secondary/50 font-sans mt-0.5">Custom username and chess handle</p>
                      </div>
                    </div>
                    <div className="mt-3 h-8 border border-dashed border-brand-border/40 rounded flex items-center justify-center text-xs text-brand-secondary/35 italic">
                      Configure player profile custom description
                    </div>
                  </div>
  
                  {/* Connected Accounts Placeholder */}
                  <div className="bg-brand-surface/30 border border-brand-border/40 hover:border-brand-border/80 transition-all duration-200 rounded-xl p-5 relative overflow-hidden group select-none">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
                        <Link2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-sans font-semibold text-brand-secondary uppercase tracking-wider">Connected Accounts</h4>
                        <p className="text-xs text-brand-secondary/50 font-sans mt-0.5">Google Sign-In Active</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 w-fit">
                      {/* Tiny Google Icon */}
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                      </svg>
                      <span className="text-xs font-sans text-white/70">Google</span>
                    </div>
                  </div>
  
                  {/* Connected Platforms Card */}
                  <div className="bg-brand-surface/30 border border-brand-border/40 hover:border-brand-border/80 transition-all duration-200 rounded-xl p-5 relative overflow-hidden sm:col-span-2 lg:col-span-3 select-none">
                    <div className="absolute top-3 right-3 text-brand-secondary/20">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-brand-border/10">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
                          <Share2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-sans font-bold text-white tracking-wide">Connected Platforms</h4>
                          <p className="text-xs text-brand-secondary/60 font-sans mt-0.5">Connect your favorite gaming and social platforms.</p>
                        </div>
                      </div>
                      <span className="text-[9px] uppercase font-sans font-semibold bg-violet-500/15 text-violet-400 px-2 py-0.5 rounded-full tracking-wider w-fit">
                        Social Accounts
                      </span>
                    </div>
  
                    {/* Platform Buttons grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                      {PLATFORMS.map((platform) => (
                        <PlatformButton
                          key={platform.name}
                          name={platform.name}
                          icon={platform.icon}
                          brandColor={platform.brandColor}
                        />
                      ))}
                    </div>
                  </div>
  
                </div>
              </div>
  
              {/* Quick settings link or details */}
              <div className="mt-8 border-t border-brand-border/20 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs font-sans text-brand-secondary/60">
                  Player Status: <span className="text-brand-accent font-semibold">Active Member</span>
                </p>
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-center sm:justify-end">
                  <button
                    onClick={handleLogoutAll}
                    disabled={loggingOutAll}
                    className="font-sans text-xs text-red-400 hover:text-red-300 transition-colors duration-150 inline-flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loggingOutAll ? "Signing out..." : "Sign out from all devices"}
                  </button>
                  <span className="text-brand-border/40 text-xs hidden sm:inline">|</span>
                  <button
                    onClick={() => navigate("/settings")}
                    className="font-sans text-xs text-brand-secondary hover:text-white transition-colors duration-150 inline-flex items-center gap-1 cursor-pointer"
                  >
                    Configure site preferences <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
            </>
);
}