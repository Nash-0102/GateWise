const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MaintainanceSchema = new Schema({
user: {
    type: Schema.Types.ObjectId , 
    ref: "User" ,
    required: true ,
},
title:{
    type:String,
    required: true,
},
description:{
    type: String,
    required:true,
},
amount:{
    type:Number,
    required:true,
    min:0,
},
dueDate:{
    type:Date,
    required:true,
},
 houseNo: {
        type: String,
        required: true,  // <-- NEW FIELD
    },
frequency:{
    type:String,
    enum:["one-time" , "Monthly" , "Yearly" , "Quarterly" ],
    default:"Monthly",
},
status:{
    type:String,
    enum:["pending" , "paid"],
},
createdBy:{
    type: Schema.Types.ObjectId,
    ref:"User",

},
createdAt:{
    type:Date,
    default:Date.now,

},
paidAt:Date,
paymentRef:String,//If required in Future 
notes:String,

});

const Maintainance = mongoose.model("Maintainance" , MaintainanceSchema);
MaintainanceSchema.index({ user: 1, dueDate: 1 });
module.exports = Maintainance;