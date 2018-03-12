/*-----------------------------------------------------------------------------
This template demonstrates how to use an IntentDialog with a LuisRecognizer to add 
natural language support to a bot. 
For a complete walkthrough of creating this type of bot see the article at
https://aka.ms/abs-node-luis
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var path = require('path');
const WeDeploy = require('wedeploy')

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';


const luisModelUrl = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/85f85c99-b87c-477b-8a9c-34c5ff400868?subscription-key=f1497b363d484310830cf4fb46e71472&timezoneOffset=0&verbose=true&q='

let bot = new builder.UniversalBot(connector, session => {
    session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.', session.message.text)
    session.send('I\'m still in progress!');
}
);

bot.localePath(path.join(__dirname, './locale'));

let recognizer = new builder.LuisRecognizer(luisModelUrl);
bot.recognizer(recognizer);

bot.dialog('None', (session, args) => {
    session.send('I couldn\'t understand anything :('+ JSON.stringify(args.intent));
}).triggerAction({
    matches: 'None'
});

bot.dialog('GREETINGS', (session, args) => {
    session.send('GREETINGS!'+ JSON.stringify(args.intent));
}).triggerAction({
    matches: 'GREETINGS'
});

bot.dialog('NEXT_TALKS', [(session, args, next) => {

    session.send('Do you want the next talks?' 
    //+ JSON.stringify(args.intent)
    );
    
    WeDeploy
	.data('http://talks.techtalkes.wedeploy.io/')
	.get('talks')
	.then(function(movies) {
	  session.send(JSON.stringify(movies))
	}).catch(err => session.send(JSON.stringify(err)))

    /*let entity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Account');
    if (entity == null) {
        builder.Prompts.text(session, 'Sure, which account do you want to see?');
        session.send('Mortgage, Savings, or Credit')
        //session.send('Captured entity: ' + JSON.stringify(entity));
    } else {
        session.dialogData.entityName = entity.entity
        next()
    }*/
}, (session, args) => { 
    
    /*let entityName = args.response || session.dialogData.entityName
    
    session.send(`Sure, here’s your ${entityName} account.`);
     WeDeploy
        .data('http://data.demoform.wedeploy.io')
        .create('data', {name: 'Accounts', entity: entityName})
        .then(x => session.send('Request sent: ' + JSON.stringify(x))
     )
     .catch(err => session.send('I couldn\'t send the information to wedeploy :(: ' + err));
    */
}]).triggerAction({
    matches: 'NEXT_TALKS'
});

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}

