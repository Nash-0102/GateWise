const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EventSchema = new Schema({
    title:{
        type:String,
        required: true,
    },
    description:{
        type:String,
        required:true,
    },
    date:{
        type:Date,
        required:true,
    },
    category:{
        type:String,
        enum:['General' , 'Event' ],
        default: 'General',
    }
});


module.exports = mongoose.model('Event' , EventSchema);