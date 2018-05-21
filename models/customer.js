var keystone = require('keystone'),
    moment =  require('moment');
var Types = keystone.Field.Types;

var customer = new keystone.List('customer', {
  map: {name: 'title'},
  singular: 'customer',
  plural: 'customers',
  autokey: {path: 'slug', from: 'title', unique: true}
});

customer.add({
  title: {type: String},
  custPic: {type: Types.CloudinaryImage},
  mobile: {type: Number},
  email: {type: String},
  dob: {type: Types.Date, initial : true},
  gender: {type: String},
  doj: {type: Types.Date, initial : true},
  date_birthday : {type : String , hidden : true, initial : true},
  date_joining : {type : String , hidden : true , inital : true},
  cname: {type: Types.Relationship, ref: 'Company'},
  friends: {type: Types.Relationship, ref: 'customer', filters: {cname : ':cname' }, many: true},
  addedDate: {type: Date}
});

customer.schema.pre('save', function(next){
  this.date_birthday = moment(this.dob , "MM-DD").format("MM-DD");
  this.date_joining = moment(this.doj, "MM-DD").format("MM-DD");
  next();
})

customer.register();
