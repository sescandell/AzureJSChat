// This file handles the configuration of the app.
// It is required by app.js

var express = require('express');

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
	if (false && process.env.hasOwnProperty('WEBSITE_INSTANCE_ID')) {
		console.log('Loading Azure adapter');
		var azureAdapter = require(__dirname + '/lib/socketio-azuresb/index.js');
		console.log('Attaching Azure adapter');
		io.adapter(azureAdapter({subscriptionId: process.env.WEBSITE_INSTANCE_ID}));
	} else {
		console.log('This is not Azure, use classic mechanism.');
	}
};