const BASE_URL = "https://www.dnd5eapi.co";
let currentScore = 0;
let currentMonster = null; 

const myHeaders = new Headers();
myHeaders.append("Accept", "application/json");

const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow"
};

document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    console.log("Dispositivo listo");

    // Listeners del Menú
    document.getElementById('btnStart').addEventListener('click', startGame);
    document.getElementById('btnRanking').addEventListener('click', showRanking);
    document.getElementById('btnBestiary').addEventListener('click', loadBestiary);

    // Listeners del Juego
    document.getElementById('btn-attack').addEventListener('click', playerAttack);
    document.getElementById('btn-run').addEventListener('click', playerRun);
    document.getElementById('btn-end-expedition').addEventListener('click', endExpedition);

    // Listeners de Retorno
    document.getElementById('btnBackFromRanking').addEventListener('click', showMenu);
    document.getElementById('btnBackFromBestiary').addEventListener('click', showMenu);
}

/* --- NAVEGACIÓN --- */
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
    document.getElementById('game-container').style.display = 'block';
    fetchMonster();
}

/* --- LÓGICA DE COMBATE --- */
async function fetchMonster() {
    const loader = document.getElementById('loader');
    const cardArea = document.getElementById('monster-card-area');
    
    loader.style.display = 'block';
    cardArea.innerHTML = ""; // Limpiamos la carta anterior

    try {
        const listResponse = await fetch(`${BASE_URL}/api/monsters`, requestOptions);
        const listData = await listResponse.json();
        
        const randomIndex = Math.floor(Math.random() * listData.count);
        const randomMonsterIndex = listData.results[randomIndex].index;

        const detailResponse = await fetch(`${BASE_URL}/api/monsters/${randomMonsterIndex}`, requestOptions);
        currentMonster = await detailResponse.json(); 

        renderCard(currentMonster);
    } catch (error) {
        M.toast({html: 'Error de conexión', classes: 'red'});
    } finally {
        loader.style.display = 'none';
    }
}

function renderCard(monster) {
    const cardArea = document.getElementById('monster-card-area');
    let imageSrc = monster.image ? (BASE_URL + monster.image) : 'https://i.imgur.com/3f4iLkR.png';

    cardArea.innerHTML = `
    <div class="card z-depth-3 animated fadeIn">
        <div class="card-image">
            <img src="${imageSrc}" style="height: 200px; object-fit: contain; margin-top: 10px;">
        </div>
        <div class="card-content">
            <span class="card-title bold">${monster.name}</span>
            <div class="chip red white-text" style="width: 100%; margin: 10px 0; font-size: 1.1rem;">
                HP: ${monster.hit_points}
            </div>
            <p class="grey-text">${monster.type} | AC: ${monster.armor_class ? monster.armor_class[0].value : 10}</p>
        </div>
    </div>`;
}

function playerAttack() {
    currentScore++; // Sumamos 1 por cada monstruo derrotado
    updateScoreDisplay();
    M.toast({html: '¡Victoria!', classes: 'green'});
    
    if (currentMonster) markMonsterAsDiscovered(currentMonster.index);
    fetchMonster();
}

function playerRun() {
    M.toast({html: 'Escapaste...', classes: 'orange'});
    fetchMonster(); // Cambia de monstruo sin puntuar
}

function endExpedition() {
    let playerName = prompt(`Has derrotado a ${currentScore} monstruos. Escribe tu nombre:`, "Héroe");
    if (playerName) {
        saveScore(playerName, currentScore);
        M.toast({html: '¡Ranking actualizado!', classes: 'blue'});
        showMenu();
    }
}

function updateScoreDisplay() {
    document.getElementById('score-display').textContent = currentScore;
}

/* --- SISTEMAS (LOCALSTORAGE) --- */
function getDiscoveredMonsters() {
    return JSON.parse(localStorage.getItem("discovered_monsters")) || [];
}

function markMonsterAsDiscovered(monsterIndex) {
    let discovered = getDiscoveredMonsters();
    if (!discovered.includes(monsterIndex)) {
        discovered.push(monsterIndex);
        localStorage.setItem("discovered_monsters", JSON.stringify(discovered));
    }
}

function saveScore(name, score) {
    let ranking = JSON.parse(localStorage.getItem("ranking_data")) || [];
    ranking.push({ playerName: name, points: score, date: new Date().toLocaleDateString() });
    ranking.sort((a, b) => b.points - a.points);
    localStorage.setItem("ranking_data", JSON.stringify(ranking.slice(0, 20)));
}

async function loadBestiary() {
    // 1. Mostrar vista y preparar elementos
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('bestiary-view').style.display = 'block';

    const listElement = document.getElementById('bestiary-list');
    const loader = document.getElementById('bestiary-loader');
    const progressFill = document.getElementById('bestiary-progress');
    const discCountText = document.getElementById('discovered-count');
    const totalCountText = document.getElementById('total-count');
    
    listElement.innerHTML = ''; // Limpiar lista previa
    loader.style.display = 'block';

    try {
        // 2. Obtener datos locales y de la API
        const unlockedList = getDiscoveredMonsters(); // Array de índices ["beholder", "goblin", ...]
        const response = await fetch(`${BASE_URL}/api/monsters`, requestOptions);
        const data = await response.json();
        const allMonsters = data.results;

        // 3. Actualizar contadores y progreso
        totalCountText.textContent = allMonsters.length;
        discCountText.textContent = unlockedList.length;
        let percentage = (unlockedList.length / allMonsters.length) * 100;
        progressFill.style.width = percentage + '%';

        // 4. Generar la lista completa (Sin .slice)
        // Usamos un fragmento de documento para mejorar el rendimiento al insertar muchos elementos
        const fragment = document.createDocumentFragment();

        allMonsters.forEach(monster => {
            const isUnlocked = unlockedList.includes(monster.index);
            
            const item = document.createElement('li');
            item.className = "collection-item avatar valign-wrapper";
            
            // Estilo dinámico si está desbloqueado o no
            const icon = isUnlocked ? 'visibility' : 'lock_outline';
            const color = isUnlocked ? 'purple' : 'grey lighten-2';
            const name = isUnlocked ? monster.name : "???";
            const subtext = isUnlocked ? `ID: ${monster.index}` : "Monstruo no descubierto";

            item.innerHTML = `
                <i class="material-icons circle ${color}">${icon}</i>
                <div style="width: 100%; margin-left: 15px;">
                    <span class="title ${isUnlocked ? 'black-text' : 'grey-text'}" style="font-weight: bold;">
                        ${name}
                    </span>
                    <p class="grey-text" style="font-size: 0.8rem;">${subtext}</p>
                </div>
                ${isUnlocked ? '<i class="material-icons green-text">check_circle</i>' : ''}
            `;

            // Si está desbloqueado, podemos hacer que al pulsar nos dé un aviso
            if (isUnlocked) {
                item.onclick = () => M.toast({html: `¡Ya has derrotado al ${monster.name}!`});
            }

            fragment.appendChild(item);
        });

        listElement.appendChild(fragment);

    } catch (error) {
        console.error("Error en bestiario:", error);
        M.toast({html: 'Error al cargar el Bestiario', classes: 'red'});
    } finally {
        loader.style.display = 'none';
    }
}


function showRanking() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('ranking-view').style.display = 'block';

    const ranking = JSON.parse(localStorage.getItem("ranking_data")) || [];
    const listElement = document.getElementById('ranking-list');

    // Limpiar lista manteniendo el header
    const oldItems = listElement.querySelectorAll('.collection-item');
    oldItems.forEach(item => item.remove());

    if (ranking.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'collection-item center-align grey-text';
        empty.innerHTML = "<em>La historia aún no tiene héroes. ¡Sé el primero!</em>";
        listElement.appendChild(empty);
    } else {
        ranking.forEach((player, index) => {
            const li = document.createElement('li');
            li.className = 'collection-item avatar';
            li.innerHTML = `
                <i class="material-icons circle ${index < 3 ? 'orange' : 'grey'}">emoji_events</i>
                <span class="title" style="font-weight:bold;">${player.playerName}</span>
                <p>Monstruos: <strong>${player.points}</strong></p>
                <span class="secondary-content">#${index + 1}</span>
            `;
            listElement.appendChild(li);
        });
    }
}
