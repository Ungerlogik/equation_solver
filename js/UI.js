// Sammelt alle wichtigen HTML-Elemente
const els = {
    showCustomBtn: document.getElementById('show-custom-btn'),
    customArea: document.getElementById('custom-input-area'),
    customInput: document.getElementById('custom-eq-input'),
    startCustomBtn: document.getElementById('start-custom-btn'),
    login: document.getElementById('login-screen'),
    main: document.getElementById('main-screen'),
    nameIn: document.getElementById('student-name'),
    taskCounter: document.getElementById('task-counter'),
    startBtn: document.getElementById('start-btn'),
    history: document.getElementById('history-container'),
    eqDisplay: document.getElementById('current-equation'),
    opInput: document.getElementById('operation-input'),
    error: document.getElementById('error-message'),
    controls: document.getElementById('controls'),
    nextBtn: document.getElementById('next-task-btn'),
    submitBtn: document.getElementById('submit-btn'),
    taskDesc: document.getElementById('task-description'),
    showSolBtn: document.getElementById('show-solution-btn'),
    loadTeacherBtn: document.getElementById('load-teacher-data'),
    teacherInput: document.getElementById('teacher-data'),
    activeRow: document.getElementById('active-row'),
    helpBtn: document.getElementById('help-btn'),
    helpModal: document.getElementById('help-modal'),
    closeHelp: document.getElementById('close-help'),
    teacherModal: document.getElementById('teacher-modal'),
    closeTeacher: document.getElementById('close-teacher'),
    solutionDisplay: document.getElementById('solution-display')
};

// Das UI-Objekt stellt Funktionen bereit, um die Oberfläche zu steuern
const UI = {
    startSession: function() {
        els.login.classList.add('hidden');
        els.main.classList.remove('hidden');
    },

    resetForNewTask: function(taskText) {
        els.history.innerHTML = '';
        els.opInput.value = '';
        els.opInput.disabled = false;
        els.controls.classList.add('hidden');
        els.activeRow.classList.remove('hidden');
        els.showSolBtn.classList.remove('hidden');
        els.error.classList.add('hidden');
        els.taskDesc.innerText = taskText;

        // NEU: Lösungsfeld verstecken und leeren
        els.solutionDisplay.classList.add('hidden');
        els.solutionDisplay.innerHTML = '';

        // Setzt den Cursor automatisch ins Eingabefeld
        setTimeout(() => els.opInput.focus(), 10);
    },

    renderEquation: function(texString) {
        katex.render(texString, els.eqDisplay);
    },

    // NEU: Lösungsfunktion
    showSolution: function(texString) {
        els.solutionDisplay.classList.remove('hidden');
        els.showSolBtn.classList.add('hidden'); // Button verstecken
        katex.render("\\text{Ziel: } " + texString, els.solutionDisplay);
    },

    addHistoryRow: function(stepIndex, oldTeX, input) {
        const row = document.createElement('div');
        row.className = 'row';
        row.innerHTML = `
        <div class="equation-display" id="hist-${stepIndex}"></div>
        <div class="input-area">| ${input}</div>
        `;
        els.history.appendChild(row);
        katex.render(oldTeX, document.getElementById(`hist-${stepIndex}`));
    },

    showError: function(message) {
        els.error.innerText = message;
        els.error.classList.remove('hidden');
    },

    hideError: function() {
        els.error.classList.add('hidden');
    },

    finishTask: function(finalTeX) {
        els.opInput.disabled = true;
        els.activeRow.classList.add('hidden');
        els.showSolBtn.classList.add('hidden');
        els.controls.classList.remove('hidden');

        // Einen grünen Haken an die letzte Zeile setzen
        const finalRow = document.createElement('div');
        finalRow.className = 'row';
        finalRow.innerHTML = `<div class="equation-display" id="hist-final"></div><div class="input-area">✔️</div>`;
        els.history.appendChild(finalRow);
        katex.render(finalTeX, document.getElementById('hist-final'));
    },

    toggleTeacherMode: function(active) {
        if (active) {
            els.teacherModal.classList.remove('hidden');
            document.body.classList.add('teacher-mode');
        } else {
            els.teacherModal.classList.add('hidden');
            document.body.classList.remove('teacher-mode');
        }
    },

    updateCounter: function(count) {
        if (count > 0) {
            els.taskCounter.innerText = `${count} Aufgabe(n) bereit zum Senden`;
            els.taskCounter.classList.remove('hidden');
        } else {
            els.taskCounter.classList.add('hidden');
        }
    },

    clearForTeacher: function() {
        els.history.innerHTML = '';
        els.activeRow.classList.add('hidden');
        els.controls.classList.add('hidden');
        els.solutionDisplay.classList.add('hidden');
    }
};
