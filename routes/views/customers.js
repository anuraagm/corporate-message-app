var keystone = require('keystone'),
    Customer = keystone.list('customer'),
    moment = require('moment'),
    cron = require('node-cron');

exports = module.exports = function(req,res){
 var view = new keystone.View(req,res);
 var locals = res.locals;
 view.render('customers');
};
