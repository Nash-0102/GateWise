const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MainSettingSchema = new Schema({
    houseNo: { type: String, required: true },      
    title: { type: String, required: true },        
    description: { type: String, default: '' },
    amount: { type: Number, required: true, min: 0 },
    frequency: {
        type: String,
        enum: ['one-time', 'Monthly', 'Quarterly', 'Yearly'],
        default: 'Monthly'
    },
    active: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }, // secretary id
    createdAt: { type: Date, default: Date.now }
});

MainSettingSchema.index({houseNo:1});

module.exports = mongoose.model("MainSetting" , MainSettingSchema);