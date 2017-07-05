'use strict';
var Alexa = require('alexa-sdk');

exports.handler = function(event, context, callback){
    var alexa = Alexa.handler(event, context, callback);
    alexa.registerHandlers(handlers);
    alexa.execute();
};

// =====================================================================================================
// --------------------------------- Section 1. Data and Text strings  ---------------------------------
// =====================================================================================================
var skillName = "Alexa This American Life Lookup";

var WELCOME_MESSAGE = "Welcome to the This American Life episode lookup skill.";

var data = [
  { number: 2, title: 'Small Scale Sin', description: 'Small-scale stories on the nature of small-scale sin.', date: "1995-11-24" },
  { number: 3, title: 'Poultry Slam 1995', description: 'Stories decrying the wonders of turkeys, chickens, and other fowl.', date: "1995-12-01" },
];


// =====================================================================================================
// --------------------------------- Section 2. Handlers  ---------------------------------
// =====================================================================================================

var handlers = {
    'LaunchRequest': function () {
         this.emit(':ask', WELCOME_MESSAGE + getGenericHelpMessage(data));
     },

    'SearchByEpisodeNumberIntent': function () {
        this.emit(':tell', 'Episode found!');
    }

};

// =====================================================================================================
// --------------------------------- Section 3. generate messages  ---------------------------------
// =====================================================================================================
function getGenericHelpMessage(data){
  var sentences = ["ask - play episode" + getRandomEpisodeNumber(1, 500)];
  return "You can " + sentences;
}

// =====================================================================================================
// ------------------------------------ Section 4. Helper Functions  -----------------------------------
// =====================================================================================================

function getRandomEpisodeNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
