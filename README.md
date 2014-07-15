# Azure JS Chat

## Description

NodeJS & SocketIO smaple application running on Azure Web Sites.

The repository is organized by branches to see how to get from a local application to a scalable and highly available one :

 * _local_: the running application on a non-auto-scalable server

 * _azure-servicebus_: the same application ready for Azure Web Sites and using Azure Service Bus as a socket.io adapter. _Note_
 For now, this implementation is not finished due to a bug waiting for a fix: https://github.com/Azure/azure-sdk-for-node/issues/1255

 * _azure-redis_: the same application working on the Cloud through the Redis Cache Service as a socket.io-adapter and based on Azure
 Table Storage Service for data storage synchronization.

 * _master_: identical to azure-redis


Additionnal informations available here: http://www.slideshare.net/stephaneesc/nodejs-socket-io-on-microsoft-azure-cloud-web-sites

## Installation

### Running the application locally

 1- Clone the project: `git clone https://github.com/brainsonic/AzureJSChat.git`

 2- Install NodeJS: http://nodejs.org/

 3- Checkout the local branch: `~/project/AzureJSChat/ $> git checkout local`

 4- Install dependencies: `~/project/AzureJSChat/ $> npm install`

 5- Run the server: `~/project/AzureJSChat/ $> node app.js`

 6- Open you favorite browser, and go to http://localhost:8080

### Running the application on Azure Web Sites

To run the application on the Azure Web Sites service, you should first of all create a Redis or Service Bus from the Azure Portal.

You then have to define as environment variables the following informations (using the Redis branch for example):

 * Redis host: `azure site appsetting add REDIS_HOST=your\_key\_here`

 * Redis port: `azure site appsetting add REDIS_PORT=6379`

 * Redis host: `azure site appsetting add REDIS_AUTH=your\_key\_here`

 * Storage account: `azure site appsetting add AZURE_STORAGE_ACCOUNT=you\_account\_here`

 * Storage key: `azure site appsetting add AZURE_STORAGE_ACCESS_KEY=you\_key\_here`

Finally, you just have to push the branch on your Web Sites, and it works:
`git push azure master`

### Running the application locally using Azure services

Usefull to simulate the "multi-instances" and dynamic scalability behavior.

 1- Deploy your application on Azure Web Sites (optionnal)

 2- Export the same variables as above into your environment. For example on a UNIX based system, run:

 ```bash
 
 export REDIS_HOST=your\_host\_here

 export REDIS_PORT=6379

 export REDIS_AUTH_PASS=your\_key\_here

 export AZURE_STORAGE_ACCOUNT=your\_account\_here

 export AZURE_STORAGE_ACCESS_KEY=your\_key\_here
 
 ```


 3- Run the local server: `~/project/AzureJSChat/ $> node app.js`

 4- Open you favorite browser, and go to http://localhost:8080

