# CBT TKA Bahasa Indonesia SMP - Panduan Penggunaan

Selamat datang di aplikasi **Computer Based Test (CBT) TKA Bahasa Indonesia SMP**. Aplikasi ini dirancang untuk mensimulasikan lingkungan ujian standar nasional dengan fokus pada penguatan literasi membaca melalui soal-soal berstimulus, dilengkapi sistem autentikasi siswa serta dasbor pemantauan rekapitulasi nilai bagi guru.

## 📋 Spesifikasi Ujian
- **Mata Pelajaran:** Bahasa Indonesia (Jenjang SMP)
- **Jumlah Soal:** 30 Butir
- **Durasi Waktu:** 60 Menit
- **Tipe Soal:** 
  - **Pilihan Ganda (PG):** Memilih 1 jawaban benar.
  - **Pilihan Ganda Kompleks (PGK):** Memilih lebih dari 1 jawaban benar.

## 🚀 Cara Menjalankan
Aplikasi ini bersifat *client-side* murni (tanpa backend). Cukup buka berkas `index.html` menggunakan peramban modern (Chrome, Edge, Firefox, atau Safari). Tidak diperlukan instalasi tambahan atau koneksi internet setelah halaman dimuat.

---

## 👩‍🎓 Panduan untuk Siswa: Masuk & Mengerjakan Ujian

### 1. Halaman Login Siswa
Saat pertama kali membuka aplikasi, Anda akan disambut oleh **Modal/Halaman Login Siswa**:
- **Nama Lengkap Siswa:** Masukkan nama lengkap Anda (contoh: *Raka Pratama*).
- **Kelas / Rombel:** Masukkan kelas atau rombongan belajar Anda (contoh: *IX A / 9.1*).
- **Nomor Induk Siswa (NIS):** Masukkan nomor induk atau ID peserta ujian Anda (contoh: *12345678*).
- Klik tombol **"Mulai Ujian Sekarang"** untuk masuk ke antarmuka utama CBT dan memulai timer hitung mundur (60 menit).

### 2. Navigasi Soal
- Gunakan tombol **"Selanjutnya"** dan **"Sebelumnya"** di bagian bawah untuk berpindah soal.
- Klik **"Daftar Soal"** (ikon grid) untuk melihat status seluruh nomor soal.
- **Warna Nomor Soal:**
  - **Biru:** Soal sudah dijawab.
  - **Kuning:** Soal ditandai "Ragu-Ragu".
  - **Putih/Garis:** Soal belum dijawab.

### 3. Menjawab Soal & Ragu-Ragu
- Untuk soal **PG**, klik pada salah satu opsi (A/B/C/D).
- Untuk soal **PGK**, Anda dapat mencentang beberapa kotak jawaban yang dianggap benar.
- Jika ragu, centang kotak **"Ragu-Ragu"** agar nomor soal berwarna kuning di daftar navigasi sebagai pengingat untuk diperiksa kembali.

### 4. Mengakhiri Ujian
- Klik tombol **"Selesaikan Ujian"** di sidebar navigasi.
- Pastikan semua soal telah terjawab (cek ringkasan pada modal konfirmasi).
- Setelah dikumpulkan, Anda akan langsung menerima skor akhir, predikat capaian literasi, grafik analitik kompetensi, serta pembahasan soal secara mendetail.

---

## 👨‍🏫 Panduan untuk Guru / Administrator: Dasbor Pemantauan

### 1. Mengakses Dasbor Guru
Guru atau pengawas dapat memantau rekapitulasi nilai siswa dengan dua cara:
- Klik tombol **"Dasbor Guru"** kecil di bagian bawah formulir login siswa.
- Klik tombol **"Dasbor Guru"** yang tersedia di bilah atas (*header*) maupun di dalam panel navigasi samping (*sidebar*) saat ujian sedang berlangsung.

### 2. Rekapitulasi & Statistik Kelas
Di dalam **Dasbor Pemantauan Guru**, Anda dapat melihat:
- **Total Siswa Mengumpulkan:** Jumlah siswa yang telah menyelesaikan ujian.
- **Rata-rata Skor Kelas:** Akumulasi nilai rata-rata dari seluruh siswa yang tercatat.
- **Tingkat Ketuntasan (Pass Rate):** Persentase siswa yang mencapai skor $\ge 70$.
- **Tabel Nilai Siswa:** Daftar lengkap berisi Nomor, Nama, Kelas, NIS, Skor Akhir, Jawaban Benar, Predikat, dan Waktu Selesai ujian masing-masing siswa.

### 3. Ekspor Data & Pengelolaan Riwayat
- **Ekspor Rekap CSV:** Klik tombol **"Ekspor Rekap CSV"** untuk mengunduh seluruh data rekap nilai siswa dalam format `.csv` yang kompatibel dengan Microsoft Excel atau Google Sheets.
- **Hapus Riwayat:** Guru dapat menghapus seluruh riwayat rekap nilai tersimpan jika memulai sesi ujian baru dengan mengeklik tombol **"Hapus Riwayat"**.

---

## 🚀 Progressive Web App (PWA)
Aplikasi ini dirancang sebagai Progressive Web App (PWA), yang memungkinkan pengalaman seperti aplikasi native:
- **Instalasi:** Anda dapat menginstal aplikasi ini ke layar beranda perangkat Anda (desktop atau mobile) untuk akses cepat tanpa perlu browser.
- **Offline-First:** Aplikasi dapat dimuat dan berfungsi secara offline setelah kunjungan pertama, berkat penggunaan *Service Worker*.

## 🛠️ Catatan Teknis & Deployment
- **Penyimpanan Data:** Identitas siswa dan jawaban disimpan secara otomatis ke dalam *LocalStorage* peramban. Sesi login akan tetap tersimpan hingga siswa menekan tombol "Keluar / Ganti Akun" atau melakukan reset sesi.
- **Responsivitas:** Antarmuka dirancang *mobile-first* dan mendukung tampilan desktop, tablet, maupun ponsel pintar dengan standar desain UI profesional.
- **Deployment:** Cukup unggah seluruh berkas proyek ke layanan hosting statis seperti GitHub Pages, Netlify, Vercel, atau Firebase Hosting.

---
*Dokumentasi disusun oleh Fajar (Spesialis Rilis & Dukungan) - Tim Pengembang Si Rakit.*