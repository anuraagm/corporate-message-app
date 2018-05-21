var keystone = require('keystone');
var Types = keystone.Field.Types;

var Config = new keystone.List('Config', {
    singular: 'config',
    plural: 'configs',
});

Config.add({
  birthday : {type: Types.CloudinaryImage},
  anniversary : {type: Types.CloudinaryImage}
});

Config.register();
