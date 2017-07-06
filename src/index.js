'use strict';
var Alexa = require('alexa-sdk');
var data = require('./data');


exports.handler = function(event, context, callback){
  var alexa = Alexa.handler(event, context, callback);
  alexa.registerHandlers(handlers, startSearchHandlers, descriptionHandlers);
  alexa.execute();
};

// =====================================================================================================
// --------------------------------- Section 1. Data and Text strings  ---------------------------------
// =====================================================================================================
//eventually move this to separate file?

var skillName = "Alexa This American Life Lookup";

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
  },

  "Unhandled": function() {
    this.emit(":ask", getGenericHelpMessage(data));
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

  //handle "read me the description" intent
  "ReadDescriptionIntent": function(){
    this.handler.state = states.DESCRIPTION;
    ReadDescriptionIntentHandler.call(this);
  },

  "Unhandled": function() {
    this.emit(":ask", getGenericHelpMessage(data));
  }
});


var descriptionHandlers = Alexa.CreateStateHandler(states.DESCRIPTION, {


  //handle "play episode" intent
  //handle "new search" intent
  "SearchByEpisodeNumberIntent": function() {
    SearchByEpisodeNumberIntentHandler.call(this);
  },

  "Unhandled": function(){
    this.emit(":ask", getGenericHelpMessage(data));
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

  var searchQuery = parseInt(this.event.request.intent.slots.episodeNumber.value);
  var searchType = "number";
  var searchResults = searchDatabase(data, searchQuery, searchType);

  if (searchResults.count > 0) {
    // assign episodenumber to object attributes attributes?
    Object.assign(this.attributes, {
      "STATE": states.DESCRIPTION,
      "currentEpisodeInfo": searchResults
    });

    var speechOutput = "I found a match for episode" + searchQuery + ", " + DESCRIPTION_STATE_HELP_MESSAGE;
    this.emit(":ask", speechOutput);

  } else {
    var output = "no results found";
    this.emit(":ask", output);
  }
}


function ReadDescriptionIntentHandler(){
  // get 'results' output to persist from the searchbyepisodenumberhandler
  console.log(this.attributes.currentEpisodeInfo);
  var description = this.attributes.currentEpisodeInfo.results[0].description;
  this.emit(":tell", description);
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
