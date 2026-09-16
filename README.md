# 🎮 eFootball Rwanda League (EFRL) Official Esports Platform

Official competitive video game platform for the **eFootball Mobile Rwanda League (EFRL)**. Built for Rwandan mobile gaming athletes across **3 divisions (Division 1, 2, and 3)**, featuring daily **24-hour matchday cycles**, screenshot proof arbitration, automated midnight fixture drops, **post-season UCL and Europa Leagues**, and a dedicated **League Administrator Portal**.

---

## 🌟 Key Features

### 1. 🏆 3-Tier Division System (eFootball Mobile Only)
- **Division 1 (Premiership)**: Flagship tier (capped at 20 players max).
- **Division 2 (Championship)**: Competitive feeder division.
- **Division 3 (National Academy)**: Youth and academy division.
- **Relegation & Promotion**: Automatic relegation of bottom 3 players at end of season.

### 2. ⚡ 24-Hour Automated Match Window & WhatsApp Integration
- New fixtures drop daily at **12:00 AM midnight**.
- Players coordinate directly using opponent WhatsApp chat buttons embedded in each match fixture.
- **Proof-Based Result Submission**: Both players must play and upload their full-time end-game screenshot before the 24-hour timer expires.
- **Forfeit & Walkover Protection**: Players can upload WhatsApp proof if an opponent is unresponsive.
- **Strict Disciplinary Rule**: Any player who misses 3 consecutive matches is automatically **disqualified** from the league.

### 3. ⭐ Table-Based "Match of the Day" (MOTD) Engine
- Automatically identifies and spotlights the daily marquee clash based on live league table standings.
- **Round 1 Exclusion**: As per official rules, Match of the Day selection begins in **Round 2** once table standings have formed.
- Evaluates combined points, sum of ranks, and top-4 proximity to highlight top-of-the-table blockbusters.

### 4. 🌍 Post-Season Continental Tournaments (UCL & Europa)
- **Locked by Default**: UCL and Europa are locked until regular division stages conclude and the League Administrator unlocks them.
- **UCL Qualification**: 16 players (Top 8 from Division 1 + Top 4 from Division 2 + Top 4 from Division 3).
- **Strict Division Separation**: Players from the same division cannot choose or share the same group in UCL or Europa League.
- Includes interactive voting and automated 1-click seeded draw capabilities.

### 5. 👑 Dedicated League Administrator Portal (`/admin`)
- Standalone secure login portal at `/admin/login`.
- **Start / End Registration**: Toggle to open or close player registrations.
- **Round-Robin Match Generator**: Berger pairing algorithm to generate complete home-and-away round-robin fixtures once registration closes.
- **Results & Forfeit Arbitration**: Inspect player screenshot evidence, approve scores, and award 3-0 walkovers.
- **All League Tables**: Instant live view across Division 1, 2, 3, UCL, and Europa League tables.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or yarn

### Installation
```bash
# 1. Clone repository
git clone https://github.com/E1mery/Efootballsite.git
cd Efootballsite

# 2. Install dependencies
npm install

# 3. Setup SQLite database & generate Prisma client
npx prisma db push

# 4. Seed official tournaments, admin account, and welcome announcement
npx tsx prisma/seed.ts

# 5. Run development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 🔑 Default Administrator Credentials
- **Portal URL**: `/admin/login`
- **Email**: `admin@efootball.rw`
- **Password**: `admin123`

---

## 🛠 Tech Stack
- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Database**: SQLite with [Prisma ORM](https://www.prisma.io/)
- **Styling**: Tailwind CSS & Lucide React
- **Authentication**: Secure bcrypt password hashing with HTTP-only cookies

---

## 📄 License
All rights reserved © 2026 eFootball Rwanda League (EFRL).