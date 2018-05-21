var keystone = require('keystone');
var Types = keystone.Field.Types;

var url = new keystone.List('url', {
  singular: 'url',
  plural: 'urls'
});

url.add({
  senID: {type: Types.Relationship , ref: 'customer', filters: {uid : ':sender'}},
  recID: {type: Types.Relationship, ref: 'customer', filters: {uid: ':receiver'}},
  occ: {type: String},
  details: {type: String},
  status: {type: Types.Select, options: 'created, replied, expired'},
  type : {type: Types.Select, options: 'message, final'},
  messages: {type: Types.Relationship, ref: 'message', hidden: true, many: true}
});
url.register();
