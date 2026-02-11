// ===============================
// CONFIGURACIÓN GENERAL
// ===============================

const BASE_URL = "https://www.dnd5eapi.co";

// Cabeceras API
const myHeaders = new Headers();
myHeaders.append("Accept", "application/json");

const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow"
};

document.addEventListener('deviceready', onDeviceReady, false);
// document.addEventListener('DOMContentLoaded', onDeviceReady); // Para pruebas en PC

function onDeviceReady() {
    // Botones del menú principal
    document.getElementById('btnBestiary').addEventListener('click', loadBestiary);
    document.getElementById('btnRanking').addEventListener('click', showRanking);

    // Botones de navegación
    document.getElementById('btnBackFromRanking').addEventListener('click', showMenu);
    document.getElementById('btnBackFromBestiary').addEventListener('click', showMenu);
}



// ===============================
// GESTIÓN DE VISTAS
// ===============================

function showMenu() {
    document.getElementById('main-menu').style.display = 'block';
    document.getElementById('bestiary-view').style.display = 'none';
    document.getElementById('ranking-view').style.display = 'none';
}



// ===============================
// BESTIARIO
// ===============================

// Obtener monstruos descubiertos
function getDiscoveredMonsters() {
    return JSON.parse(localStorage.getItem("discovered_monsters")) || [];
}

// Marcar monstruo como descubierto
function unlockMonster(index) {
    let list = getDiscoveredMonsters();
    if (!list.includes(index)) {
        list.push(index);
        localStorage.setItem("discovered_monsters", JSON.stringify(list));
    }
}

async function loadBestiary() {
    // Mostrar vista
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('ranking-view').style.display = 'none';
    document.getElementById('bestiary-view').style.display = 'block';

    const listElement = document.getElementById('bestiary-list');
    const loader = document.getElementById('bestiary-loader');

    listElement.innerHTML = '';
    loader.style.display = 'block';

    try {
        const unlockedList = getDiscoveredMonsters();

        const response = await fetch(`${BASE_URL}/api/monsters`, requestOptions);
        const data = await response.json();
        const allMonsters = data.results;

        // Actualizar contadores
        document.getElementById('total-count').textContent = allMonsters.length;
        document.getElementById('discovered-count').textContent = unlockedList.length;

        const percentage = (unlockedList.length / allMonsters.length) * 100;
        document.getElementById('bestiary-progress').style.width = percentage + '%';

        loader.style.display = 'none';

        // Generar lista
        allMonsters.forEach(monster => {
            const isUnlocked = unlockedList.includes(monster.index);

            const item = document.createElement('li');
            item.className = "collection-item avatar valign-wrapper";

            item.innerHTML = `
                <i class="material-icons circle ${isUnlocked ? 'purple' : 'grey'}">
                    ${isUnlocked ? 'android' : 'help_outline'}
                </i>

                <span class="title ${isUnlocked ? 'black-text' : 'grey-text'}">
                    ${isUnlocked ? monster.name : "?????"}
                </span>

                <p class="grey-text lighten-1" style="font-size: 0.8rem;">
                    ${isUnlocked ? "Avistado" : "Desconocido"}<br>
                    <small>ID: ${isUnlocked ? monster.index : "???"}</small>
                </p>

                <i class="material-icons secondary-content grey-text">
                    ${isUnlocked ? 'chevron_right' : 'lock'}
                </i>
            `;

            // Si está desbloqueado, permitir ver detalles
            if (isUnlocked) {
                item.addEventListener('click', () => {
                    M.toast({ html: "Detalles: " + monster.name });
                });
            }

            listElement.appendChild(item);
        });

    } catch (error) {
        console.error(error);
        loader.innerHTML = "<p class='red-text'>Error cargando bestiario.</p>";
    }
}



// ===============================
// RANKING
// ===============================

function saveScore(name, score) {
    let ranking = JSON.parse(localStorage.getItem("ranking_data")) || [];

    ranking.push({
        playerName: name,
        points: score,
        date: new Date().toLocaleDateString()
    });

    ranking.sort((a, b) => b.points - a.points);

    if (ranking.length > 20) ranking = ranking.slice(0, 20);

    localStorage.setItem("ranking_data", JSON.stringify(ranking));
}

function showRanking() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('bestiary-view').style.display = 'none';

    const rankingView = document.getElementById('ranking-view');
    rankingView.style.display = 'block';

    const ranking = JSON.parse(localStorage.getItem("ranking_data")) || [];
    const listElement = document.getElementById('ranking-list');

    // Limpiar lista excepto el header
    const oldItems = listElement.querySelectorAll('li:not(.collection-header)');
    oldItems.forEach(item => item.remove());

    if (ranking.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.className = 'collection-item center-align grey-text';
        emptyItem.innerText = 'Aún no hay registros.';
        listElement.appendChild(emptyItem);
        return;
    }

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
                Puntos: <strong class="blue-text">${player.points}</strong><br>
                <small class="grey-text">${player.date}</small>
            </p>
            <a class="secondary-content" style="font-size: 1.5rem; color: #444;">#${index + 1}</a>
        `;

        listElement.appendChild(item);
    });
}
