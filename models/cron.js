var keystone = require('keystone'),
    cronjob = require('node-cron'),
		MongoClient = require('mongodb').MongoClient,
    sendgrid = require('@sendgrid/mail'),
    hbs = require('handlebars'),
    fs = require('fs'),
    https = require('https'),
    moment =  require('moment');
var Types = keystone.Field.Types;
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
var cron = new keystone.List('cron', {
  nocreate : true,
  nodelete : true
});

cron.add({
  send_invite: {type: Types.Boolean, default: false, label: "Send Invite Links"},
  send_final: {type: Types.Boolean, default: false, label: "Send Final Links"},
})

cron.schema.pre('save', function(next){
  if(this.send_invite == true){
    runSendInvite();
  }
  if(this.send_final == true){
    runSendFinal();
  }
  this.send_invite = true;
  this.send_final = true;
  next();
})


function findFriendsForBirthday (db , data , year) {
  db.collection('customers').find({
    cname : data.cname,
    _id : {
      $ne : data._id
    }
  }).toArray(function(err , response) {
    if(err) {
      console.log(err);
      return false;
    }
    if(response.length !== 0) {
      for(i in response) {
        var query = {
          senID : response[i]._id,
          recID : data._id,
          occ : 'Birthday',
          details : year,
          status : 'created',
          type : 'message'
        }
        executeQueryForInvites(query , db);
      }
    }
  });
}

function findFriendsForWork (db , data , year) {
  db.collection('customers').find({
    cname : data.cname,
    _id : {
      $ne : data._id
    }
  }).toArray(function(err , response) {
    if(err) {
      console.log(err);
      return false;
    }
    if(response.length !== 0) {
      for(i in response) {
        var query = {
          senID : response[i]._id,
          recID : data._id,
          occ : 'Work Anniversary',
          details : year,
          status : 'created',
          type : 'message'
        }
        executeQueryForInvites(query , db);
      }
    }
  });
}

function runSendInvite(){
  MongoClient.connect(process.env.MONGO_URL, function(err, db) {
		var today = moment(new Date()).format("MM-DD");
		var year = moment(new Date()).format("YYYY");
	  var query = {
		  $or: [
				{date_birthday : today},
				{date_joining : today}
			]
		};
	  db.collection("customers").find(query).toArray(function(err, result) {
			for(index in result) {
				if(result[index].date_birthday == today) {
					findFriendsForBirthday(db , result[index] , year);
				}
				if(result[index].date_joining == today) {
          findFriendsForWork(db , result[index] , year);
				}
			}
	  });
  });
}
function executeQueryForInvites(query , db) {
    var check = {
          senID : query.senID,
          recID : query.recID,
          occ : query.occ,
          details : query.details,
          type : query.type
    }
    db.collection("urls").find(check).toArray(function (err , res) {
      if(res.length == 0) {
        db.collection("urls").save(query).then(function (response) {
          callSMS(response , db);
        }).catch(function(err) {
          console.log(err);
        });
      }
    })
}
function callSMS(data , db) {
  data = data.ops[0];
  var query = {
    $or : [
      { "_id" : data.senID },
      { "_id" : data.recID }
    ]
  }
  db.collection("customers").find(query).toArray(function(err , res) {
      var sender = {},receiver = {};
      for(i in res) {
        if(res[i]._id.equals(data.senID)) {
          sender = res[i];
        }
        if(res[i]._id.equals(data.recID)) {
          receiver = res[i];
        }
      }
      if(sender._id && receiver._id) {
        var message = "Hi " + sender.title + ", it is " + receiver.title + "'s " + data.occ + " today. Click " + process.env.DOMAIN + "message/" + data._id + " to send your wishes.";
        var url = process.env.SMS_URL + "?uname=" + process.env.SMS_UNAME + "&pass=" + process.env.SMS_PASS + "&send=" + process.env.SMS_SENDID + "&dest=" + sender.mobile + "&msg=" + encodeURIComponent(message);
        https.get(url , function(resp) {
          console.log(resp);
        }).on("error" , function(err) {
          console.log(err);
        })
      } else {
        console.log("Could not find sender or receiver");
        return false
      }
  })
}
function sendFinalBirthday(data , db , year) {
  db.collection("messages").find({year: year, receiver: data._id, occasion: 'Birthday'}).toArray(function(err,messages){
    if(err) {
      return false;
    }
    if(messages.length !== 0){
      var messagesId = [];
      for (j in messages) {
        messagesId.push(messages[j]._id);
      }
      var query = {
        recID : data._id,
        occ : 'Birthday',
        details : year,
        type : 'final',
        messages: messagesId
      }
      executeQuery(query, db);
    }
  });
}
function sendFinalWork(data , db , year) {
  db.collection("messages").find({year: year, receiver: data._id, occasion: 'Work Anniversary'}).toArray(function(err,messages){
    if(err) {
      return false;
    }
    if(messages.length !== 0){
      var messagesId = [];
      for (j in messages) {
        messagesId.push(messages[j]._id);
      }
      var query = {
        recID : data._id,
        occ : 'Work Anniversary',
        details : year,
        type : 'final',
        messages: messagesId
      }
      executeQuery(query, db);
    }
  });
}
function runSendFinal() {
  MongoClient.connect(process.env.MONGO_URL, function(err, db) {
    var today = moment(new Date()).format("MM-DD");
		var year = moment(new Date()).format("YYYY");
	  var query = {
		  $or: [
				{date_birthday : today},
				{date_joining : today}
			]
		};
	  db.collection("customers").find(query).toArray(function(err, result) {
			for(index in result) {
				if(result[index].date_birthday == today) {
            sendFinalBirthday(result[index] , db , year);
            moveUrlsToExpired(result[index]._id, 'Birthday' , year ,db);
				}
				if(result[index].date_joining == today) {
            sendFinalWork(result[index] , db ,year );
            moveUrlsToExpired(result[index]._id, 'Work Anniversary' , year ,db);
				}
			}
	  });
  });
}
function executeQuery(query , db) {
  var check = {
        recID : query.recID,
        occ : query.occ,
        details : query.details,
        type : query.type
  }
  db.collection("urls").find(check).toArray(function (err , res) {
    if(res.length == 0) {
      db.collection("urls").save(query).then(function (response) {
        sendgridSendEmail(response , db);
      }).catch(function(err) {
        console.log(err);
      });
    }
  });
}
function sendgridSendEmail(data , db) {
  db.collection("customers").find({ _id : data.ops[0].recID}).toArray(function(error , customer) {
    if(error) {
      console.log(error);
    }
    db.collection("configs").find().toArray(function(err ,templates) {
      var options = {
        templateImage : data.ops[0].occ == "Birthday" ? templates[0].birthday.secure_url : templates[0].anniversary.secure_url,
        name : customer[0].title,
        occ : data.ops[0].occ,
        link : process.env.DOMAIN + 'wishes/' + data.ops[0]._id
      }
      var html = generateHtml(options);
      var msg = {
        to : customer[0].email,
        from : "wishes@giftbig.com",
        subject : "Happy " + data.ops[0].occ,
        html : html,
      }
      sendgrid.send(msg).then(function(resp){
        console.log('Email Sent');
      }).catch(function(errr){
        console.log(errr);
      });
    });
  });
}
function generateHtml(options) {
  var source = fs.readFileSync('./templates/emails/email.hbs' , 'utf8');
  var html = hbs.compile(source);
  return html(options);
}
function moveUrlsToExpired(id , occ , year , db) {
  db.collection("urls").update(
     {
       recID : id ,
       occ : occ ,
       details : year,
       type : 'message',
       status : 'created'
     },
     { $set : {status : 'expired'} },
     {multi : true})
   .then(function (response) {
    console.log("Moved to expired");
  }).catch(function(err) {
    console.log(err);
  });
}

cronjob.schedule('0 30 2 * * *', function(){
  runSendInvite();
});
cronjob.schedule('0 30 12 * * *', function(){
  runSendFinal();
});
cron.register();
