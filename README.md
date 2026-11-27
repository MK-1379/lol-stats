# LoLStats

[![CI](https://github.com/MK-1379/lol-stats/actions/workflows/ci.yml/badge.svg)](https://github.com/MK-1379/lol-stats/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React-19-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)
![Node.js](https://img.shields.io/badge/Node.js-24-5fa04e)
![MySQL](https://img.shields.io/badge/MySQL-8.4-00758f)

A full-stack League of Legends stats dashboard for my own account (**M0n0kuum44#SSJ**, EUW), built with React, TypeScript, Node.js and the official Riot Games API.

**Live demo:** https://lolstats-mk.duckdns.org

A background worker downloads my matches, ranks and champion mastery from the Riot API and stores them in MySQL. A REST API turns that data into stats, a performance score, coaching tips and champion builds, and a React frontend shows it all in a dashboard inspired by sites like OP.GG. The browser never talks to Riot: the API key only lives on the server.

<p align="center">
  <img src="docs/screenshots/overview.webp" alt="Profile overview with ranked cards, mastery, recent form and match history" width="100%">
</p>

<table>
  <tr>
    <td align="center"><img src="docs/screenshots/scoreboard.webp" alt="Expanded match with the scoreboard of all 10 players and the score breakdown" width="560"></td>
    <td align="center"><img src="docs/screenshots/mobile.webp" alt="Profile on a mobile screen" width="280"></td>
  </tr>
  <tr>
    <td align="center"><sub>Match scoreboard and score breakdown</sub></td>
    <td align="center"><sub>Mobile layout</sub></td>
  </tr>
</table>

## Highlights

- **End-to-end project:** data ingestion from an external API, a relational database, a layered REST API, a React SPA, tests, CI/CD and a production deployment.
- **Rate-limit aware worker:** three scheduled jobs (my matches every 30 minutes, high-elo matches every hour, champion data every night) that only request what isn't stored yet.
- **Explainable metrics:** the 0-10 performance score and the coaching tips are transparent rules, tested and shown with their breakdown, not a black box.
- **Accessible and responsive:** keyboard navigation, screen reader labels, table views for every chart, light and dark themes and animations that respect "reduce motion".
- **Automated delivery:** every push to `main` runs lint, tests and builds, builds the Docker images and deploys to an Oracle Cloud VM over SSH.

## Features

### Profile

- **Queue filter:** SoloQ+Flex, SoloQ or Flex. Every tab refetches its data for the selected queue and the choice is remembered.
- **Overview:** current rank in each queue with its emblem, LP to the next division and the peak rank reached, top 3 champion masteries, and form over the last 20 matches (win rate, average KDA, score and roles played).
- **Match history:** the last 100 matches, filterable by result and role.
- **Scoreboard:** all 10 players of each match with damage, gold, CS and vision, the MVP and the breakdown of my score.
- **Performance score (0-10):** weighs KDA, deaths, vision, CS or assists depending on the role, plus the result.

<p align="center">
  <img src="docs/screenshots/performance.webp" alt="Rank evolution chart and KDA trend chart" width="100%">
</p>

- **Champions:** a table sortable by games, win rate or KDA, with search.
- **Performance:** LP progression over 7, 30 or 90 days and KDA, CS/min and vision trends.
- **Coach:** compares my stats with my lane opponent (gold difference, deaths, CS, vision, kill participation), picks the 3 things to improve, my strengths and a weekly goal. An optional AI summary turns the report into a short text.

<p align="center">
  <img src="docs/screenshots/coach.webp" alt="Coach tab with AI summary, weekly goal and three tips" width="100%">
</p>

### Champion builds

Clicking any champion icon opens `/campeon/:champion` with the recommended build for each position: runes, summoner spells, starting items, core build, boots, late items and skill order, each option with its win rate and number of games.

The build is aggregated from the 10 players of every stored match: my own games plus a sample of Master+ EUW matches that the worker collects every hour and keeps for 14 days.

<p align="center">
  <img src="docs/screenshots/build.webp" alt="Nami build page with runes, spells, items and skill order" width="100%">
</p>

## Architecture

```mermaid
flowchart LR
    riot[Riot API] -->|scheduled jobs| worker
    ddragon[Data Dragon] -->|items, runes, champions| worker
    worker -->|Prisma| db[(MySQL)]
    api["REST API<br>Express"] -->|Prisma| db
    api -->|optional| ai[AI summary]
    web["React SPA<br>served by nginx"] -->|/api| api
    user((Browser)) --> web
```

Four services in Docker Compose:

| Service | What it does | Local port |
| --- | --- | --- |
| `db` | MySQL 8.4 with a volume for the data | 3308 |
| `worker` | node-cron jobs: player sync every 30 min (ranks, matches, scoreboards, builds), high-elo collector every hour, champion data every night | — |
| `api` | Express REST API | 3000 |
| `web` | nginx serves the React build and proxies `/api` to the `api` container | 8080 |

The server is split into layers: `routes` → `controllers` (input validation with Zod) → `services` (calculations) → `repositories` (queries with Prisma). `api` and `worker` share the same code and Docker image.

### API

| Endpoint | Returns |
| --- | --- |
| `GET /api/summary` | Player, ranks, peak rank and recent form |
| `GET /api/matches` | Paginated match history |
| `GET /api/matches/:matchId/scoreboard` | The 10 players of a match |
| `GET /api/champions` | Stats per champion |
| `GET /api/champions/:championKey/build?position=` | Recommended build for a champion |
| `GET /api/masteries` | Top champion masteries |
| `GET /api/rank-history` | Daily LP snapshots |
| `GET /api/trends` | KDA, CS/min and vision per match |
| `GET /api/coach` | Coaching report |
| `GET /api/coach/summary` | AI summary of the report (cached once a day) |

Most endpoints accept `?queue=all|solo|flex`.

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, React Router, Tailwind CSS 4, TanStack Query, Recharts.
- **Backend:** Node.js 24, Express 5, TypeScript, Zod, Prisma 7, node-cron.
- **Database:** MySQL 8.4.
- **Testing:** Vitest, Supertest and Testing Library.
- **DevOps:** Docker Compose, nginx, GitHub Actions, Oracle Cloud ARM VM with Caddy for HTTPS.

## Getting started

Requirements: Docker with Docker Compose, Node.js 24 and a Riot API key ([developer.riotgames.com](https://developer.riotgames.com)).

1. Clone the repository and create the environment file:

   ```bash
   git clone https://github.com/MK-1379/lol-stats.git
   cd lol-stats
   cp .env.example .env
   ```

   Fill in `.env` with your Riot API key, your Riot ID and the MySQL passwords. `DATABASE_URL` is the connection from your machine, for example `mysql://lolstats:change_me@localhost:3308/lolstats`, with the same password as `MYSQL_PASSWORD`. `AI_API_KEY` is optional: without it the Coach tab works but hides the AI summary. `HIGH_ELO_MATCHES_PER_RUN` limits the high-elo collector (`0` turns it off).

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

- **Server (91 tests):** API routes with Supertest and mocked repositories, coach rules, build aggregation, the high-elo collector, and the Riot, Data Dragon and AI clients with a mocked `fetch`.
- **Web (75 tests):** the score formula, formatters and components with Testing Library: match history, scoreboard loading, rank card, queue selector, coach panels, mastery block and the champion build page.

The tests don't need a real Riot API key. On every push, GitHub Actions runs lint, tests and builds for both parts and builds the Docker images; on `main` it also deploys.

## Design decisions

- **One account only.** Riot's personal API key is meant for showing your own stats and has low rate limits (100 requests every 2 minutes). Searching any player, like OP.GG does, needs a production key; I've applied for one.
- **Rank snapshots.** Riot doesn't provide LP history, so the worker stores a snapshot of the rank on every sync. The LP chart and the peak rank come from those snapshots, so they start when the worker started.
- **Builds from stored matches, not scraping.** Build stats are computed from match and timeline data that the app already stores, plus a capped high-elo sample, so the collector stays inside the rate limits.
- **The scoreboard has its own table** (`ScoreboardEntry`), so my own stats keep reading only my rows in `MatchParticipant`.
- **The score and the coach tips aren't AI.** They're rules that can be checked on every match. The AI only writes the summary, it's cached once a day and the app works without it.
- Matches shorter than 5 minutes (remakes) aren't stored.

## Roadmap

- Player search by Riot ID, once Riot approves the production key.

## Legal

LoLStats isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.

## License

The source code is released under the [MIT License](LICENSE).
