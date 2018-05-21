var keystone = require('keystone'),
    moment =  require('moment'),
    Customer = keystone.list('customer');
var Types = keystone.Field.Types;

var message = new keystone.List('message', {
  singular: 'message',
  plural: 'messages',
});

message.add({
  message: {type: Types.Textarea},
  createdDate: {type: Date},
  receiver: {type: Types.Relationship, ref: 'customer', initial: true},
  sender: {type: Types.Relationship, ref: 'customer', initial: true},
  year: {type: String},
  occasion: {type: String}
});

message.register();
