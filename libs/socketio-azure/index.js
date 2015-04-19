var azure = require('azure');
var msgpack = require('msgpack-js');
var Adapter = require('socket.io-adapter');

module.exports = adapter;

function adapter(opts) {

	var azureServiceBusSender = undefined;
	var azureServiceBusReceiver = undefined;
	opts = opts || {};
	
	opts.topic = opts.topic || 'default';
	opts.azureNsp = opts.azureNsp || undefined;
	opts.azureKey = opts.azureKey || undefined;
	opts.subscriptionId = opts.subscriptionId || 'auto' + Math.round((Math.random() * 1000000));
	opts.subscriptionId = opts.subscriptionId.substring(0, 30); // 50 == max length subscription id


	if (!(opts.azureNsp && opts.azureKey)) {
		azureServiceBusSender = azure.createServiceBusService();
		azureServiceBusReceiver = azure.createServiceBusService();
	} else {
		azureServiceBusSender = azure.createServiceBusService(opts.azureNsp, opts.azureKey);
		azureServiceBusReceiver = azure.createServiceBusService(opts.azureNsp, opts.azureKey);
	}

	console.log(process.pid + " - " + "Creating topic " + opts.topic);
	


	function AzureServiceBus(nsp) {
		console.log('Creating AzureServiceBus for nsp ' + nsp.name);
		var nspName = nsp.name.substring(1);
		if (nsp.name == '/') {
			nspName = 'nspNameDef';
		}
		this.subscriptionId = opts.subscriptionId + '_' + nspName;
		Adapter.call(this, nsp);

		azureServiceBusReceiver.listTopics(function(results){
			console.log(process.pid + " - " + 'listTopics: ' + JSON.stringify(arguments));
		});

		azureServiceBusReceiver.createTopicIfNotExists(opts.topic, function(err) {
			if (err) {
				console.log(process.pid + " - " + 'creatingTopicFailed: ' + JSON.stringify(err));

				throw err;
			}

			console.log(process.pid + " - " + "Topic created");
			console.log(process.pid + " - " + "Creating subscription");
			azureServiceBusReceiver.createSubscription(opts.topic, this.subscriptionId, function(err){
				if (err) {
					if (err.code != 409) {
						console.log(process.pid + " - " + 'Create Subscription failed: ' + JSON.stringify(err));

						throw err;
					}
					console.log(process.pid + " - " + 'Subscription already exists');					
				}
				console.log(process.pid + " - " + "Subscription ready");
				azureServiceBusReceiver.receiveSubscriptionMessage(opts.topic, this.subscriptionId, this.onmessage.bind(this));
			}.bind(this));
		}.bind(this));
	}

	/**
   	* Inherits from `Adapter`.
   	*/
  	AzureServiceBus.prototype.__proto__ = Adapter.prototype;

	/**
	* Called with a subscription message
	*
	* @api private
	*/
	AzureServiceBus.prototype.onmessage = function(err, receivedMessage) {
		if (err) {
			if (err !== 'No messages to receive') {
				console.log(process.pid + " - " + 'Error receiving message: ' + JSON.stringify(err));

				// throw err;
			}
			console.log(process.pid + " - " + err);
		}

		if (receivedMessage) {
			console.log(process.pid + " - " + 'Brut: ' + receivedMessage);
    		console.log(process.pid + " - " + 'JSON.parse: ' + msgpack.decode(receivedMessage));
		}

    	azureServiceBusReceiver.receiveSubscriptionMessage(opts.topic, this.subscriptionId, this.onmessage.bind(this));
		args.push(true);
		this.broadcast.apply(this, args);
	};

   /**
	* Broadcasts a packet.
	*
	* @param {Object} packet to emit
	* @param {Object} options
	* @param {Boolean} whether the packet came from another node
	* @api public
	*/
	AzureServiceBus.prototype.broadcast = function(packet, opt, remote) {
		Adapter.prototype.broadcast.call(this, packet, opt);

		if (!remote) {
			var message = {
				body: msgpack.encode([packet, opt])
				//body: 'test'
			};


			console.log(process.pid + " - " + 'sending message: ' + JSON.stringify(message));
			azureServiceBusSender.sendTopicMessage(opts.topic, JSON.stringify(message), function(err) {
				if (err) {
					console.log(process.pid + " - " + 'sendTopicMessage failed: ' + JSON.stringify(err));
					// throw err;
				} else {
					console.log(process.pid + " - " + 'sendTopicMessage succeed');
				}
			}.bind(this));
		}
	};

	return AzureServiceBus;
}