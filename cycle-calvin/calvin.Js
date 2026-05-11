/**
 * CALVIN.JS - Logique de simulation du Cycle de Calvin
 */

const state = {
    step: 1,
    isPaused: false,
    fixation: { co2: false, rubp: false },
    isLightOn: true,
    atpLevel: 100,
    nadphLevel: 100
};

// --- ÉLÉMENTS DU DOM ---
const arena = document.getElementById('reaction-arena');
const recycleBin = document.getElementById('recycle-bin'); 
const exportBin = document.getElementById('export-bin');    
const guide = document.getElementById('current-step-text');
const spawnShelf = document.getElementById('spawn-shelf');
const rubisco = document.getElementById('rubisco-altar');
const resultDisplay = document.getElementById('result-display');
const resultText = document.getElementById('result-text');

// --- OPTIMISATION O1 & O2 : GESTION LUMIÈRE ET BATTERIES ---
const btnLight = document.getElementById('btn-light-toggle');
const atpFill = document.getElementById('atp-battery-fill');
const nadphFill = document.getElementById('nadph-battery-fill');
const stromaContainer = document.getElementById('stroma-display');

if (btnLight) {
    btnLight.onclick = function() {
        state.isLightOn = !state.isLightOn;
        const label = document.getElementById('light-status-label');
        const batteries = document.querySelectorAll('.battery-body');
        
        this.classList.toggle('off');
        this.innerText = state.isLightOn ? "ON" : "OFF";
        
        // Basculer l'obscurité totale sur le site
        document.body.classList.toggle('dark-mode', !state.isLightOn);

        // Optimisation O1 : Mise à jour du label dynamique
        if (label) label.innerText = state.isLightOn ? "Lumière" : "Obscurité";

        // Initialisation des batteries en mode OFF (80% pour fixation)
        if (!state.isLightOn) {
            state.atpLevel = 80;
            state.nadphLevel = 80;
        }

        // Optimisation O3 : Gestion de l'effet de chargement (icônes)
        batteries.forEach(b => {
            if (state.isLightOn) b.classList.add('charging');
            else b.classList.remove('charging');
        });
        
        if (stromaContainer) {
            stromaContainer.style.filter = state.isLightOn ? "none" : "brightness(0.4) saturate(0.5)";
            stromaContainer.style.transition = "filter 1s ease";
        }
    };
}

function updateBatteries() {
    if (!state.isPaused) {
        if (state.isLightOn) {
            if (state.atpLevel < 100) state.atpLevel += 0.2;
            if (state.nadphLevel < 100) state.nadphLevel += 0.2;
        } else {
            // Consommation naturelle minimale
            if (state.atpLevel > 0) state.atpLevel -= 0.01;
            if (state.nadphLevel > 0) state.nadphLevel -= 0.01;
        }

        // Mise à jour visuelle des barres et couleurs (Optimisation O2)
        if (atpFill) {
            atpFill.style.height = state.atpLevel + "%";
            // Changement de couleur dynamique selon l'état de la lumière et du niveau
            if (state.isLightOn) {
                atpFill.style.backgroundColor = "#27ae60"; // Vert normal sous lumière
            } else {
                atpFill.style.backgroundColor = state.atpLevel > 50 ? "#27ae60" : (state.atpLevel > 20 ? "#f1c40f" : "#e74c3c");
            }
        }
        if (nadphFill) {
            nadphFill.style.height = state.nadphLevel + "%";
            if (state.isLightOn) {
                nadphFill.style.backgroundColor = "#27ae60";
            } else {
                nadphFill.style.backgroundColor = state.nadphLevel > 50 ? "#27ae60" : (state.nadphLevel > 20 ? "#f1c40f" : "#e74c3c");
            }
        }
    }
    requestAnimationFrame(updateBatteries);
}
updateBatteries();

// --- AJUSTEMENT 14 : LOGIQUE DU QUIZ ---
function checkQuiz(answer) {
    const feedback = document.getElementById('quiz-feedback');
    const overlay = document.getElementById('quiz-overlay');
    
    if (answer === 'B') {
        feedback.style.color = "#27ae60";
        feedback.innerText = "✅ Bonne réponse ! Chargement du Stroma...";
        
        setTimeout(() => {
            overlay.style.opacity = "0";
            overlay.style.pointerEvents = "none";
            setTimeout(() => overlay.remove(), 500);
        }, 1000);
    } else {
        feedback.style.color = "#e74c3c";
        feedback.innerText = "❌ Mauvaise réponse. Réessayez !";
        
        const card = document.querySelector('.quiz-card');
        card.style.animation = "none";
        void card.offsetWidth; // Trigger reflow
        card.style.animation = "shake 0.5s";
    }
}

// --- AJUSTEMENT 15 : LOGIQUE DES BOUTONS DE CONTRÔLE ---
document.getElementById('btn-pause').onclick = function() {
    state.isPaused = !state.isPaused;
    this.innerHTML = state.isPaused ? "▶️ Reprendre" : "⏸️ Pause";
    
    if (state.isPaused) {
        arena.style.filter = "grayscale(0.5) opacity(0.8)";
        arena.style.pointerEvents = "none";
    } else {
        arena.style.filter = "none";
        arena.style.pointerEvents = "auto";
    }
};

document.getElementById('btn-reset').onclick = function() {
    if(confirm("Voulez-vous recommencer la simulation ?")) {
        location.reload();
    }
};

document.getElementById('btn-back').onclick = function() {
    if (state.step === 2) location.reload();
    else if (state.step === 2.5) startPhase2();
    else if (state.step === 3) startPhase3();
};

// --- AJOUT : FONCTIONS UNIVERSELLES POUR TACTILE ---
function getPointerPos(e) {
    const event = e.touches ? e.touches[0] : e;
    return { x: event.clientX, y: event.clientY };
}

function setupTouchSupport() {
    const mobiles = document.querySelectorAll('.reactant, .g3p-block');
    
    mobiles.forEach(el => {
        // Empêcher d'attacher plusieurs fois les mêmes écouteurs
        if (el.dataset.touchSet === "true") return;
        el.dataset.touchSet = "true";

        el.addEventListener('touchstart', (e) => {
            if (state.isPaused) return;
            if (state.atpLevel <= 5 || state.nadphLevel <= 5) return;
            
            const pos = getPointerPos(e);
            el.dataset.startX = pos.x;
            el.dataset.startY = pos.y;
            el.style.zIndex = "1000";
        }, {passive: false});

        el.addEventListener('touchmove', (e) => {
            if (state.isPaused) return;
            e.preventDefault();
            const pos = getPointerPos(e);
            const rect = el.getBoundingClientRect();
            el.style.position = 'fixed';
            el.style.left = (pos.x - rect.width / 2) + 'px';
            el.style.top = (pos.y - rect.height / 2) + 'px';
        }, {passive: false});

        el.addEventListener('touchend', (e) => {
            if (state.isPaused) return;
            el.style.display = 'none';
            const pos = getPointerPos(e.changedTouches[0]);
            
            // On cherche si on survole l'arène ou la zone d'exportation
            const dropTarget = document.elementFromPoint(pos.x, pos.y);
            const isOverArena = dropTarget?.closest('#reaction-arena');
            const isOverExport = dropTarget?.closest('#export-bin');
            
            el.style.display = '';
            el.style.position = '';
            el.style.left = '';
            el.style.top = '';

            if (isOverExport && state.step === 2.5 && el.id.includes('g3p')) {
                handleG3PExport(el.id);
            } else if (isOverArena) {
                handleReactionLogic(el.id);
            }
        });
    });
}

// --- INITIALISATION DU DRAG & DROP ---
function initDraggables() {
    document.querySelectorAll('.reactant, .g3p-block').forEach(item => {
        item.ondragstart = (e) => {
            if (state.isPaused) return e.preventDefault();
            // Sécurité batteries vides
            if (state.atpLevel <= 5 || state.nadphLevel <= 5) {
                alert("⚠️ Stock d'énergie épuisé ! Rallumez la lumière pour charger.");
                return e.preventDefault();
            }
            e.dataTransfer.setData('text/plain', e.target.id);
        };
    });
    setupTouchSupport(); // Activer le tactile pour les éléments chargés
}

arena.ondragover = (e) => e.preventDefault();
arena.ondrop = (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    handleReactionLogic(id);
};

exportBin.ondragover = (e) => e.preventDefault();
exportBin.ondrop = (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (state.step === 2.5 && id.includes('g3p')) {
        handleG3PExport(id);
    }
};

// --- LOGIQUE DE RÉACTION PRINCIPALE ---
function handleReactionLogic(id) {
    if (state.step === 1) {
        if (id === 'co2-batch') state.fixation.co2 = true;
        if (id === 'rubp-batch') state.fixation.rubp = true;
        
        const el = document.getElementById(id);
        if (el) el.style.opacity = '0.2'; 

        if (state.fixation.co2 && state.fixation.rubp) {
            startPhase2();
        }
    } 
    else if (state.step === 2 && id === 'atp-red-batch') {
        // Correction Timing Obscurité : Consommation pour Reduction -> Jaune
        if (!state.isLightOn) {
            state.atpLevel = 40;
            state.nadphLevel = 40;
        } else {
            state.atpLevel -= 30;
            state.nadphLevel -= 30;
        }
        startPhase3();
    }
    else if (state.step === 3 && id === 'atp-reg-batch') {
        // Correction Timing Obscurité : Consommation pour Regeneration -> Rouge
        if (!state.isLightOn) {
            state.atpLevel = 10;
        } else {
            state.atpLevel -= 20;
        }
        finishCycle();
    }
}

// --- PHASES DU CYCLE ---

function startPhase2() {
    state.step = 2;
    animateCatalysis();
    spawnShelf.innerHTML = '';
    
    setTimeout(() => {
        rubisco.classList.add('rubisco-finished');
    }, 1000);

    showResultTemporarily("Fixation : Formation de 6 molécules d'APG (C3)", () => {
        const apg = document.createElement('div');
        apg.id = "main-molecule";
        apg.className = "waste-mol product-active";
        apg.innerHTML = "6 APG (C3)";
        arena.appendChild(apg);

        guide.innerText = "Étape 2 : Réduction de l'APG en G3P (Glissez le lot 6 ATP / 6 NADPH)";
        
        spawnShelf.innerHTML = `
            <div class="reactant" id="atp-red-batch" draggable="true">
                <div class="waste-mol" style="background:#fff9c4">⚡ 6 ATP / 6 NADPH</div>
            </div>
        `;
        initDraggables();
    });
}

function startPhase3() {
    state.step = 2.5;
    const mainMol = document.getElementById('main-molecule');
    const energyBatch = document.getElementById('atp-red-batch');
    if(energyBatch) energyBatch.style.opacity = '0';

    showResultTemporarily("Réduction : Production de 6 G3P riches en énergie", () => {
        const waste = createWasteElement("6 ADP + 6 Pi + 6 NADP+");
        arena.appendChild(waste);
        setTimeout(() => moveMolecule(waste, recycleBin), 100);

        if(mainMol) mainMol.remove();
        
        const container = document.createElement('div');
        container.className = "g3p-container";
        container.id = "g3p-pool";

        for (let i = 0; i < 6; i++) {
            const block = document.createElement('div');
            block.className = "g3p-block";
            block.id = `g3p-${i}`;
            block.draggable = true;
            block.innerText = "G3P";
            container.appendChild(block);
        }
        arena.appendChild(container);
        guide.innerText = "Étape : Exportez 1 G3P vers 'Matière organique prête'";
        initDraggables();
    });
}

function handleG3PExport(blockId) {
    const block = document.getElementById(blockId);
    if(!block) return;

    moveMolecule(block, exportBin);
    block.draggable = false;
    block.style.cursor = "default";

    const congrats = document.createElement('div');
    congrats.id = "congrats-overlay";
    congrats.className = "show";
    congrats.innerHTML = "🎉 Bravo !<br>Matière organique fabriquée !";
    document.body.appendChild(congrats);

    setTimeout(() => {
        congrats.classList.remove('show');
        setTimeout(() => congrats.remove(), 500);
        prepareRegeneration();
    }, 2500);
}

function prepareRegeneration() {
    state.step = 3;
    const pool = document.getElementById('g3p-pool');
    if(pool) {
        pool.style.opacity = '1'; 
        pool.style.pointerEvents = 'none'; 
    }

    guide.innerText = "Étape 3 : Régénération du RuBP (Glissez les 3 ATP)";
    
    spawnShelf.innerHTML = `
        <div class="reactant" id="atp-reg-batch" draggable="true">
            <div class="waste-mol" style="background:#fff9c4">🔋 3 ATP</div>
        </div>
    `;
    initDraggables();
}

function finishCycle() {
    const atpReg = document.getElementById('atp-reg-batch');
    if(atpReg) atpReg.style.opacity = '0';
    
    showResultTemporarily("Régénération : Les 5 G3P restants redeviennent 3 RuBP", () => {
        const waste = createWasteElement("3 ADP + 3 Pi");
        arena.appendChild(waste);
        setTimeout(() => moveMolecule(waste, recycleBin), 100);

        if (document.getElementById('g3p-pool')) document.getElementById('g3p-pool').remove();
        
        const finalRuBP = document.createElement('div');
        finalRuBP.className = "waste-mol";
        finalRuBP.style.background = "#ccffcc";
        finalRuBP.innerHTML = "3 RuBP Régénérés !";
        arena.appendChild(finalRuBP);
        
        guide.innerText = "Cycle complet ! Le RuBP est prêt pour une nouvelle fixation.";

        // Alerte Épuisement Obscurité
        if (!state.isLightOn && state.atpLevel <= 15) {
            setTimeout(() => {
                alert("⚠️ STOCKS ÉPUISÉS : L'énergie accumulée pendant la phase claire est terminée. Vous ne pouvez pas relancer un nouveau cycle sans rallumer la lumière !");
                arena.style.pointerEvents = "none";
            }, 500);
        }
    });
}

// --- FONCTIONS UTILITAIRES ---

function animateCatalysis() {
    rubisco.classList.remove('catalyzing');
    void rubisco.offsetWidth; 
    rubisco.classList.add('catalyzing');
}

/**
 * Gère l'affichage des résultats avec support de la Pause
 */
function showResultTemporarily(text, callback) {
    resultText.innerText = text;
    resultDisplay.style.display = 'block';

    let timeLeft = 3500;
    const checkPause = setInterval(() => {
        if (!state.isPaused) {
            timeLeft -= 100;
        }
        if (timeLeft <= 0) {
            clearInterval(checkPause);
            resultDisplay.style.display = 'none';
            if (callback) callback();
        }
    }, 100);
}

function createWasteElement(text) {
    const div = document.createElement('div');
    div.className = "waste-mol";
    div.innerText = text;
    div.style.position = "absolute";
    div.style.top = "45%";
    div.style.left = "45%";
    return div;
}

function moveMolecule(element, target) {
    element.style.position = "relative";
    element.style.top = "auto";
    element.style.left = "auto";
    element.style.transform = "none";
    element.style.transition = "all 0.8s ease-in-out";
    target.appendChild(element);
}

// Lancement initial
initDraggables();
