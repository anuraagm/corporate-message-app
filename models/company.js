var keystone = require('keystone');
var Types = keystone.Field.Types;

var Company = new keystone.List('Company', {
    autokey: { path: 'slug', from: 'title', unique: true },
    singular: 'company',
    plural: 'companies',
    map: { name: 'title' },
    defaultSort: '-createdAt'
});

Company.add({
  title: {type: String, required: true},
  compLogo: {type: Types.CloudinaryImage},
  primaryColor: {type: Types.Color, initial: false},
  secondaryColor: {type: Types.Color, initial: false},
  footer: {type: String},
  addedDate: {type: Date}
});

Company.register();
