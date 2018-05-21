var keystone = require('keystone');
exports = module.exports = function(req,res){
 var view = new keystone.View(req,res);
 var locals = res.locals;
 locals.section = 'corporates';
 view.query('companies', keystone.list('company').model.find());
 view.render('companies');
}
