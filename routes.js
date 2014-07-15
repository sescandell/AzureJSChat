// This file is required by app.js. It sets up event listeners
// for the two main URL endpoints of the application - /create and /chat/:id
// and listens for socket.io messages.

// Use the gravatar module, to turn email addresses into avatar images:

var gravatar = require('gravatar');

// Export a function, so that we can pass 
// the app and io instances from the app.js file:

module.exports = function(app,io){

	app.get('/', function(req, res){
		// Render views/home.html
		res.render('home');
	});

	app.get('/create', function(req,res){
		// Generate unique id for the room
		var id = Math.round((Math.random() * 1000000));
		// Redirect to the random room
		res.redirect('/chat/'+id);
	});

	app.get('/chat/:id', function(req,res){
		// Render the chat.html view
		res.render('chat');
	});


	// Participants storage
	//	 > Based on a simple Key-Value mechanism
	var participants = {};

	// Initialize a new socket.io application
	io.of('/socket').on('connection', function (socket) {

		// When the client emits the 'load' event, reply with the 
		// number of people in this chat room
		socket.on('load',function(room){
			// Get clients count
			var clientsCount = Object.keys(participants).length;

			console.log('Someone loaded room ' + room + '. Already ' + clientsCount + ' participants.');
			socket.emit('peopleInChat', {number: clientsCount});
		});

		// When the client emits 'login', save his name and avatar,
		// and add them to the room
		socket.on('login', function(data) {
			// Use the socket object to store data. Each client gets
			// their own unique socket object
			socket.username = data.user;
			socket.room = data.id;
			socket.avatar = gravatar.url(data.avatar, {s: '140', r: 'x', d: 'mm'});

			// Display the avatar we are going to use
			socket.emit('img', socket.avatar);

			// Add the client to the room
			socket.join(data.id);
			console.log('New participant to the room ' + socket.room + ': ' + socket.username + ' (' + socket.avatar + ')');

			// Store the client to the store
			participants[socket.id] = {
				id: socket.id,
				username: socket.username,
				avatar: socket.avatar,
				room: socket.room
			};

			// Notify participants
			socket.to(socket.room).emit('participantJoined', {
				username: socket.username,
				avatar: socket.avatar,
				room: socket.room
			});
		});

		// Somebody left the chat
		socket.on('disconnect', function() {
			console.log('Disconnect received');
			if (socket.username) {
				// Notify others in the chat room
				socket.to(socket.room).emit('participantLeaved', {
					room: socket.room,
					username: socket.username,
					avatar: socket.avatar
				});

				// Remove the client from store
				delete participants[socket.id];
			}
		});


		// Handle messages
		socket.on('msg', function(data){
			// When the server receives a message, it sends it to participants in the room.
			socket.to(socket.room).emit('receive', {
				msg: data.msg,
				username: data.username,
				avatar: data.avatar
			});
		});
	});
};
