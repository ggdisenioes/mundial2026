# ggdisenio.es — Auditoría y plan de producto

**Fecha:** 6 de julio de 2026
**Alcance:** auditoría basada exclusivamente en información pública (el sitio en vivo y su código no eran accesibles desde la sesión). Los hallazgos afirmados como hechos fueron verificados desde fuera; todo lo demás está marcado como *a verificar* con instrucciones para comprobarlo.
**Objetivo de negocio:** que ggdisenio.es represente a una agencia de desarrollo web e IA de excelencia, con 10 años de trayectoria, donde **nada falle** — porque el sitio de una agencia web ES su portfolio.

---

## 1. Resumen ejecutivo

**North star:** *cada visita al sitio debe salir con la sensación de "si su propio sitio es así de bueno, quiero que hagan el mío".* Todo lo que sigue se subordina a eso.

**Estado conocido hoy (verificado desde fuera):**

| # | Hallazgo | Severidad |
|---|----------|-----------|
| 1 | Solo la **home** está indexada en Google (`site:ggdisenio.es` → 1 resultado) | 🔴 Alta |
| 2 | El sitio devuelve **403 a bots legítimos** (fetchers, readers) — WAF demasiado agresivo | 🔴 Alta |
| 3 | El dominio antiguo **ggdisenio.com aparece como expirado/parked** en Google | 🔴 Alta |
| 4 | Hosting en **Vercel** (IP 216.198.79.1) — plataforma correcta, buen punto de partida | 🟢 OK |
| 5 | Título/posicionamiento actual: "GG Diseño \| Agencia de Desarrollo Web, IA y Automatización", "+20 proyectos exitosos" | 🟡 Mejorable |

**Top 5 acciones (si solo haces cinco cosas, que sean estas):**

1. **Tapar las fugas** — redirigir o recuperar ggdisenio.com con 301 a ggdisenio.es y afinar el WAF para no bloquear bots buenos (Bing, previews de WhatsApp/LinkedIn). Es tráfico y reputación que se pierde hoy, todos los días.
2. **Hacer el sitio indexable** — sitemap.xml, robots.txt, Google Search Console, y una arquitectura de páginas por servicio en vez de (o además de) una one-page.
3. **Casos de estudio reales** — convertir los "+20 proyectos" en 4–6 casos con problema → solución → resultado medible. Es el activo de conversión #1 de una agencia.
4. **Un funnel de contacto que no falle nunca** — formulario corto con validación, estados de éxito/error, notificación redundante (email + registro en base de datos), y test E2E automático que lo verifique en cada deploy.
5. **Instrumentar todo** — analítica, error tracking (Sentry), uptime monitoring y Lighthouse CI. "Que nada falle" no es una aspiración, es un sistema de detección.

---

## 2. Hallazgos verificados desde fuera

### 2.1 Indexación: Google solo ve la home 🔴

La búsqueda `site:ggdisenio.es` devuelve **un único resultado**. Para una agencia que vende desarrollo web (y presumiblemente SEO), esto es un problema doble:

- **Negocio:** no existe superficie de captación orgánica. Nadie que busque "desarrollo web madrid", "automatización con IA para pymes" o "agencia Next.js" puede aterrizar en una página tuya que hable de eso.
- **Credibilidad:** un cliente sofisticado que haga esta misma comprobación (los hay) verá que la agencia no aplica en su propio sitio lo que vende.

Causas probables (a confirmar en la auditoría guiada, §3): sitio one-page sin más URLs, falta de sitemap, páginas con `noindex`, o el WAF bloqueando crawlers (ver 2.2).

### 2.2 WAF que bloquea bots legítimos 🔴

Durante esta auditoría, el sitio devolvió **HTTP 403** a múltiples fetchers no maliciosos. Googlebot pasa (la home está indexada), pero un 403 indiscriminado a otros agentes suele afectar a:

- **Bing/DuckDuckGo** → invisibilidad en ~5–10% del mercado de búsqueda español.
- **Previews de enlaces** en WhatsApp, LinkedIn, Slack, Telegram, X → cuando compartas el sitio con un cliente potencial, puede aparecer sin imagen ni título. Para una agencia, ese preview es una tarjeta de presentación.
- **Herramientas de auditoría y monitoreo** (PageSpeed de terceros, uptime checkers, validadores).

Probablemente es el **Vercel WAF / Bot Protection en modo challenge o deny**. La corrección es de minutos: pasar a modo *log* o crear excepciones para verified bots.

### 2.3 ggdisenio.com expirado/parked 🔴

Google todavía lista páginas del sitio antiguo (WordPress "GG Web": contacto, aviso legal, políticas) y a la vez muestra el dominio raíz como **"Your domain is expired"**. Consecuencias:

- Los **backlinks y la antigüedad** del dominio .com (parte de esos "10 años de trayectoria") se están perdiendo en vez de transferirse por 301 al .es.
- Cualquier tercero puede **registrar el dominio caducado** y colgar lo que quiera bajo tu marca histórica.
- Clientes antiguos con el .com guardado en favoritos o en emails llegan a una página de dominio caducado — la peor primera impresión posible.

**Acción:** verificar en el registrador si aún está en periodo de gracia y renovarlo, aunque sea solo para redirigir. Coste ~10 €/año; el daño de marca de no hacerlo es muy superior.

### 2.4 Plataforma: Vercel 🟢

El dominio resuelve a infraestructura de Vercel. Es la plataforma adecuada para el stack (presumiblemente Next.js, como tus otros proyectos): deploys atómicos, previews por rama, edge network, HTTPS automático. El plan de excelencia técnica (§4, W4) se apoya en capacidades que ya tienes: Vercel Analytics/Speed Insights, cabeceras vía `next.config`/`vercel.json`, y checks de CI antes de producción.

### 2.5 Posicionamiento actual 🟡

"Agencia de Desarrollo Web, IA y Automatización" + "+20 proyectos exitosos" es un buen punto de partida, pero es **la misma frase que usan cientos de agencias**. Los 10 años de experiencia y la especialización en IA aplicada son diferenciales reales que hoy no se están explotando (ver W1).

---

## 3. Auditoría guiada de 60 minutos

Lo que no pude verificar desde fuera, verificalo así (o habilitá el acceso y lo hago yo). Cada ítem tiene criterio de aprobado.

| # | Prueba | Cómo | Aprobado si… |
|---|--------|------|--------------|
| A1 | Rendimiento móvil | [PageSpeed Insights](https://pagespeed.web.dev) → ggdisenio.es, pestaña Móvil | Performance ≥ 90, LCP < 2.5 s, CLS < 0.1, INP < 200 ms |
| A2 | Indexación | Alta en [Google Search Console](https://search.google.com/search-console) → informe Cobertura | Todas las páginas relevantes "Indexada"; cero "Rastreada, sin indexar" inesperadas |
| A3 | Sitemap y robots | Visitar `/sitemap.xml` y `/robots.txt` | Ambos existen; el sitemap lista todas las páginas; robots no bloquea nada crítico |
| A4 | WAF | Vercel Dashboard → Firewall → logs de las últimas 24 h | Ningún 403 a Bingbot, DuckDuckBot, WhatsApp, LinkedInBot, facebookexternalhit, Twitterbot |
| A5 | Preview social | Pegar la URL en [opengraph.xyz](https://www.opengraph.xyz) y en un chat de WhatsApp | Aparecen título, descripción e imagen OG correctos |
| A6 | Formulario de contacto | Enviarse un mensaje de prueba real, y otro con datos inválidos | Llega el email + queda registro; los errores se muestran en línea, sin perder lo escrito |
| A7 | Rutas rotas | Visitar una URL inexistente (`/loremipsum`) y clicar todos los enlaces del sitio | 404 con página propia y navegación de vuelta; cero enlaces rotos |
| A8 | Accesibilidad | Lighthouse pestaña Accessibility + navegar todo el sitio solo con teclado (Tab/Enter) | Score ≥ 95; todo alcanzable y visible el foco |
| A9 | Cabeceras de seguridad | [securityheaders.com](https://securityheaders.com) | Nota A o superior (HSTS, CSP, X-Content-Type-Options, Referrer-Policy) |
| A10 | Legal RGPD | Buscar en el sitio: aviso legal, privacidad, cookies, banner de consentimiento | Las tres páginas existen y el banner bloquea cookies no esenciales hasta aceptar |
| A11 | Consistencia responsive | Probar en móvil real: 360px, y en desktop 1440px+ | Sin scroll horizontal, sin textos cortados, imágenes nítidas |
| A12 | Marca | ¿Favicon, título de pestaña, imagen OG, firma del footer coherentes? | Identidad consistente en todos los puntos de contacto |

**Regla de oro:** cualquier ítem que falle se convierte en ticket del backlog (§7) con su prioridad ya asignada según el workstream al que pertenece.

---

## 4. Workstreams

Prioridad MoSCoW: **M** = Must (sin esto no hay excelencia), **S** = Should, **C** = Could.

### W0 · Tapar fugas urgentes — *esta semana*

*Objetivo: dejar de perder tráfico, reputación y leads hoy.*

| Ticket | Prioridad | Esfuerzo | Criterio de aceptación |
|--------|-----------|----------|------------------------|
| W0.1 Recuperar/renovar ggdisenio.com y redirigir 301 todo → ggdisenio.es (mapeando rutas antiguas: `/contacto/` → `/contacto`, etc.) | M | S | `curl -I ggdisenio.com/contacto/` devuelve 301 a la página equivalente del .es |
| W0.2 Afinar Vercel WAF: verified bots permitidos, challenge solo para tráfico anómalo | M | S | Ítem A4 de la auditoría en verde; preview de WhatsApp funciona |
| W0.3 Crear `sitemap.xml` + `robots.txt` (en Next.js: `app/sitemap.ts` y `app/robots.ts`) | M | S | A3 en verde |
| W0.4 Alta y verificación en Google Search Console + Bing Webmaster Tools; enviar sitemap | M | S | Sitemap procesado sin errores |
| W0.5 Test manual completo del formulario de contacto (A6) y corrección de lo que falle | M | S–M | A6 en verde |

### W1 · Confianza y narrativa de marca — *semanas 2–4*

*Objetivo: que el sitio cuente la historia de una agencia con 10 años de experiencia y especialización real en IA, no otra landing genérica.*

| Ticket | Prioridad | Esfuerzo | Criterio de aceptación |
|--------|-----------|----------|------------------------|
| W1.1 Propuesta de valor nueva en el hero: específica, con los 10 años y el diferencial IA (ej.: "10 años construyendo webs y plataformas. Ahora, con IA que trabaja para tu negocio.") | M | S | Un desconocido entiende qué hacés y para quién en < 5 segundos |
| W1.2 4–6 **casos de estudio** de los +20 proyectos: contexto del cliente → problema → solución → resultado con número (velocidad, leads, ventas, horas ahorradas) | M | L | Cada caso tiene una métrica verificable y al menos 1 imagen real del proyecto |
| W1.3 Testimonios reales con nombre, empresa y foto (pedir a los mejores clientes; 3–5 alcanzan) | M | M | Mínimo 3 testimonios publicados con atribución completa |
| W1.4 Página "Cómo trabajamos": proceso en 4–5 pasos (descubrimiento → propuesta → desarrollo con previews → lanzamiento → mantenimiento) | S | M | Página publicada y enlazada desde el nav |
| W1.5 Página "Sobre nosotros" con la historia de los 10 años, quién está detrás, y por qué IA + automatización ahora | S | M | Página publicada; incluye foto/identidad real (la gente contrata a personas) |
| W1.6 Logos de clientes / tecnologías dominadas (Next.js, Vercel, Supabase, Claude/OpenAI…) como franja de credibilidad | C | S | Franja visible en la home sin dañar CLS |

### W2 · Arquitectura de información y SEO — *mes 2*

*Objetivo: pasar de "1 página indexada" a una superficie orgánica que capte demanda real.*

| Ticket | Prioridad | Esfuerzo | Criterio de aceptación |
|--------|-----------|----------|------------------------|
| W2.1 Arquitectura: home + `/servicios/desarrollo-web`, `/servicios/ia-y-automatizacion`, `/servicios/mantenimiento`, `/proyectos` (+ 1 página por caso de estudio), `/sobre-nosotros`, `/contacto` | M | L | Todas las URLs viven, están en el sitemap y enlazadas entre sí |
| W2.2 Metadata por página: `title` único (≤ 60 car.), `description` (≤ 155), OG image por página (puede generarse con `@vercel/og`) | M | M | A5 en verde para todas las páginas |
| W2.3 JSON-LD: `Organization` + `LocalBusiness` (Madrid) en la home; `Service` en páginas de servicio; `Review` si hay testimonios | S | M | [Rich Results Test](https://search.google.com/test/rich-results) sin errores |
| W2.4 Keywords objetivo por página (ej.: "desarrollo web a medida madrid", "automatización procesos ia pymes") documentadas y aplicadas en H1/title/contenido | S | M | Cada página tiene 1 keyword primaria y aparece en H1 + title |
| W2.5 Blog/recursos: 1 artículo/mes que demuestre expertise en IA aplicada (casos, comparativas, guías) | C | L (continuo) | 3 artículos publicados en el trimestre |

### W3 · Conversión — *semanas 2–4, en paralelo con W1*

*Objetivo: que el visitante interesado tenga un camino obvio, corto y sin fricción hasta hablar contigo.*

| Ticket | Prioridad | Esfuerzo | Criterio de aceptación |
|--------|-----------|----------|------------------------|
| W3.1 Un CTA primario único y repetido ("Agenda una llamada gratuita" o "Cuéntanos tu proyecto") en hero, tras casos de estudio y en footer | M | S | Un solo CTA primario por vista; contraste AA |
| W3.2 Formulario mínimo (nombre, email, "¿qué necesitas?") con validación en línea, estado de envío, mensaje de éxito y fallback si el envío falla | M | M | A6 en verde; tasa de error de envío 0% en Sentry |
| W3.3 Canal alternativo de baja fricción: botón WhatsApp Business y/o Calendly embebido | S | S | Click-to-chat funcional desde móvil |
| W3.4 Prueba social above the fold (testimonio corto o "+20 proyectos · 10 años" con sustancia detrás) | S | S | Visible sin scroll en móvil 360px |
| W3.5 Medir el funnel: eventos de analítica en vista de CTA, click, envío de formulario | M | S | Dashboard con conversión visita→lead |

### W4 · Excelencia técnica: "que NADA falle" — *continuo, arranca semana 1*

*Objetivo: convertir "nada falla" en un sistema: prevención en CI, detección en producción, corrección con SLA propio.*

| Ticket | Prioridad | Esfuerzo | Criterio de aceptación |
|--------|-----------|----------|------------------------|
| W4.1 **Prevención:** CI en GitHub Actions con typecheck + lint + build en cada push; Vercel preview por rama | M | S | Ningún deploy a producción con build roto |
| W4.2 **Prevención:** Lighthouse CI con presupuesto (perf ≥ 90 móvil, a11y ≥ 95) que falla el PR si se degrada | S | M | Presupuesto activo en CI |
| W4.3 **Prevención:** test E2E con Playwright del flujo crítico (cargar home → navegar → enviar formulario) en cada deploy | M | M | Test corre en CI y contra producción post-deploy |
| W4.4 **Detección:** Sentry (o similar) para errores JS y de servidor, con alerta a tu email/WhatsApp | M | S | Error provocado a propósito genera alerta en < 5 min |
| W4.5 **Detección:** uptime monitoring externo (UptimeRobot/Checkly, ping cada 1–5 min a home y endpoint del formulario) | M | S | Alerta ante caída simulada |
| W4.6 Core Web Vitals reales: Vercel Speed Insights activo; optimizar imágenes (`next/image`, AVIF/WebP), fuentes (`next/font`, sin FOIT), JS mínimo | M | M | A1 en verde con datos de campo, no solo lab |
| W4.7 Accesibilidad WCAG 2.2 AA: contraste, foco visible, alt en imágenes, formulario etiquetado, navegación por teclado, `prefers-reduced-motion` respetado en animaciones | M | M | A8 en verde + revisión manual con teclado |
| W4.8 Cabeceras de seguridad en `next.config`/`vercel.json`: HSTS, CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy | S | S | A9 = nota A |
| W4.9 Página 404 propia con navegación de vuelta y CTA; página de error 500 amable | S | S | A7 en verde |
| W4.10 Higiene de repo: eliminar archivos que no deben versionarse (¡en mundial2026 hay un `.env.vercel` commiteado! — auditar el repo del sitio por lo mismo), rotar cualquier secreto expuesto | M | S | Cero secretos en el historial accesible; `.gitignore` cubre `.env*` |

> ⚠️ **Nota sobre W4.10:** en el repo mundial2026 (visible en esta sesión) hay un archivo `.env.vercel` commiteado. Si el repo del sitio de la agencia sigue el mismo patrón, es prioritario: los secretos en git son de las fallas más comunes y evitables. Rotar claves además de borrarlas, porque el historial las conserva.

### W5 · Legal (España) — *mes 2*

*Objetivo: cumplimiento LSSI-CE y RGPD — obligatorio por ley y señal de profesionalismo que los clientes corporativos revisan.*

| Ticket | Prioridad | Esfuerzo | Criterio de aceptación |
|--------|-----------|----------|------------------------|
| W5.1 Aviso legal con datos identificativos del prestador (LSSI-CE art. 10) | M | S | Página publicada y enlazada en footer |
| W5.2 Política de privacidad RGPD: qué datos recoge el formulario, base legal, plazos, derechos ARSOPOL, encargados (Vercel, proveedor de email) | M | S–M | Página publicada; el formulario enlaza a ella con checkbox de consentimiento |
| W5.3 Política de cookies + banner de consentimiento que **bloquea** analítica/marketing hasta aceptar (criterio AEPD) | M | M | A10 en verde; sin cookies no esenciales antes del consentimiento |

---

## 5. Roadmap

```
Semana 1        W0 completo (fugas) + W4.1/4.4/4.5/4.10 (CI, Sentry, uptime, higiene)
Semanas 2–4     W1 (narrativa y casos de estudio) + W3 (conversión)   ← el grueso del valor
Mes 2           W2 (arquitectura y SEO) + W5 (legal) + W4.2/4.3/4.6–4.9
Continuo        W2.5 (contenido) + monitoreo W4 + revisión mensual de KPIs
```

**Dependencias clave:**
- W2.1 (arquitectura) necesita W1.2 (casos de estudio escritos) para tener contenido real — no lanzar páginas vacías.
- W2.2/W2.3 (metadata/schema) dependen de W2.1.
- W3.5 (medición) debe estar activo **antes** de los cambios de W1/W3 para poder comparar antes/después.
- W0 no depende de nada: empezar ya.

---

## 6. KPIs y definición de éxito

| KPI | Hoy (estimado) | Meta 90 días | Fuente |
|-----|----------------|--------------|--------|
| Páginas indexadas en Google | 1 | ≥ 10 | Search Console |
| Performance móvil (Lighthouse, campo) | a verificar (A1) | ≥ 90 | Speed Insights |
| Leads/mes vía formulario o WhatsApp | a verificar | tendencia +50% vs. baseline | Analítica (W3.5) |
| Errores JS sin resolver en producción | sin visibilidad | 0 (con alertas < 5 min) | Sentry |
| Uptime | sin visibilidad | ≥ 99.9% | UptimeRobot/Checkly |
| Accesibilidad | a verificar (A8) | ≥ 95 + auditoría manual OK | Lighthouse CI |
| Nota de cabeceras de seguridad | a verificar (A9) | A | securityheaders.com |
| Posición para keyword primaria local | fuera del top 50 (probable) | top 20 y subiendo | Search Console |

**Definición de "nada falla" (contrato contigo mismo):** todo deploy pasa CI + E2E; todo error de producción alerta en < 5 minutos; el formulario se prueba automáticamente a diario; caída de uptime o de CWV = ticket inmediato. Si no está monitorizado, se asume roto.

---

## 7. Backlog priorizado (vista única)

Orden de ejecución sugerido. Esfuerzo: S < ½ día · M = 1–2 días · L = 3+ días.

| # | Ticket | WS | Pri | Esf |
|---|--------|----|-----|-----|
| 1 | Renovar/redirigir ggdisenio.com (301) | W0.1 | M | S |
| 2 | Afinar WAF de Vercel (verified bots) | W0.2 | M | S |
| 3 | sitemap.xml + robots.txt | W0.3 | M | S |
| 4 | Search Console + Bing WMT | W0.4 | M | S |
| 5 | Test y fix del formulario de contacto | W0.5 | M | S–M |
| 6 | CI: typecheck + lint + build | W4.1 | M | S |
| 7 | Sentry con alertas | W4.4 | M | S |
| 8 | Uptime monitoring | W4.5 | M | S |
| 9 | Higiene de secretos en repos | W4.10 | M | S |
| 10 | Eventos de analítica del funnel | W3.5 | M | S |
| 11 | Nueva propuesta de valor en hero | W1.1 | M | S |
| 12 | CTA primario único | W3.1 | M | S |
| 13 | Formulario con validación y estados | W3.2 | M | M |
| 14 | 4–6 casos de estudio | W1.2 | M | L |
| 15 | 3–5 testimonios con atribución | W1.3 | M | M |
| 16 | WhatsApp/Calendly | W3.3 | S | S |
| 17 | Prueba social above the fold | W3.4 | S | S |
| 18 | Arquitectura multi-página | W2.1 | M | L |
| 19 | Metadata + OG por página | W2.2 | M | M |
| 20 | Test E2E Playwright del funnel | W4.3 | M | M |
| 21 | Optimización CWV (imágenes, fuentes, JS) | W4.6 | M | M |
| 22 | Accesibilidad WCAG 2.2 AA | W4.7 | M | M |
| 23 | Aviso legal + privacidad + cookies | W5.1–3 | M | M |
| 24 | JSON-LD (Organization/LocalBusiness/Service) | W2.3 | S | M |
| 25 | Cabeceras de seguridad | W4.8 | S | S |
| 26 | Páginas 404/500 propias | W4.9 | S | S |
| 27 | Página "Cómo trabajamos" | W1.4 | S | M |
| 28 | Página "Sobre nosotros" (10 años) | W1.5 | S | M |
| 29 | Lighthouse CI con presupuesto | W4.2 | S | M |
| 30 | Blog: 1 artículo/mes | W2.5 | C | L |

---

## Anexo: cómo desbloquear una auditoría completa

Este plan se hizo sin acceso al sitio ni a su código. Para una segunda pasada con hallazgos concretos línea por línea:

1. **Agregar el repo del sitio** a una sesión de Claude Code (`add_repo`), o
2. **Permitir el dominio** ggdisenio.es en la configuración de red del entorno (claude.ai/code → Settings → Environments), para auditar el sitio en vivo: HTML real, CWV, enlaces rotos, metadata, accesibilidad.

Con cualquiera de los dos, los ítems "a verificar" de la sección 3 se resuelven automáticamente y el backlog se refina con evidencia real.
