const gridSize = 3;
// const headers = "  0 1 2 3 4 5 6 7 8 9 ";
let playerGrid = createGrid();
let enemyGrid = createGrid();
let playerShips = 3;
let enemyShips = 3;
let enemyLocations = {};

printGrid(enemyGrid, true);
printGrid(playerGrid);

setupGame();
gameLoop();

function setupGame() {
    for (let i = 1; i < 4; i++) {
        // limitar para jogador so poder entrar com certos números
        let x = prompt('Digite a coordenada x para seu navio número ' + i + ' (de 0 a 9)');
        let y = prompt('Digite a coordenada y para seu navio número ' + i + ' (de 0 a 9)');
        placeCharacter(x, y, 'O', playerGrid);
        placeRandomCharacter('O', enemyGrid, gridSize);
        drawBreak();
        printGrid(enemyGrid, true);
        printGrid(playerGrid);
        // printar regras
    }
}

function gameLoop() {
    while (playerShips > 0 && enemyShips > 0) {
        let x = prompt('Digite a coordenada x para seu ataque!');
        let y = prompt('Digite a coordenada y para seu ataque!');

        if (attack(x, y, enemyGrid)) {
            enemyShips--;
        }

        x = getRandomInt(gridSize);
        y = getRandomInt(gridSize);

        if (enemyShips > 0 && attack(x, y, playerGrid)) {
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
    //limitar para so colocar onde ainda não foi colocado
    grid[y][x] = c;
}

function placeRandomCharacter(c, grid, max) {
    // limitar para so conseguir colocar onde não foi colocado
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

function attack(x, y, grid) {
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

}

function drawBreak() {
    console.log("-----------------------");
}