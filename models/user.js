const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema  = new Schema({
    email:{
        type: String ,  
        required:true,
    },
    role:{
        type:String,
        enum:["Secretary" , "Resident"],
        default:"Resident" ,
    },

    profile: {
    fullName: String,
    phone: Number,
    houseNo: String,
    
  }
});

UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User" ,UserSchema );