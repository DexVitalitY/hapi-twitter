var Bcrypt = require('bcrypt');
var Joi = require('joi');


exports.register = function(server, options, next) {


  //routes HERE
  server.route([
    {
    	method:'GET',
    	path: '/users',
    	handler: function (request, reply) { 
    		var db = request.server.plugins['hapi-mongodb'].db;

    		db.collection('users').find().toArray(function(err, users) {
    			if (err) {
    				return reply('Internal MongoDB error', err);
    			}
        
        reply(users);
    	});
    }
  },
  {
  	method:'POST',
  	path: '/users',
  	config: {
  		handler: function (request, reply) {
	  		var newUser = request.payload.newUser;
	  		var db = request.server.plugins['hapi-mongodb'].db;

	  		Bcrypt.genSalt(10, function(err, salt){
	  			Bcrypt.hash(newUser.password, salt, function(err, hash){
	  				newUser.password = hash;

	  				var uniqueUserQuery = {
	  					$or: [
	  						{ username: newUser.username},
	  						{ email: newUser.email },
	  					]};

	  				db.collection('users').count(uniqueUserQuery, function(err, userExist) {
	  					if (userExist) {
	  						return reply('User Already Exists', err);
	  					} 
	  				})	

	  				db.collection('users').insert(newUser, function(err, writeResult){
	  					if (err) {
	  						return reply(Hapi.error.internal('Internal MongoDB Error', err));
	  					} else {
	  						reply(writeResult);
	  					}
	  				});
	  			});
	  		})
  		},
  		validate: {
  			payload: {
  				newUser: {
  					username: Joi.string().min(4).max(20).required(),
  					email: Joi.string().email().max(50).required(),
  					password: Joi.string().min(5).max(20).required()
  				}
  			}
  		}
  		
  	}
  },
  {
  	method:'GET',
  	path:'/users/{username}',
  	handler: function (request, reply) {
  		var id = encodeURIComponent(request.params.username);
     
      var db = request.server.plugins['hapi-mongodb'].db;
      var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;

  		db.collection('users').findOne({'_id' : ObjectID(id) }, function(err, writeResult) {
          if (err) throw err;
          reply(writeResult);
        })
  	}
  }
//server.route END
 ]);

  next();
};

exports.register.attributes = { 
  name: 'users-route',
  version: '0.0.1'
}