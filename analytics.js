/**
 * Modul Analisis Data CBT TKA Bahasa Indonesia
 * Tugas: Nadia (Analis Data)
 * Fokus: Rekapitulasi, Statistik, dan Ekspor Data
 */

// Pemetaan Kompetensi Spesifik ke Level Kognitif Literasi (Standar Asesmen Nasional)
const COMPETENCY_MAPPING = {
    // L1: Menemukan Informasi (Access and Retrieve)
    "Menemukan Gagasan Pokok Paragraf": "L1",
    "Menentukan Makna Istilah Kontekstual": "L1",
    "Menganalisis Unsur Adiksimba (5W+1H)": "L1",
    "Menentukan Latar dan Suasana Cerita Fantasi": "L1",
    "Menemukan Ciri Faktual Objek dalam Teks LHO": "L1",
    "Mengidentifikasi Istilah Teknis Bidang Sains": "L1",
    "Mengidentifikasi Material dan Pantangan Prosedur": "L1",
    "Menentukan Citraan / Pengimajian Puisi": "L1",
    
    // L3: Evaluasi & Refleksi (Evaluate and Reflect)
    "Membedakan Fakta dan Opini dalam Teks Berita": "L3",
    "Menganalisis Perilaku Berbahaya di Dunia Maya": "L3",
    "Mengevaluasi Penerapan Rumus 'PIKIR'": "L3",
    "Menilai Hubungan Sebab-Akibat dalam Wacana": "L3",
    "Menyunting Kalimat Efektif Sesuai EYD": "L3",
    "Menilai Suasana dan Nada Puisi": "L3",
    
    // L2: Interpretasi & Integrasi (Integrate and Interpret)
    "Menyimpulkan Isi Berita": "L2",
    "Menganalisis Watak Tokoh Berdasarkan Bukti Teks": "L2",
    "Menemukan Nilai Moral / Amanat Cerita": "L2",
    "Ciri Kebahasaan Teks Cerita Fantasi": "L2",
    "Mengidentifikasi Konflik Cerita": "L2",
    "Struktur Teks Laporan Hasil Observasi": "L2",
    "Membedakan Kalimat Definisi dan Kalimat Deskripsi": "L2",
    "Menjelaskan Fungsi Bau pada Bunga Berdasarkan Teks": "L2",
    "Mengidentifikasi Tujuan Penulis Teks": "L2",
    "Menentukan Makna Kias / Majas dalam Konteks": "L2",
    "Menganalisis Konjungsi Temporal dalam Teks Prosedur": "L2",
    "Kaidah Kebahasaan Kalimat Imperatif": "L2",
    "Memahami Alasan Teknis di Balik Langkah Prosedur": "L2",
    "Menganalisis Majas / Gaya Bahasa Puisi": "L2",
    "Menafsirkan Makna Simbolik Puisi": "L2",
    "Menemukan Amanat Akhir Puisi": "L2"
};

const LEVEL_NAMES = {
    "L1": "Menemukan Informasi",
    "L2": "Interpretasi & Integrasi",
    "L3": "Evaluasi & Refleksi"
};

/**
 * Menghitung statistik mendalam dari hasil ujian, menyertakan identitas siswa
 */
export function processExamAnalytics(state, questions) {
    const student = state.student || { name: 'Siswa Anonim', class: '-', nis: '-' };
    const stats = {
        student: student,
        totalScore: 0,
        maxScore: 0,
        correctCount: 0,
        wrongCount: 0,
        unansweredCount: 0,
        durationSeconds: Math.floor((Date.now() - state.startTime) / 1000),
        competencyData: {
            L1: { correct: 0, total: 0, points: 0, maxPoints: 0 },
            L2: { correct: 0, total: 0, points: 0, maxPoints: 0 },
            L3: { correct: 0, total: 0, points: 0, maxPoints: 0 }
        },
        details: []
    };

    questions.forEach(q => {
        const level = COMPETENCY_MAPPING[q.kompetensi] || "L2";
        const userAns = state.answers[q.id] || [];
        const isCorrect = isAnswerEqual(userAns, q.kunci);
        
        stats.maxScore += q.bobot;
        stats.competencyData[level].total++;
        stats.competencyData[level].maxPoints += q.bobot;

        if (userAns.length === 0) {
            stats.unansweredCount++;
        } else if (isCorrect) {
            stats.totalScore += q.bobot;
            stats.correctCount++;
            stats.competencyData[level].correct++;
            stats.competencyData[level].points += q.bobot;
        } else {
            stats.wrongCount++;
        }

        stats.details.push({
            no: q.nomor,
            kompetensi: q.kompetensi,
            level: LEVEL_NAMES[level],
            status: isCorrect ? "Benar" : (userAns.length === 0 ? "Kosong" : "Salah"),
            poin: isCorrect ? q.bobot : 0,
            userAns: userAns.map(i => String.fromCharCode(65 + i)).join(";"),
            keyAns: q.kunci.map(i => String.fromCharCode(65 + i)).join(";")
        });
    });

    stats.percentage = Math.round((stats.totalScore / stats.maxScore) * 100);
    
    // Penentuan Predikat
    if (stats.percentage >= 85) stats.predicate = "Sangat Baik";
    else if (stats.percentage >= 70) stats.predicate = "Baik";
    else if (stats.percentage >= 55) stats.predicate = "Cukup";
    else stats.predicate = "Perlu Pendampingan";

    return stats;
}

/**
 * Helper: Cek kesamaan array jawaban (PG & PGK)
 */
function isAnswerEqual(a, b) {
    if (a.length !== b.length) return false;
    const sA = [...a].sort();
    const sB = [...b].sort();
    return sA.every((v, i) => v === sB[i]);
}

/**
 * Render Grafik Radar Capaian Kompetensi menggunakan Chart.js
 */
let chartInstance = null;
export function renderAnalyticsChart(canvasId, analyticsData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (chartInstance) chartInstance.destroy();

    const labels = Object.values(LEVEL_NAMES);
    const dataValues = Object.keys(LEVEL_NAMES).map(key => {
        const d = analyticsData.competencyData[key];
        return d.maxPoints > 0 ? Math.round((d.points / d.maxPoints) * 100) : 0;
    });

    chartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Persentase Capaian (%)',
                data: dataValues,
                fill: true,
                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                borderColor: 'rgb(37, 99, 235)',
                pointBackgroundColor: 'rgb(37, 99, 235)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(37, 99, 235)',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { display: true, color: '#e2e8f0' },
                    suggestedMin: 0,
                    suggestedMax: 100,
                    ticks: { 
                        stepSize: 20,
                        backdropColor: 'transparent',
                        font: { size: 10 }
                    },
                    pointLabels: {
                        font: {
                            family: "'Plus Jakarta Sans', sans-serif",
                            size: 11,
                            weight: 'bold'
                        }
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => ` Capaian: ${context.raw}%`
                    }
                }
            }
        }
    });
}

/**
 * Ekspor data hasil ke format CSV (Excel Friendly) termasuk identitas siswa
 */
export function exportResultsToCSV(analyticsData) {
    const timestamp = new Date().toLocaleString('id-ID');
    const durationMin = Math.floor(analyticsData.durationSeconds / 60);
    const durationSec = analyticsData.durationSeconds % 60;
    const student = analyticsData.student || { name: '-', class: '-', nis: '-' };

    // Header Ringkasan
    const summaryRows = [
        ["LAPORAN HASIL ASESMEN TKA BAHASA INDONESIA SMP"],
        ["Nama Siswa", student.name],
        ["Kelas / Rombel", student.class],
        ["NIS / No Peserta", student.nis],
        ["Waktu Selesai", timestamp],
        ["Durasi Pengerjaan", `${durationMin} menit ${durationSec} detik`],
        ["Skor Akhir", `${analyticsData.percentage} / 100`],
        ["Total Poin", `${analyticsData.totalScore} / ${analyticsData.maxScore}`],
        ["Predikat", analyticsData.predicate],
        [""],
        ["RINCIAN PER BUTIR SOAL"],
        ["No Soal", "Kompetensi", "Level Literasi", "Status", "Poin", "Jawaban Siswa", "Kunci Jawaban"]
    ];

    // Baris Data
    const dataRows = analyticsData.details.map(d => [
        d.no,
        d.kompetensi,
        d.level,
        d.status,
        d.poin,
        d.userAns || "-",
        d.keyAns
    ]);

    // Gabungkan dan format CSV
    const csvContent = [
        ...summaryRows.map(r => r.map(c => `"${c}"`).join(",")),
        ...dataRows.map(r => r.map(c => `"${c}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Hasil_CBT_BahasaIndo_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}