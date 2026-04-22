"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, formatCurrency, getStatusGalon } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/shared/Logo";
import {
  LayoutDashboard, TrendingUp, Wallet, Building2, Users, ShoppingBag,
  GraduationCap, Trophy, Medal, LifeBuoy, MessageSquare, MessagesSquare, Settings,
  GitBranch, BookOpen, Bell, Bot, Activity, Landmark, Radio, ChevronLeft,
  ChevronRight, LogOut, Menu, X, Shield,
} from "lucide-react";
import { logoutUser } from "@/lib/actions/auth";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, TrendingUp, Wallet, Building2, Users, ShoppingBag,
  GraduationCap, Trophy, Medal, LifeBuoy, MessageSquare, MessagesSquare, Settings,
  GitBranch, BookOpen, Bell, Bot, Activity, Landmark, Radio, Shield,
};

interface NavItem {
  label: string;
  href: string;
  icon: string;
  disabled?: boolean;
  tooltip?: string;
}

interface SidebarProps {
  items: readonly NavItem[];
  user: {
    name: string;
    avatar?: string | null;
    stratum?: string;
    statusLevel?: string;
    prestigeScore?: number;
    reputationScore?: number;
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

  const galon = user.statusLevel ? getStatusGalon(user.statusLevel) : null;

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
        {/* Header — cuadro amarillo con logo MPD */}
        <div
          className={cn(
            "relative flex items-center border-b border-mpd-border bg-mpd-gold",
            collapsed ? "h-16 justify-center px-2" : "h-20 justify-between px-4"
          )}
        >
          {!collapsed ? (
            <Link href={type === "admin" ? "/admin" : "/dashboard"} className="flex items-center gap-2 min-w-0">
              <Logo size="sm" inverted />
              {type === "admin" && (
                <Badge variant="outline" className="text-[10px] border-mpd-black/40 text-mpd-black">
                  Admin
                </Badge>
              )}
            </Link>
          ) : (
            <Link href={type === "admin" ? "/admin" : "/dashboard"} aria-label="MPD">
              <div className="h-8 w-8 rounded-md bg-mpd-black/10 flex items-center justify-center text-mpd-black font-bold text-xs tracking-tight">
                MPD
              </div>
            </Link>
          )}
          <button
            onClick={() => {
              setCollapsed(!collapsed);
              setMobileOpen(false);
            }}
            className="hidden lg:flex p-1 rounded text-mpd-black/70 hover:text-mpd-black"
            aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 rounded text-mpd-black/70 hover:text-mpd-black"
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
                {galon && (
                  <p className={cn("text-[11px] mt-0.5 truncate", galon.color)}>
                    Galón — {galon.tier} / Nivel {galon.nivel}
                  </p>
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

            if (item.disabled) {
              return (
                <div
                  key={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-0.5 cursor-not-allowed text-mpd-gray/50",
                    collapsed && "justify-center px-2"
                  )}
                  title={item.tooltip ?? "Próximamente"}
                  aria-disabled="true"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                        Próx.
                      </Badge>
                    </>
                  )}
                </div>
              );
            }

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
          {type === "dashboard" && (user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-mpd-amber hover:text-mpd-gold hover:bg-mpd-gold/10 transition-colors mb-1",
                collapsed && "justify-center px-2"
              )}
            >
              <Shield className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Panel Admin</span>}
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
