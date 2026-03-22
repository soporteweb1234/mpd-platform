import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.chatMessage.deleteMany();
  await prisma.ticketMessage.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.leaderboardEntry.deleteMany();
  await prisma.stakingPeriod.deleteMany();
  await prisma.stakingDeal.deleteMany();
  await prisma.courseEnrollment.deleteMany();
  await prisma.courseLesson.deleteMany();
  await prisma.course.deleteMany();
  await prisma.serviceOrder.deleteMany();
  await prisma.service.deleteMany();
  await prisma.balanceTransaction.deleteMany();
  await prisma.rakebackRecord.deleteMany();
  await prisma.rakebackTier.deleteMany();
  await prisma.roomAffiliation.deleteMany();
  await prisma.pokerRoom.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.knowledgeArticle.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("MPD2026Admin!", 12);
  const playerPassword = await bcrypt.hash("Player123!", 12);

  // 1. Super Admin
  const admin = await prisma.user.create({
    data: {
      email: "admin@mpd.com",
      password: hashedPassword,
      name: "Admin MPD",
      role: "SUPER_ADMIN",
      stratum: "REFERENTE",
      status: "ACTIVE",
      onboardingStep: 4,
      country: "ES",
      playingLevel: "NL500",
      totalRakeback: 50000,
      availableBalance: 5000,
      lifetimeEarnings: 50000,
      points: 10000,
      level: 10,
    },
  });

  // 2. Poker Rooms
  const rooms = await Promise.all([
    prisma.pokerRoom.create({
      data: {
        name: "PokerStars",
        slug: "pokerstars",
        affiliateCode: "MPD-PS2026",
        rakebackBase: 25,
        rakebackPremium: 30,
        website: "https://pokerstars.com",
        description: "La sala de poker online más grande del mundo. Amplia variedad de juegos y torneos.",
        setupGuide: "## Alta en PokerStars con MPD\n\n1. Visita pokerstars.com\n2. Crea tu cuenta nueva\n3. Introduce el código de marketing: **MPD-PS2026**\n4. Completa la verificación de identidad\n5. Notifica a MPD para verificar tu afiliación",
        countriesBlocked: ["US"],
        status: "ACTIVE",
        sortOrder: 1,
      },
    }),
    prisma.pokerRoom.create({
      data: {
        name: "GGPoker",
        slug: "ggpoker",
        affiliateCode: "MPD-GG2026",
        rakebackBase: 30,
        rakebackPremium: 40,
        website: "https://ggpoker.com",
        description: "La sala más innovadora con SmartHUD integrado y formato Rush & Cash exclusivo.",
        setupGuide: "## Alta en GGPoker con MPD\n\n1. Descarga la app de GGPoker\n2. Regístrate con el código de referido: **MPD-GG2026**\n3. Verifica tu cuenta\n4. Contacta a MPD para confirmar",
        countriesBlocked: ["US", "AU"],
        vpnRequired: false,
        status: "ACTIVE",
        sortOrder: 2,
      },
    }),
    prisma.pokerRoom.create({
      data: {
        name: "888poker",
        slug: "888poker",
        affiliateCode: "MPD-888-2026",
        rakebackBase: 20,
        rakebackPremium: 27,
        website: "https://888poker.com",
        description: "Sala veterana con excelentes promociones para jugadores recreativos.",
        setupGuide: "## Alta en 888poker con MPD\n\n1. Visita 888poker.com\n2. Crea tu cuenta\n3. Usa el código bonus: **MPD-888-2026**\n4. Avisa a MPD para confirmar afiliación",
        status: "ACTIVE",
        sortOrder: 3,
      },
    }),
    prisma.pokerRoom.create({
      data: {
        name: "WPT Global",
        slug: "wpt-global",
        affiliateCode: "MPD-WPT2026",
        rakebackBase: 35,
        rakebackPremium: 45,
        website: "https://wptglobal.com",
        description: "Sala oficial del World Poker Tour con jugadores recreativos y buenas condiciones.",
        setupGuide: "## Alta en WPT Global con MPD\n\n1. Descarga WPT Global\n2. Regístrate con el código: **MPD-WPT2026**\n3. Verifica identidad\n4. Contacta MPD",
        vpnRequired: true,
        vpnInstructions: "## VPN para WPT Global\n\nNecesitas una VPN residencial de un país permitido (UK, Canadá, etc).\n\n1. Contrata el servicio VPN Residencial de MPD\n2. Configura la VPN antes de abrir la app\n3. Usa siempre la misma IP/país",
        countriesBlocked: ["US", "FR"],
        status: "ACTIVE",
        sortOrder: 4,
      },
    }),
    prisma.pokerRoom.create({
      data: {
        name: "iPoker Network",
        slug: "ipoker",
        affiliateCode: "MPD-IPKR2026",
        rakebackBase: 22,
        rakebackPremium: 28,
        description: "Red de salas con tráfico variado y buena acción en niveles bajos-medios.",
        setupGuide: "## Alta en iPoker con MPD\n\n1. Elige una skin de la red iPoker (bet365, Betsson, etc)\n2. Regístrate y contacta a MPD con tu ID de jugador\n3. Te vinculamos manualmente",
        status: "ACTIVE",
        sortOrder: 5,
      },
    }),
  ]);

  // Rakeback tiers for each room
  for (const room of rooms) {
    await prisma.rakebackTier.createMany({
      data: [
        { roomId: room.id, stratum: "NOVATO", rakebackPercent: room.rakebackBase },
        { roomId: room.id, stratum: "SEMI_PRO", rakebackPercent: room.rakebackBase + 5 },
        { roomId: room.id, stratum: "PROFESIONAL", rakebackPercent: room.rakebackBase + 10 },
        { roomId: room.id, stratum: "REFERENTE", rakebackPercent: room.rakebackPremium ?? room.rakebackBase + 15 },
      ],
    });
  }

  // 3. Services
  await prisma.service.createMany({
    data: [
      {
        name: "VPN Residencial",
        slug: "vpn-residencial",
        category: "VPN",
        description: "VPN con IP residencial estática para jugar en salas con restricción geográfica. IP dedicada exclusiva, conexión estable y soporte 24/7.",
        shortDescription: "IP residencial dedicada para salas restringidas",
        icon: "Shield",
        priceEur: 45,
        priceInBalance: 40,
        isRecurring: true,
        recurringPeriod: "MONTHLY",
        features: ["IP residencial exclusiva", "Conexión estable 24/7", "Soporte técnico", "Compatible con todas las salas"],
        status: "AVAILABLE",
        sortOrder: 1,
      },
      {
        name: "VPN Comercial",
        slug: "vpn-comercial",
        category: "VPN",
        description: "VPN comercial de alta velocidad. Ideal para juego casual o como backup.",
        shortDescription: "VPN de alta velocidad para juego casual",
        icon: "Shield",
        priceEur: 15,
        priceInBalance: 12,
        isRecurring: true,
        recurringPeriod: "MONTHLY",
        features: ["Alta velocidad", "Múltiples ubicaciones", "Fácil configuración"],
        status: "AVAILABLE",
        sortOrder: 2,
      },
      {
        name: "Datamining",
        slug: "datamining",
        category: "DATAMINING",
        description: "Paquete de datos de manos de las principales salas. Actualización semanal con millones de manos.",
        shortDescription: "Datos de manos actualizados semanalmente",
        icon: "Database",
        priceEur: 30,
        priceInBalance: 25,
        isRecurring: true,
        recurringPeriod: "MONTHLY",
        features: ["Millones de manos", "Actualización semanal", "Principales salas", "Formato compatible con HM3/PT4"],
        status: "AVAILABLE",
        requiredStratum: "SEMI_PRO",
        sortOrder: 3,
      },
      {
        name: "PokerTracker 4 con Descuento",
        slug: "pokertracker-descuento",
        category: "TOOLS",
        description: "Licencia de PokerTracker 4 con descuento exclusivo para miembros MPD.",
        shortDescription: "HUD profesional con descuento MPD",
        icon: "Wrench",
        priceEur: 70,
        priceInBalance: 60,
        features: ["Licencia completa PT4", "Descuento exclusivo MPD", "Soporte de instalación"],
        status: "AVAILABLE",
        sortOrder: 4,
      },
      {
        name: "PioSolver con Descuento",
        slug: "piosolver-descuento",
        category: "TOOLS",
        description: "Licencia de PioSolver con precio especial para miembros MPD.",
        shortDescription: "Solver GTO con descuento exclusivo",
        icon: "Wrench",
        priceEur: 200,
        priceInBalance: 180,
        features: ["Licencia PioSolver", "Descuento MPD", "Guía de uso incluida"],
        status: "AVAILABLE",
        requiredStratum: "SEMI_PRO",
        sortOrder: 5,
      },
      {
        name: "Coaching Personalizado",
        slug: "coaching-personalizado",
        category: "COACHING",
        description: "Sesión de coaching 1-on-1 de 90 minutos con un coach profesional. Revisión de manos, estrategia y plan de mejora.",
        shortDescription: "Sesión 1-on-1 con coach profesional",
        icon: "GraduationCap",
        priceEur: 120,
        priceInBalance: 100,
        features: ["90 minutos", "Revisión de manos", "Plan de mejora", "Grabación incluida"],
        status: "AVAILABLE",
        requiredStratum: "SEMI_PRO",
        sortOrder: 6,
      },
    ],
  });

  // 4. Players
  const playerNames = [
    { name: "Carlos García", email: "carlos@test.com", stratum: "NOVATO" as const, country: "ES" },
    { name: "María López", email: "maria@test.com", stratum: "NOVATO" as const, country: "MX" },
    { name: "Juan Martínez", email: "juan@test.com", stratum: "SEMI_PRO" as const, country: "ES" },
    { name: "Ana Rodríguez", email: "ana@test.com", stratum: "SEMI_PRO" as const, country: "AR" },
    { name: "Pedro Sánchez", email: "pedro@test.com", stratum: "SEMI_PRO" as const, country: "CO" },
    { name: "Laura Fernández", email: "laura@test.com", stratum: "PROFESIONAL" as const, country: "ES" },
    { name: "Diego Torres", email: "diego@test.com", stratum: "PROFESIONAL" as const, country: "CL" },
    { name: "Sofía Herrera", email: "sofia@test.com", stratum: "PROFESIONAL" as const, country: "ES" },
    { name: "Alejandro Ruiz", email: "alejandro@test.com", stratum: "REFERENTE" as const, country: "ES" },
    { name: "Valentina Moreno", email: "valentina@test.com", stratum: "REFERENTE" as const, country: "AR" },
  ];

  const players: Array<{ id: string; stratum: string }> = [];
  for (let i = 0; i < playerNames.length; i++) {
    const p = playerNames[i];
    const referredById: string | undefined = i > 0 && i <= 3 ? players[0]?.id : i > 3 && i <= 6 ? players[2]?.id : undefined;
    const rakebackAmounts = { NOVATO: 200, SEMI_PRO: 800, PROFESIONAL: 3000, REFERENTE: 12000 };

    const player = await prisma.user.create({
      data: {
        email: p.email,
        password: playerPassword,
        name: p.name,
        nickname: p.name.split(" ")[0].toLowerCase() + (i + 1),
        stratum: p.stratum,
        status: "ACTIVE",
        onboardingStep: 4,
        country: p.country,
        playingLevel: p.stratum === "NOVATO" ? "NL5" : p.stratum === "SEMI_PRO" ? "NL25" : p.stratum === "PROFESIONAL" ? "NL100" : "NL500",
        weeklyHours: 10 + i * 5,
        primaryRoom: rooms[i % rooms.length].name,
        totalRakeback: rakebackAmounts[p.stratum],
        availableBalance: rakebackAmounts[p.stratum] * 0.3,
        lifetimeEarnings: rakebackAmounts[p.stratum],
        points: rakebackAmounts[p.stratum] * 2,
        level: Math.min(Math.floor(rakebackAmounts[p.stratum] / 500) + 1, 10),
        referredById,
      },
    });
    players.push(player);
  }

  // Room affiliations
  for (let i = 0; i < players.length; i++) {
    await prisma.roomAffiliation.create({
      data: {
        userId: players[i].id,
        roomId: rooms[i % rooms.length].id,
        verified: true,
        verifiedAt: new Date(),
        isPrimary: true,
      },
    });
  }

  // Rakeback records (3 months)
  const now = new Date();
  for (const player of players) {
    for (let m = 2; m >= 0; m--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - m + 1, 0);
      const rakeMultiplier = player.stratum === "NOVATO" ? 1 : player.stratum === "SEMI_PRO" ? 3 : player.stratum === "PROFESIONAL" ? 8 : 20;
      const rake = (200 + Math.random() * 300) * rakeMultiplier / 3;
      const rbPercent = 25 + Math.random() * 10;
      const rbAmount = (rake * rbPercent) / 100;

      await prisma.rakebackRecord.create({
        data: {
          userId: player.id,
          roomId: rooms[players.indexOf(player) % rooms.length].id,
          period: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`,
          periodStart: monthStart,
          periodEnd: monthEnd,
          rakeGenerated: Math.round(rake * 100) / 100,
          rakebackPercent: Math.round(rbPercent * 10) / 10,
          rakebackAmount: Math.round(rbAmount * 100) / 100,
          status: m === 0 ? "PENDING" : "AVAILABLE",
          loadedBy: admin.id,
          loadedAt: new Date(),
        },
      });
    }
  }

  // 5. Achievements
  const achievements = [
    { slug: "first-rake", name: "Primer Rake", description: "Genera tu primer rakeback", icon: "🎯", category: "RAKEBACK", pointsAwarded: 50, requiredValue: 1 },
    { slug: "rake-100", name: "Centurión", description: "Acumula €100 de rakeback", icon: "💰", category: "RAKEBACK", pointsAwarded: 100, requiredValue: 100 },
    { slug: "rake-500", name: "Medio Millar", description: "Acumula €500 de rakeback", icon: "💎", category: "RAKEBACK", pointsAwarded: 250, requiredValue: 500 },
    { slug: "rake-1000", name: "Milenario", description: "Acumula €1.000 de rakeback", icon: "🏆", category: "RAKEBACK", pointsAwarded: 500, requiredValue: 1000 },
    { slug: "rake-5000", name: "Leyenda del Rake", description: "Acumula €5.000 de rakeback", icon: "👑", category: "RAKEBACK", pointsAwarded: 1000, requiredValue: 5000, isSecret: true },
    { slug: "first-referral", name: "Embajador", description: "Consigue tu primer referido", icon: "🤝", category: "COMMUNITY", pointsAwarded: 100, requiredValue: 1 },
    { slug: "referrals-5", name: "Red de Contactos", description: "Consigue 5 referidos", icon: "🌐", category: "COMMUNITY", pointsAwarded: 300, requiredValue: 5 },
    { slug: "referrals-10", name: "Influencer", description: "Consigue 10 referidos", icon: "⭐", category: "COMMUNITY", pointsAwarded: 500, requiredValue: 10, isSecret: true },
    { slug: "week-1", name: "Primera Semana", description: "Lleva 1 semana en MPD", icon: "📅", category: "LOYALTY", pointsAwarded: 25 },
    { slug: "month-1", name: "Primer Mes", description: "Lleva 1 mes en MPD", icon: "🗓️", category: "LOYALTY", pointsAwarded: 100 },
    { slug: "month-6", name: "Veterano", description: "Lleva 6 meses en MPD", icon: "🎖️", category: "LOYALTY", pointsAwarded: 500 },
    { slug: "year-1", name: "Aniversario", description: "Lleva 1 año en MPD", icon: "🎂", category: "LOYALTY", pointsAwarded: 1000, isSecret: true },
    { slug: "multi-room", name: "Multi-Sala", description: "Afíliate a 3 o más salas", icon: "🃏", category: "SKILLS", pointsAwarded: 200, requiredValue: 3 },
    { slug: "first-service", name: "Equipado", description: "Adquiere tu primer servicio", icon: "🛠️", category: "SKILLS", pointsAwarded: 100 },
    { slug: "first-course", name: "Estudiante", description: "Inscríbete en tu primer curso", icon: "📚", category: "SKILLS", pointsAwarded: 150 },
  ];

  for (let i = 0; i < achievements.length; i++) {
    await prisma.achievement.create({
      data: { ...achievements[i], sortOrder: i },
    });
  }

  // 6. Knowledge Base
  const publicArticles = [
    { title: "¿Qué es el rakeback?", slug: "que-es-rakeback", category: "FAQ", content: "El rakeback es un porcentaje del rake (comisión) que pagas en cada mano de poker que se te devuelve. Es una de las principales formas de optimizar tus ganancias como jugador de poker online.\n\n## ¿Cómo funciona?\n\nCuando juegas poker online, la sala cobra una comisión (rake) en cada mano o torneo. Con MPD, un porcentaje de ese rake se te devuelve automáticamente como saldo en tu cuenta.", tags: ["rakeback", "basico"] },
    { title: "¿Cómo me registro?", slug: "como-registrarse", category: "FAQ", content: "## Proceso de registro\n\n1. Crea tu cuenta en MPD con tu email\n2. Completa el onboarding de 3 pasos\n3. Elige tu sala principal\n4. Sigue la guía de alta para registrarte con nuestro código\n5. ¡Listo! Tu rakeback empezará a acumularse", tags: ["registro", "basico"] },
    { title: "¿Qué salas están disponibles?", slug: "salas-disponibles", category: "FAQ", content: "Actualmente trabajamos con las siguientes salas:\n\n- **PokerStars** - La más grande del mundo\n- **GGPoker** - La más innovadora\n- **888poker** - Ideal para recreativos\n- **WPT Global** - Mejores condiciones de rakeback\n- **iPoker Network** - Buena acción en niveles bajos", tags: ["salas", "basico"] },
    { title: "¿Cómo funciona el saldo interno?", slug: "saldo-interno", category: "FAQ", content: "Tu rakeback se acumula como saldo interno en MPD. Puedes usarlo para:\n\n- Comprar servicios (VPN, datamining, herramientas)\n- Pagar cursos\n- Retirarlo (según condiciones)\n\nEl saldo nunca expira mientras tu cuenta esté activa.", tags: ["saldo", "balance"] },
    { title: "¿Necesito VPN?", slug: "necesito-vpn", category: "FAQ", content: "Solo necesitas VPN si juegas en salas con restricción geográfica (como WPT Global desde ciertos países). MPD ofrece dos opciones:\n\n- **VPN Residencial** (€45/mes) - IP dedicada, máxima seguridad\n- **VPN Comercial** (€15/mes) - Opción económica\n\nConsulta la guía de cada sala para saber si necesitas VPN.", tags: ["vpn", "salas"] },
    { title: "Sistema de referidos", slug: "sistema-referidos", category: "FAQ", content: "Gana comisiones por cada jugador que invites a MPD:\n\n1. Comparte tu código de referido\n2. Cuando se registren y jueguen, recibirás una comisión\n3. Las comisiones se acumulan en tu saldo interno\n\nEncuentra tu código en la sección 'Referidos' del dashboard.", tags: ["referidos", "comisiones"] },
    { title: "Niveles y estratos", slug: "niveles-estratos", category: "FAQ", content: "## Los 4 estratos de MPD\n\n| Estrato | Nivel | Beneficios |\n|---------|-------|------------|\n| Novato | NL2-NL10 | Acceso básico, comunidad |\n| Semi-Pro | NL25-NL50 | Servicios premium, datamining |\n| Profesional | NL100-NL200 | Coaching, mejores condiciones |\n| Referente | NL500+ | Todo incluido, acceso VIP |", tags: ["estratos", "niveles"] },
    { title: "Guía de alta en PokerStars", slug: "alta-pokerstars", category: "ROOM_SETUP", content: "## Paso a paso\n\n1. Ve a pokerstars.com\n2. Haz clic en 'Jugar ahora'\n3. Rellena el formulario de registro\n4. En 'Código de marketing' introduce: **MPD-PS2026**\n5. Completa la verificación de identidad\n6. Envía un mensaje a soporte MPD con tu nombre de usuario\n7. Verificaremos tu afiliación en 24-48h", tags: ["pokerstars", "alta"] },
    { title: "Guía de alta en GGPoker", slug: "alta-ggpoker", category: "ROOM_SETUP", content: "## Paso a paso\n\n1. Descarga la app de GGPoker\n2. Crea una cuenta nueva\n3. Usa el código de referido: **MPD-GG2026**\n4. Verifica tu cuenta con documento de identidad\n5. Contacta a soporte MPD para confirmar", tags: ["ggpoker", "alta"] },
    { title: "Configuración de VPN", slug: "config-vpn", category: "VPN", content: "## Configuración VPN Residencial\n\n1. Recibirás las credenciales por email tras la compra\n2. Descarga el cliente VPN recomendado\n3. Introduce las credenciales\n4. Selecciona el país/IP asignado\n5. Conecta la VPN ANTES de abrir la sala de poker\n6. Verifica tu IP en whatismyip.com\n\n**Importante:** Usa siempre la misma IP para evitar problemas.", tags: ["vpn", "configuracion"] },
  ];

  const privateArticles = [
    { title: "Proceso de verificación de afiliación", slug: "proceso-verificacion", category: "ROOM_SETUP", content: "## Cómo verificar afiliaciones\n\n1. El jugador envía su username de la sala\n2. Acceder al panel de afiliados de la sala\n3. Buscar el username\n4. Confirmar que el código de afiliación es correcto\n5. Marcar como verificado en el admin de MPD\n6. Notificar al jugador", isPublic: false, tags: ["verificacion", "proceso"] },
    { title: "Procedimiento de carga de rakeback", slug: "carga-rakeback-proceso", category: "FAQ", content: "## Carga quincenal de rakeback\n\n1. Descargar el reporte de cada sala (día 1 y 16 de cada mes)\n2. Formato CSV con columnas: username, rake_generado\n3. Cruzar usernames con emails en la base de datos\n4. Cargar via /admin/rakeback/upload\n5. Verificar totales antes de confirmar\n6. Los jugadores reciben notificación automática", isPublic: false, tags: ["rakeback", "carga", "proceso"] },
    { title: "Resolución de problemas con VPN", slug: "vpn-problemas", category: "VPN", content: "## Problemas frecuentes\n\n### La sala detecta la VPN\n- Verificar que es IP residencial, no datacenter\n- Cambiar IP si fue flaggeada\n\n### Conexión lenta\n- Cambiar servidor\n- Verificar que no hay otros procesos consumiendo ancho de banda\n\n### No conecta\n- Verificar credenciales\n- Contactar proveedor VPN", isPublic: false, tags: ["vpn", "problemas", "soporte"] },
    { title: "Política de bancaje", slug: "politica-bancaje", category: "GENERAL", content: "## Criterios para bancaje\n\n- Mínimo 6 meses en MPD\n- Estrato Profesional o superior\n- Historial de rakeback consistente\n- Sin incidencias de fraude\n- Entrevista personal con el admin\n\n## Términos estándar\n- 50/50 contribución\n- 65/35 split de ganancias (jugador/MPD)\n- Revisión mensual\n- Makeup tracking automático", isPublic: false, tags: ["bancaje", "politica"] },
    { title: "Gestión de incidencias", slug: "gestion-incidencias", category: "GENERAL", content: "## Protocolo de incidencias\n\n### Prioridad URGENTE\n- Cuenta bloqueada en sala\n- Problema con retiro de fondos\n- Sospecha de fraude\n\n### Prioridad ALTA\n- Error en carga de rakeback\n- Problema con VPN durante sesión\n\n### Prioridad MEDIA\n- Consultas sobre servicios\n- Problemas técnicos menores\n\n### Prioridad BAJA\n- Preguntas generales\n- Sugerencias", isPublic: false, tags: ["incidencias", "soporte", "protocolo"] },
    { title: "Onboarding de nuevos jugadores", slug: "onboarding-jugadores", category: "GENERAL", content: "## Checklist nuevo jugador\n\n1. Verificar que completó el onboarding\n2. Verificar afiliación en la sala\n3. Enviar mensaje de bienvenida por Discord\n4. Añadir al canal correspondiente según estrato\n5. Primer check-in a la semana\n6. Verificar primera carga de rakeback", isPublic: false, tags: ["onboarding", "nuevo", "proceso"] },
    { title: "Criterios de cambio de estrato", slug: "cambio-estrato", category: "GENERAL", content: "## Umbrales automáticos\n\n| Estrato | Rakeback acumulado |\n|---------|-------------------|\n| Novato | €0 - €499 |\n| Semi-Pro | €500 - €1.999 |\n| Profesional | €2.000 - €9.999 |\n| Referente | €10.000+ |\n\nLa subida es automática. La bajada solo por inactividad >3 meses.", isPublic: false, tags: ["estratos", "cambio", "criterios"] },
    { title: "Templates de notificaciones", slug: "templates-notificaciones", category: "GENERAL", content: "## Templates frecuentes\n\n### Rakeback disponible\nTítulo: ¡Tu rakeback está listo!\nMensaje: Tu rakeback del período [PERIODO] ya está disponible en tu saldo. Total: €[MONTO]\n\n### Drop sorpresa\nTítulo: 🎁 ¡Drop sorpresa!\nMensaje: Te hemos añadido €[MONTO] a tu saldo como bonus especial.\n\n### Bienvenida\nTítulo: ¡Bienvenido a MPD!\nMensaje: Tu cuenta está activa. Explora el dashboard y descubre todos los servicios disponibles.", isPublic: false, tags: ["notificaciones", "templates"] },
    { title: "Configuración Discord por sala", slug: "discord-config-salas", category: "GENERAL", content: "## Canales por sala\n\n- #pokerstars - Canal general PokerStars\n- #ggpoker - Canal general GGPoker\n- #888poker - Canal general 888poker\n- #wpt-global - Canal WPT Global\n- #ipoker - Canal iPoker\n\n## Roles por estrato\n- Novato: acceso a canales generales\n- Semi-Pro: + canales de estrategia\n- Profesional: + canal privado\n- Referente: + canal VIP", isPublic: false, tags: ["discord", "configuracion"] },
    { title: "Métricas clave a monitorear", slug: "metricas-clave", category: "GENERAL", content: "## KPIs semanales\n\n1. Nuevos registros\n2. Afiliaciones verificadas\n3. Rakeback total distribuido\n4. Saldo interno en circulación\n5. Tickets abiertos sin resolver\n6. Tasa de conversión referidos\n7. Retención mensual (% jugadores activos)\n\n## KPIs mensuales\n\n1. Revenue por jugador\n2. Crecimiento de base de jugadores\n3. NPS / satisfacción", isPublic: false, tags: ["metricas", "kpis"] },
  ];

  for (let i = 0; i < publicArticles.length; i++) {
    await prisma.knowledgeArticle.create({
      data: { ...publicArticles[i], isPublic: true, sortOrder: i },
    });
  }

  for (let i = 0; i < privateArticles.length; i++) {
    await prisma.knowledgeArticle.create({
      data: { ...privateArticles[i], isPublic: privateArticles[i].isPublic ?? false, sortOrder: i + publicArticles.length },
    });
  }

  // 7. Notifications
  for (const player of players) {
    await prisma.notification.createMany({
      data: [
        { userId: player.id, type: "SYSTEM", title: "¡Bienvenido a MPD!", message: "Tu cuenta está activa. Explora el dashboard y descubre todos los servicios.", link: "/dashboard" },
        { userId: player.id, type: "RAKEBACK", title: "Rakeback disponible", message: "Tu rakeback del último período ya está disponible en tu saldo.", link: "/dashboard/rakeback" },
        { userId: player.id, type: "ACHIEVEMENT", title: "¡Nuevo logro!", message: "Has desbloqueado el logro 'Primer Rake'.", link: "/dashboard/achievements" },
      ],
    });
  }

  // 8. Course
  const course = await prisma.course.create({
    data: {
      title: "Fundamentos de NL25-NL50",
      slug: "fundamentos-nl25-nl50",
      description: "Curso trimestral intensivo para jugadores que quieren dar el salto de microlímites a límites bajos. 12 semanas de formación con profesor profesional, revisión de manos y estrategia avanzada.",
      priceEur: 150,
      priceWithAffiliation: 100,
      maxStudents: 12,
      durationWeeks: 12,
      trialWeeks: 2,
      schedule: "Martes y Jueves 20:00 CET",
      status: "OPEN_ENROLLMENT",
      requiresAffiliation: true,
      requiredStratum: "NOVATO",
    },
  });

  await prisma.courseLesson.createMany({
    data: [
      { courseId: course.id, title: "Introducción y Fundamentos Preflop", lessonNumber: 1, description: "Rangos de apertura, 3-bet y cold call." },
      { courseId: course.id, title: "Juego Postflop: C-bet y Barriles", lessonNumber: 2, description: "Estrategia de continuation bet y barriles multical." },
      { courseId: course.id, title: "Defensa de Blinds", lessonNumber: 3, description: "Cómo defender los blinds de forma rentable." },
      { courseId: course.id, title: "Lectura de Rangos y Exploitación", lessonNumber: 4, description: "Cómo leer rangos y explotar las tendencias de los rivales." },
    ],
  });

  // 9. Staking Deal
  if (players.length >= 6) {
    await prisma.stakingDeal.create({
      data: {
        userId: players[5].id,
        totalBankroll: 5000,
        mpdContribution: 2500,
        playerContribution: 2500,
        profitSplitMpd: 35,
        profitSplitPlayer: 65,
        status: "ACTIVE",
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        notes: "Deal de bancaje para NL100. Revisión mensual.",
      },
    });
  }

  console.log("Seed completed!");
  console.log(`  - 1 admin (admin@mpd.com / MPD2026Admin!)`);
  console.log(`  - ${rooms.length} poker rooms`);
  console.log(`  - ${players.length} players (password: Player123!)`);
  console.log(`  - ${achievements.length} achievements`);
  console.log(`  - ${publicArticles.length + privateArticles.length} knowledge articles`);
  console.log(`  - 1 course with 4 lessons`);
  console.log(`  - 1 staking deal`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
