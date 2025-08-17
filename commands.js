module.exports = {
    request(data, victimList, io){
        let { to, action, data: payload } = JSON.parse(data);
        if(victimList[to]){
            io.to(victimList[to]).emit(action, payload);
        }
    }
};