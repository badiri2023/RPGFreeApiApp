document.addEventListener("DOMContentLoaded", function () {
    M.Sidenav.init(document.querySelectorAll(".sidenav"));

    document.getElementById("btnStart").addEventListener("click", startGame);
    document.getElementById("btnContinue").addEventListener("click", continueGame);
    document.getElementById("btnRanking").addEventListener("click", showRanking);
});

function startGame() {
    document.getElementById("game-container").innerHTML = `
        <h4>Comienza tu aventura</h4>
        <p>Buscando enemigo...</p>
    `;

    fetch("https://www.dnd5eapi.co/api/monsters")
        .then(res => res.json())
        .then(list => {
            const random = list.results[Math.floor(Math.random() * list.results.length)];
            return fetch("https://www.dnd5eapi.co" + random.url);
        })
        .then(res => res.json())
        .then(monster => {
            document.getElementById("game-container").innerHTML = `
                <div class="card">
                    <div class="card-content">
                        <span class="card-title">${monster.name}</span>
                        <p>Tipo: ${monster.type}</p>
                        <p>HP: ${monster.hit_points}</p>
                    </div>
                    <div class="card-action center-align">
                        <a class="btn green" onclick="attack(${monster.hit_points})">Atacar</a>
                        <a class="btn red" onclick="runAway()">Huir</a>
                    </div>
                </div>
            `;
        });
}


function continueGame() {
    document.getElementById("game-container").innerHTML = `
        <h4>Continuar partida</h4>
        <p>No hay partida guardada todavía.</p>
    `;
}

function showRanking() {
    const ranking = JSON.parse(localStorage.getItem("ranking")) || [];

    let html = `
        <h4>Ranking</h4>
        <ul class="collection">
    `;

    ranking.forEach((player, index) => {
        html += `
            <li class="collection-item">
                <span class="title"><strong>${index + 1}. ${player.name}</strong></span>
                <p>Puntos: ${player.score}</p>
            </li>
        `;
    });

    html += `</ul>`;

    document.getElementById("game-container").innerHTML = html;
}

function saveScore(name, score) {
    const ranking = JSON.parse(localStorage.getItem("ranking")) || [];

    ranking.push({ name, score });

    ranking.sort((a, b) => b.score - a.score); // ordenar de mayor a menor

    localStorage.setItem("ranking", JSON.stringify(ranking));
}

