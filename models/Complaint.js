const mongoose = require("mongoose");
const Schema = mongoose.Schema;

 
const ComplaintSchema = new Schema({
    user:{
        type:String,
        required: true,
    },
    title:{
        type:String,
        required: true,

    },

    description:{
        type:String,
        required:true,
    },
    status:{
        type:String,
        enum:["Pending" , "Resolved"],
        default:"Pending",
    },

    createdAt:{
        type:Date,
        default:Date.now,
    }
});

const complaint = mongoose.model("complaint" , ComplaintSchema);
module.exports= complaint; 