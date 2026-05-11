// --- ÉTAT GLOBAL ET HISTORIQUE ---
let state = {
    ps2Excited: false,
    ps1Excited: false,
    electronPos: 'ps2',
    protonsLumen: 0,
    protonsStroma: 8,
    nadphProduced: 0,
    atpProduced: 0,
    e2Pumped: false,
    waterCount: 0,
    nadpPlacedOnE3: false,
    electronAtE3: false,
    instructionStep: null,
    photolysisValidated: false,
    reductionValidated: false,
    atpValidated: false,
    bilanValidated: false 
};

let history = []; 

// --- DÉCLARATION DES SONS ---
const soundPump = new Audio('pump.mp3');
const soundATP = new Audio('synth.mp3');
const soundVictoire = new Audio('Photochimie/felicitations.mp3'); // Ajout du son de félicitations

// --- AMÉLIORATION : GESTION DES AFFICHAGES ---

function updateStepDisplay(message, isSpecial = false) {
    const display = document.getElementById('instruction'); 
    if (display) {
        display.innerText = message;
        display.style.color = isSpecial ? "#2e7d32" : "#222";
    }
}

function afficherPopupElectron() {
    const popup = document.getElementById('electron-info-popup');
    if (popup) popup.style.display = 'flex';
}

function fermerPopupElectron() {
    const popup = document.getElementById('electron-info-popup');
    if (popup) popup.style.display = 'none';
}

// --- LOGIQUE PHOTOLYSE (A1) ---
function insertArrow() {
    const input = document.getElementById('photolysis-input');
    input.value += "→";
    input.focus();
}

function verifierPhotolyse() {
    const input = document.getElementById('photolysis-input').value.replace(/\s+/g, ''); 
    const feedback = document.getElementById('sci-feedback');
    
    const eq1 = "H2O→1/2O2+2H++2e-";
    const eq2 = "2H2O→O2+4H++4e-";

    if (input === eq1 || input === eq2) {
        feedback.style.color = "#27ae60";
        feedback.innerText = "✅ Équation correcte !";
        setTimeout(() => {
            document.getElementById('photolysis-overlay').style.display = 'none';
            finaliserPhotolyseAction(); 
        }, 1200);
    } else {
        feedback.style.color = "#e74c3c";
        feedback.innerText = "❌ Équation incorrecte ou mal formatée.";
        const card = document.querySelector('#photolysis-overlay .sci-card');
        card.style.animation = "shake 0.4s";
        setTimeout(() => card.style.animation = "", 400);
    }
}

function finaliserPhotolyseAction() {
    sauvegarderEtat();
    state.ps2Excited = false; 
    state.waterCount++;
    state.photolysisValidated = true;
    
    document.getElementById('h2o-source').style.display = 'none';
    
    // Étape visuelle : Dégagement de l'oxygène
    creerOxygene(); 
    creerProtonLumen(true); 
    setTimeout(() => creerProtonLumen(true), 1000);
    state.protonsLumen += 2;
    
    // MODIFICATION : On attend que l'oxygène commence son ascension avant d'afficher l'alerte
    setTimeout(() => {
        creerElectron('electron-mobile', 'ps2', 'electron');
        afficherPopupElectron();
        actualiserInstruction();
    }, 2500); // Délai de 2.5s pour laisser l'apprenant observer l'oxygène
}

// --- LOGIQUE RÉDUCTION (A2) ---
function insertArrowA2() {
    const input = document.getElementById('reduction-input');
    input.value += "→";
    input.focus();
}

function verifierReduction() {
    const input = document.getElementById('reduction-input').value.toLowerCase().replace(/\s+/g, '');
    const feedback = document.getElementById('reduction-feedback');
    const eqAttendue = "nadp++2h++2e-→nadph,h+";

    if (input === eqAttendue) {
        feedback.style.color = "#27ae60";
        feedback.innerText = "✅ Réduction validée !";
        setTimeout(() => {
            document.getElementById('reduction-overlay').style.display = 'none';
            finaliserReductionAction(); 
        }, 1200);
    } else {
        feedback.style.color = "#e74c3c";
        feedback.innerText = "❌ Équation incorrecte.";
        const card = document.querySelector('#reduction-overlay .sci-card');
        card.style.animation = "shake 0.4s";
        setTimeout(() => card.style.animation = "", 400);
    }
}

function finaliserReductionAction() {
    const targetE3 = document.getElementById('e3');
    creerAnimationReaction(targetE3);
    
    const eSurE3 = targetE3.querySelector('.electron-particle');
    if (eSurE3) eSurE3.remove();

    state.electronAtE3 = false;
    state.nadphProduced += 1;
    document.getElementById('nadph-count').innerText = state.nadphProduced;
    state.nadpPlacedOnE3 = true;
    state.reductionValidated = true;

    for (let i = 0; i < 2; i++) {
        const sH = document.querySelector('.stroma-h');
        if (sH) { sH.remove(); state.protonsStroma--; }
    }
    afficherPopUpNADPH();
}

// --- LOGIQUE ATP (A4 & A5) ---
function insertArrowATP() {
    const input = document.getElementById('atp-input');
    input.value += "→";
    input.focus();
}

function verifierATP() {
    const input = document.getElementById('atp-input').value.toLowerCase().replace(/\s+/g, '');
    const feedback = document.getElementById('atp-feedback');
    const eqAttendue = "adp+pi→atp";

    if (input === eqAttendue) {
        feedback.style.color = "#27ae60";
        feedback.innerText = "✅ Phosphorylation validée !";
        setTimeout(() => {
            document.getElementById('atp-validation-overlay').style.display = 'none';
            document.getElementById('lumen').classList.remove('lumen-critique');
            finaliserProductionATPAction(); 
        }, 1200);
    } else {
        feedback.style.color = "#e74c3c";
        feedback.innerText = "❌ Équation incorrecte.";
        const card = document.querySelector('#atp-validation-overlay .sci-card');
        card.style.animation = "shake 0.4s";
        setTimeout(() => card.style.animation = "", 400);
    }
}

function finaliserProductionATPAction() {
    const target = document.getElementById('atp-synthase');
    state.protonsLumen -= 6;
    state.atpProduced += 1.5; 
    state.atpValidated = true;

    target.classList.add('rotating');
    soundATP.play().catch(() => {});

    const protons = document.querySelectorAll('.proton-particle.in-lumen');
    protons.forEach((p, i) => {
        if(i < 6) {
            setTimeout(() => {
                p.style.transform = "translateY(-400px)"; 
                p.style.opacity = "0";
                setTimeout(() => { 
                    p.remove(); 
                    creerProtonStroma(); 
                    state.protonsStroma++; 
                }, 3000);
            }, i * 400);
        }
    });

    setTimeout(() => {
        document.getElementById('atp-count').innerText = state.atpProduced;
        target.classList.remove('rotating'); 
        if (state.atpProduced < 3 || state.nadphProduced < 2) {
            alert("ATP produit ! Recommencez pour compléter le bilan.");
            initScene();
        }
        actualiserInstruction();
    }, 5000);
}

// --- BILAN FINAL (A6 & A7) ---
function insertArrowBilan() {
    const input = document.getElementById('bilan-input');
    input.value += "→";
    input.focus();
}

function verifierBilanFinal() {
    const input = document.getElementById('bilan-input').value.toLowerCase().replace(/\s+/g, '');
    const feedback = document.getElementById('bilan-feedback');
    const eqBilan = "2h2o+2nadp++adp+pi→o2+2nadph,h++atp";

    if (input === eqBilan) {
        state.bilanValidated = true;
        
        // Jouer le son de félicitations
        soundVictoire.currentTime = 0;
        soundVictoire.play().catch(e => console.log("Audio non chargé :", e));

        document.getElementById('bilan-overlay').style.display = 'none';
        
        // --- NOUVELLE TRANSITION DE FÉLICITATIONS ---
        const transitionOverlay = document.createElement('div');
        transitionOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; flex-direction: column;
            align-items: center; justify-content: center; z-index: 10000;
            animation: fadeIn 0.5s forwards; font-family: sans-serif; text-align: center; color: white;
        `;

        transitionOverlay.innerHTML = `
            <h1 style="color: #f1c40f; font-size: 60px; margin-bottom: 10px; animation: bounceIn 1s;">FÉLICITATIONS !</h1>
            <h2 style="font-size: 30px; margin-bottom: 20px;">Mission 1 Accomplie</h2>
            <p style="font-size: 20px; color: #2ecc71;">La Phase Claire est terminée avec succès.</p>
            <p style="margin-top: 30px; font-style: italic; opacity: 0.8;">Transition vers le stroma...</p>
        `;

        document.body.appendChild(transitionOverlay);

        // Redirection vers l'Interface 3 après l'animation et le son
        setTimeout(() => {
            window.location.href = "../interface3.html";
        }, 4500);

    } else {
        feedback.style.color = "#e74c3c";
        feedback.innerText = "❌ Équation bilan incorrecte.";
        const card = document.querySelector('#bilan-overlay .sci-card');
        card.style.animation = "shake 0.4s";
        setTimeout(() => card.style.animation = "", 400);
    }
}

// --- GESTION ÉTAT & HISTORIQUE ---
function sauvegarderEtat() {
    history.push(JSON.parse(JSON.stringify(state)));
}

function reinitialiser() {
    state = {
        ps2Excited: false, ps1Excited: false, electronPos: 'ps2',
        protonsLumen: 0, protonsStroma: 8, nadphProduced: 0,
        atpProduced: 0, e2Pumped: false, waterCount: 0,
        nadpPlacedOnE3: false, electronAtE3: false,
        instructionStep: null, photolysisValidated: false, reductionValidated: false, atpValidated: false,
        bilanValidated: false
    };
    history = [];
    document.getElementById('atp-count').innerText = "0";
    document.getElementById('nadph-count').innerText = "0";
    document.querySelectorAll('.sci-validation-box, #electron-info-popup, #victory-overlay').forEach(el => el.style.display = 'none');
    document.getElementById('lumen').classList.remove('lumen-critique');
    initScene();
    actualiserInstruction();
}

function reculerEtape() {
    if (history.length > 0) {
        state = history.pop();
        document.getElementById('atp-count').innerText = state.atpProduced;
        document.getElementById('nadph-count').innerText = state.nadphProduced;
        if (state.protonsLumen < 6) document.getElementById('lumen').classList.remove('lumen-critique');
        initScene();
        actualiserInstruction();
    } else {
        alert("Début de l'expérience.");
    }
}

// --- INITIALISATION ---
function init() {
    initScene();
    setupDragAndDrop();
    setupTouchSupport(); // AJOUT : Initialisation du support tactile
    actualiserInstruction();
}

function initScene() {
    document.querySelectorAll('.proton-particle').forEach(p => p.remove());
    
    const existingE1 = document.getElementById('electron-mobile');
    const existingE2 = document.getElementById('electron-psi-active');
    const isEOnE3 = (el) => state.electronPos === 'e3' && el && el.parentElement && el.parentElement.id === 'e3';
    
    if (existingE1 && !isEOnE3(existingE1)) existingE1.remove();
    if (existingE2 && !isEOnE3(existingE2)) existingE2.remove();

    for(let i = 0; i < state.protonsLumen; i++) creerProtonLumen(false);
    for(let i = 0; i < state.protonsStroma; i++) creerProtonStroma();

    document.getElementById('h2o-source').style.display = (state.electronPos === 'ps2' && !document.getElementById('electron-mobile')) ? 'block' : 'none';
    document.getElementById('nadp-target').style.display = (state.electronAtE3) ? 'block' : 'none';
    document.getElementById('adp-pi').style.display = (state.protonsLumen >= 6) ? 'block' : 'none';

    if (state.electronPos !== 'ps2' && state.electronPos !== 'e3') {
        let id = (state.electronPos === 'ps1' && !state.ps1Excited) ? 'electron-mobile' : 
                 (state.electronPos === 'ps1' || state.electronPos === 't3') ? 'electron-psi-active' : 'electron-mobile';
        const type = (id === 'electron-mobile') ? 'electron' : 'electron-excité';
        creerElectron(id, state.electronPos, type);
    }
}

// --- GÉNÉRATION PARTICULES ---
function creerProtonStroma() {
    const p = document.createElement('div');
    p.className = "proton-particle stroma-h";
    p.innerText = "H+";
    p.style.left = (Math.random() * 90) + "%";
    p.style.top = (Math.random() * 25 + 5) + "%"; 
    document.getElementById('stroma').appendChild(p);
}

function creerProtonLumen(isAnimated) {
    const p = document.createElement('div');
    p.className = "proton-particle";
    p.innerText = "H+";
    p.style.left = (Math.random() * 80 + 10) + "%";
    
    if(isAnimated) {
        p.style.animation = "pumpMove 2.5s forwards cubic-bezier(0.4, 0, 0.2, 1)";
        setTimeout(() => p.classList.add('in-lumen'), 2500);
    } else {
        p.classList.add('in-lumen');
        p.style.top = (Math.random() * 30 + 65) + "%"; 
    }
    document.getElementById('lumen').appendChild(p);
}

function creerOxygene() {
    const o2 = document.createElement('div');
    o2.className = "oxygen-particle"; 
    o2.innerText = "1/2 O₂";
    o2.style.left = "15%";
    o2.style.bottom = "25%"; 
    document.getElementById('lumen').appendChild(o2);
    setTimeout(() => { 
        o2.style.transition = "all 5s ease-out";
        o2.style.transform = "translateY(-450px)"; 
        o2.style.opacity = "0"; 
    }, 100);
    setTimeout(() => o2.remove(), 5500);
}

// --- INTERACTIONS NADP/E3 ---
function handleElectronDropOnE3(electron, targetE3) {
    targetE3.style.position = 'relative';
    targetE3.appendChild(electron);
    electron.style.position = 'absolute';
    electron.style.left = '50%';
    electron.style.top = '50%';
    electron.style.transform = 'translate(-50%, -50%)';
    state.electronAtE3 = true;
    actualiserInstruction();
}

function handleNADPDragDrop(nadpElement, targetE3) {
    if (!state.electronAtE3) {
        alert("Le NADP+ nécessite des électrons pour sa réduction !");
        return;
    }
    document.getElementById('reduction-input').value = "";
    document.getElementById('reduction-feedback').innerText = "";
    document.getElementById('reduction-overlay').style.display = 'block';
}

function creerAnimationReaction(targetE3) {
    targetE3.classList.add('reaction-nadph-flash');
    setTimeout(() => targetE3.classList.remove('reaction-nadph-flash'), 650);
}

function afficherPopUpNADPH() {
    if (state.nadphProduced < 2) {
        alert("NADPH,H+ produit !");
        state.ps2Excited = false;
        state.ps1Excited = false;
        state.electronPos = 'ps2';
        state.e2Pumped = false;
        state.electronAtE3 = false;
        state.photolysisValidated = false;
        state.reductionValidated = false;
        state.instructionStep = null; 
        initScene();
        actualiserInstruction(); 
    } else {
        alert("Deuxième NADPH,H+ produit ! Passez à la phase de phosphorylation.");
        initScene();
    }
    onClosePopupNADPH();
}

function onClosePopupNADPH() {
    state.instructionStep = 'PHOSPHORYLATION';
    actualiserInstruction();
}

// --- GUIDAGE PÉDAGOGIQUE ---
function actualiserInstruction() {
    const ps2El = document.getElementById('ps2');
    const ps1El = document.getElementById('ps1');
    const lumen = document.getElementById('lumen');
    const e = document.getElementById('electron-mobile') || document.getElementById('electron-psi-active');
    const pos = e ? e.parentElement.id : null;

    if (state.atpProduced >= 3 && state.nadphProduced >= 2) {
        updateStepDisplay("Félicitations ! Cliquez ici pour écrire l'équation bilan.", true);
        document.getElementById('instruction').onclick = () => {
            document.getElementById('bilan-overlay').style.display = 'block';
        };
        lumen.classList.remove('lumen-critique');
        return;
    }

    if (ps2El) state.ps2Excited ? ps2El.classList.add('ps2-excited') : ps2El.classList.remove('ps2-excited');
    if (ps1El) state.ps1Excited ? ps1El.classList.add('ps1-excited') : ps1El.classList.remove('ps1-excited');

    if (e) {
        if (pos === 'ps2') updateStepDisplay("Électron libéré ! Transférez-le au transporteur membranaire T1.");
        else {
            switch (pos) {
                case 't1': updateStepDisplay("Transportez l'électron vers le complexe E2 (Cytochrome)."); break;
                case 'e2': updateStepDisplay(state.e2Pumped ? "Transférez l'électron vers T2." : "Cliquez sur E2 pour pomper des protons H+ vers le lumen."); break;
                case 't2': updateStepDisplay(state.ps1Excited ? "Le PSI est excité. Transférez-lui l'électron." : "Excitez le PSI avec la radiation convenable."); break;
                case 'ps1': updateStepDisplay("Transférez l'électron vers T3."); break;
                case 't3': updateStepDisplay("Transportez l'électron vers l'enzyme finale E3."); break;
                case 'e3': updateStepDisplay("Réalisez la réduction finale de NADP+ au niveau de E3."); break;
            }
        }
        return;
    }

    if (state.instructionStep === 'PHOSPHORYLATION' && state.protonsLumen >= 6) {
        updateStepDisplay("Gradient de protons est crée ! Faites la phosphorylation de l'ADP sur l'ATPSynthase.");
        lumen.classList.add('lumen-critique');
        return;
    }

    if (state.electronPos === 'ps2') {
        updateStepDisplay(state.ps2Excited ? "PSII excité ! Faites la photolyse de l'eau (H2O)." : "Étape 1 : Excitez le PSII avec la radiation convenable.");
    }
}

// --- AJOUT : FONCTIONS UNIVERSELLES POUR TACTILE ---
function getPointerPos(e) {
    const event = e.touches ? e.touches[0] : e;
    return { x: event.clientX, y: event.clientY };
}

function setupTouchSupport() {
    const mobiles = document.querySelectorAll('.light-beam, #h2o-source, #nadp-target, #adp-pi, .electron-particle');
    
    mobiles.forEach(el => {
        el.addEventListener('touchstart', (e) => {
            const pos = getPointerPos(e);
            el.dataset.startX = pos.x;
            el.dataset.startY = pos.y;
            el.style.zIndex = "1000";
        }, {passive: false});

        el.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const pos = getPointerPos(e);
            const rect = el.getBoundingClientRect();
            el.style.position = 'fixed';
            el.style.left = (pos.x - rect.width / 2) + 'px';
            el.style.top = (pos.y - rect.height / 2) + 'px';
        }, {passive: false});

        el.addEventListener('touchend', (e) => {
            el.style.display = 'none';
            const pos = getPointerPos(e.changedTouches[0]);
            const target = document.elementFromPoint(pos.x, pos.y)?.closest('.complex, #atp-synthase');
            el.style.display = '';
            el.style.position = '';
            el.style.left = '';
            el.style.top = '';

            if (target) {
                // Simulation d'un événement Drop pour réutiliser ta logique existante
                const wave = el.classList.contains('light-beam') ? el.id : null;
                const item = el.id.split('-')[0];
                const type = el.id.includes('electron') ? (el.id === 'electron-psi-active' ? 'electron-excité' : 'electron') : null;

                // Logique simplifiée du Drop (copiée de ton setupDragAndDrop)
                if (target.id === 'ps2' && wave === 'light-680') {
                    sauvegarderEtat(); state.ps2Excited = true; actualiserInstruction();
                } else if (target.id === 'ps2' && item === 'h2o' && state.ps2Excited) {
                    document.getElementById('photolysis-input').value = ""; 
                    document.getElementById('sci-feedback').innerText = ""; 
                    document.getElementById('photolysis-overlay').style.display = 'block'; 
                } else if (target.id === 'ps1' && wave === 'light-700') {
                    sauvegarderEtat(); state.ps1Excited = true; actualiserInstruction();
                } else if (type === 'electron' || type === 'electron-excité') {
                    const sequence = ['ps2', 't1', 'e2', 't2', 'ps1', 't3', 'e3'];
                    const nextIdx = sequence.indexOf(target.id);
                    const currIdx = sequence.indexOf(state.electronPos);
                    if (nextIdx === currIdx + 1) {
                        if (target.id === 'ps1' && !state.ps1Excited) return alert("Excitez d'abord le PSI !");
                        if (state.electronPos === 'e2' && !state.e2Pumped) return alert("Actionnez d'abord le pompage sur E2 !");
                        sauvegarderEtat(); state.electronPos = target.id;
                        if (target.id === 'ps1') { state.ps1Excited = false; setTimeout(() => afficherPopupElectron(), 500); }
                        if (target.id === 'e3') handleElectronDropOnE3(el, target);
                        if (target.id === 'e2') gererControleEtape();
                        initScene(); actualiserInstruction();
                    }
                } else if (target.id === 'e3' && item === 'nadp' && state.electronAtE3) {
                    sauvegarderEtat(); handleNADPDragDrop(null, target);
                } else if (target.id === 'atp-synthase' && item === 'adp') {
                    if (state.protonsLumen >= 6) {
                        sauvegarderEtat();
                        document.getElementById('atp-input').value = "";
                        document.getElementById('atp-validation-overlay').style.display = 'block';
                    } else { alert("Gradient insuffisant."); }
                }
            }
        });
    });
}

// --- SETUP INTERACTIONS ---
function setupDragAndDrop() {
    const sequence = ['ps2', 't1', 'e2', 't2', 'ps1', 't3', 'e3'];

    document.querySelectorAll('.light-beam, #h2o-source, #nadp-target, #adp-pi').forEach(el => {
        el.addEventListener('dragstart', e => {
            if(el.classList.contains('light-beam')) e.dataTransfer.setData('wavelength', el.id);
            else e.dataTransfer.setData('item', el.id.split('-')[0]); 
        });
    });

    document.querySelectorAll('.complex, #atp-synthase').forEach(target => {
        target.addEventListener('dragover', e => e.preventDefault());
        target.addEventListener('drop', e => {
            const wave = e.dataTransfer.getData('wavelength');
            const item = e.dataTransfer.getData('item');
            const type = e.dataTransfer.getData('type');

            if (target.id === 'ps2' && wave === 'light-680') {
                sauvegarderEtat(); state.ps2Excited = true; actualiserInstruction();
            }
            else if (target.id === 'ps2' && item === 'h2o' && state.ps2Excited) {
                document.getElementById('photolysis-input').value = ""; 
                document.getElementById('sci-feedback').innerText = ""; 
                document.getElementById('photolysis-overlay').style.display = 'block'; 
            }
            else if (target.id === 'ps1' && wave === 'light-700') {
                sauvegarderEtat(); 
                state.ps1Excited = true; 
                actualiserInstruction();
            }
            else if (type === 'electron' || type === 'electron-excité') {
                const nextIdx = sequence.indexOf(target.id);
                const currIdx = sequence.indexOf(state.electronPos);

                if (nextIdx === currIdx + 1) {
                    if (target.id === 'ps1' && !state.ps1Excited) return alert("Excitez d'abord le PSI !");
                    if (state.electronPos === 'e2' && !state.e2Pumped) return alert("Actionnez d'abord le pompage sur E2 !");
                    
                    sauvegarderEtat();
                    state.electronPos = target.id;
                    
                    if (target.id === 'ps1') {
                        state.ps1Excited = false;
                        setTimeout(() => {
                            afficherPopupElectron();
                        }, 500);
                    }
                    
                    if (target.id === 'e3') {
                        handleElectronDropOnE3(document.getElementById(type === 'electron' ? 'electron-mobile' : 'electron-psi-active'), target);
                    }
                    if (target.id === 'e2') gererControleEtape();
                    initScene();
                    actualiserInstruction();
                }
            }
            else if (target.id === 'e3' && item === 'nadp' && state.electronAtE3) {
                sauvegarderEtat();
                handleNADPDragDrop(null, target);
            }
            else if (target.id === 'atp-synthase' && item === 'adp') {
                if (state.protonsLumen >= 6) {
                    sauvegarderEtat();
                    document.getElementById('atp-input').value = "";
                    document.getElementById('atp-feedback').innerText = "";
                    document.getElementById('atp-validation-overlay').style.display = 'block';
                } else {
                    alert("Gradient électrochimique insuffisant (H+). Continuez le transfert d'électrons.");
                }
            }
        });
    });
}

function creerElectron(id, parentId, type) {
    if (document.getElementById(id)) return;
    const e = document.createElement('div');
    e.id = id;
    e.className = id === 'electron-psi-active' ? 'electron-particle excited' : 'electron-particle';
    e.innerText = 'e-';
    e.setAttribute('draggable', 'true');
    e.addEventListener('dragstart', ev => {
        ev.dataTransfer.setData('type', type);
        ev.dataTransfer.setData('id', id);
    });
    const parent = document.getElementById(parentId);
    if (parent) {
        parent.appendChild(e);
        setupTouchSupport(); // Ré-appliquer le tactile pour le nouvel électron
    }
}

function gererControleEtape() {
    const e2 = document.getElementById('e2');
    e2.onclick = () => {
        let count = 0;
        const interval = setInterval(() => {
            const sH = document.querySelector('.stroma-h');
            if(sH) {
                sH.remove(); state.protonsStroma--;
                soundPump.play().catch(() => {}); 
                creerProtonLumen(true); state.protonsLumen++;
            }
            if(++count >= 4) { 
                clearInterval(interval); state.e2Pumped = true; 
                actualiserInstruction(); e2.onclick = null; 
            }
        }, 600); 
    };
}

document.addEventListener("DOMContentLoaded", init);