'use strict';
var Alexa = require('alexa-sdk');

exports.handler = function(event, context, callback){
    var alexa = Alexa.handler(event, context, callback);
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
         this.emit('SayHello');
     },

    'SearchByEpisodeNumberIntent': function () {
        this.emit(':tell', 'Episode found!');
    }

};
