import express from "express";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { GameHandler } from "../spartacus/engine";

const PORT = 3000;
const app = express();
const server = createServer(app);
const io = new Server(server, { /* options */ });

app.set('port', PORT);
app.use('/dist', express.static(__dirname + '/../../dist'));
app.use('/static', express.static(__dirname + '/../../static'));

const emitCallback = function(socketId, eventType, data) {
    if (socketId !== null || socketId !== '' || socketId !== undefined) {
        io.in(socketId).fetchSockets().then((sockets) => {
            for (const socket of sockets) {
                socket.emit(eventType, data);
            }
        });
    } else {
        io.sockets.emit(eventType, data);
    }
}
const game = new GameHandler(emitCallback);

io.on('connection', function(socket) {
    socket.on('connected', function(data) {
        console.log(`connected ${socket.id}`);
        game.addPlayer(socket.id, true, data.hero);
    });
    socket.on('disconnect', function() {
        console.error("disconnect");
        // удаляем отключившегося игрока
    });
    socket.on('rolledSpeed', function(data) {
        console.log(`rolledSpeed ${socket.id}`);
        game.handlePlayerEvent({...data, playerId: socket.id});
    });
    socket.on('rolledAttack', function(data) {
        console.log(`rolledAttack ${socket.id}`);
        game.handlePlayerEvent({...data, playerId: socket.id});
    });
    socket.on('rolledDefence', function(data) {
        console.log(`rolledDefence ${socket.id}`);
        game.handlePlayerEvent({...data, playerId: socket.id});
    });
    socket.on('choosedDamageSet', function(data) {
        console.log(`choosedDamageSet ${socket.id}`);
        game.handlePlayerEvent({...data, playerId: socket.id});
    });
    socket.on('rolledRecovery', function(data) {
        console.log(`rolledRecovery ${socket.id}`);
        game.handlePlayerEvent({...data, playerId: socket.id});
    });
});

// Маршруты
app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, '../../static/index.html'));
});

server.listen(PORT, function() {
    console.log(`Запускаю сервер на порте ${PORT}`);
});
