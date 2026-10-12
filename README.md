# LoLStats

[![CI](https://github.com/MK-1379/lol-stats/actions/workflows/ci.yml/badge.svg)](https://github.com/MK-1379/lol-stats/actions/workflows/ci.yml)

Panel personal con mis estadísticas de League of Legends en clasificatoria Solo/Dúo (EUW, **M0n0kuum44#SSJ**), construido sobre la API oficial de Riot Games.

Un *worker* descarga mis partidas cada 30 minutos y las guarda en MySQL. Una API REST propia calcula las estadísticas y un frontend en React las muestra con un diseño inspirado en las webs de estadísticas como OP.GG. El navegador nunca llama a Riot: la clave de la API solo vive en el servidor.

![Resumen](docs/capturas/resumen.png)

| Marcador de una partida | Móvil |
| --- | --- |
| ![Marcador](docs/capturas/marcador.png) | ![Móvil](docs/capturas/movil.png) |

## Funcionalidades

- **Resumen:** rango actual con su emblema, PL que faltan para la siguiente división y forma en las últimas 20 partidas (winrate, KDA medio y posiciones).
- **Historial:** últimas 100 partidas con filtros por resultado y posición.
- **Puntuación por partida (0-10):** fórmula propia que pondera KDA, muertes, farmeo o visión según la posición y la victoria, con el desglose de cada parte.
- **Marcador:** los 10 jugadores de cada partida, con daño, oro, CS, visión, MVP y enlace a su perfil de OP.GG.
- **Campeones:** tabla ordenable por partidas, winrate o KDA, con buscador.
- **Rendimiento:** evolución de los PL (7, 30 o 90 días) y tendencia de KDA, CS/min y visión, con vista de tabla accesible.
- Tema claro y oscuro, diseño adaptable a móvil y navegación por teclado.

## Arquitectura

```mermaid
flowchart LR
    riot[API de Riot] -->|cada 30 min| worker
    worker -->|Prisma| db[(MySQL)]
    api["API REST<br>Express"] -->|Prisma| db
    web["React<br>servido por nginx"] -->|/api| api
    usuario((Navegador)) --> web
```

Cuatro servicios en Docker Compose:

| Servicio | Qué hace | Puerto local |
| --- | --- | --- |
| `db` | MySQL 8.4 con un volumen para los datos | 3308 |
| `worker` | Sincroniza jugador, rango, partidas y marcadores con node-cron | — |
| `api` | API REST: `/api/summary`, `/matches`, `/matches/:id/scoreboard`, `/champions`, `/rank-history`, `/trends` | 3000 |
| `web` | nginx sirve el build de React y redirige `/api` al contenedor `api` | 8080 |

El servidor está organizado en capas: `routes` → `controllers` (validación con Zod) → `services` (cálculos) → `repositories` (consultas con Prisma). `api` y `worker` comparten código y usan la misma imagen.

## Tecnologías

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, TanStack Query, Recharts.
- **Backend:** Node.js 24, Express 5, TypeScript, Zod, Prisma 7, node-cron.
- **Base de datos:** MySQL 8.4.
- **Calidad:** Vitest, Supertest, Testing Library, ESLint y GitHub Actions.
- **Infraestructura:** Docker Compose y nginx.

## Cómo ejecutarlo

Requisitos: Docker con Docker Compose, Node.js 24 y una clave de la API de Riot ([developer.riotgames.com](https://developer.riotgames.com)).

1. Clona el repositorio y crea el archivo de entorno:

   ```bash
   git clone https://github.com/MK-1379/lol-stats.git
   cd lol-stats
   cp .env.example .env
   ```

   Rellena `.env` con tu clave de Riot, tu Riot ID y las contraseñas de MySQL. `DATABASE_URL` es la conexión desde tu equipo, por ejemplo `mysql://lolstats:cambia_esto@localhost:3308/lolstats`, con la misma contraseña que `MYSQL_PASSWORD`.

2. Arranca la base de datos y aplica las migraciones:

   ```bash
   docker compose up -d db
   cd server
   npm ci
   npx prisma migrate deploy
   cd ..
   ```

3. Arranca el resto de servicios y abre http://localhost:8080:

   ```bash
   docker compose up -d --build
   ```

La primera sincronización se ejecuta al arrancar el worker. Puedes seguirla con `docker compose logs -f worker`.

## Desarrollo y tests

```bash
cd server && npm run dev
cd web && npm run dev
```

El frontend en modo desarrollo se abre en http://localhost:5173 y Vite redirige `/api` a la API.

```bash
cd server && npm test
cd web && npm test
```

- **Server:** tests de la API con Supertest y repositorios simulados, y del cliente de Riot con `fetch` simulado.
- **Web:** tests de la puntuación, los formatos y el historial (filtros, paginación y carga del marcador) con Testing Library.

GitHub Actions ejecuta en cada push el lint, los tests y el build de las dos partes y construye las imágenes de Docker. Los tests no necesitan una clave real de Riot.

## Decisiones

- **Solo una cuenta.** La clave personal de Riot está pensada para mostrar tus propias estadísticas. Un buscador de cualquier jugador necesitaría una clave de producción.
- **Fotos del rango.** Riot no da el historial de PL, así que el worker guarda una foto del rango en cada sincronización y la gráfica se construye a partir de ellas.
- **El marcador va en otra tabla** (`ScoreboardEntry`) para que las estadísticas propias sigan leyendo solo mis filas de `MatchParticipant`.
- **La puntuación no es IA:** es una fórmula transparente cuyo desglose se puede consultar en cada partida.
- Las partidas de menos de 5 minutos (remakes) no se guardan.

## Aviso legal

LoLStats no está respaldado por Riot Games y no refleja las opiniones de Riot Games ni de nadie oficialmente involucrado en la producción o gestión de las propiedades de Riot Games. Riot Games y todas las propiedades asociadas son marcas comerciales o marcas registradas de Riot Games, Inc.
