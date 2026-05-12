# ADR-001: Tech Stack untuk Codebase Wiki MVP

## Status

Accepted

## Context

Codebase Wiki adalah produk hackathon untuk membuat dokumentasi project software secara otomatis dari source code. Berdasarkan PRD dan C4 model, MVP harus mendukung:

- input project melalui upload ZIP atau GitHub repository URL
- akses private repository menggunakan GitHub Personal Access Token (PAT)
- ekstraksi/clone source code ke temporary storage
- analisis struktur folder, dependency, dan tech stack
- generate dokumentasi berbasis AI
- render hasil dokumentasi sebagai wiki/Markdown di web

Karena targetnya hackathon, stack harus memprioritaskan kecepatan implementasi, demo end-to-end, dan minim overhead setup.

## Decision

Untuk MVP hackathon, Codebase Wiki akan menggunakan stack berikut:

| Area | Decision | Rationale |
| --- | --- | --- |
| Frontend | Next.js / React | Cepat untuk membuat web app dan mudah digabung dengan API routes. |
| Styling | Tailwind CSS | Cepat membuat UI bersih dan presentable untuk demo. |
| Backend/API | Next.js API Routes / Node.js | Mengurangi overhead backend terpisah dan cocok untuk upload, ingestion, dan orchestration sederhana. |
| Authentication | NextAuth/Auth.js | Cocok dengan Next.js dan cukup cepat untuk Sign In/Sign Up MVP. |
| Upload ZIP | Node.js upload handler | Cukup untuk menerima file ZIP dari user. |
| ZIP Limit | 50MB max upload | Membatasi risiko timeout dan demo failure saat upload project. |
| ZIP Extract | Node.js filesystem + unzip library | Praktis untuk ekstraksi ZIP ke temporary storage. |
| GitHub Import | Git clone | Cara tercepat untuk mengambil struktur repo lengkap, baik public maupun private repo. |
| Temporary Source Storage | Ephemeral `/tmp` storage | Source code hanya dibutuhkan sementara untuk analisis dan harus dibersihkan setelah job selesai. |
| AI Provider | OpenAI-compatible API adapter | Tim sudah memiliki API yang kompatibel dengan OpenAI, sehingga integrasi bisa dibuat melalui satu interface standar. |
| PAT Handling | Encrypted file storage per user | PAT diperlukan agar private repo dapat di-clone ulang saat regenerate documentation; revoke/delete hanya oleh pemilik user. |
| Generated Docs Storage | Multi-page Markdown docs + generated sidebar + history | Output seperti GitBook: docs dipisah per topik, current docs dapat overwrite, history tetap disimpan. |
| Markdown Rendering | React Markdown renderer | Sesuai output AI dan kebutuhan wiki viewer multi-page. |
| GitHub Actions | Workflow template + regenerate endpoint | Pendekatan praktis untuk hackathon: workflow memanggil endpoint regenerate docs. |
| Semantic Search | Embeddings/vector index for chatbot | Chatbot butuh semantic codebase search agar bisa menjawab dari context codebase dan dokumentasi. |

## Consequences

### Positive

- Satu ekosistem JavaScript/TypeScript untuk frontend, API, ingestion, dan AI integration.
- Setup project lebih cepat untuk hackathon.
- Next.js memudahkan membuat UI, route API, dan demo dalam satu repository.
- NextAuth/Auth.js mempercepat auth tanpa membangun sistem login sendiri.
- Tailwind CSS mempercepat pembuatan UI yang clean.
- Temporary storage menghindari kebutuhan database/file storage kompleks di MVP.
- OpenAI-compatible adapter menyederhanakan integrasi AI karena mengikuti interface standar yang sudah tersedia.
- Git clone membuat proses analisis repo public/private lebih mirip dengan source folder lokal.
- Encrypted PAT storage memungkinkan private repository digunakan ulang untuk regenerate docs tanpa meminta token setiap kali.
- Multi-page Markdown membuat output lebih mirip GitBook dan lebih mudah dinavigasi dengan sidebar otomatis.
- Embeddings/vector index membuka jalan untuk semantic codebase search di AI Chat.

### Negative / Trade-offs

- Next.js API routes bukan desain terbaik untuk heavy background processing jangka panjang.
- Temporary storage tidak cocok untuk menyimpan source code atau hasil proses jangka panjang.
- PAT-based access lebih sederhana, tetapi perlu encrypted file storage, lifecycle token yang jelas, kontrol permission minimum, dan fitur revoke/delete oleh user.
- Generated docs history menambah kebutuhan penyimpanan metadata/history meskipun current docs di-overwrite.
- Embeddings/vector index menambah kompleksitas pipeline dan storage, sehingga bisa diposisikan sebagai bagian chat/search setelah generation flow stabil.
- Jika file ZIP/repository besar, proses analisis bisa lambat atau timeout.
- Jika nanti butuh scale, worker/background queue kemungkinan perlu dipisah dari API.

## Alternatives Considered

### Separate Frontend + Backend

Frontend memakai Next.js dan backend memakai Express/NestJS terpisah.

- Kelebihan: boundary lebih jelas, backend lebih fleksibel untuk worker.
- Kekurangan: setup lebih lama dan kurang cocok untuk hackathon 1 hari.

### Python Backend

Backend memakai Python/FastAPI untuk parsing dan AI workflow.

- Kelebihan: ekosistem AI kuat.
- Kekurangan: menambah stack baru dan memperlambat integrasi web/API untuk MVP.

### OAuth / GitHub App sejak MVP

Private repo access memakai OAuth atau GitHub App.

- Kelebihan: lebih aman dan production-ready.
- Kekurangan: setup permission, callback, dan app configuration lebih kompleks untuk hackathon.

### GitHub API Adapter untuk Import Repo

Mengambil struktur dan file repository melalui GitHub API, bukan `git clone`.

- Kelebihan: lebih terkontrol dan bisa membatasi file yang diambil.
- Kekurangan: lebih banyak edge case, rate limit, dan implementasi lebih kompleks daripada clone untuk MVP.

### Gemini/OpenAI Switchable Provider

Membuat provider AI bisa dipilih antara Gemini dan OpenAI.

- Kelebihan: fleksibel jika salah satu API bermasalah.
- Kekurangan: menambah abstraction dan testing; untuk kondisi sekarang tim sudah punya API OpenAI-compatible sehingga tidak perlu memilih banyak provider di awal.

### Persistent Storage sejak Awal

Menyimpan source, docs, dan metadata ke database/object storage sejak MVP.

- Kelebihan: lebih siap untuk multi-project dan history.
- Kekurangan: menambah kompleksitas, sementara demo MVP cukup dengan temporary source dan generated output sederhana.

### Full Webhook GitHub Actions Integration

Membuat integrasi webhook penuh untuk GitHub Actions sejak MVP.

- Kelebihan: lebih otomatis dan production-like.
- Kekurangan: lebih banyak setup dan security concern; untuk hackathon cukup workflow template yang memanggil endpoint regenerate.

## Follow-up Decisions

- Tentukan limit ukuran ZIP/repository untuk MVP.
- Tentukan mekanisme enkripsi PAT dan lifecycle token.
- Tentukan format encrypted file untuk PAT storage per user.
- Tentukan storage untuk docs history dan vector index.
- Tentukan kapan worker/background queue perlu dipisah dari API routes.
