const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ALertschema = new Schema({
    title:{
        type:String,
        required : true,
    },
    description : {
        type:String,
        required : true,
    },
});

const alert = mongoose.model("alert" , ALertschema);
module.exports = alert;