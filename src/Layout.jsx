import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Menu, X, Zap } from "lucide-react";

const publicPages = ["Register", "Ticket", "EventDetails", "EventTicketing", "RegistrationSuccess"];

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Show simple layout only for public pages
  if (publicPages.includes(currentPageName)) {
    return <div style={{ background: "#070707", minHeight: "100vh" }}>{children}</div>;
  }

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
            <p className="text-[10px]" style={{ color: "#444" }}>Ticketing</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {/* Organizer menu items */}
          <Link
            to={createPageUrl("Dashboard?event_id=default")}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ color: "#beff00" }}
          >
            📊 Event Dashboard
          </Link>
        </nav>
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
            <Link
              to={createPageUrl("Dashboard?event_id=default")}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ color: "#beff00" }}
            >
              📊 Event Dashboard
            </Link>
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