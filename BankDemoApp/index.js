'use strict';

let builder = require('botbuilder');
let botbuilder_azure = require('botbuilder-azure');
let path = require('path');
let WeDeploy = require('wedeploy')
const http = require('http')

let useEmulator = (process.env.NODE_ENV === 'development');
useEmulator = false

let connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

let luisModelUrl = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/7e6da1ba-8ab7-4a42-9564-be552f61e497?subscription-key=f1497b363d484310830cf4fb46e71472'

let bot = new builder.UniversalBot(connector, session =>
    session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.' + luisModelUrl, session.message.text)
);

bot.localePath(path.join(__dirname, './locale'));

let recognizer = new builder.LuisRecognizer(luisModelUrl);
bot.recognizer(recognizer);

let debug = function(message) {
    if (true) {
        session.send('[DEBUG] ' + message)
    }
}

bot.dialog('Nothing', (session, args) => {
    session.send('I couldn\'t understand anything :(');
}).triggerAction({
    matches: 'Nothing'
});

bot.dialog('Communication.Hello', [(session, args, next) => {
    session.send('Hi!');
    builder.Prompts.text(session, 'What is your name?');
},(session, args) => {
    session.send(`Hola ${args.response}!`);
}]).triggerAction({
    matches: 'Communication.Hello'
});

bot.dialog('Accounts', [(session, args, next) => {

    let entity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Account');
    if (entity == null) {
        builder.Prompts.text(session, 'Sure, which account do you want to see?');
        session.send('Mortgage, Savings, or Credit')
        //session.send('Captured entity: ' + JSON.stringify(entity));
    } else {
        session.dialogData.entityName = entity.entity
        next()
    }
}, (session, args) => { 
    
    let entityName = args.response || session.dialogData.entityName
    
    session.send(`Sure, here’s your ${entityName} account.`);
     WeDeploy
        .data('http://data.demoform.wedeploy.io')
        .create('data', {name: 'Accounts', entity: entityName})
        .then(x => session.send('Request sent: ' + JSON.stringify(x))
     )
     .catch(err => session.send('I couldn\'t send the information to wedeploy :(: ' + err));
    
}]).triggerAction({
    matches: 'Accounts'
});

bot.dialog('New Account', [(session, args, next) => {
    
    session.send('Sure, let’s set that up.')

    let entity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Account');
    if (entity == null) {
        builder.Prompts.text(session, 'What account do you want to create?');
        session.send('Mortgage, Savings, or Credit')
        //session.send('Captured entity: ' + JSON.stringify(entity));
    } else {
        session.dialogData.entityName = entity.entity
        next()
    }
    
}, (session, args) => {
    
   let entityName = args.response || session.dialogData.entityName
   session.send(`Sure, let’s create a new ${entityName} account.`);
   session.send('But first we need some information...')
    
    WeDeploy
        .data('http://data.demoform.wedeploy.io')
        .create('data', {name: 'New Account', entity: entityName})
        .then(x => session.send('Request sent: ' + JSON.stringify(x)))
        .catch(err =>  session.send('I couldn\'t send the information to wedeploy :(: ' + JSON.stringify(err)));
}
]).triggerAction({
    matches: 'New Account'
});

if (useEmulator) {
    let restify = require('restify');
    let server = restify.createServer();
    server.listen(3978, function () {
        debug('test bot endpoint at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());
} else {
    module.exports = {default: connector.listen()}
}