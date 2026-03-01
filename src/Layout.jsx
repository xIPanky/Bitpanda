import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  ScanLine,
  Settings,
  ClipboardList,
  Menu,
  X,
  Ticket,
  Megaphone,
  CalendarDays,
  ChevronRight,
  Mail,
  Zap,
} from "lucide-react";

const publicPages = [
  "Register",
  "Ticket",
  "Landing",
  "EventDetails",
  "EventTicketing",
  "RegistrationSuccess",
  "Verify",
  "Verified",
];

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event_id");

  // Check auth for protected pages
  const { data: user, isLoading: authLoading } = useQuery({
    queryKey: ["auth-check"],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    enabled: !publicPages.includes(currentPageName),
    staleTime: Infinity,
  });

  useEffect(() => {
    // Redirect to login if trying to access protected route without auth
    if (!publicPages.includes(currentPageName) && !authLoading && !user) {
      base44.auth.redirectToLogin(window.location.pathname + window.location.search);
    }
  }, [currentPageName, user, authLoading]);

  // Show loading for protected pages during auth check
  if (!publicPages.includes(currentPageName) && authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#070707" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#beff00" }} />
      </div>
    );
  }

  const eventNavItems = eventId ? [
    { name: "Dashboard", page: `Dashboard?event_id=${eventId}`, icon: LayoutDashboard },
    { name: "Veranstaltungsinfos", page: `EventInfo?event_id=${eventId}`, icon: CalendarDays },
    { name: "Ticketing", page: `TicketManagement?event_id=${eventId}`, icon: Ticket },
    { name: "Gästeliste", page: `GuestList?event_id=${eventId}`, icon: Users },
    { name: "Gästedaten", page: `GuestData?event_id=${eventId}`, icon: ClipboardList },
    { name: "Rollenverteilung", page: `RoleManagement?event_id=${eventId}`, icon: Users },
    { name: "Einstellungen", page: `Settings?event_id=${eventId}`, icon: Settings },
    { name: "E-Mail-Sequenzen", page: `EmailSequences?event_id=${eventId}`, icon: Mail },
    { name: "Scanner", page: `Scanner?event_id=${eventId}`, icon: ScanLine },
  ] : [];

  const topNavItems = [
    { name: "Meine Events", page: "Home", icon: CalendarDays },
    { name: "Gästedaten", page: "GuestData", icon: ClipboardList },
  ];

  if (publicPages.includes(currentPageName)) {
    return <div style={{ background: "#070707", minHeight: "100vh" }}>{children}</div>;
  }

  const currentBase = currentPageName;

  const NavLink = ({ item, onClick }) => {
    const Icon = item.icon;
    const basePage = item.page.split("?")[0];
    const isActive = currentBase === basePage;
    return (
      <Link
        key={item.page}
        to={createPageUrl(item.page)}
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
          isActive
            ? "text-black"
            : "text-[#555] hover:text-white hover:bg-white/5"
        }`}
        style={isActive ? { background: "#beff00" } : {}}
      >
        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-black" : "text-[#555] group-hover:text-[#beff00]"}`} />
        <span>{item.name}</span>
        {isActive && <div className="ml-auto w-1 h-1 rounded-full bg-black" />}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#070707" }}>
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-60 fixed inset-y-0 z-30" style={{ background: "#0a0a0a", borderRight: "1px solid #141414" }}>
        {/* Logo */}
        <div className="p-5 flex items-center gap-3" style={{ borderBottom: "1px solid #141414" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#beff00" }}>
            <Zap className="w-4 h-4 text-black" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-widest uppercase">EventPass</p>
            <p className="text-[10px]" style={{ color: "#444" }}>Ticket & Guestlist System</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {topNavItems.map((item) => <NavLink key={item.page} item={item} />)}

          {eventNavItems.length > 0 && (
            <>
              <div className="pt-4 pb-1 px-3">
                <div className="flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" style={{ color: "#333" }} />
                  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#333" }}>Event</p>
                </div>
              </div>
              {eventNavItems.map((item) => <NavLink key={item.page} item={item} />)}
            </>
          )}
        </nav>

        {eventId && (
          <div className="p-3" style={{ borderTop: "1px solid #141414" }}>
            <Link
              to={createPageUrl(`EventTicketing?event_id=${eventId}`)}
              target="_blank"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ color: "#beff00" }}
            >
              <ClipboardList className="w-4 h-4" />
              Registrierungsseite
            </Link>
          </div>
        )}
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center gap-3" style={{ background: "#0a0a0a", borderBottom: "1px solid #141414" }}>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 -ml-2 text-white">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#beff00" }}>
            <Zap className="w-3.5 h-3.5 text-black" />
          </div>
          <p className="text-sm font-bold text-white tracking-widest uppercase">Synergy</p>
        </div>
      </div>

      {/* Mobile Nav Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }} onClick={() => setMobileOpen(false)}>
          <div className="w-64 h-full shadow-2xl p-3 pt-20 space-y-0.5" style={{ background: "#0a0a0a", borderRight: "1px solid #141414" }} onClick={(e) => e.stopPropagation()}>
            {topNavItems.map((item) => <NavLink key={item.page} item={item} onClick={() => setMobileOpen(false)} />)}
            {eventNavItems.map((item) => <NavLink key={item.page} item={item} onClick={() => setMobileOpen(false)} />)}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-60 mt-14 md:mt-0" style={{ background: "#070707" }}>
        {children}
      </main>
    </div>
  );
}