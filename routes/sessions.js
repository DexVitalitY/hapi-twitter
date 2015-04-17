var Bcrypt = require('bcrypt');
var Joi = require('joi');


exports.register = function(server, options, next) {

server.route([
  {
  	method:'POST',
  	path: '/sessions',
  		handler: function (request, reply) {
  			//PAYLOAD SHOULD BE NOW user
	  		var user = request.payload.user;
	  		var db = request.server.plugins['hapi-mongodb'].db;

				db.collection('users').findOne({"username" : user.username}, function(err, userMongo) {
					if (err) {
						return reply('Internal MongoDV error', err);
					}

					if (userMongo === null) {
						return reply({"message": "User does not Exist"});
					}

					Bcrypt.compare(user.password, userMongo.password, function(err, matched) {
						if (err) {
							return reply('Error!', err);
						} 
						if (matched) {
							//Authenticate the usergit 
							function randomKeyGenerator() {
					    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
					    }  
					  // Generate a random key
						  var randomKey = (randomKeyGenerator() + randomKeyGenerator() + "-" + randomKeyGenerator() + "-4" + randomKeyGenerator().substr(0,3) + "-" + randomKeyGenerator() + "-" + randomKeyGenerator() + randomKeyGenerator() + randomKeyGenerator()).toLowerCase();

						  var newSession = {
						  	"session_id": randomKey,
						  	"user_id": userMongo._id
						  };

						  db.collection('sessions').insert(newSession, function(err, writeResult) {
						  	if (err) { return reply ('Internal MongoDB Error', err); }

						  	//Store the Session information in the browser Cookie
						  	//Yar

						  	request.session.set('hapi_twitter_session', {
						  		"session_key": randomKey,
						  		"user_id": userMongo._id
						  	});

						  	return reply(writeResult);
						  });

						} else {
							reply({'message' : 'Not authorized'})
						}


					})


				});
  	}
	},
	{
		method: 'GET',
		path: '/authenticated',
		handler: function(request, reply) {
			// retreieve the session information form the browser
			var session = request.session.get('hapi_twitter_session');

			var db = request.server.plugins['hapi-mongodb'].db;

			db.collection('sessions').findOne({"session_id": session.session_key}, function(err, result){
				if (result === null) {
					return reply({"message": "Unauthenticated"});
				} else {
					return reply({"message": "Authenticated"});
				}
			});
		}
	},
	{
		method: 'DELETE',
		path: '/sessions',
		handler: function(request, reply) {
			var db = request.server.plugins['hapi-mongodb'].db;
			var session = request.sessions.get('hapi_twitter_session');

			db.collection('sessions').findOne({"session_id": session._id}).remove();
		}
	}
]);

next();

}
exports.register.attributes = { 
  name: 'sessions-routes',
  version: '0.0.1'
}