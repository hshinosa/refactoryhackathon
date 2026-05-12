# PRD: Codebase Wiki

## 1. Ringkasan

**Codebase Wiki** adalah website untuk membuat dokumentasi project software secara otomatis dari source code. User dapat mengupload project dalam bentuk `.zip`, lalu sistem akan membaca struktur folder, dependency, dan tech stack untuk menghasilkan dokumentasi berbasis AI dalam format wiki/Markdown yang mudah dibaca.

Produk ini ditujukan untuk membantu developer, tech lead, project manager, dan anggota tim baru memahami codebase lebih cepat tanpa harus menulis dokumentasi manual dari awal.

### Tim

- Muhammad Daffa Fadillah
- Muhammad Hashfi Hadyan
- Arinza Aurelvia
- Soraya Haidar Salma

## 2. Problem Statement

Banyak tim software tidak sempat membuat dokumentasi project karena dokumentasi manual memakan waktu, cepat outdated, dan sering kalah prioritas dibanding coding. Akibatnya, onboarding developer baru menjadi lambat, knowledge tersebar di beberapa orang saja, dan stakeholder sulit memahami gambaran teknis project.

Codebase Wiki menyelesaikan masalah ini dengan mengubah source code menjadi dokumentasi awal yang terstruktur secara otomatis menggunakan AI.

## 3. Target User

### Primary User

- Developer yang ingin memahami codebase baru dengan cepat.
- Developer baru dalam tim yang perlu onboarding ke project.

### Secondary User

- Tech lead yang ingin dokumentasi project tetap mudah dibuat dan diperbarui.
- Project manager atau stakeholder teknis yang butuh gambaran project tanpa membaca source code langsung.

### User Pain Points

- Dokumentasi project sering tidak ada atau tidak lengkap.
- Dokumentasi cepat outdated ketika codebase berubah.
- Developer baru butuh waktu lama untuk memahami struktur project.
- Knowledge project terlalu bergantung pada beberapa orang dalam tim.

## 4. Goals

- Mengurangi waktu memahami codebase dari hitungan hari menjadi beberapa menit.
- Menghasilkan dokumentasi project otomatis dari struktur dan dependency source code.
- Menampilkan hasil dokumentasi dalam format wiki yang rapi dan mudah dibaca.
- Membantu tim membuat dokumentasi awal tanpa proses manual yang panjang.
- Menyediakan demo end-to-end yang kuat untuk hackathon.

## 5. Non-Goals

Untuk MVP hackathon, fitur berikut **tidak dikerjakan terlebih dahulu**:

- Authentication/login.
- Database kompleks.
- Multi-user workspace.
- Realtime collaboration.
- Versioning system untuk dokumentasi.
- Editor dokumentasi penuh seperti CMS.
- Chatbot tanya jawab codebase.
- Import langsung dari GitHub repository.

> Catatan: GitHub import dan chatbot dapat menjadi fitur lanjutan setelah MVP stabil.

## 6. User Flow

```text
User membuka website
  -> user upload project .zip
  -> sistem validasi file
  -> backend extract ZIP
  -> sistem scan folder, file penting, dan dependency
  -> sistem deteksi tech stack/framework
  -> sistem menyusun context ringkas untuk AI
  -> AI generate dokumentasi Markdown
  -> user melihat hasil dalam tampilan wiki
```

### Demo Flow Hackathon

```text
Upload ZIP sample project
  -> loading: AI analyzing codebase
  -> generated wiki muncul
  -> tampilkan Project Overview, Tech Stack, Folder Explanation, Setup Guide
```

## 7. Functional Requirements

### FR-001 Upload Project ZIP

Sistem harus memungkinkan user mengupload file project software dalam format `.zip`.

### FR-002 Validate Upload

Sistem harus memvalidasi file upload agar hanya menerima file `.zip` yang valid.

### FR-003 Extract ZIP

Sistem harus mengekstrak file ZIP secara otomatis setelah upload berhasil.

### FR-004 Read Project Structure

Sistem harus membaca informasi dasar project, termasuk:

- struktur folder
- nama file penting
- dependency project
- file konfigurasi utama seperti `package.json` atau file dependency lain jika tersedia

### FR-005 Detect Tech Stack

Sistem harus dapat mengidentifikasi framework dan library utama dari project.

Contoh output:

- Next.js
- React
- Express
- Tailwind CSS

### FR-006 Generate AI Documentation

Sistem harus menghasilkan dokumentasi otomatis berbasis AI yang mencakup:

- Project Overview
- Tech Stack
- Folder Explanation
- Setup Guide
- Main Features
- Improvement Suggestions

### FR-007 Render Wiki Documentation

Sistem harus menampilkan dokumentasi dalam format Markdown/wiki yang rapi dan mudah dibaca.

### FR-008 Show Analysis Status

Sistem harus menampilkan status proses saat analisis dan AI generation sedang berjalan.

Minimal status untuk MVP:

- uploading
- extracting
- scanning
- generating documentation
- completed

### FR-009 Error Handling

Sistem harus menampilkan pesan error yang jelas jika:

- upload gagal
- file bukan `.zip`
- extract ZIP gagal
- AI gagal generate dokumentasi

### FR-010 Sample Project for Demo

Sistem sebaiknya menyediakan atau menyiapkan sample project agar demo hackathon dapat berjalan cepat dan stabil.

## 8. Non-Functional Requirements

### NFR-001 Performance

Sistem harus mampu memproses project kecil sampai menengah dalam waktu kurang dari 60 detik untuk kebutuhan demo.

### NFR-002 Usability

Interface harus sederhana, jelas, dan bisa digunakan tanpa tutorial panjang.

### NFR-003 Reliability

Demo flow utama harus dapat berjalan end-to-end dengan sample project yang sudah disiapkan.

### NFR-004 Security

Sistem hanya menerima file `.zip` dan tidak menjalankan source code yang diupload.

### NFR-005 Scalability

Arsitektur harus memungkinkan fitur lanjutan seperti GitHub import, chatbot codebase, dan diagram generation tanpa rewrite besar.

### NFR-006 Compatibility

Website harus dapat digunakan pada browser modern seperti Chrome, Edge, dan Firefox.

## 9. Success Metrics

| Code | Metric | Target |
| --- | --- | --- |
| SC-001 | Successful Upload | User berhasil upload file ZIP valid tanpa error. |
| SC-002 | Successful Analysis | Sistem berhasil membaca struktur folder, dependency, dan framework project. |
| SC-003 | AI Documentation Generated | AI berhasil menghasilkan dokumentasi project otomatis. |
| SC-004 | Readable Wiki | Dokumentasi tampil rapi, mudah dibaca, dan terstruktur. |
| SC-005 | Faster Understanding | User dapat memahami gambaran project dalam kurang dari 5 menit. |
| SC-006 | Demo Ready | Flow upload, analyze, generate, dan display berhasil didemokan end-to-end. |

## 10. Risks & Open Questions

### Risks

- AI output terlalu umum jika context yang dikirim kurang informatif.
- Token/cost dapat membesar jika sistem mengirim terlalu banyak source code ke AI.
- File ZIP terlalu besar dapat memperlambat proses demo.
- Dokumentasi yang dihasilkan bisa kurang akurat jika dependency atau struktur project tidak terbaca dengan baik.
- Waktu hackathon terbatas, sehingga scope harus tetap fokus pada flow utama.

### Mitigation

- Jangan kirim seluruh source code ke AI.
- Kirim context ringkas seperti struktur folder, dependency, dan beberapa file penting.
- Siapkan sample project untuk demo.
- Batasi MVP pada upload ZIP, scan, AI generation, dan wiki viewer.

### Open Questions

- Model AI final yang dipakai: Gemini atau OpenAI?
- Batas maksimal ukuran ZIP untuk MVP?
- Apakah output dokumentasi perlu bisa diedit oleh user pada versi MVP?
- Apakah hasil dokumentasi disimpan sementara atau hanya ditampilkan setelah generate?

## Appendix A: MVP Scope Hackathon

### Included

- Upload project ZIP.
- Extract dan scan struktur project.
- Deteksi tech stack dan dependency.
- Generate dokumentasi otomatis dengan AI.
- Tampilkan hasil sebagai wiki/Markdown viewer.
- Loading state dan error handling dasar.

### Excluded

- Authentication.
- Database kompleks.
- Realtime collaboration.
- Versioning system.
- Multi-user workspace.
- GitHub import.
- Chat with codebase.
- Diagram generation otomatis.

## Appendix B: Priority

### Tier 1 - Wajib Demo

- Upload ZIP.
- Extract ZIP.
- Scan project structure.
- Generate AI documentation.
- Render wiki viewer.

### Tier 2 - Nice to Have

- UI lebih polished.
- Markdown navigation.
- Syntax highlighting.
- Dark mode.

### Tier 3 - Bonus

- GitHub repository import.
- Chat with codebase.
- Architecture/dependency diagram generation.

## Appendix C: Suggested Tech Stack

Tech stack ini bersifat rekomendasi awal untuk eksekusi cepat hackathon.

| Area | Recommendation | Reason |
| --- | --- | --- |
| Frontend | Next.js | Cepat untuk setup, cocok untuk fullstack MVP. |
| Styling | Tailwind CSS | Cepat membuat UI bersih untuk demo. |
| Backend | Next.js API Routes | Mengurangi overhead setup backend terpisah. |
| Upload | Multer / compatible upload handler | Umum dipakai untuk upload file. |
| ZIP Extract | unzipper / fs-extra | Praktis untuk extract dan scan file. |
| Markdown Rendering | react-markdown | Cepat render hasil AI ke UI. |
| AI | Gemini atau OpenAI | Pilih berdasarkan akses API dan biaya. |

## Appendix D: AI Prompt Direction

Prompt AI sebaiknya meminta output dokumentasi dengan struktur berikut:

```text
You are a senior software architect.

Generate professional project documentation based on this codebase summary.

Include:
- Project Overview
- Tech Stack
- Folder Explanation
- Main Features
- Setup Guide
- Possible Improvements
```

Context yang dikirim ke AI sebaiknya meliputi:

- struktur folder
- dependency dari `package.json` atau file dependency lain
- framework/library terdeteksi
- daftar file penting
- ringkasan isi file penting jika diperlukan
