// Globale Variablen für den Zustand der App
let currentEquation = null;
let studentName = "";
let sessionData = []; // Speichert alle gelösten Aufgaben
let currentSteps = []; // Speichert die Schritte der aktuellen Aufgabe
let usedHelp = false;
let initialEquationTeX = ""; // Merkt sich die Startgleichung

// --- EREIGNISSE (Klicks & Tasten) ---

// 1. Start-Button (Login)
els.startBtn.addEventListener('click', () => {
    if (els.nameIn.value.trim() === '') {
        alert("Bitte gib einen Namen ein!"); return;
    }
    studentName = els.nameIn.value.trim();
    UI.startSession();
    generateNewTask();
});

// 2. Aufgabe generieren
function generateNewTask() {
    usedHelp = false;
    currentSteps = [];

    // Zufallszahlen 0-100 (Vorfaktoren a und c mindestens 1, damit kein 0x entsteht)
    const rC = () => Math.floor(Math.random() * 26);
    const rV = () => Math.floor(Math.random() * 25) + 1;

    let a = rV(), b = rC(), c = rV(), d = rC();

    // 50% Chance für 2 Variablen
    let isTwoVars = Math.random() > 0.5;
    let v1Name = 'x', v2Name = '';
    let taskText = "";

    if (isTwoVars) {
        v1Name = Math.random() > 0.5 ? 'x' : 'a';
        v2Name = v1Name === 'x' ? 'y' : 'b';
        taskText = "Forme die Gleichung nach einer der Variablen um.";
    } else {
        taskText = "Löse die Gleichung nach x auf.";
        // Sinnlose Aufgaben verhindern
        while(a === c) c = rV();
    }

    currentEquation = new Equation(v1Name, v2Name, a, b, c, d);
    initialEquationTeX = currentEquation.getTeX(); //Startzustand für die E-Mail speichern
    UI.resetForNewTask(taskText);
    UI.renderEquation(currentEquation.getTeX());
}

// 3. Eingabe der Schüler verarbeiten (Enter-Taste)
els.opInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        UI.hideError();
        const input = els.opInput.value;
        if(input.trim() === '') return;

        try {
            const oldTeX = currentEquation.getTeX();
            currentEquation.apply(input);
            currentSteps.push(input);

            UI.addHistoryRow(currentSteps.length, oldTeX, input);
            UI.renderEquation(currentEquation.getTeX());
            els.opInput.value = '';

            if (currentEquation.isSolved()) {
                handleTaskFinished();
            }
        } catch (err) {
            UI.showError(err.message);
        }
    }
});

els.nameIn.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); // Verhindert ungewolltes Neuladen der Seite
        els.startBtn.click(); // Simuliert den Klick auf "Starten"
    }
});

// Enter-Taste für das Feld der eigenen Gleichung
els.customInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        els.startCustomBtn.click(); // Simuliert den Klick auf "Los!"
    }
});

// 4. Aufgabe wurde gelöst
function handleTaskFinished() {
    UI.finishTask(currentEquation.getTeX());

    let stepsStr = currentSteps.join(', ');
    // NEU: Wir nutzen die Tilde (~) als Schummel-Symbol!
    if (usedHelp) stepsStr += ' ~';

    let combinedString = `${initialEquationTeX} | ${stepsStr}`;

    sessionData.push({ combined: combinedString });
    UI.updateCounter(sessionData.length);
}

// --- BUTTONS ---
// --- EIGENE GLEICHUNG EINGEBEN ---

// Blendet das Eingabefeld ein und aus
els.showCustomBtn.addEventListener('click', () => {
    els.customArea.classList.toggle('hidden');
    if (!els.customArea.classList.contains('hidden')) {
        els.customInput.focus();
    }
});

// Startet die eigene Gleichung
els.startCustomBtn.addEventListener('click', () => {
    const eqText = els.customInput.value.trim();
    if (!eqText) return;

    // Brüche und Geteilt-Zeichen blockieren
    if (eqText.includes('/') || eqText.includes(':')) {
        alert("Bitte gib keine Brüche oder Geteilt-Zeichen in der Startgleichung ein. Nutze nur ganze Zahlen!");
        return;
    }

    try {
        // Wir nutzen einfach den Parser aus dem Lehrer-Modus!
        currentEquation = Equation.fromText(eqText);
        initialEquationTeX = currentEquation.getTeX();
        usedHelp = false;
        currentSteps = [];

        // Den Anleitungstext dynamisch anpassen (je nachdem, ob es 1 oder 2 Variablen sind)
        let taskText = currentEquation.v2Name !== ''
        ? "Forme die Gleichung nach einer der Variablen um."
        : `Löse die Gleichung nach ${currentEquation.v1Name} auf.`;

        UI.resetForNewTask(taskText);
        UI.renderEquation(currentEquation.getTeX());

        // Feld wieder leeren und verstecken
        els.customInput.value = '';
        els.customArea.classList.add('hidden');

    } catch (e) {
        alert("Fehler bei der Eingabe: " + e.message + "\nBitte halte dich an Formate wie '2x+3=7-9x'.");
    }
});


els.nextBtn.addEventListener('click', generateNewTask);

els.showSolBtn.addEventListener('click', () => {
    usedHelp = true;
    UI.showSolution(currentEquation.getSolutionTeX());
});

els.helpBtn.addEventListener('click', () => els.helpModal.classList.remove('hidden'));
els.closeHelp.addEventListener('click', () => els.helpModal.classList.add('hidden'));

// Senden an Google Sheets
els.submitBtn.addEventListener('click', () => {
    if (sessionData.length === 0) {
        alert("Du hast noch keine Aufgabe gelöst!");
        return;
    }

    // Button sofort sperren, um Doppelklicks zu verhindern
    els.submitBtn.innerText = "Sendet...";
    els.submitBtn.disabled = true;

    const payload = {
        name: studentName,
        tasks: sessionData
    };

    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwDLS7iKXpFvrBHW2EyUrR8RFxwfqHlNynUIIiIxT6wuvyGzQ6989JsKqeDUQgIMHtEGw/exec';

    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(() => {
        alert("Erfolgreich gesendet!");
        els.submitBtn.innerText = "Ergebnisse Senden";
        els.submitBtn.disabled = false; // Button wieder freigeben
        sessionData = []; // Speicher leeren
    }).catch(err => {
        alert("Fehler beim Senden. Bitte überprüfe deine Internetverbindung.");
        els.submitBtn.innerText = "Ergebnisse Senden";
        els.submitBtn.disabled = false; // Button auch bei Fehler wieder freigeben
    });
});

// --- LEHRER MODUS (Alt + E) ---

document.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'e' || e.key === 'E')) {
        UI.toggleTeacherMode(true);
    }
});

els.closeTeacher.addEventListener('click', () => {
    UI.toggleTeacherMode(false);
});

// --- LEHRER MODUS (Abspielen) ---
els.loadTeacherBtn.addEventListener('click', () => {
    const rawData = els.teacherInput.value.trim();
    if (!rawData.includes('|')) {
        alert("Format bitte: Gleichung | Schritt1, Schritt2");
        return;
    }

    try {
        // Den String am | zerschneiden
        let [eqText, stepsText] = rawData.split('|');

        // Da wir '~' nehmen, können wir völlig sicher suchen und ersetzen!
        let hasHelp = stepsText.includes('~');
        stepsText = stepsText.replace('~', '').trim();

        // Schritte wieder in eine Liste verwandeln
        const steps = stepsText ? stepsText.split(',').map(s => s.trim()) : [];

        // UI aufräumen
        UI.clearForTeacher();
        UI.toggleTeacherMode(false); // Modal schließen

        // 1. Startgleichung laden und rendern
        currentEquation = Equation.fromText(eqText);
        UI.renderEquation(currentEquation.getTeX());

        // 2. Schritte nacheinander ausführen
        steps.forEach((step, index) => {
            if (step === '') return;
            const oldTeX = currentEquation.getTeX();
            currentEquation.apply(step);
            UI.addHistoryRow(index + 1, oldTeX, step);
        });

        // 3. Endergebnis anzeigen
        UI.renderEquation(currentEquation.getTeX());

        // Wenn geschummelt wurde, Hinweis einblenden
        if (hasHelp) {
            const helpRow = document.createElement('div');
            helpRow.className = 'row';
            helpRow.innerHTML = `<div class="equation-display" style="color:#FF9800; font-size:16px;">(Der Schüler hat sich die Lösung anzeigen lassen ~)</div><div class="input-area"></div>`;
            els.history.appendChild(helpRow);
        }

    } catch (e) {
        alert("Fehler beim Laden: " + e.message);
    }
});
