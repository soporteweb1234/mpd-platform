# CLAUDE.md — Manager Poker Deal (MPD)

## Qué es este proyecto

Manager Poker Deal es una plataforma web + ecosistema cerrado de asesoría integral para jugadores de poker online hispanohablantes. El jugador entra, encuentra todo lo que necesita (sala, rakeback, herramientas, aprendizaje, bancaje, comunidad) y no tiene incentivo de salir. La marca opera sin figura pública visible — su identidad es la entidad, no el fundador.

## Propuesta de valor

> "El jugador solo tiene que jugar al poker. Manager Poker Deal resuelve todo lo demás."

## Stack técnico

- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS 4
- **Componentes:** shadcn/ui + componentes custom inspirados en 21st.dev
- **Animaciones:** Framer Motion / CSS animations
- **Deploy:** Vercel
- **Backend futuro:** Supabase (auth, DB, realtime)
- **Integraciones futuras:** Discord API, bots con RAG

## Paleta corporativa

| Token | Hex | Uso |
|-------|-----|-----|
| `--mpd-black` | `#0D1117` | Fondo principal, base dark |
| `--mpd-gold` | `#C9A84C` | Acentos premium, CTAs, highlights |
| `--mpd-green` | `#00C875` | Ganancias, estados positivos, rakeback disponible |
| `--mpd-amber` | `#FF9500` | Pendientes, alertas, estados intermedios |
| `--mpd-white` | `#E6EDF3` | Texto principal sobre fondo oscuro |
| `--mpd-gray` | `#8B949E` | Texto secundario, subtítulos |
| `--mpd-surface` | `#161B22` | Cards, superficies elevadas |
| `--mpd-border` | `#30363D` | Bordes sutiles |

## Tipografía

- **Display/Headings:** Font premium sans-serif (ej: Satoshi, General Sans, Clash Display o Cabinet Grotesk — NO Inter, NO Arial, NO Roboto)
- **Body:** Font limpia y legible (ej: Plus Jakarta Sans, Outfit)
- **Monospace (datos/cifras):** JetBrains Mono o similar

## Identidad visual y tono

- **Estética:** Dark luxury fintech. Piensa en paneles de trading cripto premium, no en casinos flashy.
- **Tono:** Profesional, directo, sin florituras. Genera confianza y exclusividad.
- **Referencia visual:** Estilo EASEOUT — negro profundo, dorado como acento, verde para ganancias, ámbar para pendientes.
- **Iconografía:** Lucide icons o custom SVGs. Línea fina, estilo minimal.
- **Animaciones:** Sutiles y con propósito. Staggered reveals al scroll, hover states con micro-interacciones, números que animan al entrar en viewport.
- **NO hacer:** Nada que parezca casino, apuestas deportivas o slot machines. Esto es gestión financiera de poker, no gambling.

## Arquitectura de páginas (v1 - Landing + Captación)

```
/                  → Landing page principal (captación)
/calculadora       → Calculadora de rakeback (lead magnet interactivo)
/como-funciona     → Explicación del proceso en 3-4 pasos
/servicios         → Grid de servicios del ecosistema
/contacto          → Formulario de contacto / CTA a Discord
```

## Los cuatro estratos de usuario

| Estrato | Nivel | Necesidades | Oferta MPD |
|---------|-------|-------------|------------|
| Novato | NL2-NL10 | Orientación, comunidad | Contenido gratuito, onboarding, bot soporte |
| Semi-pro | NL25-NL50 | Herramientas, rakeback | Grupos estudio, servicios, rakeback preferente |
| Profesional | NL100-NL200 | Coaching, datos, condiciones | Análisis avanzado, bancaje, coaching |
| Referente | NL500+ | Audiencia, visibilidad | Acceso a segmento concentrado, salón de la fama |

## Fuentes de ingreso

1. **Rakeback de afiliación** — Core prioritaria
2. **Servicios periféricos** — VPN, datamining, herramientas (alta prioridad)
3. **Cursos trimestrales** — Grupos cerrados max 12 alumnos (complementaria)
4. **Bancaje parcial** — 50/50 bankroll, selectivo (selectiva)
5. **Mentoría premium** — Bundle semestral/anual (futura - fase 3)

## Sistema de saldo interno

El rakeback acumulado se convierte en crédito canjeable dentro del ecosistema. El dinero no sale, la retención aumenta, la fricción desaparece.

## Secciones clave de la landing page

### Hero Section
- Headline impactante con la propuesta de valor
- Subheadline explicando el concepto en una frase
- CTA primario: "Calcula tu rakeback" / "Únete gratis"
- Elemento visual: mockup del dashboard o animación de datos de rakeback
- Social proof: número de jugadores activos, rakeback total distribuido

### Calculadora de Rakeback (Lead Magnet)
- Widget interactivo embebido en la landing
- Inputs: nivel de juego, volumen mensual, sala principal
- Output: estimación de rakeback mensual/anual con MPD vs sin MPD
- CTA post-resultado: "Activa tu rakeback ahora"

### Cómo Funciona
- 3-4 pasos visuales con iconografía custom
- Paso 1: Regístrate y cuéntanos tu nivel
- Paso 2: Te recomendamos sala y te guiamos en el alta
- Paso 3: Juegas — tu rakeback se acumula automáticamente
- Paso 4: Canjea tu saldo por servicios o retíralo

### Ecosistema / Servicios
- Grid de cards con los servicios disponibles
- Cada card: icono + título + descripción breve + estado (disponible/próximamente)
- Servicios: Rakeback optimizado, VPN, Datamining, Herramientas con descuento, Grupos de estudio, Coaching, Bancaje

### Social Proof / Testimonios
- Carousel o grid de testimonios de jugadores
- Métricas destacadas (rakeback total distribuido, jugadores activos, salas disponibles)

### FAQ
- Accordion con las 8-10 preguntas más frecuentes
- Tono directo, respuestas concisas

### CTA Final
- Sección de cierre con CTA fuerte
- "¿Listo para optimizar tu poker?" + botón de registro/Discord

### Footer
- Links de navegación
- Legal mínimo
- Redes sociales (Discord, Instagram)
- © Manager Poker Deal 2026

## Integración Discord

- Login vinculado: cuenta Discord → perfil MPD
- Notificaciones bidireccionales
- Bot con contexto personalizado del jugador
- Control de acceso por roles según estrato
- Registro de actividad alimenta sistema de puntos

## Reglas de desarrollo

1. **Mobile-first** — El jugador de poker está en el móvil constantemente
2. **Performance** — Lighthouse 95+ en todas las métricas
3. **SEO** — Metadata, JSON-LD, OpenGraph optimizado para "rakeback poker", "afiliación poker", "gestión bankroll poker"
4. **Accesibilidad** — WCAG 2.1 AA mínimo
5. **Código limpio** — Componentes reutilizables, naming semántico, zero dead code
6. **No reinventar** — Usar shadcn/ui como base, customizar con la paleta MPD
7. **Animaciones con propósito** — Cada animación debe guiar la atención o comunicar estado, nunca decorativa sin función

## Estructura de archivos esperada

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              # Landing principal
│   ├── calculadora/
│   │   └── page.tsx
│   ├── como-funciona/
│   │   └── page.tsx
│   ├── servicios/
│   │   └── page.tsx
│   └── contacto/
│       └── page.tsx
├── components/
│   ├── ui/                   # shadcn/ui base
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── sections/
│   │   ├── Hero.tsx
│   │   ├── Calculator.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── Services.tsx
│   │   ├── Testimonials.tsx
│   │   ├── FAQ.tsx
│   │   └── FinalCTA.tsx
│   └── shared/
│       ├── AnimatedCounter.tsx
│       ├── GlowCard.tsx
│       └── SectionHeading.tsx
├── lib/
│   ├── utils.ts
│   └── constants.ts
├── styles/
│   └── globals.css
└── types/
    └── index.ts
```

## Contexto de negocio para el desarrollador

- El proyecto arranca con la landing page como herramienta de captación
- La plataforma completa (dashboard, bots, saldo interno) se desarrolla en paralelo con otro equipo
- La landing debe funcionar como standalone y convertir visitantes en registros
- La calculadora de rakeback es el principal lead magnet — debe ser interactiva e inmediata
- Discord es el canal de entrada a la comunidad — todos los CTAs llevan a registro o Discord
- El fundador NO aparece públicamente — todo es marca "Manager Poker Deal"

## Errores conocidos — NO repetir

### [2026-04-22] 13 páginas 404 por NAVIGATION + botones sin `page.tsx`
- **Qué pasó:** el sidebar (`src/lib/constants.ts::NAVIGATION`) y varios `<Link href>` en listings apuntaban a rutas sin `src/app/<ruta>/page.tsx`. Next.js App Router es 100% filesystem-based y devuelve 404 al instante si el fichero no existe. El build de Vercel pasa verde aunque los hrefs estén muertos.
- **Fix:** commit `528689b` — crear 13 pages stubs funcionales usando server actions existentes (`createRoom`, `createService`, `createKnowledgeArticle`, `loadRakeback`, `updateUserBalances`, `sendTicketMessage`). Quitar `disabled:true` de items de sidebar que ya existen.
- **Regla:** SIEMPRE que añadas un item a `NAVIGATION.*` o un `<Link href>`, crea la `page.tsx` correspondiente en la misma PR. Verificar en prod con `curl -s -o /dev/null -w "%{http_code}" URL` — auth redirect = `302` (OK), `404` = falta page.
- **Ver también:** [[Knowledge/Errors/nextjs-orphan-nav-404]] (cross-project).

### [2026-04-22] Vercel CLI token scoping bug post-breach
- **Qué pasó:** tras rotación de token 2026-04-21, el CLI `vercel` rechazaba el token con "cannot set Personal Account as scope". `whoami` OK pero `teams ls`, `link`, `projects` fallaban.
- **Fix:** usar REST API directa (`POST /v10/projects/{id}/env`, `POST /v13/deployments?forceNew=1`) con `team_ndudzZEvrwLBpa5MjJIIZmlD` como teamId explícito. No confiar en el CLI para operaciones scopeadas.

### [2026-04-22] `prisma.update` con WHERE no-unique falla
- **Qué pasó:** `prisma.paymentIntent.update({ where: { id, creditedAt: null }, ... })` → error typecheck. Prisma `update` solo acepta UNIQUE en where.
- **Fix:** usar `updateMany({ where: { id, creditedAt: null }, data: {...} })` y chequear `result.count === 1` para idempotencia exactly-once.

### [2026-04-22] `navigator.clipboard` narrowing a `never` en strict TS
- **Qué pasó:** `navigator as Navigator & { share: ... }` — el cast no propaga y TS infiere `never` para `clipboard`.
- **Fix:** usar `window.navigator as unknown as { share?: ...; clipboard?: ... }` para hacer double-cast explícito.
- Target: jugadores hispanohablantes de poker online, principalmente España y Latinoamérica