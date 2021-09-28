import * as express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, { /* options */ });

// app.set('port', 5000);
// app.use('/static', express.static(__dirname + '/static'));

io.on("connection", (socket) => {
    // ...
});

// Маршруты
// app.get('/', function(request, response) {
//     response.sendFile(path.join(__dirname, 'index.html'));
// });

server.listen(3000, function() {
    console.log('Запускаю сервер на порте 5000');
});

setInterval(function() {
    io.sockets.emit('message', 'hi!');
}, 1000);
