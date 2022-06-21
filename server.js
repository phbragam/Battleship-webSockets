const express = require('express');
const path = require('path');
const http = require('http');
const PORT = process.env.PORT || 3000;
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// Start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const connections = [null, null]

// Handle a socket connection request from web client
io.on('connection', socket => {
    // console.log('New WS Connection');
    console.log(socket.id);

    // Find an available player number
    let playerIndex = -1;
    for (const i in connections) {
        if (connections[i] == null) {
            playerIndex = i;
            break;
        }
    }

    // tell the connecting client what player number they are
    // see emit as if it has a header (player-number) and the content (playerIndex)
    socket.emit('player-number', playerIndex);
    console.log(`Player ${playerIndex} has connected!`);

    // ignore player 3
    if (playerIndex == -1)
        return;

    connections[playerIndex] = false;

    // tell everyone what player number just connected
    socket.broadcast.emit('player-connection', playerIndex);

    // handle disconnect
    socket.on('disconnect', () => {
        console.log(`Player ${playerIndex} disconnected!`)
        connections[playerIndex] = null;
        // tell everyone what player number just disconnected
        socket.broadcast.emit('player-disconnect', playerIndex);
    })

    // on ready 
    socket.on('player-ready', () => {
        socket.broadcast.emit('enemy-ready', playerIndex)
        connections[playerIndex] = true;
    })

    // check player connections
    socket.on('check-players', () => {
        const players = []
        for (const i in connections) {
            connections[i] == null ? players.push({ connected: false, ready: false }) :
                players.push({ connected: true, ready: connections[i] })
        }
        socket.emit('check-players', players);
    })

    // On fire received
    socket.on('fire', coordinates => {
        console.log(`Shot fired from ${playerIndex}`, coordinates);

        // Emit the move to other player
        socket.broadcast.emit('fire', coordinates)
    })

    // On fire repply
    socket.on('fire-reply', fireReplyData => {
        console.log(fireReplyData);

        // forward the reply to the other player
        socket.broadcast.emit('fire-reply', fireReplyData);
    })

    // Timeout connection
    setTimeout(() => {
        connections[playerIndex] = null;
        socket.emit('timeout')
        socket.disconnect();
    }, 300000)

    // handle game over
    socket.on('game-over', (roomId) => {
        socket.disconnect();
    })
































})

