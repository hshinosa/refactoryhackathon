# Coding Agent Workflow

Dokumen ini menjelaskan cara coding agent harus bekerja di repository ini.

## Prinsip utama

1. **OpenSpec adalah source of truth utama untuk perubahan aktif.**
2. **Agent tidak boleh langsung coding tanpa mengecek change OpenSpec yang relevan.**
3. **Dokumen arsitektur dan produk wajib dibaca sebelum implementasi.**
4. **Task OpenSpec harus tetap sinkron dengan pekerjaan aktual.**
5. **Backend-first untuk change aktif saat ini; UI mengikuti kontrak yang diberikan backend.**

## Urutan kerja agent

### 1. Pahami intent user

- Jika user hanya bertanya atau diskusi: jangan implementasi.
- Jika user meminta perubahan: identifikasi apakah change OpenSpec sudah ada atau belum.

### 2. Cek OpenSpec terlebih dahulu

Sebelum coding, agent harus mengecek:

- `openspec/changes/<active-change>/proposal.md`
- `openspec/changes/<active-change>/design.md`
- `openspec/changes/<active-change>/tasks.md`
- file spec di `openspec/changes/<active-change>/specs/`

Jika change belum ada:

- agent harus membuat proposal/design/tasks dulu melalui workflow OpenSpec
- jangan langsung implementasi dari PRD saja

### 3. Baca dokumen referensi repo

Untuk setiap implementasi, agent harus membaca dokumen yang relevan:

- `docs/prd/prd.md`
- `docs/architecture/decisions/*.md`
- `docs/architecture/c4/*.md`

Urutan authority:

1. OpenSpec change aktif
2. ADR
3. C4
4. PRD

Jika ada konflik, agent harus mengikuti urutan di atas dan menyebutkan konflik tersebut.

### 4. Tentukan scope implementasi

Agent hanya boleh mengerjakan task yang ada di change OpenSpec aktif.

Jika menemukan ide baru saat implementasi:

- jangan langsung menambah scope
- catat sebagai follow-up
- buat change OpenSpec baru jika diperlukan

### 5. Aturan backend-first untuk project ini

Untuk change `build-codebase-wiki-backend-mvp`:

- prioritaskan implementasi di `apps/api`
- `apps/web` hanya disentuh jika perlu kontrak minimal atau dummy integration
- jangan membuat keputusan UI baru tanpa task terpisah
- fokus pada auth, project intake, ingestion, analysis, AI docs generation, docs history, semantic search prep, dan regenerate endpoint

### 6. Task tracking wajib sinkron

- Jika memakai todo internal/session, itu hanya alat bantu.
- Source of truth progres tetap `openspec/changes/<active-change>/tasks.md`.
- Setiap task selesai harus langsung dicentang di file OpenSpec.
- Jangan klaim selesai jika checklist OpenSpec belum ter-update.

### 7. Verification sebelum klaim selesai

Sebelum melaporkan task selesai, agent harus:

- cek file yang diubah
- cek diagnostics/test/build yang relevan
- pastikan implementasi masih sesuai PRD, ADR, C4, dan OpenSpec
- pastikan tidak ada artifact lokal yang ikut mengotori repo

### 8. Git discipline

- Commit harus mengikuti unit perubahan yang jelas.
- Jangan mencampur refactor liar dengan feature utama.
- Jangan push tanpa diminta user.
- Artifact lokal seperti `.sisyphus/` dan `.DS_Store` tidak boleh ikut repo.

## Workflow ringkas

```text
User request
  -> identify change or create OpenSpec change
  -> read proposal/design/specs/tasks
  -> read ADR/C4/PRD
  -> implement only active task scope
  -> update OpenSpec checklist immediately
  -> verify code/tests/diagnostics
  -> commit only when user asks
```

## Larangan

- Jangan coding di luar change aktif.
- Jangan skip OpenSpec.
- Jangan update task hanya di todo internal tanpa update checklist OpenSpec.
- Jangan treat PRD as implementation spec jika OpenSpec sudah ada.
- Jangan tambahkan scope UI saat change backend-first masih aktif.
