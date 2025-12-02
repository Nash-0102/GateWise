const mongoose = require("mongoose");
const initData = require("../init_Event/Eventdata.js");
const event  = require("../models/Event.js");





const MONGO_URL = "mongodb://127.0.0.1:27017/SocietyTest";


main().then(() => {
    console.log("conncted to db");
}).catch((err) => {
    console.log(err);
});

async function main(){
    await mongoose.connect(MONGO_URL);
}

const initDB =  async()=>{
    await event.deleteMany({});
    await event.insertMany(initData.data);
    console.log("Event Data successfully inserted !");
};

initDB();