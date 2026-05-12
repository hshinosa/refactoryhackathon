# Documentation Guide

Folder `docs/` berisi dokumen resmi project. Gunakan folder ini untuk hal yang sudah cukup jelas dan ingin dijadikan referensi tim.

## Struktur

```text
docs/
├─ prd/                   # Product Requirement Document
├─ architecture/          # Arsitektur sistem
│  ├─ c4/                 # C4 model
│  ├─ diagrams/           # Diagram pendukung
│  └─ decisions/          # Architecture Decision Record
├─ content/               # Struktur dan standar konten dokumentasi
│  ├─ structure/
│  ├─ templates/
│  └─ writing-guidelines/
└─ research/              # Riset, referensi, dan temuan
```

## Aturan umum

- Pakai Markdown untuk dokumen utama.
- Satu file sebaiknya punya satu tujuan jelas.
- Gunakan nama file kebab-case, contoh: `user-onboarding.md`.
- Kalau dokumen sudah menjadi dasar keputusan, pindahkan dari `experiments/` ke `docs/`.
- Kalau perubahan berdampak ke implementasi, pastikan ada task/change terkait di `openspec/`.

## Alur kerja dokumen

1. Tulis draft di folder yang sesuai.
2. Review singkat dengan tim.
3. Jika dokumen memengaruhi scope atau implementasi, buat/update change di OpenSpec.
4. Simpan keputusan final di `docs/architecture/decisions/` bila relevan.

## Ownership awal

- `docs/prd/`: product scope dan requirement.
- `docs/architecture/`: C4, diagram sistem, dan keputusan teknis.
- `docs/content/`: struktur dokumentasi yang akan dihasilkan produk.
- `docs/research/`: referensi, kompetitor, dan temuan riset.
