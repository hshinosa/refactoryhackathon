# PRD: Codebase Wiki

## Team

- Muhammad Daffa Fadillah
- Muhammad Hashfi Hadyan
- Arinza Aurelvia
- Soraya Haidar Salma

## Nama Project

Codebase Wiki

## Deskripsi Project

Codebase Wiki adalah website untuk membuat dokumentasi project software secara otomatis dari source code. User dapat mengupload project dalam bentuk `.zip` atau memasukkan URL GitHub repository, lalu sistem akan membaca struktur folder, dependency, dan tech stack untuk menghasilkan dokumentasi berbasis AI dalam format wiki/Markdown yang mudah dibaca.

Produk ini ditujukan untuk membantu developer, tech lead, project manager, dan anggota tim baru memahami codebase lebih cepat tanpa harus menulis dokumentasi manual dari awal.

Selain dokumentasi, aplikasi juga mendukung chat berbasis project, pencarian dokumen, job logs terminal-style, dan integrasi MCP read-only untuk konsumsi coding agent.

## Problem Statement

Banyak tim software tidak sempat membuat dokumentasi project karena dokumentasi manual memakan waktu, cepat outdated, dan sering kalah prioritas dibanding coding. Akibatnya, onboarding developer baru menjadi lambat, knowledge tersebar di beberapa orang saja, dan stakeholder sulit memahami gambaran teknis project.

Codebase Wiki menyelesaikan masalah ini dengan mengubah source code menjadi dokumentasi awal yang terstruktur secara otomatis menggunakan AI.

## Visi

Menjadi platform dokumentasi berbasis AI yang membantu tim software development memahami, mengelola, dan menjaga dokumentasi project secara lebih mudah, cepat, konsisten, dan selalu relevan.

## Misi

Membantu tim developer mengotomatisasi proses pembuatan dan pemeliharaan dokumentasi software agar dokumentasi lebih jelas, terstruktur, mudah dipahami, serta mendukung onboarding, kolaborasi, dan knowledge sharing dalam tim.

## Goals

### Short-Term Goals (Hackathon / MVP)

- Membuat website yang memungkinkan user untuk mengunggah source code project.
- Membaca dan menganalisis struktur project secara otomatis.
- Membantu mempercepat proses pembuatan dokumentasi awal dari hitungan jam menjadi beberapa menit.

### Mid-Term Goals

- Menambahkan integrasi GitHub/GitLab agar dokumentasi dapat dibuat langsung dari repository project.
- Menyediakan AI Chat Assistant yang dapat menjawab pertanyaan terkait codebase.
- Mendukung lebih banyak framework dan bahasa pemrograman.

### Long-Term Goals

- Menjadi platform dokumentasi AI untuk software team.
- Mengurangi masalah dokumentasi yang tidak lengkap, tidak konsisten, dan outdated dalam software development.
- Membantu meningkatkan produktivitas dan kolaborasi software team.

## Feature

### Core Features

- Sign In/Sign Up.
- Upload project ZIP.
- Input URL GitHub repository.
- Input GitHub Personal Access Token (PAT) untuk akses private repository.
- Multi Project (user bisa memasukkan lebih dari satu project).
- Validasi file ZIP atau URL repository.
- Extract ZIP atau clone repository secara otomatis.
- Scan struktur folder, dependency, dan file penting.
- Deteksi framework, library, dan tech stack utama.
- Generate dokumentasi project otomatis dengan AI.
- AI Chat untuk project berbasis docs yang sudah digenerate.
- Search Docs dan Ask Wiki berbasis semantic retrieval.
- MCP read-only untuk project documentation.
- Job logs terminal-style selama proses import dan generate.
- Tampilkan hasil dokumentasi dalam format wiki/Markdown.
- Tampilkan loading/progress state selama proses analisis.
- Tampilkan error handling jika proses gagal.

### MVP Scope

Fokus utama hackathon:

- Sign in dengan NextAuth/Auth.js.
- Create project.
- Input source project dari ZIP atau GitHub repo + PAT jika private.
- Scan project structure.
- Generate documentation dengan AI.
- Render hasil wiki multi-page seperti GitBook dengan sidebar otomatis.
- Search docs, Ask Wiki, dan MCP read-only untuk project docs.
- Tampilkan job logs selama proses berjalan.

### Out of Scope untuk MVP

- Database kompleks.
- Realtime collaboration.
- Diagram generation otomatis.
- GitHub Actions integration.

## User Stories

### Epic 1 — Upload & Analyze Codebase

- Sebagai developer, saya ingin mengupload file project `.zip` agar sistem dapat menganalisis source code secara otomatis.
- Sebagai developer, saya ingin memasukkan URL GitHub repository agar saya tidak perlu mengompres project secara manual.
- Sebagai developer, saya ingin memasukkan GitHub Personal Access Token (PAT) saat repository private agar sistem tetap bisa mengakses codebase saya dengan aman.
- Sebagai developer, saya ingin sistem membaca struktur folder project agar saya dapat memahami arsitektur project dengan cepat.
- Sebagai developer baru, saya ingin melihat tech stack dan dependency project agar onboarding menjadi lebih mudah.

### Epic 2 — AI Documentation Generation

- Sebagai project manager, saya ingin dokumentasi project dibuat otomatis agar tim tidak perlu menulis dokumentasi manual.
- Sebagai developer, saya ingin mendapatkan penjelasan setiap folder/module agar saya memahami fungsi masing-masing bagian project.
- Sebagai developer, saya ingin sistem menghasilkan setup guide otomatis agar project dapat dijalankan lebih cepat.

### Epic 3 — Wiki Display

- Sebagai user, saya ingin dokumentasi ditampilkan dalam format wiki yang rapi agar mudah dibaca.
- Sebagai user, saya ingin melihat hasil dokumentasi tanpa membuka source code secara langsung.

### Epic 4 — Productivity

- Sebagai tech lead, saya ingin dokumentasi dapat dibuat ulang dari source code terbaru agar mengurangi outdated documentation.
- Sebagai anggota tim baru, saya ingin memahami project dalam beberapa menit agar onboarding lebih cepat.

### Epic 5 — AI Assistance

- Sebagai developer, saya ingin memahami project menggunakan chatbot agar saya dapat bertanya langsung tentang codebase.
- Sebagai developer, saya ingin mencari bagian dokumentasi tertentu agar saya bisa menemukan jawaban lebih cepat.
- Sebagai developer, saya ingin menggunakan MCP read-only untuk menghubungkan wiki ke coding agent.

### Epic 6 — Automation

- Sebagai developer, saya ingin menghubungkan GitHub Actions agar dokumentasi dapat di-regenerate otomatis ketika repository berubah.

## Requirement

### Functional Requirements

**FR-001 — Input Project Source**  
Sistem harus memungkinkan user memasukkan source project melalui dua cara:
- upload file `.zip`
- input URL GitHub repository

**FR-002 — Validate Input**  
Sistem harus memvalidasi input user:
- jika upload ZIP, sistem hanya menerima file `.zip` yang valid
- ukuran ZIP maksimal 50MB
- jika GitHub URL, sistem harus memvalidasi format URL dan memastikan repository dapat diakses
- jika repository private, sistem harus menerima PAT yang valid dengan permission minimum untuk membaca repository

**FR-003 — Fetch Project Source**  
Sistem harus mengambil source project sesuai metode input:
- jika upload ZIP, sistem mengekstrak file ZIP secara otomatis
- jika GitHub URL public, sistem clone repository secara otomatis
- jika GitHub URL private, sistem clone repository menggunakan PAT yang diberikan user

**FR-004 — Read Project Structure**  
Sistem harus membaca informasi dasar project, termasuk:
- struktur folder
- nama file penting
- dependency project
- file konfigurasi utama seperti `package.json` atau file dependency lain jika tersedia

Sistem harus mengecualikan folder/file umum yang tidak relevan untuk analisis seperti `node_modules`, `.git`, `.next`, `dist`, `build`, `coverage`, `.turbo`, dan file lock/cache besar bila tidak dibutuhkan.

**FR-005 — Detect Tech Stack**  
Sistem harus dapat mengidentifikasi framework dan library utama dari project.

Contoh output:
- Next.js
- React
- Express
- Tailwind CSS

**FR-006 — Generate AI Documentation**  
Sistem harus menghasilkan dokumentasi otomatis berbasis AI yang mencakup:
- Project Overview
- Tech Stack
- Folder Explanation
- Setup Guide
- Main Features
- Improvement Suggestions

**FR-007 — Render Wiki Documentation**  
Sistem harus menampilkan dokumentasi sebagai multiple Markdown pages seperti GitBook, dengan sidebar yang digenerate otomatis dari struktur halaman/topik.

**FR-008 — Show Analysis Status**  
Sistem harus menampilkan status proses saat analisis dan AI generation sedang berjalan.

Minimal status untuk MVP:
- uploading
- cloning (jika GitHub)
- extracting
- scanning
- generating documentation
- completed

**FR-009 — Job Logs**  
Sistem harus menampilkan job logs terminal-style untuk fase import, analisis, generasi, cleanup, completed, dan failed.

**FR-010 — Error Handling**  
Sistem harus menampilkan pesan error yang jelas jika:
- upload gagal
- GitHub URL tidak valid
- repository tidak dapat diakses
- PAT tidak valid atau permission PAT tidak cukup
- file bukan `.zip`
- extract ZIP gagal
- AI gagal generate dokumentasi

**FR-011 — Sample Project for Demo**  
Sistem sebaiknya menyediakan atau menyiapkan sample project agar demo hackathon dapat berjalan cepat dan stabil.

**FR-012 — Authentication**  
Sistem harus menyediakan Sign In/Sign Up menggunakan NextAuth/Auth.js agar project, PAT, dan generated docs dapat dikaitkan ke user.

**FR-013 — Multi Project Support**  
Sistem dapat memungkinkan user memasukkan lebih dari satu project agar dokumentasi dapat dikelola per project.

**FR-014 — AI Chat Assistant**  
Sistem dapat menyediakan AI Chat Assistant untuk menjawab pertanyaan user terkait isi codebase dan dokumentasi project, dengan jawaban grounded pada docs dan vector index.

**FR-015 — Private Repository Access via PAT**  
Sistem harus mendukung akses ke private GitHub repository menggunakan Personal Access Token (PAT) yang diberikan user secara aman untuk kebutuhan read-only repository access. PAT disimpan per user dalam encrypted file storage dan hanya user pemilik yang dapat revoke/delete PAT tersebut.

**FR-016 — Generated Docs Storage & History**  
Sistem harus menyimpan current generated docs sebagai multi-page Markdown output. Jika docs digenerate ulang, current docs dapat di-overwrite, tetapi riwayat generation/history tetap disimpan.

**FR-017 — Semantic Codebase Search**  
Sistem dapat membuat embedding/vector index dari ringkasan codebase dan generated docs agar AI Chat dapat menjawab pertanyaan menggunakan semantic codebase search.

**FR-018 — MCP Integration**  
Sistem dapat menyediakan MCP read-only untuk search docs, ask wiki, get page, dan source evidence.

### Non-Functional Requirements

**NFR-001 — Performance**  
Sistem harus mampu memproses project kecil sampai menengah dalam waktu kurang dari 60 detik untuk kebutuhan demo.

**NFR-002 — Usability**  
Interface harus sederhana, jelas, dan bisa digunakan tanpa tutorial panjang.

**NFR-003 — Reliability**  
Demo flow utama harus dapat berjalan end-to-end dengan sample project yang sudah disiapkan.

**NFR-004 — Security**  
Sistem hanya menerima file `.zip` maksimal 50MB atau GitHub repository yang dapat diakses, tidak menjalankan source code yang diupload, dan harus memperlakukan PAT sebagai credential sensitif yang disimpan terenkripsi, tidak boleh ditampilkan kembali ke user, dan tidak boleh dicatat ke log aplikasi.

**NFR-005 — Scalability**  
Arsitektur harus memungkinkan fitur lanjutan seperti chatbot codebase dan diagram generation tanpa rewrite besar.

**NFR-006 — Compatibility**  
Website harus dapat digunakan pada browser modern seperti Chrome, Edge, dan Firefox.

**NFR-007 — Temporary Storage Cleanup**  
Temporary source storage harus dibersihkan setelah job selesai atau gagal, dengan fallback TTL cleanup 30 menit.

## Criteria Success

| Code | Criteria | Target |
| --- | --- | --- |
| SC-001 | Successful Input | User berhasil upload ZIP atau memasukkan GitHub repo URL tanpa error. |
| SC-002 | Successful Analysis | Sistem berhasil membaca struktur folder, dependency, dan framework project. |
| SC-003 | AI Documentation Generated | AI berhasil menghasilkan dokumentasi project otomatis. |
| SC-004 | Readable Wiki | Dokumentasi tampil rapi, mudah dibaca, dan terstruktur. |
| SC-005 | Faster Understanding | User dapat memahami gambaran project dalam kurang dari 5 menit. |
| SC-006 | Demo Ready | Flow input, analyze, generate, dan display berhasil didemokan end-to-end. |
| SC-007 | GitHub Input Ready | User berhasil menggunakan input GitHub repository sebagai sumber project. |
| SC-008 | Private Repo Access Ready | User berhasil mengakses private repository menggunakan PAT yang valid. |
| SC-009 | GitBook-like Output Ready | Generated docs tampil sebagai multiple pages dengan sidebar otomatis. |
| SC-010 | Tier 1 Flow Ready | Sign in, create project, input source, scan, generate docs, dan view wiki berhasil berjalan. |

## Catatan Tambahan

### Demo Flow Hackathon

```text
Input GitHub URL atau upload ZIP sample project
  -> loading: AI analyzing codebase
  -> generated wiki muncul
  -> tampilkan Project Overview, Tech Stack, Folder Explanation, Setup Guide
```

### Priority

#### Tier 1 - Wajib Demo

- Sign in.
- Create project.
- Upload ZIP.
- Input GitHub URL.
- Input PAT untuk private repository.
- Extract ZIP.
- Clone GitHub repository.
- Scan project structure.
- Generate AI documentation.
- Render multi-page wiki viewer dengan generated sidebar.

#### Tier 2 - Nice to Have

- UI lebih polished.
- Markdown navigation.
- Syntax highlighting.
- Dark mode.
- Sign In/Sign Up.
- Multi project support.
- GitHub Actions integration.

#### Tier 3 - Bonus

- Chat with codebase.
- Architecture/dependency diagram generation.

### Open Questions

- Konfigurasi OpenAI-compatible API yang dipakai: base URL, model name, dan API key management.
- Format encrypted file storage untuk PAT per user seperti apa?
- Storage apa yang dipakai untuk docs history dan embedding/vector index?
- Sejauh mana GitHub Actions integration masuk scope hackathon setelah workflow template tersedia?
- Apakah output dokumentasi perlu bisa diedit oleh user pada versi MVP?
