const mongoose = require("mongoose");
const Maintainance = require("../models/Maintainance.js");
const initData = require("./MaintainanceData.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/SocietyTest";



main().then(()=>{
    console.log("conncted to db");
}).catch((err)=>{
    console.log(err);
});

async function main(){
    await mongoose.connect(MONGO_URL);
}

const initDB = async()=>{
    await Maintainance.deleteMany({});
    await Maintainance.insertMany(initData.data);
    console.log("Data successfully inserted !");
};


initDB();