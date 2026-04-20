export const APP_NAME = "Manager Poker Deal";
export const APP_DESCRIPTION =
  "El jugador solo tiene que jugar al poker. Manager Poker Deal resuelve todo lo demás.";

export const STRATA = {
  NOVATO: { label: "Novato", level: "NL2 - NL10", color: "text-mpd-gray" },
  SEMI_PRO: { label: "Semi-Pro", level: "NL25 - NL50", color: "text-mpd-amber" },
  PROFESIONAL: { label: "Profesional", level: "NL100 - NL200", color: "text-mpd-gold" },
  REFERENTE: { label: "Referente", level: "NL500+", color: "text-mpd-green" },
} as const;

export const STRATUM_THRESHOLDS = {
  NOVATO: 0,
  SEMI_PRO: 500,
  PROFESIONAL: 2000,
  REFERENTE: 10000,
} as const;

export const NAVIGATION = {
  dashboard: [
    { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "Rakeback", href: "/dashboard/rakeback", icon: "TrendingUp" },
    { label: "Saldo", href: "/dashboard/balance", icon: "Wallet" },
    { label: "Mis Salas", href: "/dashboard/rooms", icon: "Building2" },
    { label: "Referidos", href: "/dashboard/referrals", icon: "Users" },
    { label: "Servicios", href: "/dashboard/services", icon: "ShoppingBag" },
    { label: "Cursos", href: "/dashboard/cursos", icon: "GraduationCap" },
    { label: "Streaming", href: "/dashboard/streaming", icon: "Radio" },
    { label: "Logros", href: "/dashboard/achievements", icon: "Trophy" },
    { label: "Comunidad", href: "/dashboard/community", icon: "MessagesSquare" },
    { label: "MPD Staking", href: "/dashboard/staking", icon: "Landmark" },
    { label: "Ranking", href: "/dashboard/leaderboard", icon: "Medal" },
    { label: "Soporte", href: "/dashboard/support", icon: "LifeBuoy" },
    { label: "Chat Bot", href: "/dashboard/chat", icon: "MessageSquare" },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
    { label: "Usuarios", href: "/admin/users", icon: "Users" },
    { label: "Rakeback", href: "/admin/rakeback", icon: "TrendingUp" },
    { label: "Salas", href: "/admin/rooms", icon: "Building2" },
    { label: "Servicios", href: "/admin/services", icon: "ShoppingBag" },
    { label: "Cursos", href: "/admin/courses", icon: "GraduationCap" },
    { label: "Bancaje", href: "/admin/staking", icon: "Landmark" },
    { label: "Referidos", href: "/admin/referrals", icon: "GitBranch" },
    { label: "Saldo", href: "/admin/saldos", icon: "Wallet" },
    { label: "Logros", href: "/admin/achievements", icon: "Trophy" },
    { label: "Knowledge Base", href: "/admin/knowledge", icon: "BookOpen" },
    { label: "Soporte", href: "/admin/support", icon: "LifeBuoy" },
    { label: "Notificaciones", href: "/admin/notifications", icon: "Bell" },
    { label: "Bot Interno", href: "/admin/bot", icon: "Bot" },
    { label: "Actividad", href: "/admin/activity", icon: "Activity" },
    { label: "Configuración", href: "/admin/settings", icon: "Settings" },
    { label: "Discord Sync", href: "/admin/settings/discord", icon: "MessageSquare" },
  ],
} as const;

export const TICKET_CATEGORIES = [
  { value: "ROOM_SETUP", label: "Alta en sala" },
  { value: "RAKEBACK", label: "Rakeback" },
  { value: "VPN", label: "VPN" },
  { value: "BILLING", label: "Facturación / Saldo" },
  { value: "OTHER", label: "Otros" },
] as const;

export const SERVICE_CATEGORIES = [
  { value: "VPN", label: "VPN" },
  { value: "DATAMINING", label: "Datamining" },
  { value: "TOOLS", label: "Herramientas" },
  { value: "COACHING", label: "Coaching" },
  { value: "OTHER", label: "Otros" },
] as const;
