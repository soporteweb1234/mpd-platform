"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, formatCurrency, getStratumLabel } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, TrendingUp, Wallet, Building2, Users, ShoppingBag,
  GraduationCap, Trophy, Medal, LifeBuoy, MessageSquare, MessagesSquare, Settings,
  GitBranch, BookOpen, Bell, Bot, Activity, Landmark, ChevronLeft,
  ChevronRight, LogOut, Menu, X,
} from "lucide-react";
import { logoutUser } from "@/lib/actions/auth";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, TrendingUp, Wallet, Building2, Users, ShoppingBag,
  GraduationCap, Trophy, Medal, LifeBuoy, MessageSquare, MessagesSquare, Settings,
  GitBranch, BookOpen, Bell, Bot, Activity, Landmark,
};

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface SidebarProps {
  items: readonly NavItem[];
  user: {
    name: string;
    avatar?: string | null;
    stratum?: string;
    availableBalance?: number;
    role?: string;
  };
  type: "dashboard" | "admin";
}

export function Sidebar({ items, user, type }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-mpd-surface border border-mpd-border text-mpd-white"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen bg-mpd-surface border-r border-mpd-border flex flex-col transition-all duration-300",
          collapsed ? "w-[72px]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className={cn("flex items-center h-16 px-4 border-b border-mpd-border", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && (
            <Link href={type === "admin" ? "/admin" : "/dashboard"} className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-mpd-gold flex items-center justify-center text-mpd-black font-bold text-sm">
                M
              </div>
              <span className="font-semibold text-mpd-white">MPD</span>
              {type === "admin" && <Badge variant="warning" className="text-[10px]">Admin</Badge>}
            </Link>
          )}
          {collapsed && (
            <div className="h-8 w-8 rounded-lg bg-mpd-gold flex items-center justify-center text-mpd-black font-bold text-sm">
              M
            </div>
          )}
          <button
            onClick={() => {
              setCollapsed(!collapsed);
              setMobileOpen(false);
            }}
            className="hidden lg:flex p-1 rounded text-mpd-gray hover:text-mpd-white"
            aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 rounded text-mpd-gray hover:text-mpd-white"
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User info */}
        {!collapsed && (
          <div className="p-4 border-b border-mpd-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-mpd-white truncate">{user.name}</p>
                {user.stratum && (
                  <Badge variant="outline" className="text-[10px] mt-0.5">
                    {getStratumLabel(user.stratum)}
                  </Badge>
                )}
              </div>
            </div>
            {type === "dashboard" && user.availableBalance !== undefined && (
              <div className="mt-3 p-2 rounded-lg bg-mpd-black/50">
                <p className="text-[10px] text-mpd-gray uppercase tracking-wider">Saldo disponible</p>
                <p className="text-sm font-mono font-semibold text-mpd-green">
                  {formatCurrency(user.availableBalance)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {items.map((item) => {
            const Icon = iconMap[item.icon] || LayoutDashboard;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5",
                  isActive
                    ? "bg-mpd-gold/10 text-mpd-gold border border-mpd-gold/20"
                    : "text-mpd-gray hover:text-mpd-white hover:bg-mpd-surface-hover",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-mpd-border">
          {type === "dashboard" && (
            <Link
              href="/dashboard/settings"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-mpd-gray hover:text-mpd-white hover:bg-mpd-surface-hover transition-colors mb-1",
                collapsed && "justify-center px-2"
              )}
            >
              <Settings className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Configuración</span>}
            </Link>
          )}
          <form action={logoutUser}>
            <button
              type="submit"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-mpd-gray hover:text-mpd-red hover:bg-mpd-red/10 transition-colors w-full",
                collapsed && "justify-center px-2"
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Cerrar sesión</span>}
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
