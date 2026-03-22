# PROMPT PARA CLAUDE CODE — PLATAFORMA COMPLETA MPD (Manager Poker Deal)

> **INSTRUCCIÓN:** Este prompt es para Claude Code operando con `--dangerously-skip-permissions` sobre un repositorio Next.js ya inicializado. Lee el CLAUDE.md del proyecto primero. Edita el repositorio existente y conviértelo en la plataforma completa. No crees un proyecto nuevo — trabaja sobre el que ya existe. Si algo no está suficientemente detallado aquí, toma las mejores decisiones de arquitectura como senior fullstack engineer y documéntalas en comentarios.

---

## 1. VISIÓN GENERAL DEL PROYECTO

Manager Poker Deal (MPD) es un **ecosistema cerrado de asesoría integral para jugadores de poker online hispanohablantes**. NO es una landing page — es una plataforma completa con:

- **Panel del jugador** (dashboard personal con rakeback, saldo, referidos, progreso)
- **Panel de administración** (gestión completa de jugadores, rakeback, referidos, contenido, bots)
- **Sistema de autenticación** con roles y estratos
- **Sistema de saldo interno** (crédito canjeable por servicios)
- **Sistema de referidos** multinivel
- **Calculadora de rakeback** interactiva
- **Sistema de bots** (FAQ público + bot interno privado)
- **Integración con Discord** (roles, notificaciones, login vinculado)
- **Sistema de gamificación** (puntos, logros, ranking)
- **Gestión de servicios** (VPN, datamining, herramientas, cursos, bancaje)

**Propuesta de valor:** "El jugador solo tiene que jugar al poker. Manager Poker Deal resuelve todo lo demás."

**La marca opera sin figura pública visible — su identidad es la entidad, no el fundador.**

---

## 2. STACK TÉCNICO OBLIGATORIO

```
Framework:        Next.js 14+ (App Router, Server Components, Server Actions)
Auth:             NextAuth.js v5 (Auth.js) con credentials + Discord OAuth
Base de datos:    Supabase (PostgreSQL) con Prisma ORM
Realtime:         Supabase Realtime (suscripciones a cambios)
Storage:          Supabase Storage (avatares, documentos)
Styling:          Tailwind CSS 4 con CSS variables para el brand
Componentes UI:   shadcn/ui customizado con paleta MPD
Animaciones:      Framer Motion
Iconos:           Lucide React
State:            Zustand (client state) + React Query / TanStack Query (server state)
Forms:            React Hook Form + Zod (validación)
Email:            Resend (transaccional)
Charts:           Recharts (gráficas en dashboard)
Tables:           TanStack Table (tablas de datos en admin)
Deploy:           Vercel
Bot FAQ:          AI SDK de Vercel + Anthropic Claude API (RAG con knowledge base)
Discord:          discord.js para el bot + Discord OAuth para login
```

---

## 3. PALETA CORPORATIVA Y DESIGN SYSTEM

### Colores (configurar como CSS variables y en tailwind.config)

```css
:root {
  --mpd-black: #0D1117;        /* Fondo principal */
  --mpd-surface: #161B22;      /* Cards, superficies elevadas */
  --mpd-surface-hover: #1C2128; /* Hover en superficies */
  --mpd-border: #30363D;       /* Bordes */
  --mpd-border-light: #3D444D; /* Bordes hover */
  --mpd-gold: #C9A84C;         /* Acento principal, CTAs, premium */
  --mpd-gold-light: #D4B85A;   /* Gold hover */
  --mpd-gold-dark: #A88B3D;    /* Gold pressed */
  --mpd-green: #00C875;        /* Ganancias, positivo, disponible */
  --mpd-green-dark: #00A35E;   /* Green hover */
  --mpd-amber: #FF9500;        /* Pendiente, alerta, próximamente */
  --mpd-red: #F85149;          /* Error, pérdida, danger */
  --mpd-white: #E6EDF3;        /* Texto principal */
  --mpd-gray: #8B949E;         /* Texto secundario */
  --mpd-gray-dark: #656D76;    /* Texto terciario */
}
```

### Tipografía

- **Display/Headings:** Satoshi o Cabinet Grotesk (Google Fonts / Fontsource) — NUNCA Inter, Arial, Roboto
- **Body:** Plus Jakarta Sans
- **Monospace (cifras, datos financieros):** JetBrains Mono
- **Tamaños:** Sistema fluid con `clamp()` para todos los headings

### Estética

- **Dark luxury fintech.** Paneles de trading cripto premium, NO casino.
- Cards con glass-morphism sutil, bordes gradient, glow effects
- Animaciones con propósito: staggered reveals, counters animados, hover elevations
- Iconografía Lucide, línea fina, minimal

---

## 4. ESQUEMA DE BASE DE DATOS (Prisma Schema)

Crea el schema de Prisma completo con TODOS estos modelos. Usa las mejores prácticas: soft deletes, timestamps, índices apropiados, enums, relaciones bien definidas.

### 4.1 — Usuarios y Autenticación

```prisma
enum UserRole {
  PLAYER          // Jugador normal
  SUBAGENT        // Subagente/referidor activo
  MODERATOR       // Moderador de comunidad
  ANALYST         // Analista de datos
  TEACHER         // Profesor de cursos
  ADMIN           // Administrador (fundador)
  SUPER_ADMIN     // Super admin técnico
}

enum PlayerStratum {
  NOVATO          // NL2 - NL10
  SEMI_PRO        // NL25 - NL50
  PROFESIONAL     // NL100 - NL200
  REFERENTE       // NL500+
}

enum UserStatus {
  PENDING         // Registro incompleto
  ACTIVE          // Activo
  SUSPENDED       // Suspendido temporalmente
  BANNED          // Baneado permanente
  INACTIVE        // Inactivo por >60 días sin actividad
}

model User {
  id                String          @id @default(cuid())
  email             String          @unique
  password          String          // Hash bcrypt
  name              String
  nickname          String?         @unique
  avatar            String?         // URL en Supabase Storage
  role              UserRole        @default(PLAYER)
  stratum           PlayerStratum   @default(NOVATO)
  status            UserStatus      @default(PENDING)
  
  // Discord
  discordId         String?         @unique
  discordUsername   String?
  discordConnected  Boolean         @default(false)
  
  // Onboarding (3 pasos progresivos)
  onboardingStep    Int             @default(0) // 0=no iniciado, 1,2,3=pasos, 4=completo
  country           String?
  playingLevel      String?         // NL level actual
  weeklyHours       Float?
  primaryRoom       String?         // Sala principal
  secondaryRooms    String[]        // Otras salas
  goals             String[]        // Objetivos del jugador
  
  // Datos del jugador
  totalRakeback      Float          @default(0)
  availableBalance   Float          @default(0) // Saldo interno disponible
  pendingBalance     Float          @default(0) // Saldo pendiente de liquidar
  lifetimeEarnings   Float          @default(0) // Total histórico ganado
  
  // Gamificación
  points             Int            @default(0)
  level              Int            @default(1)
  
  // Referidos
  referredById       String?
  referredBy         User?           @relation("Referrals", fields: [referredById], references: [id])
  referrals          User[]          @relation("Referrals")
  referralCode       String          @unique @default(cuid())
  
  // Timestamps
  lastLoginAt        DateTime?
  lastActiveAt       DateTime?
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt
  deletedAt          DateTime?       // Soft delete
  
  // Relaciones
  rakebackRecords    RakebackRecord[]
  balanceTransactions BalanceTransaction[]
  roomAffiliations   RoomAffiliation[]
  serviceOrders      ServiceOrder[]
  courseEnrollments   CourseEnrollment[]
  stakingDeals       StakingDeal[]
  achievements       UserAchievement[]
  notifications      Notification[]
  supportTickets     SupportTicket[]
  activityLogs       ActivityLog[]
  chatMessages       ChatMessage[]
}
```

### 4.2 — Salas de Poker y Afiliación

```prisma
enum RoomStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

model PokerRoom {
  id                String       @id @default(cuid())
  name              String       @unique // PokerStars, GGPoker, 888poker, WPT Global, etc
  slug              String       @unique
  logo              String?      // URL
  website           String?
  affiliateCode     String       // Código de afiliación MPD
  rakebackBase      Float        // % base de rakeback
  rakebackPremium   Float?       // % premium negociado por MPD
  description       String?
  setupGuide        String?      @db.Text // Guía de alta paso a paso (markdown)
  vpnRequired       Boolean      @default(false)
  vpnInstructions   String?      @db.Text
  countriesAllowed  String[]     // Códigos ISO de países permitidos
  countriesBlocked  String[]     // Códigos ISO de países bloqueados
  status            RoomStatus   @default(ACTIVE)
  sortOrder         Int          @default(0)
  
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  
  affiliations      RoomAffiliation[]
  rakebackRecords   RakebackRecord[]
  rakebackTiers     RakebackTier[]
}

model RakebackTier {
  id                String       @id @default(cuid())
  roomId            String
  room              PokerRoom    @relation(fields: [roomId], references: [id])
  stratum           PlayerStratum
  rakebackPercent   Float        // % de rakeback para este estrato en esta sala
  description       String?
  
  @@unique([roomId, stratum])
}

model RoomAffiliation {
  id                String       @id @default(cuid())
  userId            String
  user              User         @relation(fields: [userId], references: [id])
  roomId            String
  room              PokerRoom    @relation(fields: [roomId], references: [id])
  
  playerRoomId      String?      // ID del jugador en la sala
  affiliatedAt      DateTime     @default(now())
  verified          Boolean      @default(false)
  verifiedAt        DateTime?
  isPrimary         Boolean      @default(false)
  status            String       @default("ACTIVE") // ACTIVE, PENDING_VERIFICATION, INACTIVE
  notes             String?
  
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  
  @@unique([userId, roomId])
}
```

### 4.3 — Rakeback y Saldo Interno

```prisma
enum RakebackStatus {
  PENDING           // Cargado pero no liquidado
  AVAILABLE         // Disponible como saldo interno
  REDEEMED          // Canjeado por servicio
  WITHDRAWN         // Retirado del ecosistema
  EXPIRED           // Expirado por inactividad
}

model RakebackRecord {
  id                String          @id @default(cuid())
  userId            String
  user              User            @relation(fields: [userId], references: [id])
  roomId            String
  room              PokerRoom       @relation(fields: [roomId], references: [id])
  
  period            String          // "2026-03-01" formato de quincena
  periodStart       DateTime
  periodEnd         DateTime
  rakeGenerated     Float           // Rake total generado por el jugador
  rakebackPercent   Float           // % aplicado
  rakebackAmount    Float           // Cantidad de rakeback en EUR
  status            RakebackStatus  @default(PENDING)
  
  loadedBy          String?         // Admin que cargó el dato
  loadedAt          DateTime?
  notes             String?
  
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
}

enum TransactionType {
  RAKEBACK_CREDIT       // Abono de rakeback
  SERVICE_PURCHASE      // Compra de servicio
  COURSE_PURCHASE       // Compra de curso
  REFERRAL_COMMISSION   // Comisión por referido
  STAKING_PROFIT        // Ganancia de bancaje
  STAKING_LOSS          // Pérdida de bancaje
  MANUAL_ADJUSTMENT     // Ajuste manual por admin
  WITHDRAWAL            // Retiro
  BONUS                 // Bonus/drop sorpresa
  POINTS_REWARD         // Recompensa por puntos
}

model BalanceTransaction {
  id                String            @id @default(cuid())
  userId            String
  user              User              @relation(fields: [userId], references: [id])
  
  type              TransactionType
  amount            Float             // Positivo = ingreso, Negativo = gasto
  balanceBefore     Float
  balanceAfter      Float
  description       String
  referenceId       String?           // ID del rakeback/servicio/curso relacionado
  referenceType     String?           // "RAKEBACK", "SERVICE", "COURSE", etc
  
  createdBy         String?           // Admin/sistema que creó la transacción
  createdAt         DateTime          @default(now())
}
```

### 4.4 — Servicios y Productos

```prisma
enum ServiceCategory {
  VPN
  DATAMINING
  TOOLS           // HUDs, solvers, etc
  COACHING
  OTHER
}

enum ServiceStatus {
  AVAILABLE
  COMING_SOON
  DISCONTINUED
}

model Service {
  id                String            @id @default(cuid())
  name              String
  slug              String            @unique
  category          ServiceCategory
  description       String            @db.Text
  shortDescription  String
  icon              String?           // Nombre del icono Lucide
  
  priceEur          Float
  priceInBalance    Float?            // Precio en saldo interno (puede ser distinto)
  isRecurring       Boolean           @default(false)
  recurringPeriod   String?           // "MONTHLY", "QUARTERLY", "YEARLY"
  
  status            ServiceStatus     @default(AVAILABLE)
  requiredStratum   PlayerStratum?    // Estrato mínimo para acceder
  sortOrder         Int               @default(0)
  
  features          String[]          // Lista de features/beneficios
  setupInstructions String?           @db.Text // Instrucciones post-compra (markdown)
  
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  orders            ServiceOrder[]
}

enum OrderStatus {
  PENDING
  CONFIRMED
  DELIVERED
  CANCELLED
  REFUNDED
}

model ServiceOrder {
  id                String         @id @default(cuid())
  userId            String
  user              User           @relation(fields: [userId], references: [id])
  serviceId         String
  service           Service        @relation(fields: [serviceId], references: [id])
  
  amount            Float
  paidWithBalance   Boolean        @default(true)
  status            OrderStatus    @default(PENDING)
  
  notes             String?
  deliveredAt       DateTime?
  
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
}
```

### 4.5 — Cursos Trimestrales

```prisma
enum CourseStatus {
  DRAFT
  OPEN_ENROLLMENT
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model Course {
  id                String          @id @default(cuid())
  title             String
  slug              String          @unique
  description       String          @db.Text
  teacherId         String?         // User con role TEACHER
  
  priceEur          Float           // 150 EUR base
  priceWithAffiliation Float?       // Precio escalonado según afiliación
  maxStudents       Int             @default(12)
  durationWeeks     Int             @default(12) // 3 meses
  trialWeeks        Int             @default(2)
  
  startDate         DateTime?
  endDate           DateTime?
  schedule          String?         // "Martes y Jueves 20:00 CET"
  
  status            CourseStatus    @default(DRAFT)
  requiredStratum   PlayerStratum?
  requiresAffiliation Boolean       @default(true) // Obligatorio estar afiliado
  
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  
  enrollments       CourseEnrollment[]
  lessons           CourseLesson[]
}

model CourseLesson {
  id                String       @id @default(cuid())
  courseId           String
  course            Course       @relation(fields: [courseId], references: [id])
  
  title             String
  description       String?
  lessonNumber      Int
  scheduledAt       DateTime?
  recordingUrl      String?      // URL de grabación
  materials         String[]     // URLs de materiales
  
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
}

enum EnrollmentStatus {
  ENROLLED
  TRIAL
  COMPLETED
  DROPPED
  EXPELLED
}

model CourseEnrollment {
  id                String            @id @default(cuid())
  userId            String
  user              User              @relation(fields: [userId], references: [id])
  courseId           String
  course            Course            @relation(fields: [courseId], references: [id])
  
  status            EnrollmentStatus  @default(TRIAL)
  paidAmount        Float
  paidWithBalance   Boolean           @default(false)
  enrolledAt        DateTime          @default(now())
  completedAt       DateTime?
  
  rakeGeneratedDuringCourse Float     @default(0) // Para competición entre alumnos
  
  @@unique([userId, courseId])
}
```

### 4.6 — Bancaje (Staking)

```prisma
enum StakingStatus {
  PROPOSED        // Propuesto, pendiente de aprobación
  ACTIVE          // En curso
  SETTLED         // Liquidado
  CANCELLED       // Cancelado
  DEFAULTED       // Incumplimiento
}

model StakingDeal {
  id                    String          @id @default(cuid())
  userId                String
  user                  User            @relation(fields: [userId], references: [id])
  
  totalBankroll         Float           // Bankroll total
  mpdContribution       Float           // 50% aportado por MPD
  playerContribution    Float           // 50% aportado por jugador
  profitSplitMpd        Float           @default(35) // % de ganancias para MPD
  profitSplitPlayer     Float           @default(65) // % de ganancias para jugador
  
  status                StakingStatus   @default(PROPOSED)
  startDate             DateTime?
  endDate               DateTime?
  
  // Makeup tracking
  currentMakeup         Float           @default(0) // Pérdidas acumuladas pendientes
  totalProfit           Float           @default(0) // Ganancias netas totales
  totalLoss             Float           @default(0) // Pérdidas totales
  
  notes                 String?         @db.Text
  
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt
  
  periods               StakingPeriod[]
}

model StakingPeriod {
  id                String       @id @default(cuid())
  dealId            String
  deal              StakingDeal  @relation(fields: [dealId], references: [id])
  
  periodStart       DateTime
  periodEnd         DateTime
  profitLoss        Float        // + ganancia, - pérdida
  makeupBefore      Float
  makeupAfter       Float
  mpdShare          Float        // Lo que recibe/pierde MPD
  playerShare       Float        // Lo que recibe/pierde jugador
  
  notes             String?
  createdAt         DateTime     @default(now())
}
```

### 4.7 — Gamificación

```prisma
model Achievement {
  id                String            @id @default(cuid())
  slug              String            @unique
  name              String
  description       String
  icon              String            // Emoji o URL de icono
  category          String            // "RAKEBACK", "COMMUNITY", "LOYALTY", "SKILLS"
  pointsAwarded     Int               @default(0)
  requiredValue     Float?            // Valor numérico requerido (ej: 1000 EUR rakeback)
  isSecret          Boolean           @default(false)
  sortOrder         Int               @default(0)
  
  createdAt         DateTime          @default(now())
  
  users             UserAchievement[]
}

model UserAchievement {
  id                String       @id @default(cuid())
  userId            String
  user              User         @relation(fields: [userId], references: [id])
  achievementId     String
  achievement       Achievement  @relation(fields: [achievementId], references: [id])
  
  unlockedAt        DateTime     @default(now())
  
  @@unique([userId, achievementId])
}

model LeaderboardEntry {
  id                String       @id @default(cuid())
  userId            String
  period            String       // "2026-03" formato mes
  category          String       // "RAKEBACK", "POINTS", "REFERRALS"
  value             Float
  rank              Int?
  
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  
  @@unique([userId, period, category])
}
```

### 4.8 — Soporte y Comunicación

```prisma
enum TicketStatus {
  OPEN
  IN_PROGRESS
  WAITING_USER
  RESOLVED
  CLOSED
}

enum TicketPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

model SupportTicket {
  id                String          @id @default(cuid())
  userId            String
  user              User            @relation(fields: [userId], references: [id])
  
  subject           String
  category          String          // "ROOM_SETUP", "RAKEBACK", "VPN", "BILLING", "OTHER"
  priority          TicketPriority  @default(MEDIUM)
  status            TicketStatus    @default(OPEN)
  
  assignedTo        String?         // Admin ID
  resolvedAt        DateTime?
  
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  
  messages          TicketMessage[]
}

model TicketMessage {
  id                String        @id @default(cuid())
  ticketId          String
  ticket            SupportTicket @relation(fields: [ticketId], references: [id])
  
  senderId          String        // User ID (jugador o admin)
  senderRole        String        // "PLAYER" o "ADMIN"
  content           String        @db.Text
  attachments       String[]      // URLs
  
  createdAt         DateTime      @default(now())
}

model Notification {
  id                String       @id @default(cuid())
  userId            String
  user              User         @relation(fields: [userId], references: [id])
  
  type              String       // "RAKEBACK", "BALANCE", "COURSE", "ACHIEVEMENT", "SYSTEM", "DROP"
  title             String
  message           String
  link              String?      // URL interna para navegar
  read              Boolean      @default(false)
  readAt            DateTime?
  
  createdAt         DateTime     @default(now())
}
```

### 4.9 — Bot y Knowledge Base

```prisma
model KnowledgeArticle {
  id                String       @id @default(cuid())
  title             String
  slug              String       @unique
  content           String       @db.Text  // Markdown
  category          String       // "FAQ", "ROOM_SETUP", "VPN", "TOOLS", "GENERAL"
  isPublic          Boolean      @default(true) // Público (bot FAQ) o privado (bot interno)
  tags              String[]
  sortOrder         Int          @default(0)
  
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
}

model ChatMessage {
  id                String       @id @default(cuid())
  userId            String
  user              User         @relation(fields: [userId], references: [id])
  
  botType           String       // "FAQ", "INTERNAL", "LEARNING"
  role              String       // "user", "assistant"
  content           String       @db.Text
  metadata          Json?        // Datos adicionales (artículos referenciados, etc)
  
  createdAt         DateTime     @default(now())
}
```

### 4.10 — Actividad y Auditoría

```prisma
model ActivityLog {
  id                String       @id @default(cuid())
  userId            String?
  user              User?        @relation(fields: [userId], references: [id])
  
  action            String       // "LOGIN", "RAKEBACK_LOADED", "SERVICE_PURCHASED", etc
  entityType        String?      // "USER", "RAKEBACK", "SERVICE", etc
  entityId          String?
  details           Json?        // Datos adicionales
  ipAddress         String?
  
  createdAt         DateTime     @default(now())
}

model SystemSetting {
  id                String       @id @default(cuid())
  key               String       @unique
  value             String       @db.Text
  description       String?
  category          String       @default("GENERAL")
  
  updatedBy         String?
  updatedAt         DateTime     @updatedAt
}
```

---

## 5. SISTEMA DE AUTENTICACIÓN Y ROLES

### 5.1 — Auth con NextAuth.js v5

Implementa autenticación completa con:

- **Credentials provider:** Email + password con bcrypt
- **Discord OAuth provider:** Login con Discord, vincular cuenta existente
- **Sesiones JWT** con datos del usuario embedidos (id, role, stratum, discordId)
- **Middleware de protección** de rutas por rol

### 5.2 — Matriz de permisos por rol

```
RUTA / ACCIÓN                    | PLAYER | SUBAGENT | MODERATOR | ANALYST | TEACHER | ADMIN | SUPER_ADMIN
──────────────────────────────── | ────── | ──────── | ───────── | ─────── | ─────── | ───── | ───────────
Ver dashboard propio             | ✅     | ✅       | ✅        | ✅      | ✅      | ✅    | ✅
Ver su rakeback                  | ✅     | ✅       | ✅        | ✅      | ✅      | ✅    | ✅
Ver sus referidos                | ✅     | ✅       | ❌        | ❌      | ❌      | ✅    | ✅
Calculadora rakeback             | ✅     | ✅       | ✅        | ✅      | ✅      | ✅    | ✅
Comprar servicios con saldo      | ✅     | ✅       | ✅        | ❌      | ❌      | ✅    | ✅
Chat bot FAQ                     | ✅     | ✅       | ✅        | ✅      | ✅      | ✅    | ✅
Crear tickets de soporte         | ✅     | ✅       | ✅        | ✅      | ✅      | ✅    | ✅
──────────────────────────────── | ────── | ──────── | ───────── | ─────── | ─────── | ───── | ───────────
Ver panel de referidos extendido | ❌     | ✅       | ❌        | ❌      | ❌      | ✅    | ✅
──────────────────────────────── | ────── | ──────── | ───────── | ─────── | ─────── | ───── | ───────────
Moderar chat/comunidad           | ❌     | ❌       | ✅        | ❌      | ❌      | ✅    | ✅
──────────────────────────────── | ────── | ──────── | ───────── | ─────── | ─────── | ───── | ───────────
Ver datos agregados              | ❌     | ❌       | ❌        | ✅      | ❌      | ✅    | ✅
Generar informes                 | ❌     | ❌       | ❌        | ✅      | ❌      | ✅    | ✅
──────────────────────────────── | ────── | ──────── | ───────── | ─────── | ─────── | ───── | ───────────
Gestionar cursos                 | ❌     | ❌       | ❌        | ❌      | ✅      | ✅    | ✅
Ver alumnos de sus cursos        | ❌     | ❌       | ❌        | ❌      | ✅      | ✅    | ✅
──────────────────────────────── | ────── | ──────── | ───────── | ─────── | ─────── | ───── | ───────────
PANEL ADMIN completo             | ❌     | ❌       | ❌        | ❌      | ❌      | ✅    | ✅
Cargar rakeback                  | ❌     | ❌       | ❌        | ❌      | ❌      | ✅    | ✅
Gestionar usuarios               | ❌     | ❌       | ❌        | ❌      | ❌      | ✅    | ✅
Gestionar salas                  | ❌     | ❌       | ❌        | ❌      | ❌      | ✅    | ✅
Gestionar servicios              | ❌     | ❌       | ❌        | ❌      | ❌      | ✅    | ✅
Gestionar bancaje                | ❌     | ❌       | ❌        | ❌      | ❌      | ✅    | ✅
Ajustar saldos                   | ❌     | ❌       | ❌        | ❌      | ❌      | ✅    | ✅
Bot interno privado              | ❌     | ❌       | ❌        | ❌      | ❌      | ✅    | ✅
Gestionar knowledge base         | ❌     | ❌       | ❌        | ❌      | ❌      | ✅    | ✅
Config sistema                   | ❌     | ❌       | ❌        | ❌      | ❌      | ❌    | ✅
Gestionar roles                  | ❌     | ❌       | ❌        | ❌      | ❌      | ❌    | ✅
```

### 5.3 — Middleware

Crea middleware que:
1. Proteja todas las rutas `/dashboard/*` requiriendo autenticación
2. Proteja todas las rutas `/admin/*` requiriendo rol ADMIN o SUPER_ADMIN
3. Proteja rutas específicas según la matriz de permisos
4. Redirija a `/login` si no autenticado
5. Redirija a `/unauthorized` si autenticado pero sin permisos
6. Pase los datos de sesión (user, role, stratum) a los Server Components

---

## 6. ESTRUCTURA DE RUTAS Y PÁGINAS

### 6.1 — Páginas Públicas (sin auth)

```
/                           → Landing page (la del prompt anterior, integrada)
/login                      → Login con email/password + botón Discord OAuth
/register                   → Registro con email + password
/register/onboarding        → Onboarding 3 pasos post-registro
/calculadora                → Calculadora de rakeback (pública, lead magnet)
/como-funciona              → Cómo funciona MPD
/servicios                  → Catálogo de servicios
/faq                        → Preguntas frecuentes
/legal/privacidad           → Política de privacidad
/legal/terminos             → Términos y condiciones
/ref/[code]                 → Link de referido (registra cookie + redirect a /register)
```

### 6.2 — Panel del Jugador (auth: PLAYER+)

```
/dashboard                        → Dashboard principal del jugador
/dashboard/rakeback               → Detalle de rakeback por sala y período
/dashboard/balance                → Historial de saldo interno y transacciones
/dashboard/rooms                  → Mis salas afiliadas + guía de alta en nuevas
/dashboard/rooms/[roomSlug]       → Detalle y guía de alta de una sala específica
/dashboard/referrals              → Mis referidos y datos básicos
/dashboard/services               → Servicios disponibles + mis compras
/dashboard/services/[serviceSlug] → Detalle de servicio + compra
/dashboard/courses                → Cursos disponibles + mis inscripciones
/dashboard/courses/[courseSlug]   → Detalle de curso + lecciones
/dashboard/achievements           → Logros desbloqueados + progreso
/dashboard/leaderboard            → Ranking mensual de la comunidad
/dashboard/support                → Mis tickets de soporte
/dashboard/support/new            → Crear nuevo ticket
/dashboard/support/[ticketId]     → Detalle de ticket + chat
/dashboard/notifications          → Centro de notificaciones
/dashboard/settings               → Configuración de perfil + vincular Discord
/dashboard/chat                   → Chat con bot FAQ
```

### 6.3 — Panel de Administración (auth: ADMIN+)

```
/admin                                  → Dashboard admin (KPIs, métricas generales)
/admin/users                            → Lista de todos los usuarios (tabla con filtros)
/admin/users/[userId]                   → Perfil completo de un usuario (editable)
/admin/users/[userId]/rakeback          → Rakeback del usuario (cargar/editar)
/admin/users/[userId]/balance           → Saldo del usuario (ajustar)
/admin/users/[userId]/staking           → Bancaje del usuario
/admin/rooms                            → Gestión de salas de poker
/admin/rooms/new                        → Crear nueva sala
/admin/rooms/[roomId]                   → Editar sala (condiciones, guía, rakeback tiers)
/admin/rakeback                         → Carga masiva de rakeback (por período)
/admin/rakeback/upload                  → Upload CSV de rakeback
/admin/rakeback/history                 → Historial de cargas
/admin/services                         → Gestión de servicios
/admin/services/new                     → Crear servicio
/admin/services/[serviceId]             → Editar servicio
/admin/services/orders                  → Pedidos de servicios
/admin/courses                          → Gestión de cursos
/admin/courses/new                      → Crear curso
/admin/courses/[courseId]               → Editar curso + alumnos
/admin/staking                          → Gestión de bancaje
/admin/staking/[dealId]                 → Detalle de deal de bancaje
/admin/referrals                        → Árbol de referidos global
/admin/balance                          → Transacciones de saldo del ecosistema
/admin/achievements                     → Gestión de logros
/admin/knowledge                        → Knowledge base (artículos para bots)
/admin/knowledge/new                    → Crear artículo
/admin/knowledge/[articleId]            → Editar artículo
/admin/support                          → Todos los tickets de soporte
/admin/support/[ticketId]               → Gestionar ticket
/admin/notifications                    → Enviar notificaciones (individuales o masivas)
/admin/bot                              → Chat con bot interno privado
/admin/activity                         → Log de actividad del sistema
/admin/settings                         → Configuración del sistema
/admin/settings/discord                 → Configuración de integración Discord
```

---

## 7. PANEL DEL JUGADOR — ESPECIFICACIÓN DE CADA MÓDULO

### 7.1 — Dashboard Principal (`/dashboard`)

Layout con sidebar izquierda (collapsible en mobile) y área principal.

**Sidebar:**
- Logo MPD
- Foto + nombre del jugador + badge de estrato
- Navegación con iconos para cada sección
- Saldo disponible siempre visible en la sidebar
- Botón "Soporte" fijo en el bottom
- Versión collapsible con solo iconos en tablet

**Área principal del dashboard:**

**Tarjetas superiores (4 cards en fila):**
1. **Saldo Disponible** — cifra grande en verde (#00C875) con JetBrains Mono. Botón "Canjear"
2. **Saldo Pendiente** — cifra en ámbar (#FF9500). Tooltip: "Se liquida en la próxima quincena"
3. **Rakeback del Mes** — cifra acumulada del mes actual. Icono trending-up si es mayor que el mes anterior
4. **Referidos Activos** — número de referidos que han generado rake este mes

**Gráfica central:**
- Chart de barras (Recharts) con rakeback de los últimos 6 meses
- Selector de sala para filtrar
- Tooltips con datos detallados al hover

**Barra de progreso de estrato:**
- Barra visual horizontal que muestra progreso hacia el siguiente estrato
- Indicar estrato actual y siguiente
- Mostrar qué falta para subir (ej: "Genera €500 más de rake para alcanzar Semi-Pro")
- Animación de relleno progresivo al cargar

**Actividad reciente:**
- Lista de las últimas 5-10 transacciones/eventos
- Cada item: fecha + tipo + descripción + monto (+ verde o - rojo)

**Logros recientes:**
- Badge row con los últimos 3 logros desbloqueados
- Link a "/dashboard/achievements" para ver todos

### 7.2 — Rakeback (`/dashboard/rakeback`)

- Tabla con historial de rakeback por período y sala
- Columnas: Período | Sala | Rake Generado | % Rakeback | Cantidad | Estado
- Filtros: por sala, por período, por estado
- Resumen superior con totales

### 7.3 — Saldo Interno (`/dashboard/balance`)

- Saldo actual grande + botón "Canjear por servicios"
- Historial de transacciones en tabla
- Columnas: Fecha | Tipo | Descripción | Monto | Saldo Resultante
- Filtros: por tipo de transacción, por rango de fechas
- El saldo NUNCA puede ser negativo (validar en backend)

### 7.4 — Mis Salas (`/dashboard/rooms`)

- Grid de cards con las salas donde el jugador está afiliado
- Cada card: logo sala + nombre + estado de afiliación + rakeback % + botón "Ver detalle"
- Sección inferior: "Salas disponibles" — salas donde NO está afiliado + CTA "Darme de alta"
- Al entrar en una sala no afiliada: guía de alta paso a paso integrada (el contenido viene de `setupGuide` en el modelo PokerRoom)

### 7.5 — Referidos (`/dashboard/referrals`)

- **Mi código de referido:** código copiable + botón "Copiar link" (genera URL `/ref/[code]`)
- **Mis referidos:** tabla con datos básicos:
  - Nombre (o nickname)
  - Fecha de registro
  - Estrato actual
  - Rakeback generado (total que ha producido el referido)
  - Estado (Activo/Inactivo)
- **NO mostrar** el rakeback exacto del referido ni datos financieros detallados — solo "datos informales" como dice el documento
- Comisión total generada por referidos visible arriba

### 7.6 — Servicios (`/dashboard/services`)

- Grid de cards con servicios disponibles
- Filtro por categoría (VPN, Datamining, Tools, Coaching)
- Cada card: icono + nombre + precio + descripción corta + badge estado + botón "Adquirir"
- Servicios bloqueados por estrato: se muestran con overlay + "Disponible desde [estrato]"
- Flujo de compra: seleccionar servicio → confirmar → descontar de saldo interno → marcar como entregado
- "Mis compras": tab o sección con servicios adquiridos + estado + instrucciones post-compra

### 7.7 — Cursos (`/dashboard/courses`)

- Cursos disponibles para inscripción
- Cursos en los que estoy inscrito + progreso
- Detalle de curso: descripción, profesor, horario, lecciones, materiales
- Estado del trial: "Te quedan X días de prueba"
- Competición: "Posición en ranking de rake generado durante el curso"

### 7.8 — Logros (`/dashboard/achievements`)

- Grid de badges/logros
- Desbloqueados: con color y animación de brillo
- Bloqueados: grises con "?" o condición para desbloquear
- Categorías: Rakeback, Comunidad, Lealtad, Skills
- Puntos totales visibles arriba
- Logros secretos: se muestran como "???" hasta que se desbloquean

### 7.9 — Leaderboard (`/dashboard/leaderboard`)

- Ranking mensual por categoría: Rakeback, Puntos, Referidos
- Tabs para cambiar de categoría
- Top 10 con posiciones, nombres, avatares y valores
- Posición del jugador actual highlighted
- Selector de mes para ver histórico

### 7.10 — Soporte (`/dashboard/support`)

- Lista de tickets: estado, fecha, asunto, última respuesta
- Crear ticket: formulario con asunto + categoría + mensaje
- Chat dentro del ticket: mensajes entre jugador y admin en formato de chat

### 7.11 — Chat Bot FAQ (`/dashboard/chat`)

- Interface de chat estilo ChatGPT/Discord
- Input de texto + botón enviar
- Respuestas del bot con markdown renderizado
- El bot usa la knowledge base pública para responder
- Si no puede resolver: botón "Hablar con soporte" que crea un ticket automáticamente
- Historial de conversaciones guardado

### 7.12 — Configuración (`/dashboard/settings`)

- **Perfil:** Editar nombre, nickname, avatar, país
- **Seguridad:** Cambiar contraseña
- **Discord:** Vincular/desvincular cuenta Discord. Mostrar estado de conexión.
- **Notificaciones:** Toggle para tipos de notificación (email, push, Discord)
- **Datos de juego:** Actualizar nivel, sala principal, horas semanales

---

## 8. PANEL DE ADMINISTRACIÓN — ESPECIFICACIÓN COMPLETA

### 8.1 — Dashboard Admin (`/admin`)

**KPIs en cards superiores:**
1. Jugadores totales (activos / totales)
2. Rakeback total distribuido (mes actual)
3. Rakeback total distribuido (histórico)
4. Saldo interno en circulación
5. Referidos nuevos este mes
6. Tickets de soporte abiertos

**Gráficas:**
- Rakeback mensual (últimos 12 meses) — bar chart
- Nuevos registros por semana — line chart
- Distribución por estrato — donut chart
- Actividad por sala — horizontal bar chart

**Feed de actividad reciente:**
- Últimos registros
- Últimas cargas de rakeback
- Últimas compras de servicios
- Últimos tickets

### 8.2 — Gestión de Usuarios (`/admin/users`)

**Tabla completa con TanStack Table:**
- Columnas: Avatar | Nombre | Email | Estrato | Rol | Estado | Rakeback Total | Saldo | Fecha Registro
- Búsqueda global
- Filtros: por estrato, rol, estado, sala, fecha de registro
- Sorting por cualquier columna
- Paginación
- Export CSV
- Acciones: Ver perfil | Editar | Suspender | Cambiar rol | Cambiar estrato

**Perfil de usuario (`/admin/users/[userId]`):**
- Toda la info del jugador en vista de admin
- Tabs: General | Rakeback | Saldo | Referidos | Servicios | Cursos | Bancaje | Actividad
- Poder editar cualquier campo
- Poder cargar rakeback manualmente para este usuario
- Poder ajustar saldo (+ o -) con nota obligatoria
- Historial de actividad del usuario

### 8.3 — Carga de Rakeback (`/admin/rakeback`)

**Carga individual:**
- Seleccionar usuario + sala + período + datos de rake
- Preview del cálculo antes de confirmar
- Confirmar → crea RakebackRecord + BalanceTransaction

**Carga masiva (CSV):**
- Upload de archivo CSV con columnas: email, sala, rake_generado, periodo
- Preview de la carga con validaciones
- Detectar errores (emails no encontrados, salas inexistentes)
- Confirmar carga masiva
- Log de carga con resultados

**Historial de cargas:**
- Tabla con todas las cargas realizadas
- Filtro por período y sala
- Poder revertir una carga (soft delete + transacción inversa)

### 8.4 — Gestión de Salas (`/admin/rooms`)

- CRUD completo de salas de poker
- Para cada sala:
  - Datos básicos (nombre, logo, web, código afiliación)
  - Rakeback tiers por estrato (tabla editable inline)
  - Guía de alta (editor markdown)
  - Configuración de VPN (si aplica)
  - Países permitidos/bloqueados
  - Lista de jugadores afiliados

### 8.5 — Gestión de Servicios (`/admin/services`)

- CRUD completo de servicios
- Editor con preview
- Gestión de pedidos: tabla con pedidos pendientes, poder marcar como entregado
- Dashboard de ventas por servicio

### 8.6 — Gestión de Cursos (`/admin/courses`)

- CRUD de cursos con todas las propiedades
- Gestión de lecciones (CRUD dentro del curso)
- Lista de alumnos inscritos con estados
- Poder cambiar estado de inscripción
- Ranking de rake generado por alumnos durante el curso

### 8.7 — Gestión de Bancaje (`/admin/staking`)

- Lista de deals activos y propuestos
- Crear nuevo deal: seleccionar jugador + definir términos
- Dashboard por deal: bankroll actual, makeup, P&L
- Registrar períodos: input de profit/loss + cálculo automático de shares y makeup
- Alertas si makeup acumulado supera umbral configurable

### 8.8 — Árbol de Referidos (`/admin/referrals`)

- Visualización en árbol de quién refirió a quién
- Datos: referidor → referidos → rakeback generado → comisiones
- Filtros por fecha y por referidor
- Totales: comisiones totales pagadas, referidos totales

### 8.9 — Knowledge Base (`/admin/knowledge`)

- CRUD de artículos con editor markdown
- Categorías: FAQ, Room Setup, VPN, Tools, General
- Toggle público/privado (público = bot FAQ, privado = bot interno)
- Tags para mejor búsqueda del bot
- Preview de cómo ve el bot el artículo

### 8.10 — Bot Interno Privado (`/admin/bot`)

- Interface de chat idéntica al bot FAQ pero con knowledge base privada
- El bot tiene acceso a:
  - Artículos privados de la knowledge base
  - Procesos de alta por sala
  - Configuraciones de VPN por país
  - Incidencias frecuentes y resoluciones
  - Tareas pendientes
- Se actualiza "hablándole" — el admin puede decirle "actualiza el proceso de alta de GGPoker" y el bot crea/actualiza el artículo correspondiente
- Historial de conversaciones persistente

### 8.11 — Notificaciones (`/admin/notifications`)

- Enviar notificación individual: seleccionar usuario + redactar
- Enviar notificación masiva: filtrar por estrato/rol/sala + redactar
- Templates predefinidos: rakeback disponible, drop sorpresa, recordatorio curso, actualización sala
- Historial de notificaciones enviadas
- Integración con Discord: opción de enviar también por Discord DM

### 8.12 — Activity Log (`/admin/activity`)

- Tabla con todo el log de actividad del sistema
- Filtros: por usuario, por acción, por fecha, por tipo de entidad
- Datos: timestamp, usuario, acción, entidad, detalles, IP
- Export CSV

### 8.13 — Configuración (`/admin/settings`)

- **General:** nombre del sitio, descripción, email de contacto
- **Discord:** configurar bot token, guild ID, channel IDs, role IDs por estrato
- **Rakeback:** configurar porcentaje de comisión por referido, política de expiración
- **Gamificación:** configurar puntos por acción, niveles, umbrales
- **Emails:** templates de emails transaccionales
- **Mantenimiento:** modo mantenimiento on/off

---

## 9. INTEGRACIÓN DISCORD

### 9.1 — Discord OAuth

- Login con Discord como método alternativo
- Vincular cuenta Discord existente al perfil MPD
- Al vincular: obtener discordId y discordUsername
- Asignar automáticamente rol de Discord según estrato del jugador

### 9.2 — Bot de Discord (discord.js)

Crea un bot básico de Discord que:
- Se conecta al guild configurado
- Escucha mensajes con prefix `!mpd` o slash commands
- Responde preguntas usando la knowledge base pública (misma lógica que el bot FAQ)
- Asigna roles automáticamente cuando un jugador vincula su cuenta
- Envia DMs para notificaciones (rakeback semanal, drops, recordatorios)

### 9.3 — Roles automáticos

Cuando el estrato de un jugador cambia en la plataforma:
1. Buscar el discordId del usuario
2. Quitar el rol anterior
3. Asignar el nuevo rol
4. Configuración de role IDs en admin settings

---

## 10. SISTEMA DE BOTS (RAG)

### 10.1 — Arquitectura

Usa el AI SDK de Vercel (`ai` package) con Claude API de Anthropic:

```
Mensaje del usuario
       ↓
Buscar artículos relevantes en KnowledgeArticle (búsqueda por embeddings o text search)
       ↓
Construir prompt con contexto de los artículos encontrados
       ↓
Llamar a Claude API con streaming
       ↓
Renderizar respuesta en chat
```

### 10.2 — Bot FAQ (público)

- Accede solo a artículos con `isPublic: true`
- System prompt: "Eres el asistente de Manager Poker Deal. Responde preguntas sobre rakeback, salas de poker, alta en salas, VPN, y servicios del ecosistema. Sé conciso, directo y amable. Si no puedes resolver la duda, sugiere al jugador abrir un ticket de soporte. Responde siempre en español."
- Puede acceder a datos públicos del jugador que pregunta (nombre, estrato, salas)

### 10.3 — Bot Interno (privado, solo admin)

- Accede a TODOS los artículos (públicos y privados)
- System prompt: "Eres la memoria operativa de Manager Poker Deal. Tienes acceso a todos los procesos de alta por sala, configuraciones de VPN, incidencias frecuentes y tareas pendientes. Cuando el administrador te pida actualizar información, genera el artículo actualizado. Responde con el máximo detalle técnico."
- Capacidad de crear/actualizar artículos cuando el admin lo solicita

---

## 11. API ROUTES (Server Actions + API Routes)

Implementa TODAS las acciones necesarias como Server Actions de Next.js cuando sea posible, y como API Routes cuando se necesite acceso externo (Discord bot, webhooks).

### API Routes necesarias:

```
POST   /api/auth/[...nextauth]          → NextAuth.js handler
POST   /api/chat/faq                    → Bot FAQ (streaming)
POST   /api/chat/internal               → Bot interno (streaming)
POST   /api/discord/webhook             → Webhook para eventos de Discord
POST   /api/rakeback/upload-csv         → Upload CSV de rakeback masivo
GET    /api/cron/rakeback-reminder      → Cron job para recordatorios de rakeback
GET    /api/cron/inactivity-check       → Cron job para detectar jugadores inactivos
POST   /api/notifications/discord       → Enviar notificación por Discord
```

### Server Actions por dominio:

```
// auth
signUp, signIn, signOut, linkDiscord, unlinkDiscord, updateProfile, changePassword

// users (admin)
getUsers, getUser, updateUser, updateUserRole, updateUserStratum, suspendUser, banUser

// rakeback
getRakebackByUser, getRakebackByPeriod, loadRakeback, loadRakebackBatch, revertRakeback

// balance
getBalance, getTransactions, adjustBalance, purchaseWithBalance

// rooms
getRooms, getRoom, createRoom, updateRoom, deleteRoom, affiliateUser, verifyAffiliation

// services
getServices, getService, createService, updateService, deleteService, placeOrder, fulfillOrder

// courses
getCourses, getCourse, createCourse, updateCourse, enrollUser, updateEnrollment, addLesson

// staking
getDeals, getDeal, createDeal, updateDeal, addPeriod, settleDeal

// referrals
getReferrals, getReferralTree, getReferralStats

// achievements
getAchievements, getUserAchievements, unlockAchievement, checkAchievements

// leaderboard
getLeaderboard, updateLeaderboard

// support
getTickets, getTicket, createTicket, sendMessage, updateTicketStatus, assignTicket

// notifications
getNotifications, markAsRead, sendNotification, sendBulkNotification

// knowledge
getArticles, getArticle, createArticle, updateArticle, deleteArticle, searchArticles

// activity
logActivity, getActivityLog

// settings
getSettings, updateSetting
```

---

## 12. COMPONENTES UI COMPARTIDOS A CREAR

```
components/
├── ui/                        # shadcn/ui base (customizado con paleta MPD)
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── tabs.tsx
│   ├── accordion.tsx
│   ├── badge.tsx
│   ├── toast.tsx
│   ├── skeleton.tsx
│   ├── avatar.tsx
│   ├── tooltip.tsx
│   ├── slider.tsx
│   ├── switch.tsx
│   ├── textarea.tsx
│   ├── table.tsx
│   └── ... (todos los que necesites de shadcn/ui)
│
├── layout/
│   ├── PublicNavbar.tsx        # Navbar para páginas públicas
│   ├── DashboardLayout.tsx    # Layout con sidebar para /dashboard
│   ├── AdminLayout.tsx        # Layout con sidebar para /admin
│   ├── Sidebar.tsx            # Sidebar reutilizable (player/admin)
│   └── Footer.tsx
│
├── shared/
│   ├── GlowCard.tsx           # Card con borde glow cursor-tracking
│   ├── AnimatedCounter.tsx    # Número que anima de 0 a N
│   ├── SectionHeading.tsx     # H2 + subtítulo + línea dorada
│   ├── ShimmerButton.tsx      # Botón con efecto shimmer
│   ├── BadgeStatus.tsx        # "Disponible" / "Próximamente" / "Activo" / etc
│   ├── BadgeStratum.tsx       # Badge con color según estrato
│   ├── BadgeRole.tsx          # Badge con color según rol
│   ├── DataCard.tsx           # Card de KPI con icono + cifra + label + trend
│   ├── EmptyState.tsx         # Estado vacío con ilustración + CTA
│   ├── LoadingState.tsx       # Skeleton loaders
│   ├── ConfirmDialog.tsx      # Diálogo de confirmación reutilizable
│   ├── MarkdownRenderer.tsx   # Renderiza markdown (para artículos/guías)
│   ├── CopyToClipboard.tsx    # Botón de copiar con feedback
│   ├── FileUpload.tsx         # Upload de archivos (avatar, CSV)
│   ├── SearchInput.tsx        # Input de búsqueda con debounce
│   ├── DateRangePicker.tsx    # Selector de rango de fechas
│   ├── ProgressBar.tsx        # Barra de progreso animada
│   └── ChatInterface.tsx      # Interface de chat reutilizable (bot FAQ + interno + soporte)
│
├── charts/
│   ├── RakebackBarChart.tsx   # Gráfica de rakeback por mes
│   ├── StratumDonutChart.tsx  # Distribución por estrato
│   ├── RegistrationLineChart.tsx # Registros por semana
│   └── RoomActivityChart.tsx  # Actividad por sala
│
├── tables/
│   ├── UsersTable.tsx         # Tabla de usuarios (admin)
│   ├── RakebackTable.tsx      # Tabla de rakeback
│   ├── TransactionsTable.tsx  # Tabla de transacciones
│   ├── OrdersTable.tsx        # Tabla de pedidos
│   ├── TicketsTable.tsx       # Tabla de tickets
│   └── ActivityTable.tsx      # Tabla de actividad
│
├── forms/
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   ├── OnboardingForm.tsx     # 3 pasos
│   ├── ProfileForm.tsx
│   ├── RakebackLoadForm.tsx   # Cargar rakeback (admin)
│   ├── RoomForm.tsx           # Crear/editar sala (admin)
│   ├── ServiceForm.tsx        # Crear/editar servicio (admin)
│   ├── CourseForm.tsx         # Crear/editar curso (admin)
│   ├── StakingDealForm.tsx    # Crear deal de bancaje (admin)
│   ├── ArticleForm.tsx        # Crear/editar artículo KB (admin)
│   ├── TicketForm.tsx
│   └── NotificationForm.tsx   # Enviar notificación (admin)
│
└── sections/                  # Secciones de landing page
    ├── Hero.tsx
    ├── TrustBar.tsx
    ├── HowItWorks.tsx
    ├── Calculator.tsx
    ├── Services.tsx
    ├── Strata.tsx
    ├── Testimonials.tsx
    ├── FAQ.tsx
    └── FinalCTA.tsx
```

---

## 13. SEEDS Y DATOS INICIALES

Crea un seed script (`prisma/seed.ts`) que genere:

1. **Usuario admin:** email: admin@mpd.com, password: "MPD2026Admin!", role: SUPER_ADMIN
2. **5 salas de poker:** PokerStars, GGPoker, 888poker, WPT Global, iPoker — con datos realistas, rakeback tiers por estrato, y guías de alta placeholder
3. **6 servicios:** VPN Residencial, VPN Comercial, Datamining, HUD con descuento, Solver con descuento, Coaching personalizado — con precios y descripciones
4. **10 jugadores ficticios:** distribuidos entre los 4 estratos, con rakeback data de los últimos 3 meses, saldos variados, algunos con referidos entre sí
5. **15 logros:** distribuidos en 4 categorías (Rakeback, Comunidad, Lealtad, Skills)
6. **20 artículos de knowledge base:** 10 públicos (FAQ) + 10 privados (procesos internos)
7. **3 notificaciones** por jugador
8. **1 curso** de ejemplo con 4 lecciones
9. **1 deal de bancaje** de ejemplo

---

## 14. VARIABLES DE ENTORNO

Crea `.env.example` con TODAS las variables necesarias:

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# Discord OAuth
DISCORD_CLIENT_ID="..."
DISCORD_CLIENT_SECRET="..."

# Discord Bot
DISCORD_BOT_TOKEN="..."
DISCORD_GUILD_ID="..."
DISCORD_ROLE_NOVATO="..."
DISCORD_ROLE_SEMIPRO="..."
DISCORD_ROLE_PROFESIONAL="..."
DISCORD_ROLE_REFERENTE="..."

# AI / Bot
ANTHROPIC_API_KEY="..."

# Email
RESEND_API_KEY="..."
EMAIL_FROM="noreply@managerpoker.deal"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Manager Poker Deal"
```

---

## 15. INSTRUCCIONES DE EJECUCIÓN PARA CLAUDE CODE

1. **Lee el CLAUDE.md** del repositorio primero para contexto visual y de marca.
2. **Instala dependencias** necesarias que no estén ya en el proyecto.
3. **Configura Prisma** con el schema completo descrito arriba.
4. **Implementa la autenticación** primero (NextAuth + middleware + roles).
5. **Crea el layout system** (public, dashboard, admin) con los sidebars.
6. **Implementa el panel del jugador** módulo por módulo.
7. **Implementa el panel de administración** módulo por módulo.
8. **Implementa los bots** (FAQ + interno).
9. **Integra Discord** (OAuth + bot básico).
10. **Crea los seeds** y verifica que todo funciona.
11. **Implementa la landing page** integrada en la ruta raíz.
12. **Aplica animaciones y polish** final.
13. **Documenta** cualquier decisión de arquitectura importante en comentarios.

**PRIORIDAD:** Si no puedes completar todo en una sesión, prioriza en este orden:
1. Auth + DB + Middleware
2. Dashboard del jugador (las 4 cards + rakeback + saldo)
3. Panel admin (usuarios + carga rakeback)
4. Servicios + saldo interno
5. Bot FAQ
6. Referidos
7. Cursos + bancaje
8. Gamificación
9. Discord integration
10. Landing page
11. Polish y animaciones

**Toma decisiones propias** donde algo no esté suficientemente detallado. Eres senior engineer — si ves una mejor forma de implementar algo, hazlo y documenta por qué.

---

## 16. CRITERIOS DE CALIDAD

- ✅ TypeScript estricto en todo — cero `any`
- ✅ Validación con Zod en todos los formularios y API routes
- ✅ Error handling completo — try/catch, error boundaries, toast notifications
- ✅ Loading states con skeletons en todas las páginas
- ✅ Empty states con ilustración y CTA en todas las listas/tablas vacías
- ✅ Mobile-first responsive — todo funciona en móvil
- ✅ Accesibilidad WCAG 2.1 AA — aria labels, keyboard navigation, contraste
- ✅ SEO en páginas públicas — metadata, OpenGraph, JSON-LD
- ✅ Performance — lazy loading, code splitting, image optimization
- ✅ Seguridad — CSRF, rate limiting en auth, sanitización de inputs, SQL injection prevention via Prisma
- ✅ Todos los textos en español
- ✅ Estética dark luxury fintech consistente en toda la plataforma
