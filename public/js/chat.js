// This file is executed in the browser, when people visit /chat/<random id>

$(function(){

	// getting the id of the room from the url
	var id = Number(window.location.pathname.match(/\/chat\/(\d+)$/)[1]);

	// connect to the socket
	var socket = io.connect('/socket');

	// variables which hold the data for each person
	var name = "",
		email = "",
		img = "";

	// cache some jQuery objects
	var section = $(".section"),
		footer = $("footer"),
		onConnect = $(".connected"),
		inviteSomebody = $(".invite-textfield"),
		personInside = $(".personinside"),
		chatScreen = $(".chatscreen"),
		left = $(".left"),
		noMessages = $(".nomessages"),
		tooManyPeople = $(".toomanypeople");

	// some more jquery objects
	var participantsCount = $(".participants-count"),
		leftNickname = $(".nickname-left"),
		loginForm = $(".loginForm"),
		yourName = $("#yourName"),
		yourEmail = $("#yourEmail"),
		hisName = $("#hisName"),
		hisEmail = $("#hisEmail"),
		chatForm = $("#chatform"),
		textarea = $("#message"),
		messageTimeSent = $(".timesent"),
		chats = $(".chats");

	// these variables hold images
	var ownerImage = $("#ownerImage"),
		leftImage = $("#leftImage"),
		noMessagesImage = $("#noMessagesImage");


	// on connection to server get the id of person's room
	socket.on('connect', function(){
		socket.emit('load', id);
	});

	// save the gravatar url
	socket.on('img', function(data){
		img = data;
	});

	// receive the names and avatars of all people in the chat room
	socket.on('peopleInChat', function(data){
		if(data.number === 0){
			showMessage("connected");

			loginForm.on('submit', function(e){
				e.preventDefault();
				name = $.trim(yourName.val());
				
				if(name.length < 1){
					alert("Please enter a nick name longer than 1 character!");
					return;
				}
				email = yourEmail.val();

				if(!isValid(email)) {
					alert("Please enter a valid email!");
				} else {
					showMessage("inviteSomebody");
					// call the server-side function 'login' and send user's parameters
					socket.emit('login', {user: name, avatar: email, id: id});
				}
			});

			return;
		}

		// Join already existing chat room
		showMessage("personInChat", data);
		loginForm.on('submit', function(e){
			e.preventDefault();

			name = $.trim(hisName.val());

			if(name.length < 1){
				alert("Please enter a nick name longer than 1 character!");
				return;
			}
			email = hisEmail.val();

			if(!isValid(email)){
				alert("Wrong e-mail format!");
			}else{
				socket.emit('login', {user: name, avatar: email, id: id});
				showMessage('chatStarted');
			}
		});
	});

	// Other useful
	socket.on('participantJoined', function(participant){
			console.log('participantJoined %o', participant);
			showMessage('chatStarted');
			createChatMessage("Joined the room", participant.username, participant.avatar, moment(), true);
	});

	socket.on('participantLeaved', function(participant){
		createChatMessage("Leaved the room", participant.username, participant.avatar, moment(), true);
	});

	socket.on('receive', function(data){
			showMessage('chatStarted');
			createChatMessage(data.msg, data.username, data.avatar, moment());
	});

	textarea.keypress(function(e){
		// Submit the form on enter
		if(e.which == 13) {
			e.preventDefault();
			chatForm.trigger('submit');
		}
	});

	chatForm.on('submit', function(e){
		e.preventDefault();

		// Create a new chat message and display it directly
		showMessage("chatStarted");

		createChatMessage(textarea.val(), name, img, moment());

		// Send the message to the other person in the chat
		socket.emit('msg', {msg: textarea.val(), username: name, avatar: img});

		// Empty the textarea
		textarea.val("");
	});

	// Update the relative time stamps on the chat messages every minute
	setInterval(function(){
		messageTimeSent.each(function(){
			var each = moment($(this).data('time'));
			$(this).text(each.fromNow());
		});

	}, 60000);

	// Function that creates a new chat message
	function createChatMessage(msg, user, imgg, now, auto){
		var who = '';

		auto = auto ? ' info' : '';

		if(user===name) {
			who = 'me';
		}
		else {
			who = 'you';
		}

		var li = $(
			'<li class="' + who + auto + '">'+
				'<div class="image">' +
					'<img src="' + imgg + '" />' +
					'<b></b>' +
					'<i class="timesent" data-time="' + now + '"></i> ' +
				'</div>' +
				'<p></p>' +
			'</li>');

		// use the 'text' method to escape malicious user input
		li.find('p').text(msg);
		li.find('b').text(user);

		chats.append(li);

		messageTimeSent = $(".timesent");
		messageTimeSent.last().text(now.fromNow());

		scrollToBottom();
	}

	function scrollToBottom(){
		$("html, body").animate({ scrollTop: $(document).height()-$(window).height() },1000);
	}

	function isValid(thatemail) {
		var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(thatemail);
	}

	function showMessage(status, data){
		if(status === "connected"){
			section.children().css('display', 'none');
			onConnect.fadeIn(600);
		}else if(status === "inviteSomebody"){
			// Set the invite link content
			$("#link").text(window.location.href);

			onConnect.fadeOut(600, function(){
				inviteSomebody.fadeIn(600);
			});
		}else if(status === "personInChat"){
			onConnect.css("display", "none");
			personInside.fadeIn(600);
			participantsCount.text(data.number);
		}else if(status === "chatStarted"){
			if (chatScreen.is('visible')) {
				return;
			}
			footer.fadeIn(600);
			section.children().css('display','none');
			chatScreen.css('display','block');
		}
	}

});
