const BASE_URL = "https://www.dnd5eapi.co";

document.addEventListener("deviceready", onDeviceReady, false);

let discovered = [];
let currentMonster = null;
let currentHP = 0;

function onDeviceReady() {
    document.getElementById("btnStart").addEventListener("click", startExpedition);
    document.getElementById("btnBestiary").addEventListener("click", showBestiary);
    document.getElementById("btnRanking").addEventListener("click", showRanking);

    document.getElementById("btnBackFromBestiary").addEventListener("click", showMenu);
    document.getElementById("btnBackFromRanking").addEventListener("click", showMenu);

    document.getElementById("btnAttack").addEventListener("click", attackMonster);
    document.getElementById("btnRun").addEventListener("click", runFromMonster);
    document.getElementById("btnEnd").addEventListener("click", endExpedition);

    loadDiscovered();
}
// ==============================================================
// GESTION DE VISTAS
// ==============================================================
function showMenu() {
    hideAll();
    document.getElementById("main-menu").style.display = "block";
}
function hideAll() {
    document.getElementById("main-menu").style.display = "none";
    document.getElementById("bestiary-view").style.display = "none";
    document.getElementById("ranking-view").style.display = "none";
    document.getElementById("game-view").style.display = "none";
}
// ==============================================================
// EXPEDICIÓN
// ==============================================================
function startExpedition() {
    hideAll();
    document.getElementById("game-view").style.display = "block";
    loadRandomMonster();
}
async function loadRandomMonster() {
    const list = await fetch(`${BASE_URL}/api/monsters`).then(r => r.json());
    const random = list.results[Math.floor(Math.random() * list.results.length)];
    const monster = await fetch(`${BASE_URL}${random.url}`).then(r => r.json());
    currentMonster = monster;
    currentHP = monster.hit_points;
    document.getElementById("monster-name").textContent = monster.name;
    const img = document.getElementById("monster-image");
    img.src = monster.image ? BASE_URL + monster.image : "https://i.imgur.com/3f4iLkR.png";
    img.style.display = "block";
    document.getElementById("monster-hp-text").innerHTML = `Health: <span id="monster-hp">${currentHP}</span>`;
}
// ==============================================================
// Botones
// ==============================================================
function attackMonster() {
    currentHP -= 10;
    if (currentHP < 0) currentHP = 0;
    document.getElementById("monster-hp").textContent = currentHP;
    if (currentHP === 0) {
        registerMonster(currentMonster.index);
        document.getElementById("btnAttack").disabled = true;
        document.getElementById("btnRun").disabled = true;
        M.toast({ html: "Monster defeated" });
        document.getElementById("monster-hp-text").innerHTML = "Explorando...";
        setTimeout(() => {
            loadRandomMonster();
            document.getElementById("btnAttack").disabled = false;
            document.getElementById("btnRun").disabled = false;
        }, 2000);
    }
}

function runFromMonster() {
    registerMonster(currentMonster.index);
    document.getElementById("btnAttack").disabled = true;
    document.getElementById("btnRun").disabled = true;
    M.toast({ html: "Run like a chiken" });
    document.getElementById("monster-hp-text").innerHTML = "Explorando...";
    setTimeout(() => {
        loadRandomMonster();
        document.getElementById("btnAttack").disabled = false;
        document.getElementById("btnRun").disabled = false;
    }, 2000);
}

function endExpedition() {
    const name = prompt("Introduce you name mate:");
    if (!name) return;
    const ranking = JSON.parse(localStorage.getItem("ranking")) || [];
    ranking.push({
        name,
        beasts: discovered.length,
    });
    localStorage.setItem("ranking", JSON.stringify(ranking));
    M.toast({ html: "Ended Expedition" });
    showMenu();
}
// ==============================================================
// BESTIARIO
// ==============================================================
function loadDiscovered() {
    discovered = JSON.parse(localStorage.getItem("discovered")) || [];
}

function registerMonster(index) {
    if (!discovered.includes(index)) {
        discovered.push(index);
        localStorage.setItem("discovered", JSON.stringify(discovered));
    }
}

async function showBestiary() {
    hideAll();
    document.getElementById("bestiary-view").style.display = "block";
    const list = document.getElementById("bestiary-list");
    list.innerHTML = "";
    const all = await fetch(`${BASE_URL}/api/monsters`).then(r => r.json());

    document.getElementById("bestiary-total").textContent = all.results.length;
    document.getElementById("bestiary-discovered").textContent = discovered.length;

    all.results.forEach(m => {
        const li = document.createElement("li");
        li.className = "collection-item";
        li.textContent = discovered.includes(m.index) ? m.name : "?????";
        list.appendChild(li);
    });
}
// ==============================================================
// RANKING
// ==============================================================
function showRanking() {
    hideAll();
    document.getElementById("ranking-view").style.display = "block";
    const ranking = JSON.parse(localStorage.getItem("ranking")) || [];
    const list = document.getElementById("ranking-list");
    const old = list.querySelectorAll("li:not(.collection-header)");
    old.forEach(e => e.remove());
    ranking.forEach(r => {
        const li = document.createElement("li");
        li.className = "collection-item";
        li.innerHTML = `
            <strong>${r.name}</strong> — Bestias: ${r.beasts}
        `;
        list.appendChild(li);
    });
}

