const gridSize = 10;
// const headers = "  0 1 2 3 4 5 6 7 8 9 ";
let playerGrid = createGrid();
let enemyGrid = createGrid();
let playerShips = 3;
let enemyShips = 3;
let enemyLocations = {};

const singlePlayerButton = document.querySelector('#singlePlayerButton');
const multiPlayerButton = document.querySelector('#multiPlayerButton');
const startButton = document.querySelector('#startButton');


let roomId;
let currentPlayer = 'user';
let gameMode = "";
let playerNum = 0;
let ready = false;
let enemyReady = false;
let allShipsPlaced = false;
let shotFired = -1;
let gameEnd = false;

// Select Player Mode
singlePlayerButton.addEventListener('click', startSinglePlayer);
multiPlayerButton.addEventListener('click', startMultiPlayer);

function removeEventListeners() {
    singlePlayerButton.removeEventListener('click', startSinglePlayer);
    multiPlayerButton.removeEventListener('click', startMultiPlayer);
}

function printRules() {
    console.log("Bem vindo ao batalha no terminal!")
    console.log("- => Pode atirar")
    console.log("x => Errou o alvo")
    console.log("x => Acertou o alvo")
    drawBreak();
}

printRules();

// Single Player
function startSinglePlayer() {
    removeEventListeners();
    gameMode = "singlePlayer";
    setupGame();
    gameLoop();
}

// Multiplayer
function startMultiPlayer() {
    removeEventListeners();
    gameMode = "multiPlayer"

    const socket = io();

    // Get your playernum
    socket.on('player-number', num => {
        if (num == -1) {
            console.log("Sorry, the server is full");
        }
        else {
            playerNum = parseInt(num);
            if (playerNum == 1) currentPlayer = "enemy";

            console.log(playerNum);

            // get other player stats
            socket.emit('check-players');
        }
    })

    // Another player has connected or disconnected
    socket.on('player-connection', num => {
        console.log(`Player number ${num} has connected or disconnected`);
        playerConnectedOrDisconnected(num);
    })

    // On enemy ready    
    socket.on('enemy-ready', num => {
        enemyReady = true;
        playerReady(num)
        if (ready) playGameMulti(socket);
    })

    // Check player status 
    socket.on('check-players', players => {
        players.forEach((p, i) => {
            if (p.connected) playerConnectedOrDisconnected(i)
            if (p.ready) {
                playerReady(i);
                if (i != playerNum) enemyReady = true;
            }
        })
    })

    // On timeout
    socket.on('timeout', () => {
        console.log("Conexão expirada!");
    })

    // ready button click
    startButton.addEventListener('click', () => {
        if (!allShipsPlaced) {
            setupPlayerShips()
        }

        playGameMulti(socket)
    })

    // On fire received
    socket.on('fire', coordinates => {
        let fireRepplyData = {}
        fireRepplyData.hit = attackLocal(coordinates.x, coordinates.y, playerGrid)
        if (fireRepplyData.hit) {
            playerShips--;
        }
        fireRepplyData.enemyShips = playerShips;
        fireRepplyData.coordinates = coordinates;
        socket.emit('fire-reply', fireRepplyData);
        currentPlayer = 'user';
        gameEnd = checkWinnerMulti();
        if (!gameEnd) {
            playGameMulti(socket);
        }
        else {
            socket.emit('game-over', roomId);
        }
    })

    // On fire reply received
    socket.on('fire-reply', fireReplyData => {
        enemyShips = fireReplyData.enemyShips;
        currentPlayer = 'enemy'
        attackEnemy(fireReplyData.coordinates.x, fireReplyData.coordinates.y, enemyGrid, fireReplyData.hit);
        gameEnd = checkWinnerMulti();
        if (!gameEnd) {
            playGameMulti(socket);
        }
        else {
            socket.emit('game-over', roomId);
        }
    })

    function playerConnectedOrDisconnected(num) {
        let player = `.p${parseInt(num) + 1}`;
        document.querySelector(`${player} .connected span`).classList.toggle('blue');
        if (parseInt(num) == playerNum) document.querySelector(player).style.fontWeight = 'bold';
    }
}

function playGameMulti(socket) {
    // break in case of game end

    if (!ready) {
        socket.emit('player-ready')
        ready = true;
        playerReady(playerNum);
    }

    if (enemyReady) {
        if (currentPlayer == 'user') {
            printTable();
            console.log('Seu turno!');
            fire(socket);
            currentPlayer == 'enemy';
        }
        if (currentPlayer == 'enemy') {
            printTable();
            console.log('Turno do inimigo!');
        }
    }
}

function playerReady(num) {
    let player = `.p${parseInt(num) + 1}`
    document.querySelector(`${player} .ready span`).classList.toggle('blue');
}

// Single player
function setupGame() {
    for (let i = 1; i < 4; i++) {
        let didPlace = false;
        let x = 0;
        let y = 0;
        while (x < 0 || x > 9 || y < 0 || y > 9 || didPlace == false) {
            x = prompt('Digite a coordenada x para seu navio número ' + i + ' (de 0 a 9)');
            y = prompt('Digite a coordenada y para seu navio número ' + i + ' (de 0 a 9)');
            didPlace = placeCharacter(x, y, 'O', playerGrid);
            if (!didPlace) {
                console.log("Você já colocou um barco aí!");
            }
        }
        placeRandomCharacter('O', enemyGrid, gridSize);
        drawBreak();
        printGrid(enemyGrid, true);
        printGrid(playerGrid);
    }
    allShipsPlaced = true;
}

function gameLoop() {
    while (playerShips > 0 && enemyShips > 0) {
        let x = prompt('Digite a coordenada x para seu ataque!');
        let y = prompt('Digite a coordenada y para seu ataque!');

        if (attackLocal(x, y, enemyGrid)) {
            enemyShips--;
        }

        x = getRandomInt(gridSize);
        y = getRandomInt(gridSize);

        if (enemyShips > 0 && attackLocal(x, y, playerGrid)) {
            playerShips--;
        }

        drawBreak();
        console.log("Barcos inimigos restantes: " + enemyShips);
        printGrid(enemyGrid, true);
        console.log("Seus barcos restantes: " + playerShips);
        printGrid(playerGrid);
    }

    checkWinner();
}



function checkWinner() {
    if (playerShips < enemyShips) {
        console.log("Você perdeu!");
    }
    else {
        console.log("Você ganhou!")
    }
}

function createGrid() {
    let grid = [];
    for (let i = 0; i < gridSize; i++) {
        grid[i] = [];
        for (let j = 0; j < gridSize; j++) {
            grid[i][j] = '-';
        }
    }
    return grid;
}

function printGrid(grid, isEnemy = false) {
    drawHeaders()
    let table;
    for (let i = 0; i < gridSize; i++) {
        let rowStr = i + ' ';
        for (let cell of grid[i]) {
            if (isEnemy && cell == 'O') {
                rowStr += '- ';
            } else {
                rowStr += cell + ' ';
            }
        }
        console.log(rowStr);
    }
}


function placeCharacter(x, y, c, grid) {
    if (grid[y][x] == '-') {
        grid[y][x] = c;
        return true;
    }
    else {
        return false;
    }

}

function placeRandomCharacter(c, grid, max) {
    let didPlace = false;
    while (!didPlace) {
        let x = getRandomInt(max);
        let y = getRandomInt(max);
        if (!enemyLocations[`${x}-${y}`]) {
            placeCharacter(x, y, c, grid);
            didPlace = true;
            enemyLocations[`${x}-${y}`] = true;
            console.log(enemyLocations);
        }
    }
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function attackLocal(x, y, grid) {
    if (grid[y][x] == 'O') {
        grid[y][x] = '*';
        return true;
    }
    else if (grid[y][x] == '-') {
        grid[y][x] = 'x';
        return false;
    } else {
        return false;
    }
}

function drawHeaders() {
    let headers = "  "
    for (let i = 0; i < gridSize; i++) {
        headers += i + ' ';
    }
    console.log(headers);
    // playerBoard.innerHTML += "&nbsp" + headers;
    // playerBoard.innerHTML += '<br>';

}

function drawBreak() {
    console.log("-----------------------");
}

// Multiplayer Gameplay Methods

function setupPlayerShips() {
    for (let i = 1; i < 4; i++) {
        // limitar para jogador so poder entrar com certos números
        let didPlace = false;
        let x = 0;
        let y = 0;
        while (x < 0 || x > 9 || y < 0 || y > 9 || didPlace == false) {
            x = prompt('Digite a coordenada x para seu navio número ' + i + ' (de 0 a 9)');
            y = prompt('Digite a coordenada y para seu navio número ' + i + ' (de 0 a 9)');
            didPlace = placeCharacter(x, y, 'O', playerGrid);
            if (!didPlace) {
                console.log("Você já colocou um barco aí!");
            }
        }
    }
    console.log("Você posicionou seus barcos assim:")
    printGrid(playerGrid);
    drawBreak();
    allShipsPlaced = true;
}


function fire(socket) {
    if (currentPlayer == 'user' && ready && enemyReady) {
        let attackCoordinates = {}
        attackCoordinates.x = prompt('Digite a coordenada x para seu ataque!');
        attackCoordinates.y = prompt('Digite a coordenada y para seu ataque!');

        socket.emit('fire', attackCoordinates);
        // if (attack(x, y, enemyGrid)) {
        //     enemyShips--;
        // }
    }
}

function checkWinnerMulti() {
    if (playerShips <= 0) {
        printTable();
        console.log("Você perdeu!");
        return true;
    }
    else if (enemyShips <= 0) {
        printTable();
        console.log("Você ganhou!")
        return true
    }
    else {
        return false;
    }
}

function printTable() {
    console.log('Grid inimigo:')
    printGrid(enemyGrid, true);
    console.log('Seu grid:')
    printGrid(playerGrid);
    drawBreak();
}

function attackEnemy(x, y, grid, hit) {
    if (hit == false) {
        grid[y][x] = 'x';
    } else {
        grid[y][x] = '*';
    }
}

