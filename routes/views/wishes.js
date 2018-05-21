var keystone = require('keystone'),
    Customer = keystone.list('customer'),
    Message = keystone.list('message'),
    url = keystone.list('urls');
exports = module.exports = function(req, res){
  var view = new keystone.View(req,res);
  var locals = res.locals;
  locals.data = [];
  view.on('init', function(next){
    var query = {
      _id: req.params.id
    };
    url.model.findOne(query).populate('recID messages').populate({path : 'messages' , populate : ['sender']})
      .then(function(customer){
        if(customer.messages != null){
          locals.data = customer;
          console.log(customer.messages);
          next();
        }
        else{
          return res.redirect('/error');
        }
    }).catch(function(err){
        return res.redirect('/error');
    });
  })
  view.render('wishes');
};
