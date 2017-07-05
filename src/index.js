'use strict';
var Alexa = require('alexa-sdk');

exports.handler = function(event, context, callback){
  var alexa = Alexa.handler(event, context, callback);
  alexa.registerHandlers(handlers);
  alexa.registerHandlers(startSearchHandlers);
  alexa.registerHandlers(descriptionHandlers);

  alexa.execute();
};

// =====================================================================================================
// --------------------------------- Section 1. Data and Text strings  ---------------------------------
// =====================================================================================================
var skillName = "Alexa This American Life Lookup";

var data = [
  { number: 2, title: 'Small Scale Sin', description: 'Small-scale stories on the nature of small-scale sin.', date: "1995-11-24" },
  { number: 3, title: 'Poultry Slam 1995', description: 'Stories decrying the wonders of turkeys, chickens, and other fowl.', date: "1995-12-01" },
];

var WELCOME_MESSAGE = "Welcome to the This American Life episode lookup skill. ";

var NEW_SEARCH_MESSAGE = getGenericHelpMessage(data);

var DESCRIPTION_STATE_HELP_MESSAGE = "Here are some things you can say: play episode, or tell me about the episode";

var SHUTDOWN_MESSAGE = "Ok.";


// =====================================================================================================
// --------------------------------- Section 2. States  ---------------------------------
// =====================================================================================================

var states = {
  SEARCHMODE: "_SEARCHMODE",
  DESCRIPTION: "_DESCRIPTION",
  // MULTIPLE_RESULTS: "_MULTIPLE_RESULTS"
};

var handlers = {
  'LaunchRequest': function () {
    this.handler.state = states.SEARCHMODE;
    this.emit(':ask', WELCOME_MESSAGE + getGenericHelpMessage(data));
  },

  "SearchByEpisodeNumberIntent": function() {
     SearchByEpisodeNumberIntentHandler.call(this);
  }

};

var startSearchHandlers = Alexa.CreateStateHandler(states.SEARCHMODE, {
  "AMAZON.YesIntent": function() {
    this.emit(":ask", NEW_SEARCH_MESSAGE, NEW_SEARCH_MESSAGE);
  },
  "AMAZON.NoIntent": function() {
    this.emit(":tell", SHUTDOWN_MESSAGE);
  },
  "AMAZON.RepeatIntent": function() {
    var output;
    if(this.attributes.lastSearch){
      output = this.attributes.lastSearch.lastSpeech;
      // console.log("repeating last speech");
    }
    else{
      output = getGenericHelpMessage(data);
      // console.log("no last speech availble. outputting standard help message.");
    }
    this.emit(":ask",output, output);
  },

  "SearchByEpisodeNumberIntent": function() {
    SearchByEpisodeNumberIntentHandler.call(this);
  },

  "Unhandled": function() {
    this.emit(":ask", getGenericHelpMessage(data));
  }
});


var descriptionHandlers = Alexa.CreateStateHandler(states.DESCRIPTION, {

  //handle "read me the description" intent
  "ReadDescriptionIntent": function(){
    ReadDescriptionIntentHandler.call(this);
  },
  //handle "play episode" intent
  //handle "new search" intent

  "Unhandled": function(){
    this.emit(":ask", getGenericHelpMessage(data));
  },

  "SearchByEpisodeNumberIntent": function() {
    SearchByEpisodeNumberIntentHandler.call(this);
  }

});


function searchDatabase(dataset, searchQuery, searchType) {
  var matchFound = false;
  var results = [];

  //beginning search
  for (var i = 0; i < dataset.length; i++) {
    if (searchQuery === dataset[i][searchType]) {
      results.push(dataset[i]);
      matchFound = true;
    }
    if ((i == dataset.length - 1) && (matchFound === false)) {
      //this means that we are on the last record, and no match was found
      matchFound = false;
      // console.log("no match was found using " + searchType);
      //if more than searchable items were provided, set searchType to the next item, and set i=0
      //ideally you want to start search with lastName, then firstname, and then cityName
    }
  }
  return {
    count: results.length,
    results: results
  };
}


// =====================================================================================================
// --------------------------------- Section 3. Intent Handlers  ---------------------------------
// =====================================================================================================

function SearchByEpisodeNumberIntentHandler(){

  var searchQuery = Number(this.event.request.intent.slots.episodeNumber.value);
  var searchType = "number";
  var searchResults = searchDatabase(data, searchQuery, searchType);

  if (searchResults.count > 0) { //one result found
    // var speechOutput = "I found a match for episode" + searchQuery + ", " + DESCRIPTION_STATE_HELP_MESSAGE;
    var speechOutput = "I found a match for episode";

    this.emit(":ask", speechOutput);

  } else {
    //no match found
    // console.log("no match found");
    // console.log("searchQuery was  = " + searchQuery);
    // console.log("searchResults.results was  = " + searchResults);
    var output = "no results found";
    this.emit(":ask", output);
  }
}


function ReadDescriptionIntentHandler(){
  this.handler.state = states.DESCRIPTION;
  this.emit(":tell", "this is the description");
}



// =====================================================================================================
// --------------------------------- Section 3. generate messages  ---------------------------------
// =====================================================================================================
function getGenericHelpMessage(data){
  var sentences = ["ask - play episode " + getRandomEpisodeNumber(1, data.length)];
  return "You can " + sentences;
}

// =====================================================================================================
// ------------------------------------ Section 4.  Functions  -----------------------------------
// =====================================================================================================

function getRandomEpisodeNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
