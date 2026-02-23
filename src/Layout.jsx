import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
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
  BarChart3,
} from "lucide-react";

const publicPages = ["Register", "OrganizerRegistration", "Ticket", "Landing", "EventDetails", "EventTicketing", "RegistrationSuccess", "Login", "Verify", "Verified"];

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (err) {
        return null;
      }
    },
    retry: false,
  });

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event_id");

  // Admin nav items
  const adminNavItems = [
    { name: "Dashboard", page: "AdminDashboard", icon: LayoutDashboard },
    { name: "Veranstalter", page: "AdminOrganizers", icon: Users },
    { name: "Events", page: "AdminEvents", icon: CalendarDays },
    { name: "Gäste", page: "AdminGuests", icon: ClipboardList },
  ];

  // Organizer event nav items
  const eventNavItems = eventId ? [
    { name: "Dashboard", page: `Dashboard?event_id=${eventId}`, icon: LayoutDashboard },
    { name: "Veranstaltungsinfos", page: `EventInfo?event_id=${eventId}`, icon: CalendarDays },
    { name: "Ticketing", page: `TicketManagement?event_id=${eventId}`, icon: Ticket },
    { name: "Gästeliste", page: `GuestList?event_id=${eventId}`, icon: Users },
    { name: "Gästedaten", page: `GuestData?event_id=${eventId}`, icon: ClipboardList },
    { name: "Marketing", page: `Marketing?event_id=${eventId}`, icon: Megaphone },
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

  // Show layout only if user is logged in
  if (userLoading) {
    return <div style={{ background: "#070707", minHeight: "100vh" }}>{children}</div>;
  }

  if (!user) {
    return <div style={{ background: "#070707", minHeight: "100vh" }}>{children}</div>;
  }

  const isAdminArea = currentPageName && currentPageName.startsWith("Admin");
  const isAdminUser = user?.role === 'admin';
  const isOrganizerUser = user?.role === 'user' && user?.account_type === 'organizer';
  const currentBase = currentPageName;

  // Debug info (temporary)
  if (user && process.env.NODE_ENV === 'development') {
    console.log(`[Auth Debug] email=${user.email} role=${user.role} account_type=${user.account_type} page=${currentPageName}`);
  }

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
            <p className="text-sm font-bold text-white tracking-widest uppercase">Synergy</p>
            <p className="text-[10px]" style={{ color: "#444" }}>Guestlist Platform</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {isAdminArea ? (
            adminNavItems.map((item) => <NavLink key={item.page} item={item} />)
          ) : (
            <>
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
            </>
          )}
        </nav>

        {/* Admin logout / back button */}
        {isAdminArea && (
          <div className="p-3" style={{ borderTop: "1px solid #141414" }}>
            <button
              onClick={() => base44.auth.logout()}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ color: "#beff00" }}
            >
              <X className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}

        {/* Organizer links */}
        {!isAdminArea && eventId && (
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