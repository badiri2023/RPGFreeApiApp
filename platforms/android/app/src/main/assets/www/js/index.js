// Configuración de la API oficial
const BASE_URL = "https://www.dnd5eapi.co";
let currentScore = 0;

// Configuración de cabeceras para la API (Importante para evitar errores)
const myHeaders = new Headers();
myHeaders.append("Accept", "application/json");

const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow"
};

document.addEventListener('deviceready', onDeviceReady, false);
// document.addEventListener('DOMContentLoaded', onDeviceReady); // Descomentar para probar en PC

function onDeviceReady() {
    // Listeners de botones
    document.getElementById('btnStart').addEventListener('click', startGame);
    document.getElementById('btnRanking').addEventListener('click', showRanking);
    document.getElementById('btnBackFromRanking').addEventListener('click', showMenu);
    
    document.getElementById('btn-attack').addEventListener('click', playerAttack);
    document.getElementById('btn-run').addEventListener('click', playerRun);
    
    document.getElementById('btnBestiary').addEventListener('click', loadBestiary);
    document.getElementById('btnBackFromBestiary').addEventListener('click', showMenu);
}

// --- GESTIÓN DE VISTAS ---
function showMenu() {
    document.getElementById('main-menu').style.display = 'block';
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('ranking-view').style.display = 'none';
    document.getElementById('bestiary-view').style.display = 'none';
}

function startGame() {
    currentScore = 0;
    updateScoreDisplay();
    
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('ranking-view').style.display = 'none';
    document.getElementById('bestiary-view').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    
    fetchMonster(); // Iniciar la búsqueda de monstruo
}

/* ==========================================
   LÓGICA DEL JUEGO (Batalla y API)
   ========================================== */

async function fetchMonster() {
    const loader = document.getElementById('loader');
    const cardArea = document.getElementById('monster-card-area');
    
    // UI Loading state
    if(loader) loader.style.display = 'block';
    if(cardArea) cardArea.style.opacity = '0.3';
    
    // Desactivar botón de ataque para evitar doble click
    const btnAttack = document.getElementById('btn-attack');
    if(btnAttack) btnAttack.classList.add('disabled');

    try {
        // PASO A: Pedir la lista
        const listResponse = await fetch("https://www.dnd5eapi.co/api/monsters", requestOptions);
        const listData = await listResponse.json();
        
        // PASO B: Elegir uno al azar
        const randomIndex = Math.floor(Math.random() * listData.count);
        const randomMonsterIndex = listData.results[randomIndex].index;

        // PASO C: Pedir detalles
        const detailResponse = await fetch(`https://www.dnd5eapi.co/api/monsters/${randomMonsterIndex}`, requestOptions);
        const monster = await detailResponse.json();

        // Renderizar carta
        renderCard(monster);

    } catch (error) {
        console.error(error);
        M.toast({html: 'Error buscando monstruo', classes: 'red'});
    } finally {
        if(loader) loader.style.display = 'none';
        if(cardArea) cardArea.style.opacity = '1';
        if(btnAttack) btnAttack.classList.remove('disabled');
    }
}

function renderCard(monster) {
    const cardArea = document.getElementById('monster-card-area');
    
    // Imagen placeholder o real si existiera (la API oficial suele no tener imágenes, usamos placeholder)
    let imageSrc = monster.image ? (BASE_URL + monster.image) : 'https://i.imgur.com/3f4iLkR.png';

    const htmlContent = `
    <div class="card hoverable medium z-depth-3">
        <div class="card-image waves-effect waves-block waves-light">
            <img class="activator" src="${imageSrc}" style="object-fit: cover; height: 60%;">
        </div>
        <div class="card-content">
            <span class="card-title activator grey-text text-darken-4" style="font-size: 1.2rem; font-weight: bold;">
                ${monster.name}
                <i class="material-icons right">more_vert</i>
            </span>
            
            <div style="display: flex; justify-content: space-between; margin-top: 10px;">
                <span class="new badge red left" data-badge-caption="HP">${monster.hit_points}</span>
                <span class="new badge blue left" data-badge-caption="AC">${monster.armor_class ? monster.armor_class[0].value : 10}</span>
                <span class="grey-text right">${monster.type}</span>
            </div>
        </div>
        
        <div class="card-reveal">
            <span class="card-title grey-text text-darken-4">${monster.name}<i class="material-icons right">close</i></span>
            
            <div class="row center-align" style="margin-top:20px; font-size: 0.9em;">
                <div class="col s4"><strong>STR</strong><br>${monster.strength}</div>
                <div class="col s4"><strong>DEX</strong><br>${monster.dexterity}</div>
                <div class="col s4"><strong>CON</strong><br>${monster.constitution}</div>
            </div>
            
            <p class="grey-text" style="margin-top: 20px; font-size: 0.8rem;">
               Desafío (CR): ${monster.challenge_rating}
            </p>
        </div>
    </div>
    `;

    cardArea.innerHTML = htmlContent;
}

function updateScoreDisplay() {
    document.getElementById('score-display').textContent = currentScore;
}

function playerAttack() {
    currentScore += 100;
    M.toast({html: '¡Impacto directo! +100 pts', classes: 'green'});
    updateScoreDisplay();
    // Aquí es donde deberíamos guardar el monstruo derrotado en el futuro
    fetchMonster(); 
}

function playerRun() {
    // Usamos prompt nativo
    let playerName = prompt("¡Huyes! Introduce tu nombre:", "Aventurero");
    
    if (playerName) {
        saveScore(playerName, currentScore);
        M.toast({html: 'Puntuación guardada', classes: 'blue'});
    }
    showMenu();
}

/* ==========================================
   BESTIARIO (Lógica de colección)
   ========================================== */

function getDiscoveredMonsters() {
    return JSON.parse(localStorage.getItem("discovered_monsters")) || [];
}

async function loadBestiary() {
    // Gestión de vistas
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('ranking-view').style.display = 'none';
    document.getElementById('bestiary-view').style.display = 'block';

    const listElement = document.getElementById('bestiary-list');
    const loader = document.getElementById('bestiary-loader');
    
    listElement.innerHTML = '';
    loader.style.display = 'block';

    try {
        const unlockedList = getDiscoveredMonsters();
        
        // Usamos las requestOptions definidas arriba para evitar errores
        const response = await fetch("https://www.dnd5eapi.co/api/monsters", requestOptions);
        const data = await response.json();
        const allMonsters = data.results;

        // Actualizar UI
        document.getElementById('total-count').textContent = allMonsters.length;
        document.getElementById('discovered-count').textContent = unlockedList.length;
        
        let percentage = allMonsters.length > 0 ? (unlockedList.length / allMonsters.length) * 100 : 0;
        document.querySelector('.determinate').style.width = percentage + '%';

        loader.style.display = 'none';

        // GENERAR LA LISTA (Limitamos a 50 para prueba inicial)
        // allMonsters.slice(0, 50).forEach(...) si va muy lento
        allMonsters.forEach((monster) => {
            const isUnlocked = unlockedList.includes(monster.index);
            
            let displayName = isUnlocked ? monster.name : "?????";
            let icon = isUnlocked ? 'android' : 'help_outline'; 
            let colorClass = isUnlocked ? 'purple' : 'grey';
            let textClass = isUnlocked ? 'black-text' : 'grey-text';
            let statusText = isUnlocked ? 'Avistado' : 'Desconocido';

            const item = document.createElement('li');
            item.className = "collection-item avatar valign-wrapper";
            
            item.innerHTML = `
                <div class="circle ${colorClass} lighten-4 valign-wrapper center-align" style="width: 42px; height: 42px;">
                    <i class="material-icons ${colorClass}-text">${icon}</i>
                </div>
                <div style="margin-left: 15px; width: 100%;">
                    <span class="title ${textClass}" style="font-weight: bold;">${displayName}</span>
                    <p class="grey-text lighten-1" style="font-size: 0.8rem;">
                       ${statusText} <br>
                       <small>ID: ${isUnlocked ? monster.index : '???'}</small>
                    </p>
                </div>
                ${isUnlocked ? '<i class="material-icons grey-text lighten-2">chevron_right</i>' : '<i class="material-icons grey-text lighten-2">lock</i>'}
            `;

            if (isUnlocked) {
                item.addEventListener('click', () => {
                   M.toast({html: "Detalles: " + monster.name}); 
                });
            }

            listElement.appendChild(item);
        });

    } catch (error) {
        console.error(error);
        loader.innerHTML = "<p class='red-text'>Error cargando bestiario.</p>";
    }
}

/* ==========================================
   GESTIÓN DEL RANKING (Sistema de Guardado)
   ========================================== */

function saveScore(name, score) {
    // Usamos 'ranking_data' para no mezclar con versiones antiguas
    let ranking = JSON.parse(localStorage.getItem("ranking_data")) || [];

    ranking.push({
        playerName: name,
        points: score,
        date: new Date().toLocaleDateString()
    });

    ranking.sort((a, b) => b.points - a.points);

    if (ranking.length > 20) {
        ranking = ranking.slice(0, 20);
    }

    localStorage.setItem("ranking_data", JSON.stringify(ranking));
}

function showRanking() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('bestiary-view').style.display = 'none';
    
    const rankingView = document.getElementById('ranking-view');
    rankingView.style.display = 'block';

    const ranking = JSON.parse(localStorage.getItem("ranking_data")) || [];
    const listElement = document.getElementById('ranking-list');

    // Limpiar lista preservando el Header
    const oldItems = listElement.querySelectorAll('li:not(.collection-header)');
    oldItems.forEach(item => item.remove());

    if (ranking.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.className = 'collection-item center-align grey-text';
        emptyItem.innerText = 'Aún no hay registros.';
        listElement.appendChild(emptyItem);
    } else {
        ranking.forEach((player, index) => {
            const item = document.createElement('li');
            item.className = 'collection-item avatar';

            let iconColor = 'grey';
            if (index === 0) iconColor = 'yellow darken-2';
            if (index === 1) iconColor = 'grey lighten-1';
            if (index === 2) iconColor = 'brown lighten-1';

            item.innerHTML = `
                <i class="material-icons circle ${iconColor}">emoji_events</i>
                <span class="title" style="font-weight:bold;">${player.playerName}</span>
                <p>
                    Puntos: <strong class="blue-text">${player.points}</strong> <br>
                    <small class="grey-text">${player.date}</small>
                </p>
                <a href="#!" class="secondary-content" style="font-size: 1.5rem; color: #444;">#${index + 1}</a>
            `;
            listElement.appendChild(item);
        });
    }
}