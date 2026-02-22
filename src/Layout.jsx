import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import {
  LayoutDashboard,
  Users,
  ScanLine,
  Settings,
  ClipboardList,
  Menu,
  X,
  Ticket,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", page: "Dashboard", icon: LayoutDashboard },
  { name: "Gästeliste", page: "GuestList", icon: Users },
  { name: "Scanner", page: "Scanner", icon: ScanLine },
  { name: "Einstellungen", page: "Settings", icon: Settings },
];

const publicPages = ["Register", "Ticket"];

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Public pages: no nav
  if (publicPages.includes(currentPageName)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 fixed inset-y-0 z-30">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 tracking-tight">Ticket Manager</p>
              <p className="text-xs text-slate-400">Gästeverwaltung</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-amber-400" : ""}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <Link
            to={createPageUrl("Register")}
            target="_blank"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 transition-all"
          >
            <ClipboardList className="w-5 h-5" />
            Registrierungsseite
          </Link>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-100 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
            <Ticket className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-sm font-bold text-slate-900">Ticket Manager</p>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 -mr-2">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Nav Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="bg-white w-72 h-full shadow-xl p-4 pt-20 space-y-1" onClick={(e) => e.stopPropagation()}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-amber-400" : ""}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 mt-14 md:mt-0">
        {children}
      </main>
    </div>
  );
}