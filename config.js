// This file handles the configuration of the app.
// It is required by app.js

var express = require('express');
var redis = require('redis').createClient;

module.exports = function(app, io){

	// Set .html as the default template extension
	app.set('view engine', 'html');

	// Initialize the ejs template engine
	app.engine('html', require('ejs').renderFile);

	// Tell express where it can find the templates
	app.set('views', __dirname + '/views');

	// Make the files in the public folder available to the world
	app.use(express.static(__dirname + '/public'));

	// Add azure adapter if required
	if (process.env.hasOwnProperty('REDIS_HOST') && process.env.hasOwnProperty('REDIS_PORT') && process.env.hasOwnProperty('REDIS_AUTH_PASS')) {
		console.log('Loading Redis adapter');
		var redisAdapter = require('socket.io-redis');
		console.log('Creating Redis clients');
		// We need to manually create Redis Client because, on Azure, Redis
		// requires Authentication (default socket.io-redis process doesn't permit
		// this by options). So let's create them manually
		// Publisher
		var redisClientPub = redis(
			process.env.REDIS_PORT
			, process.env.REDIS_HOST
			, {auth_pass: process.env.REDIS_AUTH_PASS}
		);
		// Subscriber
		var redisClientSub = redis(
			process.env.REDIS_PORT
			, process.env.REDIS_HOST
			, {
				auth_pass: process.env.REDIS_AUTH_PASS,
				detect_buffers: true
			}
		);
		console.log('Attaching Redis Adapter');
		io.adapter(redisAdapter({
			pubClient: redisClientPub,
			subClient: redisClientSub
		}));
	} else {
		console.log('Redis is not configured. Use local logic.');
		console.log(process.env);
	}
};