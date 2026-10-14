# TebingHub ([tebinghub.id](https://tebinghub.id))

[Bahasa Indonesia](#bahasa-indonesia) | [English](#english)

---

## Bahasa Indonesia

Halo! Ini source code lengkap dari **[tebinghub.id](https://tebinghub.id)**, panduan kota & peta interaktif Tebing Tinggi, Sumatera Utara. Project ini ku submit untuk **Kompetisi Website Nusantara Digital City** yang diselenggarain sama **[mediacloud.id](https://mediacloud.id)** dan **[pandi.id](https://pandi.id)**, dan berhasil meraih **Juara 3**.

Isinya gabungan cerita lokal Tebing Tinggi, animasi scroll pake GSAP, peta kota pake MapLibre, sama fitur penyusun rute singgah berbasis Convex yang udah dirapiin dari versi waktu kejar deadline lomba.

### Stack yang Dipakai

- **Next.js 16** (App Router), **React 19**, **next-intl** (ID/EN)
- **Tailwind CSS v4** & **GSAP** buat layout dan animasi scroll
- **MapLibre GL** + **OpenFreeMap** & data OpenStreetMap buat peta interaktif
- **Convex** buat backend rencana rute
- **OpenNext** buat deploy ke **Cloudflare Workers**

### Jalanin di Lokal

Butuh [Bun](https://bun.sh) dan Node.js.

```bash
bun install
cp .env.example .env.local   # isi URL Convex mu (bikin akun dlu di https://dashboard.convex.dev)
npx convex dev               # nyiapin dev deployment & nulis variabel env
bun run dev                  # buka http://localhost:3099
```

Fitur asisten rute (opsional) butuh `OPENROUTER_API_KEY` yang di-set lewat `npx convex env set`. Peta, cerita kota, dan penyusun rute manual tetap jalan normal walau ini ga diisi ya.

### Command Penting

| Command               | Fungsi                                    |
| --------------------- | ----------------------------------------- |
| `bun run dev`         | Jalanin dev server di port 3099           |
| `bun run build`       | Build untuk produksi                      |
| `bun run test`        | Jalanin unit test (Vitest)                |
| `bun run test:convex` | Jalanin test backend Convex               |
| `bun run test:e2e`    | Jalanin E2E test (Playwright)             |
| `bun run check`       | Cek lint & format pake Biome              |
| `bun run deploy`      | Build & deploy ke Cloudflare via OpenNext |

---

## English

Hey there! This is the full source code for **[tebinghub.id](https://tebinghub.id)**, an interactive city guide and map for Tebing Tinggi, North Sumatra. This project was my submission for the **Nusantara Digital City Website Competition** organized by **[mediacloud.id](https://mediacloud.id)** and **[pandi.id](https://pandi.id)**, where it won **3rd Place**.

It combines Tebing Tinggi local stories, GSAP scroll animations, a custom MapLibre city map, and a Convex-backed stopover planner, cleaned up from the original competition deadline build.

### Stack Used

- **Next.js 16** (App Router), **React 19**, **next-intl** (ID/EN)
- **Tailwind CSS v4** & **GSAP** for layout and scroll animations
- **MapLibre GL** + **OpenFreeMap** & OpenStreetMap data for the interactive map
- **Convex** for the route planner backend
- **OpenNext** for **Cloudflare Workers** deployment

### Run Locally

Requires [Bun](https://bun.sh) and Node.js.

```bash
bun install
cp .env.example .env.local   # fill in your Convex URL (https://dashboard.convex.dev)
npx convex dev               # sets up dev deployment & writes env vars
bun run dev                  # open http://localhost:3099
```

The optional route assistant uses `OPENROUTER_API_KEY` set via `npx convex env set`. The map, city stories, and manual route planner still work normally even if you leave it blank.

### Key Commands

| Command               | Function                                  |
| --------------------- | ----------------------------------------- |
| `bun run dev`         | Run dev server on port 3099               |
| `bun run build`       | Build for production                      |
| `bun run test`        | Run unit tests (Vitest)                   |
| `bun run test:convex` | Run Convex backend tests                  |
| `bun run test:e2e`    | Run E2E tests (Playwright)                |
| `bun run check`       | Check lint & format with Biome            |
| `bun run deploy`      | Build & deploy to Cloudflare via OpenNext |
