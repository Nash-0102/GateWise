const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const NoticeSchema = new Schema({
    title:{
        type:String,
        required:true,
    },
    description:{
        type:String,
         required:true,
    },
    createdAt:{
        type:Date,
        default:Date.now,
    }
});

const Notice = mongoose.model("Notice" , NoticeSchema);
module.exports = Notice;