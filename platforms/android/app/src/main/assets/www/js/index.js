// Configuración de la API oficial
const BASE_URL = "https://www.dnd5eapi.co";
let currentScore = 0;

document.addEventListener('deviceready', onDeviceReady, false);
// document.addEventListener('DOMContentLoaded', onDeviceReady); // Para probar en PC

function onDeviceReady() {
    // Listeners de botones
    document.getElementById('btnStart').addEventListener('click', startGame);
    document.getElementById('btnRanking').addEventListener('click', showRanking);
    document.getElementById('btnBackFromRanking').addEventListener('click', showMenu);
    document.getElementById('btn-attack').addEventListener('click', playerAttack);
    document.getElementById('btn-run').addEventListener('click', playerRun);
}

// --- GESTIÓN DE VISTAS (Igual que antes) ---
function showMenu() {
    document.getElementById('main-menu').style.display = 'block';
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('ranking-view').style.display = 'none';
}

function startGame() {
    currentScore = 0;
    updateScoreDisplay();
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('ranking-view').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    fetchMonster();
}

function showRanking() {
    // (Tu código de ranking se mantiene igual)
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('ranking-view').style.display = 'block';
    const ranking = JSON.parse(localStorage.getItem("ranking")) || [];
    const list = document.getElementById('ranking-list');
    list.innerHTML = '';
    if (ranking.length === 0) {
        list.innerHTML = '<li class="collection-item">Sin puntuaciones.</li>';
    } else {
        ranking.forEach((p) => {
            list.innerHTML += `<li class="collection-item"><b>${p.name}</b>: ${p.score}</li>`;
        });
    }
}

// --- LÓGICA DEL JUEGO ---
function updateScoreDisplay() {
    document.getElementById('score-display').textContent = currentScore;
}

function playerAttack() {
    currentScore += 100;
    M.toast({html: '¡Impacto directo!', classes: 'green'});
    updateScoreDisplay();
    fetchMonster(); // Cargar siguiente enemigo
}

function playerRun() {
    let playerName = prompt("¡Huyes! Nombre para el ranking:", "Cobarde");
    if (playerName) saveScore(playerName, currentScore);
    showMenu();
}

function saveScore(name, score) {
    const ranking = JSON.parse(localStorage.getItem("ranking")) || [];
    ranking.push({ name, score });
    ranking.sort((a, b) => b.score - a.score);
    localStorage.setItem("ranking", JSON.stringify(ranking));
}

// --- AQUÍ ESTÁ LA MAGIA CON TU CÓDIGO NUEVO ---

async function fetchMonster() {
    const loader = document.getElementById('loader');
    const cardArea = document.getElementById('monster-card-area');
    
    loader.style.display = 'block';
    cardArea.style.opacity = '0.3';

    // 1. Preparamos las cabeceras como indica la documentación que encontraste
    const myHeaders = new Headers();
    myHeaders.append("Accept", "application/json");

    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };

    try {
        // PASO A: Pedir la lista de todos los monstruos
        // Usamos la URL oficial /api/monsters
        const listResponse = await fetch("https://www.dnd5eapi.co/api/monsters", requestOptions);
        
        if (!listResponse.ok) throw new Error("Error conectando con D&D API");
        
        // Convertimos a JSON (no a text, porque necesitamos leer los datos)
        const listData = await listResponse.json();
        
        // PASO B: Elegir uno al azar
        const randomIndex = Math.floor(Math.random() * listData.count);
        const randomMonsterIndex = listData.results[randomIndex].index;

        // PASO C: Pedir los detalles de ESE monstruo específico
        // Usamos la URL base + la url que viene en el resultado (ej: /api/monsters/goblin)
        const detailResponse = await fetch(`https://www.dnd5eapi.co/api/monsters/${randomMonsterIndex}`, requestOptions);
        const monster = await detailResponse.json();

        renderCard(monster);

    } catch (error) {
        console.error(error);
        alert("Fallo: " + error.message); // Para que veas el error en el móvil
    } finally {
        loader.style.display = 'none';
        cardArea.style.opacity = '1';
    }
}

function renderCard(monster) {
    const cardArea = document.getElementById('monster-card-area');
    
    // Esta API oficial tiene pocas imágenes, así que usamos el placeholder casi siempre
    // Pero si tiene imagen, la usamos (concatendando la base url)
    let imageSrc = monster.image ? (BASE_URL + monster.image) : 'https://i.imgur.com/3f4iLkR.png';

    const htmlContent = `
    <div class="card hoverable medium">
        <div class="card-image">
            <img src="${imageSrc}" style="height: 200px; object-fit: cover;">
            <span class="card-title shadow-text" style="font-weight:bold; text-shadow: 2px 2px 2px black;">${monster.name}</span>
        </div>
        <div class="card-content">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <span class="new badge red" data-badge-caption="HP">${monster.hit_points}</span>
                <span class="new badge blue" data-badge-caption="AC">${monster.armor_class ? monster.armor_class[0].value : 10}</span>
                <span class="grey-text">${monster.type}</span>
            </div>
            
            <div class="row center-align" style="font-size: 0.8rem;">
                <div class="col s4">STR: ${monster.strength}</div>
                <div class="col s4">DEX: ${monster.dexterity}</div>
                <div class="col s4">CON: ${monster.constitution}</div>
            </div>
            <p class="center-align grey-text">Challenge: ${monster.challenge_rating}</p>
        </div>
    </div>
    `;

    cardArea.innerHTML = htmlContent;
}