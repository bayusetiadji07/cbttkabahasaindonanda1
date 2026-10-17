import { stimuliData, questions } from './questions.js';
import { processExamAnalytics, renderAnalyticsChart, exportResultsToCSV } from './analytics.js';

/**
 * Konfigurasi & State Aplikasi CBT
 * Dioptimasi oleh: Raka (Programmer Senior)
 */
const CONFIG = {
    STORAGE_KEY: 'TKA_CBT_SMP_V1.1',
    HISTORY_KEY: 'TKA_CBT_HISTORY',
    DEFAULT_TIMER_SECONDS: 60 * 60, // 60 menit
    TOTAL_QUESTIONS: 30
};

// Map Stimulus untuk akses cepat
const stimuliMap = new Map();
stimuliData.forEach(s => stimuliMap.set(s.id, s));

// State Aplikasi Utama
let state = {
    student: null,     // { name, class, nis }
    currentIndex: 0,
    answers: {},       // { [questionId]: Array<number> }
    flagged: {},       // { [questionId]: boolean }
    timeRemaining: CONFIG.DEFAULT_TIMER_SECONDS,
    isSubmitted: false,
    startTime: Date.now()
};

let timerInterval = null;
let autoSaveTimeout = null;

// DOM Elements
const elements = {
    loginOverlay: document.getElementById('login-overlay'),
    loginForm: document.getElementById('login-form'),
    inputName: document.getElementById('input-name'),
    inputClass: document.getElementById('input-class'),
    inputNIS: document.getElementById('input-nis'),
    btnLoginTeacherAccess: document.getElementById('btn-login-teacher-access'),
    cbtApp: document.getElementById('cbt-app'),
    studentInfoDisplay: document.getElementById('student-info-display'),
    
    cbtTimer: document.getElementById('cbt-timer'),
    timerCard: document.getElementById('timer-card'),
    stimulusJenis: document.getElementById('stimulus-jenis'),
    stimulusTema: document.getElementById('stimulus-tema'),
    stimulusJudul: document.getElementById('stimulus-judul'),
    stimulusSumber: document.getElementById('stimulus-sumber'),
    stimulusBody: document.getElementById('stimulus-body'),
    questionNumberBadge: document.getElementById('question-number-badge'),
    questionTypeBadge: document.getElementById('question-type-badge'),
    chkFlagDoubt: document.getElementById('chk-flag-doubt'),
    competencyText: document.getElementById('competency-text'),
    questionPrompt: document.getElementById('question-prompt'),
    optionsContainer: document.getElementById('options-container'),
    btnPrevQuestion: document.getElementById('btn-prev-question'),
    btnNextQuestion: document.getElementById('btn-next-question'),
    quickAnsweredCount: document.getElementById('quick-answered-count'),
    cbtSidebar: document.getElementById('cbt-sidebar'),
    sidebarBackdrop: document.getElementById('sidebar-backdrop'),
    btnToggleGrid: document.getElementById('btn-toggle-grid'),
    btnCloseSidebar: document.getElementById('btn-close-sidebar'),
    questionGrid: document.getElementById('question-grid'),
    statCountAnswered: document.getElementById('stat-count-answered'),
    statCountFlagged: document.getElementById('stat-count-flagged'),
    statCountUnanswered: document.getElementById('stat-count-unanswered'),
    btnFinishTest: document.getElementById('btn-finish-test'),
    btnResetSession: document.getElementById('btn-reset-session'),
    
    // Teacher Modal
    btnOpenTeacher: document.getElementById('btn-open-teacher'),
    btnTeacherSidebar: document.getElementById('btn-teacher-sidebar'),
    modalTeacher: document.getElementById('modal-teacher'),
    btnCloseTeacherModal: document.getElementById('btn-close-teacher-modal'),
    btnCloseTeacherFooter: document.getElementById('btn-close-teacher-footer'),
    teacherTotalExaminees: document.getElementById('teacher-total-examinees'),
    teacherAvgScore: document.getElementById('teacher-avg-score'),
    teacherPassRate: document.getElementById('teacher-pass-rate'),
    teacherTableBody: document.getElementById('teacher-table-body'),
    btnTeacherExportAll: document.getElementById('btn-teacher-export-all'),
    btnTeacherClear: document.getElementById('btn-teacher-clear'),

    // Confirm Modal
    modalConfirm: document.getElementById('modal-confirm'),
    btnCloseConfirmModal: document.getElementById('btn-close-confirm-modal'),
    btnCancelSubmit: document.getElementById('btn-cancel-submit'),
    btnConfirmSubmit: document.getElementById('btn-confirm-submit'),
    summaryAnswered: document.getElementById('summary-answered'),
    summaryFlagged: document.getElementById('summary-flagged'),
    summaryUnanswered: document.getElementById('summary-unanswered'),
    
    // Result Modal
    modalResult: document.getElementById('modal-result'),
    btnExportCSV: document.getElementById('btn-export-csv'),
    resultFinalScore: document.getElementById('result-final-score'),
    resultCorrectCount: document.getElementById('result-correct-count'),
    resultWrongCount: document.getElementById('result-wrong-count'),
    resultWeightedScore: document.getElementById('result-weighted-score'),
    resultPredicate: document.getElementById('result-predicate'),
    resultStudentSubtitle: document.getElementById('result-student-subtitle'),
    resultName: document.getElementById('result-name'),
    resultClassNis: document.getElementById('result-class-nis'),
    reviewQuestionsList: document.getElementById('review-questions-list'),
    btnRestartExam: document.getElementById('btn-restart-exam'),
    btnCloseResultModal: document.getElementById('btn-close-result-modal'),
    
    toastContainer: document.getElementById('toast-container')
};

// --- PERSISTENSI DATA (RECORDING) ---

function loadSavedState() {
    try {
        const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            state = { ...state, ...parsed };
            if (state.student) {
                activateAppUI();
            }
            if (state.isSubmitted) {
                setTimeout(() => submitExam(true), 100);
            } else if (state.student) {
                showToast('Progres ujian berhasil dipulihkan.', 'info');
            }
        }
    } catch (err) {
        console.error('Gagal memuat state:', err);
    }
}

function saveState() {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
        console.warn('Penyimpanan lokal penuh atau dibatasi.');
    }
}

function triggerAutoSave() {
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(saveState, 500);
}

function resetExamSession() {
    if (confirm('Hapus seluruh jawaban dan ulangi ujian dari awal?')) {
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        window.location.reload();
    }
}

function activateAppUI() {
    if (elements.loginOverlay) {
        elements.loginOverlay.classList.add('hidden');
    }
    if (elements.cbtApp) {
        elements.cbtApp.classList.remove('app-disabled');
    }
    if (state.student) {
        elements.studentInfoDisplay.textContent = `Peserta: ${state.student.name} | Kelas: ${state.student.class} (NIS: ${state.student.nis})`;
    }
}

// --- LOGIN HANDLER ---
function handleLoginSubmit(e) {
    e.preventDefault();
    const name = elements.inputName.value.trim();
    const studentClass = elements.inputClass.value.trim();
    const nis = elements.inputNIS.value.trim();

    if (!name || !studentClass || !nis) {
        showToast('Mohon lengkapi seluruh identitas siswa.', 'warning');
        return;
    }

    state.student = { name, class: studentClass, nis };
    state.startTime = Date.now();
    saveState();
    activateAppUI();
    startTimer();
    showToast(`Selamat datang, ${name}! Ujian dimulai.`, 'success');
}

// --- TEACHER DASHBOARD LOGIC ---

function getExamHistory() {
    try {
        const raw = localStorage.getItem(CONFIG.HISTORY_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveExamHistory(analytics) {
    try {
        const history = getExamHistory();
        const existingIdx = history.findIndex(h => h.student.nis === analytics.student.nis);
        const record = {
            student: analytics.student,
            score: analytics.percentage,
            correctCount: analytics.correctCount,
            maxScore: questions.length,
            predicate: analytics.predicate,
            timestamp: new Date().toLocaleString('id-ID'),
            analytics: analytics
        };

        if (existingIdx > -1) {
            history[existingIdx] = record;
        } else {
            history.push(record);
        }
        localStorage.setItem(CONFIG.HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
        console.error('Gagal menyimpan riwayat guru:', e);
    }
}

function openTeacherDashboard() {
    const password = prompt('Masukkan sandi Dasbor Guru:');
    if (password === null) return; // Dibatalkan
    if (password !== 'guru2026') {
        showToast('Sandi guru salah! Akses ditolak.', 'warning');
        return;
    }

    renderTeacherTable();
    elements.modalTeacher.classList.remove('hidden');
    // Jika masih di halaman login, sembunyikan login overlay sementara agar tidak menutupi
    if (elements.loginOverlay && !elements.loginOverlay.classList.contains('hidden')) {
        elements.loginOverlay.style.display = 'none';
    }
    if (window.innerWidth < 1024) closeSidebar();
}

function closeTeacherDashboard() {
    elements.modalTeacher.classList.add('hidden');
    // Kembalikan login overlay jika siswa belum login
    if (elements.loginOverlay && !state.student) {
        elements.loginOverlay.style.display = 'flex';
    }
}

function renderTeacherTable() {
    const history = getExamHistory();
    const tbody = elements.teacherTableBody;
    tbody.innerHTML = '';

    let totalScoreSum = 0;
    let passedCount = 0;

    if (history.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 32px; color: var(--color-text-muted);">Belum ada data siswa yang mengumpulkan ujian.</td></tr>`;
        elements.teacherTotalExaminees.textContent = '0';
        elements.teacherAvgScore.textContent = '0';
        elements.teacherPassRate.textContent = '0%';
        return;
    }

    history.forEach((item, idx) => {
        totalScoreSum += item.score;
        if (item.score >= 70) passedCount++;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td><strong>${escapeHTML(item.student.name)}</strong></td>
            <td>${escapeHTML(item.student.class)}</td>
            <td>${escapeHTML(item.student.nis)}</td>
            <td><strong style="color: var(--color-primary);">${item.score}</strong></td>
            <td>${item.correctCount} / ${item.maxScore}</td>
            <td><span class="badge ${item.score >= 70 ? 'badge-primary' : 'badge-secondary'}">${item.predicate}</span></td>
            <td style="font-size: 12px; color: var(--color-text-muted);">${item.timestamp}</td>
        `;
        tbody.appendChild(tr);
    });

    const avg = Math.round(totalScoreSum / history.length);
    const passRate = Math.round((passedCount / history.length) * 100);

    elements.teacherTotalExaminees.textContent = history.length;
    elements.teacherAvgScore.textContent = avg;
    elements.teacherPassRate.textContent = `${passRate}%`;
}

function clearTeacherHistory() {
    if (confirm('Apakah Anda yakin ingin menghapus seluruh riwayat rekapitulasi nilai siswa?')) {
        localStorage.removeItem(CONFIG.HISTORY_KEY);
        renderTeacherTable();
        showToast('Riwayat rekap guru berhasil dibersihkan.', 'info');
    }
}

function exportAllHistoryCSV() {
    const history = getExamHistory();
    if (history.length === 0) {
        showToast('Belum ada data untuk diekspor.', 'warning');
        return;
    }

    let csvContent = "No,Nama Siswa,Kelas,NIS,Skor Akhir,Jawaban Benar,Predikat,Waktu Selesai\n";
    history.forEach((h, i) => {
        csvContent += `"${i+1}","${h.student.name}","${h.student.class}","${h.student.nis}","${h.score}","${h.correctCount}/${h.maxScore}","${h.predicate}","${h.timestamp}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Rekap_Nilai_CBT_TKA_Siswa_${Date.now()}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Rekap nilai kolektif berhasil diunduh.', 'success');
}


// --- LOGIKA TIMER ---

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        if (state.isSubmitted) {
            clearInterval(timerInterval);
            return;
        }

        if (state.timeRemaining > 0) {
            state.timeRemaining--;
            updateTimerDisplay();
            if (state.timeRemaining % 30 === 0) saveState();
        } else {
            clearInterval(timerInterval);
            showToast('Waktu habis! Jawaban dikumpulkan otomatis.', 'warning');
            submitExam(true);
        }
    }, 1000);
}

function updateTimerDisplay() {
    const min = Math.floor(state.timeRemaining / 60);
    const sec = state.timeRemaining % 60;
    elements.cbtTimer.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    
    if (state.timeRemaining <= 300) {
        elements.timerCard.classList.add('timer-warning');
    }
}

// --- RENDER KONTEN ---

function renderCurrentQuestion() {
    const q = questions[state.currentIndex];
    if (!q) return;

    // Stimulus
    const stimulus = stimuliMap.get(q.stimulusId);
    if (stimulus) {
        elements.stimulusJenis.textContent = stimulus.jenis;
        elements.stimulusTema.textContent = stimulus.tema;
        elements.stimulusJudul.textContent = stimulus.judul;
        elements.stimulusSumber.textContent = `Sumber: ${stimulus.sumber}`;
        elements.stimulusBody.innerHTML = stimulus.bacaan.split('\n\n').map(p => `<p>${escapeHTML(p)}</p>`).join('');
    }

    // Question Meta
    elements.questionNumberBadge.textContent = `Soal ${q.nomor} dari ${questions.length}`;
    elements.competencyText.textContent = q.kompetensi;
    elements.questionTypeBadge.textContent = q.tipe === 'pg' ? 'Pilihan Ganda' : 'Pilihan Ganda Kompleks';
    elements.questionTypeBadge.className = `question-type-badge badge-${q.tipe}`;
    elements.chkFlagDoubt.checked = !!state.flagged[q.id];
    elements.questionPrompt.innerHTML = `<p>${escapeHTML(q.soal)}</p>`;

    renderOptions(q);

    // Nav Buttons
    elements.btnPrevQuestion.disabled = state.currentIndex === 0;
    elements.btnNextQuestion.querySelector('span').textContent = 
        state.currentIndex === questions.length - 1 ? 'Selesai' : 'Selanjutnya';

    updateActiveGridHighlight();
}

function renderOptions(question) {
    const container = elements.optionsContainer;
    container.innerHTML = '';
    const selected = state.answers[question.id] || [];
    const letters = ['A', 'B', 'C', 'D', 'E'];

    question.opsi.forEach((text, idx) => {
        const card = document.createElement('label');
        card.className = `option-card ${selected.includes(idx) ? 'selected' : ''}`;
        
        const type = question.tipe === 'pg' ? 'radio' : 'checkbox';
        card.innerHTML = `
            <input type="${type}" name="q_${question.id}" value="${idx}" 
                ${selected.includes(idx) ? 'checked' : ''} ${state.isSubmitted ? 'disabled' : ''}>
            <span class="option-indicator">${letters[idx]}</span>
            <span class="option-text">${escapeHTML(text)}</span>
        `;

        card.querySelector('input').addEventListener('change', () => {
            if (state.isSubmitted) return;
            handleSelect(question, idx, type);
        });

        container.appendChild(card);
    });
}

function handleSelect(question, idx, type) {
    if (!state.answers[question.id]) state.answers[question.id] = [];
    
    if (type === 'radio') {
        state.answers[question.id] = [idx];
    } else {
        const pos = state.answers[question.id].indexOf(idx);
        if (pos > -1) state.answers[question.id].splice(pos, 1);
        else state.answers[question.id].push(idx);
        state.answers[question.id].sort((a, b) => a - b);
    }

    renderOptions(question);
    renderQuestionGrid();
    updateStatisticsUI();
    triggerAutoSave();
}

function handleFlagToggle() {
    const q = questions[state.currentIndex];
    state.flagged[q.id] = elements.chkFlagDoubt.checked;
    renderQuestionGrid();
    updateStatisticsUI();
    triggerAutoSave();
}

// --- NAVIGASI & SIDEBAR ---

function renderQuestionGrid() {
    const grid = elements.questionGrid;
    grid.innerHTML = '';

    questions.forEach((q, idx) => {
        const btn = document.createElement('button');
        btn.className = 'grid-num-btn';
        btn.textContent = q.nomor;

        const ans = state.answers[q.id];
        if (idx === state.currentIndex) btn.classList.add('active');
        if (ans && ans.length > 0) btn.classList.add('answered');
        if (state.flagged[q.id]) btn.classList.add('flagged');

        btn.onclick = () => {
            state.currentIndex = idx;
            renderCurrentQuestion();
            if (window.innerWidth < 1024) closeSidebar();
        };
        grid.appendChild(btn);
    });
}

function updateActiveGridHighlight() {
    const btns = elements.questionGrid.querySelectorAll('.grid-num-btn');
    btns.forEach((b, i) => b.classList.toggle('active', i === state.currentIndex));
}

function updateStatisticsUI() {
    const answered = questions.filter(q => state.answers[q.id]?.length > 0).length;
    const flagged = Object.values(state.flagged).filter(Boolean).length;

    elements.statCountAnswered.textContent = answered;
    elements.statCountFlagged.textContent = flagged;
    elements.statCountUnanswered.textContent = questions.length - answered;
    elements.quickAnsweredCount.textContent = `${answered} / ${questions.length} Terjawab`;
}

// --- SELESAI & HASIL ---

function openConfirmModal() {
    const answered = questions.filter(q => state.answers[q.id]?.length > 0).length;
    const flagged = Object.values(state.flagged).filter(Boolean).length;

    elements.summaryAnswered.textContent = `${answered} Soal`;
    elements.summaryFlagged.textContent = `${flagged} Soal`;
    elements.summaryUnanswered.textContent = `${questions.length - answered} Soal`;
    elements.modalConfirm.classList.remove('hidden');
}

function getGameFeedback(score) {
    if (score >= 90) return { 
        title: "Master Literasi", 
        message: "Luar biasa! Kamu menunjukkan pemahaman mendalam layaknya seorang kritikus sastra profesional.", 
        colorClass: "text-success" 
    };
    if (score >= 75) return { 
        title: "Pakar Bahasa", 
        message: "Keren! Kamu sudah sangat mahir mengolah informasi. Sedikit lagi menuju sempurna!", 
        colorClass: "text-primary" 
    };
    if (score >= 60) return { 
        title: "Pejuang Literasi", 
        message: "Bagus! Kamu punya dasar yang kuat. Teruslah membaca untuk memperluas cakrawala.", 
        colorClass: "text-warning" 
    };
    return { 
        title: "Pembelajar Tangguh", 
        message: "Jangan menyerah! Setiap ahli dulunya adalah seorang pemula. Pelajari pembahasan dan coba lagi.", 
        colorClass: "text-danger" 
    };
}

function submitExam(isSilent = false) {
    state.isSubmitted = true;
    elements.modalConfirm.classList.add('hidden');
    saveState();

    const analytics = processExamAnalytics(state, questions);
    saveExamHistory(analytics);
    
    elements.resultFinalScore.textContent = analytics.percentage;
    elements.resultCorrectCount.textContent = `${analytics.correctCount} / ${questions.length}`;
    elements.resultWrongCount.textContent = `${analytics.wrongCount} / ${questions.length}`;
    elements.resultWeightedScore.textContent = `${analytics.totalScore} / ${analytics.maxScore}`;
    
    if (state.student) {
        elements.resultStudentSubtitle.textContent = `Peserta: ${state.student.name} | Kelas: ${state.student.class}`;
        elements.resultName.textContent = state.student.name;
        elements.resultClassNis.textContent = `${state.student.class} (NIS: ${state.student.nis})`;
    }

    const feedback = getGameFeedback(analytics.percentage);
    elements.resultPredicate.textContent = feedback.title;
    elements.resultPredicate.className = feedback.colorClass;

    let motivationEl = document.getElementById('result-motivation');
    if (!motivationEl) {
        motivationEl = document.createElement('p');
        motivationEl.id = 'result-motivation';
        motivationEl.style.fontSize = '13px';
        motivationEl.style.marginTop = '4px';
        motivationEl.style.color = 'var(--color-text-muted)';
        elements.resultPredicate.parentNode.appendChild(motivationEl);
    }
    motivationEl.innerHTML = `<em>"${feedback.message}"</em>`;

    renderAnalyticsChart('competencyChart', analytics);
    renderReviewList(analytics.details);
    
    elements.modalResult.classList.remove('hidden');
    elements.btnExportCSV.onclick = () => exportResultsToCSV(analytics);

    if (!isSilent) showToast('Ujian berhasil dikumpulkan.', 'success');
    renderCurrentQuestion();
}

function renderReviewList(details) {
    const list = elements.reviewQuestionsList;
    list.innerHTML = '';

    details.forEach((d, idx) => {
        const q = questions[idx];
        const item = document.createElement('div');
        item.className = `review-item ${d.status === 'Benar' ? 'correct' : 'wrong'}`;
        
        item.innerHTML = `
            <div class="review-item-header">
                <strong>Soal ${q.nomor}</strong>
                <span class="badge ${d.status === 'Benar' ? 'badge-primary' : 'badge-secondary'}">${d.status}</span>
            </div>
            <p style="margin: 8px 0; font-size: 14px;">${escapeHTML(q.soal)}</p>
            <div class="review-ans-row" style="font-size: 13px; margin-bottom: 8px;">
                <span>Jawaban: <b>${d.userAns || '-'}</b></span> | <span>Kunci: <b>${d.keyAns}</b></span>
            </div>
            <div class="review-explanation">
                <b>Pembahasan:</b> <p>${escapeHTML(q.pembahasan)}</p>
            </div>
        `;
        list.appendChild(item);
    });
}

// --- UTILS & EVENTS ---

function openSidebar() {
    elements.cbtSidebar.classList.add('open');
    elements.sidebarBackdrop.classList.add('show');
}

function closeSidebar() {
    elements.cbtSidebar.classList.remove('open');
    elements.sidebarBackdrop.classList.remove('show');
}

function showToast(msg, type) {
    const t = document.createElement('div');
    t.className = `toast toast-${type} show`;
    t.textContent = msg;
    elements.toastContainer.appendChild(t);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
}

function escapeHTML(s) {
    const p = document.createElement('p');
    p.textContent = s;
    return p.innerHTML;
}

function init() {
    loadSavedState();

    if (elements.loginForm) {
        elements.loginForm.onsubmit = handleLoginSubmit;
    }
    
    if (elements.btnLoginTeacherAccess) {
        elements.btnLoginTeacherAccess.onclick = () => {
            openTeacherDashboard();
        };
    }

    if (elements.btnOpenTeacher) elements.btnOpenTeacher.onclick = openTeacherDashboard;
    if (elements.btnTeacherSidebar) elements.btnTeacherSidebar.onclick = openTeacherDashboard;
    if (elements.btnCloseTeacherModal) elements.btnCloseTeacherModal.onclick = closeTeacherDashboard;
    if (elements.btnCloseTeacherFooter) elements.btnCloseTeacherFooter.onclick = closeTeacherDashboard;
    if (elements.btnTeacherExportAll) elements.btnTeacherExportAll.onclick = exportAllHistoryCSV;
    if (elements.btnTeacherClear) elements.btnTeacherClear.onclick = clearTeacherHistory;
    
    elements.btnPrevQuestion.onclick = () => { if (state.currentIndex > 0) { state.currentIndex--; renderCurrentQuestion(); } };
    elements.btnNextQuestion.onclick = () => { 
        if (state.currentIndex < questions.length - 1) { state.currentIndex++; renderCurrentQuestion(); } 
        else openConfirmModal();
    };
    
    elements.chkFlagDoubt.onchange = handleFlagToggle;
    elements.btnToggleGrid.onclick = openSidebar;
    elements.btnCloseSidebar.onclick = closeSidebar;
    elements.sidebarBackdrop.onclick = closeSidebar;
    elements.btnFinishTest.onclick = openConfirmModal;
    elements.btnResetSession.onclick = resetExamSession;
    elements.btnCancelSubmit.onclick = () => elements.modalConfirm.classList.add('hidden');
    elements.btnCloseConfirmModal.onclick = () => elements.modalConfirm.classList.add('hidden');
    elements.btnConfirmSubmit.onclick = () => submitExam();
    elements.btnRestartExam.onclick = resetExamSession;
    elements.btnCloseResultModal.onclick = () => elements.modalResult.classList.add('hidden');

    renderCurrentQuestion();
    renderQuestionGrid();
    updateStatisticsUI();
    if (state.student) {
        startTimer();
    }
}

document.addEventListener('DOMContentLoaded', init);