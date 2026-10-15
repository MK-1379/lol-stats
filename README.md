# LoLStats

[![CI](https://github.com/MK-1379/lol-stats/actions/workflows/ci.yml/badge.svg)](https://github.com/MK-1379/lol-stats/actions/workflows/ci.yml)

A personal dashboard with my League of Legends Ranked Solo/Duo stats (EUW, **M0n0kuum44#SSJ**), built on the official Riot Games API.

**Live demo:** https://lolstats-mk.duckdns.org

A worker downloads my matches every 30 minutes and stores them in MySQL. A custom REST API computes the stats, and a React frontend displays them with a design inspired by stats sites like OP.GG. The browser never calls Riot: the API key only lives on the server.

![Overview](docs/screenshots/overview.png)

| Match scoreboard | Mobile |
| --- | --- |
| ![Scoreboard](docs/screenshots/scoreboard.png) | ![Mobile](docs/screenshots/mobile.png) |

## Features

- **Overview:** current rank with its emblem, LP left until the next division, and form over the last 20 matches (win rate, average KDA and roles played).
- **Match history:** the last 100 matches, filterable by result and role.
- **Performance score (0-10):** a custom formula that weighs KDA, deaths, farming or vision depending on the role, and the result, with a breakdown of each part.
- **Scoreboard:** all 10 players of each match, with damage, gold, CS, vision, the MVP and a link to their OP.GG profile.
- **Champions:** a table sortable by games, win rate or KDA, with search.
- **Performance:** LP progression (7, 30 or 90 days) and KDA, CS/min and vision trends, each with an accessible table view.
- Light and dark themes, responsive layout and keyboard navigation.

## Architecture

```mermaid
flowchart LR
    riot[Riot API] -->|every 30 min| worker
    worker -->|Prisma| db[(MySQL)]
    api["REST API<br>Express"] -->|Prisma| db
    web["React<br>served by nginx"] -->|/api| api
    user((Browser)) --> web
```

Four services in Docker Compose:

| Service | What it does | Local port |
| --- | --- | --- |
| `db` | MySQL 8.4 with a volume for the data | 3308 |
| `worker` | Syncs player, rank, matches and scoreboards with node-cron | — |
| `api` | REST API: `/api/summary`, `/matches`, `/matches/:id/scoreboard`, `/champions`, `/rank-history`, `/trends` | 3000 |
| `web` | nginx serves the React build and proxies `/api` to the `api` container | 8080 |

The server is split into layers: `routes` → `controllers` (validation with Zod) → `services` (calculations) → `repositories` (queries with Prisma). `api` and `worker` share the same code and Docker image.

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, TanStack Query, Recharts.
- **Backend:** Node.js 24, Express 5, TypeScript, Zod, Prisma 7, node-cron.
- **Database:** MySQL 8.4.
- **Quality:** Vitest, Supertest, Testing Library, ESLint and GitHub Actions.
- **Infrastructure:** Docker Compose and nginx, deployed on an Oracle Cloud ARM VM with Caddy for HTTPS.

## Getting started

Requirements: Docker with Docker Compose, Node.js 24 and a Riot API key ([developer.riotgames.com](https://developer.riotgames.com)).

1. Clone the repository and create the environment file:

   ```bash
   git clone https://github.com/MK-1379/lol-stats.git
   cd lol-stats
   cp .env.example .env
   ```

   Fill in `.env` with your Riot API key, your Riot ID and the MySQL passwords. `DATABASE_URL` is the connection from your machine, for example `mysql://lolstats:change_me@localhost:3308/lolstats`, using the same password as `MYSQL_PASSWORD`.

2. Start the database and apply the migrations:

   ```bash
   docker compose up -d db
   cd server
   npm ci
   npx prisma migrate deploy
   cd ..
   ```

3. Start the remaining services and open http://localhost:8080:

   ```bash
   docker compose up -d --build
   ```

The first sync runs when the worker starts. You can follow it with `docker compose logs -f worker`.

## Development and tests

```bash
cd server && npm run dev
cd web && npm run dev
```

In development the frontend runs at http://localhost:5173 and Vite proxies `/api` to the API.

```bash
cd server && npm test
cd web && npm test
```

- **Server:** API tests with Supertest and mocked repositories, and Riot client tests with a mocked `fetch`.
- **Web:** tests for the score formula, the formatters and the match history (filters, pagination and scoreboard loading) with Testing Library.

On every push, GitHub Actions runs the linter, the tests and the build for both parts, and builds the Docker images. The tests don't need a real Riot API key.

## Design decisions

- **A single account.** Riot's personal API key is meant for showing your own stats. Searching any player would need a production key.
- **Rank snapshots.** Riot doesn't provide LP history, so the worker stores a snapshot of the rank on every sync and the chart is built from those snapshots.
- **The scoreboard has its own table** (`ScoreboardEntry`), so my own stats keep reading only my rows in `MatchParticipant`.
- **The score isn't AI:** it's a transparent formula, and its breakdown can be checked on every match.
- Matches shorter than 5 minutes (remakes) aren't stored.

## Legal

LoLStats isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
