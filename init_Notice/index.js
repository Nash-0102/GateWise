const mongoose = require("mongoose");
const initData = require("./Noticedata.js");
const Notice = require("../models/Notice.js");

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
    await Notice.deleteMany({});
    await Notice.insertMany(initData.data);
    console.log("Data successfully inserted !");
};

initDB();