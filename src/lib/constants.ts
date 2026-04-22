export const APP_NAME = "Manager Poker Deals";
export const APP_DESCRIPTION =
  "El jugador solo tiene que jugar al poker. Manager Poker Deals resuelve todo lo demás.";

export const CURRENCY = {
  code: "USD" as const,
  symbol: "$",
  locale: "en-US" as const,
};

export const PALETTE = {
  black: "#070707",
  gold: "#F0B429",
  white: "#EFEFEF",
} as const;

// Principales salas con servicio de agencia directo.
export const MAIN_ROOMS = [
  { slug: "pokerstars", name: "PokerStars", baseRakeback: 25, mpdRakeback: 30 },
  { slug: "ggpoker", name: "GGPoker", baseRakeback: 30, mpdRakeback: 40 },
  { slug: "888poker", name: "888poker", baseRakeback: 20, mpdRakeback: 27 },
  { slug: "wpt-global", name: "WPT Global", baseRakeback: 35, mpdRakeback: 45 },
  { slug: "ipoker", name: "iPoker Network", baseRakeback: 22, mpdRakeback: 28 },
] as const;

// Otras salas / club con servicio de agencia (perfil avanzado).
export const OTHER_ROOMS = [
  { slug: "clubgg", name: "ClubGG" },
  { slug: "pppoker", name: "PPPoker" },
  { slug: "pokerbros", name: "PokerBros" },
  { slug: "suprema", name: "Suprema Poker" },
  { slug: "x-poker", name: "X-Poker" },
] as const;

export const LEGAL_DISCLAIMER = [
  "Manager Poker Deals (MPD) no organiza partidas de poker ni opera como operador de juego. Actúa como intermediador y agencia de servicios entre el jugador y las salas de poker legalmente licenciadas.",
  "Las estimaciones de rakeback que mostramos son orientativas y dependen del volumen, nivel, promociones activas y condiciones particulares de cada sala.",
  "El poker online implica riesgo económico. Juega con responsabilidad. Si crees que tu juego puede ser un problema, consulta jugarbien.es o el recurso oficial de tu país.",
];

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
    { label: "Calendario", href: "/dashboard/calendario", icon: "Calendar" },
    { label: "Buscar", href: "#search", icon: "Search" },
    { label: "Saldo", href: "/dashboard/balance", icon: "Wallet" },
    { label: "Rakeback", href: "/dashboard/rakeback", icon: "TrendingUp" },
    { label: "Mis Salas", href: "/dashboard/rooms", icon: "Building2" },
    { label: "Status", href: "/dashboard/status", icon: "Shield" },
    { label: "Comunidad", href: "/dashboard/community", icon: "MessagesSquare" },
    { label: "Referidos", href: "/dashboard/referrals", icon: "Users" },
    { label: "Servicios", href: "/dashboard/services", icon: "ShoppingBag" },
    { label: "Cursos", href: "/dashboard/cursos", icon: "GraduationCap" },
    { label: "MPD Staking", href: "/dashboard/staking", icon: "Landmark" },
    { label: "Soporte", href: "/dashboard/support", icon: "LifeBuoy" },
    { label: "Chat MPD", href: "/dashboard/chat", icon: "MessageSquare" },
    { label: "Configuración", href: "/dashboard/settings", icon: "Settings" },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
    { label: "Calendario", href: "/admin/calendario", icon: "Calendar" },
    { label: "Buscar", href: "#search", icon: "Search" },
    { label: "Saldo", href: "/admin/saldos", icon: "Wallet" },
    { label: "Usuarios", href: "/admin/users", icon: "Users" },
    { label: "Rakeback", href: "/admin/rakeback", icon: "TrendingUp" },
    { label: "MPD Staking", href: "/admin/staking", icon: "Landmark" },
    { label: "Pagos USDT", href: "/admin/payments", icon: "Wallet" },
    { label: "Salas", href: "/admin/rooms", icon: "Building2" },
    { label: "Servicios", href: "/admin/services", icon: "ShoppingBag" },
    { label: "Cursos", href: "/admin/cursos", icon: "GraduationCap" },
    { label: "Bancaje", href: "/admin/banking", icon: "Landmark" },
    { label: "Referidos", href: "/admin/referrals", icon: "GitBranch" },
    { label: "Status", href: "/admin/status", icon: "Shield" },
    { label: "Knowledge", href: "/admin/knowledge", icon: "BookOpen" },
    { label: "Soporte", href: "/admin/support", icon: "LifeBuoy" },
    { label: "Notificaciones", href: "/admin/notifications", icon: "Bell" },
    { label: "Bot Interno", href: "/admin/bot", icon: "Bot" },
    { label: "Actividad", href: "/admin/activity", icon: "Activity" },
    {
      label: "Discord Sync",
      href: "/admin/settings/discord",
      icon: "MessageSquare",
      disabled: true,
      tooltip: "Próximamente (FASE 8)",
    },
    { label: "Configuración", href: "/admin/settings", icon: "Settings" },
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
