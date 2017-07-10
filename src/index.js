'use strict';
var Alexa = require('alexa-sdk');
var data = require('./data');
var appID = 'amzn1.ask.skill.6eb79e40-418c-4d22-8617-04048048d025';

// =====================================================================================================
// --------------------------------- Audiosear.ch API Setup ---------------------------------
// =====================================================================================================

// should move this to a .env and git ignore ... don't know how to do that right now
var Audiosearch = require('audiosearch-client-node');
var app_id = "1cd25a65f3590902e56dd4d4a398cdbb66cb807b4e81e0fc2172e4956af3a2ac";
var secret_key = "84aace8da93607e7d3098a0b13e479e0fb083f976a799f19cfd2fa0ab311c18f";
var audiosearch = new Audiosearch(app_id, secret_key);
var episodeKey = audiosearch.searchEpisodes("show_id:27").then(function (results) {
// console.log(results.total_results); //this is response length aka number of responses
// console.log(results.results[0].title); //this is the title of the first result
// console.log(results.results[0].description); //this is the title of the first result
  return results;
});


exports.handler = function(event, context, callback){
  var alexa = Alexa.handler(event, context, callback);
  alexa.registerHandlers(handlers, startSearchHandlers, descriptionHandlers, streamModeHandlers);
  alexa.execute();
};

// =====================================================================================================
// --------------------------------- Section 1. Data and Text strings  ---------------------------------
// =====================================================================================================

var skillName = "Alexa This American Life Lookup";

var WELCOME_MESSAGE = "Welcome to the This American Life episode lookup skill. ";

var NEW_SEARCH_MESSAGE = getGenericHelpMessage(data);

var DESCRIPTION_STATE_HELP_MESSAGE = "Here are some things you can say: find episode, or tell me about the episode";

var SHUTDOWN_MESSAGE = "Ok.";


// =====================================================================================================
// --------------------------------- Section 2. States  ---------------------------------
// =====================================================================================================

var states = {
  SEARCHMODE: "_SEARCHMODE",
  DESCRIPTION: "_DESCRIPTION",
  STREAM_MODE: "_STREAM_MODE"
};

var handlers = {
  'LaunchRequest': function () {
    this.handler.state = states.SEARCHMODE;
    this.emit(':ask', WELCOME_MESSAGE + getGenericHelpMessage(data));
  },

  "SearchByEpisodeNumberIntent": function() {
     SearchByEpisodeNumberIntentHandler.call(this);
  },

  "PlayEpisodeIntent": function() {
    this.handler.state = states.STREAM_MODE;

    if(this.attributes.currentEpisodeInfo){
      PlayEpisodeIntentHandler.call(this, this.attributes.results[0].number);
    } else {
      PlayEpisodeIntentHandler.call(this, data.length);
    }
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
    if(this.attributes.currentEpisodeInfo){
      SearchByEpisodeNumberIntentHandler.call(this.attributes.results[0].number);
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

  // handle "play episode" intent
  "PlayEpisodeIntent": function() {
    this.handler.state = states.STREAM_MODE;

    if(this.attributes.currentEpisodeInfo){
      PlayEpisodeIntentHandler.call(this.attributes.results[0].number);
    } else {
      PlayEpisodeIntentHandler.call(data.length);
    }
  },

  //handle "new search" intent
  "SearchByEpisodeNumberIntent": function() {
    SearchByEpisodeNumberIntentHandler.call(this);
  },

  "AMAZON.RepeatIntent": function() {
    var output;
    if(this.attributes.currentEpisodeInfo.description){
      output = this.attributes.currentEpisodeInfo.description;
      // console.log("repeating last speech");
    }
    else{
      output = "I can't recall what I said before" + getGenericHelpMessage(data);
      // console.log("no last speech availble. outputting standard help message.");
    }
    this.emit(":ask",output, output);
  },

  "Unhandled": function(){
    this.emit(":ask", "Sorry, I don't understand that request. " + getGenericHelpMessage(data));
  }

});

var streamModeHandlers = Alexa.CreateStateHandler(states.STREAM_MODE, {
  "PlayEpisodeIntent": function() {

    if(this.attributes.currentEpisodeInfo){
      PlayEpisodeIntentHandler.call(this.attributes.results[0].number);
    } else {
      PlayEpisodeIntentHandler.call(data.length);
    }
  },

  "AMAZON.PauseIntent": function(){

  },

  "AMAZON.ResumeIntent": function(){

  },

  "Unhandled": function(){
    this.emit(":ask", "Sorry, I couldn't stream this episode." + getGenericHelpMessage(data));
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

// old intent handler using database
// function SearchByEpisodeNumberIntentHandler(){
//
//   var searchQuery = parseInt(this.event.request.intent.slots.episodeNumber.value);
//   var searchType = "number";
//   var searchResults = searchDatabase(data, searchQuery, searchType);
//
//   if (searchResults.count > 0) {
//     // assign episodenumber to object attributes attributes?
//     Object.assign(this.attributes, {
//       "STATE": states.DESCRIPTION,
//       "currentEpisodeInfo": searchResults
//     });
//
//     var speechOutput = "I found a match for episode" + searchQuery + ", " + DESCRIPTION_STATE_HELP_MESSAGE;
//     this.emit(":ask", speechOutput);
//
//   } else {
//     var output = "no results found";
//     this.emit(":ask", output);
//   }
// }

function SearchByEpisodeNumberIntentHandler(){

  var episodeNumber = parseInt(this.event.request.intent.slots.episodeNumber.value);
  var episodeInfo = findEpisodeInKey(episodeNumber);


  if (episodeInfo !== false) {
    // assign episodenumber to object attributes attributes?
    Object.assign(this.attributes, {
      "STATE": states.DESCRIPTION,
      "currentEpisodeInfo": episodeInfo
    });

    var speechOutput = "I found a match for episode" + episodeNumber + ", " + DESCRIPTION_STATE_HELP_MESSAGE;
    this.emit(":ask", speechOutput);

  } else {
    var output = "no results found";
    this.emit(":ask", output);
  }

}




function ReadDescriptionIntentHandler(){
  // get 'results' output to persist from the searchbyepisodenumberhandler
  // console.log(this.attributes.currentEpisodeInfo);
  var description = this.attributes.currentEpisodeInfo.description;
  this.emit(":tell", description);
}


function PlayEpisodeIntentHandler(podcast){
    var playBehavior = 'REPLACE_ALL';
    console.log(podcast);
    var podcastUrl = generatePodcastUrl(podcast);
    console.log(podcastUrl);
    var token = "12345";
    var offsetInMilliseconds = 0;

    this.response.audioPlayerPlay(playBehavior, podcastUrl, token, null, offsetInMilliseconds);
    this.emit(':responseReady');

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

function generatePodcastUrl(episodeNumber) {
  if (parseInt(episodeNumber) <= 536){
    return "https://audio.thisamericanlife.org/jomamashouse/ismymamashouse/" + episodeNumber + ".mp3";
  }
  else {
    return "https://audio.thisamericanlife.org/podcast/" + episodeNumber + ".mp3";
  }
}

function findEpisodeInKey(episodeNumber){

  for(var i=0; i < episodeKey.total_results; i++){
    if(episodeKey.results[i].title.includes(episodeNumber.toString())){
      var episodeInfo = {};
      episodeInfo.title = episodeKey.results[i].title;
      episodeInfo.description = episodeKey.results[i].description;
      episodeInfo.id = episodeKey.results[i].id;
      return episodeInfo;
    } else {
      return false;
    }

  }

}
