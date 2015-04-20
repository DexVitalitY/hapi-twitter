var Bcrypt = require('bcrypt');
var Joi = require('joi');
var Auth = require('./auth');

exports.register = function(server, options, next) {

server.route([
	{
		method: 'GET',
		path: '/tweets',
		handler: function(request,reply) {
			var db = request.server.plugins['hapi-mongodb'].db;

			db.collection('tweets').find().toArray(function(err, tweets) {
				if (err) { return reply('Internal MongoDB error', err); }
				reply(tweets);
			});
		}
	},
	{
		method: 'GET',
		path: '/user/{username}/tweets',
		handler: function(request, reply) {
			var db = request.server.plugins['hapi-mongodb'].db;
			var username = encodeURIComponent(request.params.username);

			db.collection('users').findOne({"username" : username }, function (err, user){
				if (err) { return reply('Internal MongoDB error', err)}

				db.collection('tweets').find({"user_id": user._id }).toArray(function(err, tweets){
					if (err) { return reply('Internal MongoDB error', err)}
					reply(tweets);
				});

			})	
		}
	},
	{
		method: 'GET',
		path: '/tweets/{id}',
		handler: function(request, reply) {
			var db = request.server.plugins['hapi-mongodb'].db;
			var tweet_id = encodeURIComponent(request.params.id);
			var ObjectId = request.server.plugins['hapi-mongodb'].ObjectID;

			db.collection('tweets').findOne({ "_id": ObjectId(tweet_id)}, function (err, tweet) {
				if (err) {return reply('Internal MongoDB error', err); }

				reply(tweet);
			})
		} 		
	},
	{
  method: 'POST',
  path: '/tweets',
  config: {
    handler: function(request, reply) {
      Auth.authenticated(request, function(result) {
        if (result.authenticated) {
        	var db = request.server.plugins['hapi-mongodb'].db;
					var session = request.session.get('hapi_twitter_session');
					var ObjectId = request.server.plugins['hapi-mongodb'].ObjectID;

					var tweet = { 
					  "message": request.payload.tweet.message,
					  "user_id": ObjectId(session.user_id)
					};
					
					db.collection('tweets').insert(tweet, function(err, writeResult) {
				  	if (err) { return reply('Internal MongoDB error', err); }

  					reply(writeResult);
					});
        } else {
          reply(result.message);
        }
      });
    },
    validate: {
      payload: {
        tweet: {
          // Required, Limited to 140 chars
          message: Joi.string().max(140).required()
        }
      }
    }
  }
},

	{
		method: 'DELETE',
		path: '/tweets/{id}',
		handler: function(request, reply) {
			Auth.authenticated(request, function(result) {

				if (result.authenticated) {	
					var db = request.server.plugins['hapi-mongodb'].db;
					var tweet_id = encodeURIComponent(request.params.id);
					var ObjectId = request.server.plugins['hapi-mongodb'].ObjectID;

					db.collection('tweets').remove({"_id": ObjectId(tweet_id) }, function(err, writeResult){
						if (err) {return reply('Internal MongoDB error', err); }

						reply(writeResult);
					});	
				} else {
					replay(result.message);
				}
			});
		}
	}
])

next();
};

exports.register.attributes = {
	name: 'tweets-route',
	version: '0.0.1'
};