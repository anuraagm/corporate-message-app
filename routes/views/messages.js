var keystone = require('keystone');
exports = module.exports = function(req,res){
 var view = new keystone.View(req,res);
 var locals = res.locals;
 locals.section = 'MessageList';
 view.query('messages', keystone.list('message').model.find());
 view.render('messages');
}
