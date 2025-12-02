const Joi = require("joi");

module.exports.AlertSchema  = Joi.object({
    alert : Joi.object({
        
        title: Joi.string().required(),
        description: Joi.string().required(),
    }).required(),
});