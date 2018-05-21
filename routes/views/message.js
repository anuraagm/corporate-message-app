var keystone = require('keystone'),
    Customer = keystone.list('customer'),
    url = keystone.list('urls'),
    Message = keystone.list('message'),
    moment = require('moment');
exports = module.exports = function(req, res){
  var view = new keystone.View(req,res);
  var status;
  var locals = res.locals;
  locals.data = {
    urls1: [],
    custs1: [],
    custs2: []
	};
  view.on('init', function(next){
    var query = {
      _id : req.params.id,
      details : moment(new Date()).format("YYYY"),
      type : 'message'
    };
    url.model.findOne(query).populate('senID recID').populate({path : 'recID' , populate : ['cname']})
      .then(function(customer){
        if(customer.status == "created"){
          locals.data.urls1 = customer;
          locals.data.cust1 = customer.recID;
          locals.data.cust2 = customer.senID;
        }
        else if(customer.status == "replied"){
          return res.redirect('/replied');
        }
        else if(customer.status == "expired"){
          return res.redirect('/expired');
        }
        else{
          return res.redirect('/error');
        }
        next();
      })
      .catch(function(err){
        return res.redirect('/error');
      });
	});

  view.on('post', function(next){
     url.model.find({_id : req.params.id}).populate('sender receiver')
      .then(function(response){
       if(response[0].status == "created") {
         var newMsg = new Message.model({
           message: req.body.message,
           sender: locals.data.cust2,
           receiver: locals.data.cust1,
           occasion: locals.data.urls1.occ,
           year: moment(new Date()).format("YYYY")
         });
         newMsg.save(function(err) {
           if(err) {
             return res.redirect('/error');
           }
           var query = {
             _id: req.params.id
           };
           url.model.findOneAndUpdate(query,{status : "replied"}).then(function(urlResponse){
             return res.redirect('/thanks');
           }).catch(function(err) {
             return res.redirect('/error');
           });
         });
       } else if(response[0].status == "replied") {
         return res.redirect('/replied');
       } else if(response[0].status == "expired") {
         return res.redirect('/expired');
       } else {
         return res.redirect('/error');
       }
     }).catch(function(err) {
       return res.redirect('/error');
     });
  });

  view.render('message');
};
