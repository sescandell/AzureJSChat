// This file is required by app.js. It sets up event listeners
// for the two main URL endpoints of the application - /create and /chat/:id
// and listens for socket.io messages.

// Use the gravatar module, to turn email addresses into avatar images:

var gravatar = require('gravatar');
var azureStorage = require('azure-storage');

// Export a function, so that we can pass 
// the app and io instances from the app.js file:

module.exports = function(app, io){

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


	// Quick and dirty... just for tutorial purposes.
	// You should better to rely on a service for that
	// Use Azure Table Storage service to store users list.
	var ParticipantTableStorage = function () {
		var azureTableService = azureStorage.createTableService();
		var entGen = azureStorage.TableUtilities.entityGenerator;
		var tableName = 'participants';
		var partitionKey = "default";
		var prefix = process.env.WEBSITE_INSTANCE_ID || 'default';

		// If this is the first time the application is launched, let's create the table
		azureTableService.createTableIfNotExists(tableName, function (err, result, response){
			if (err) {
				console.log('Error on create table: ', err);

				throw err;
			}
		}.bind(this));

		return {
			// Retrieve participants count from Store
			// We retrieve all participants to show you how to get a users' list
			getCount: function(room, callback) {
				var query = new azureStorage.TableQuery()
					.where('PartitionKey eq ?', partitionKey + room);

				azureTableService.queryEntities(tableName, query, null, function(err, result, response){
					if (err) {
						console.log('Retrieving participants failed: ' + JSON.stringify(err));
						
						callback(err, undefined);
					}

					callback(undefined, result.entries.length);
				}.bind(this))
			},

			// Add a new participant to the store
			add: function(participant) {
				var entity = {
					PartitionKey: entGen.String(partitionKey + participant.room),
					RowKey: entGen.String(prefix + participant.id),
					username: entGen.String(participant.username),
					avatar: entGen.String(participant.avatar),
					room: entGen.String(participant.room)
				};

				azureTableService.insertEntity(tableName, entity, function(err, result, response){
					if (err) {
						console.log('Error inserting participant ');
					}
				}.bind(this));
			},

			// Remove a participant from the store
			remove: function(participant) {
				var entity = {
					PartitionKey: entGen.String(partitionKey + participant.room),
					RowKey: entGen.String(prefix + participant.id)
				};

				azureTableService.deleteEntity(tableName, entity, function(err, response){
					if (err) {
						console.log('Error deleting entity');
					}
					console.log('Deleted!');
				}.bind(this));
			}
		};
	};
	var participantStorage = new ParticipantTableStorage();


	// Initialize a new socket.io application, named 'chat'
	var chat = io.of('/socket').on('connection', function (socket) {
		// When the client emits the 'load' event, reply with the 
		// number of people in this chat room
		socket.on('load',function(room){
			// Get clients count
			participantStorage.getCount(room, function(err, clientsCount){
				console.log('Someone loaded room ' + room + '. Already ' + clientsCount + ' participants.');
				socket.emit('peopleInChat', {number: clientsCount});
			}.bind(this));
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
			participantStorage.add({
				id: socket.id,
				username: socket.username,
				avatar: socket.avatar,
				room: socket.room
			});

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
				console.log('Participant ' + socket.username + ' leaved the room ' + socket.room);
				// Notify others in the chat room
				socket.to(socket.room).emit('participantLeaved', {
					room: socket.room,
					username: socket.username,
					avatar: socket.avatar
				});

				// Remove the client from store
				participantStorage.remove({
					id: socket.id,
					room: socket.room,
					username: socket.username,
					avatar: socket.avatar
				});

				// leave the room
				socket.leave(socket.room);
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
