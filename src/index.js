'use strict';
var Alexa = require('alexa-sdk');
var data = require('./data');
var appID = 'amzn1.ask.skill.6eb79e40-418c-4d22-8617-04048048d025';

// =====================================================================================================
// --------------------------------- Audiosear.ch API Setup ---------------------------------
// =====================================================================================================

// should move this to a .env and git ignore ... don't know how to do that right now
var MyData = {};
var Audiosearch = require('audiosearch-client-node');
var app_id = "1cd25a65f3590902e56dd4d4a398cdbb66cb807b4e81e0fc2172e4956af3a2ac";
var secret_key = "84aace8da93607e7d3098a0b13e479e0fb083f976a799f19cfd2fa0ab311c18f";
var audiosearch = new Audiosearch(app_id, secret_key);




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
      var title = this.attributes.currentEpisodeInfo.title;

      PlayEpisodeIntentHandler.call(this, title.substr(1, title.indexOf(':')));

    } else {
      this.emit(":tell", "Sorry, I couldn't play this episode. ");
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

  "ReadDescriptionIntent": function(){
    this.handler.state = states.DESCRIPTION;
    ReadDescriptionIntentHandler.call(this);
  },

  // handle "play episode" intent
  "PlayEpisodeIntent": function() {
    this.handler.state = states.STREAM_MODE;

    if(this.attributes.currentEpisodeInfo){
      var title = this.attributes.currentEpisodeInfo.title;
      console.log(title.substr(1, title.indexOf(':')));
      PlayEpisodeIntentHandler.call(title.substr(1, title.indexOf(':')));
    } else {
      this.emit(":tell", "Sorry, I couldn't play this episode. ");
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
  // handle "play episode" intent
  "PlayEpisodeIntent": function() {
    this.handler.state = states.STREAM_MODE;

    if(this.attributes.currentEpisodeInfo){
      var title = this.attributes.currentEpisodeInfo.title;
      PlayEpisodeIntentHandler.call(title.substr(1, title.indexOf(':')));
    } else {
      this.emit(":tell", "Sorry, I couldn't play this episode. ");
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


// function searchDatabase(dataset, searchQuery, searchType) {
//   var matchFound = false;
//   var results = [];
//
//   //beginning search
//   for (var i = 0; i < dataset.length; i++) {
//     if (searchQuery === dataset[i][searchType]) {
//       results.push(dataset[i]);
//       matchFound = true;
//     }
//     if ((i == dataset.length - 1) && (matchFound === false)) {
//       //this means that we are on the last record, and no match was found
//       matchFound = false;
//
//     }
//   }
//   return {
//     count: results.length,
//     results: results
//   };
// }


// =====================================================================================================
// --------------------------------- Section 3. Intent Handlers  ---------------------------------
// =====================================================================================================

function SearchByEpisodeNumberIntentHandler(){

  var episodeNumber = parseInt(this.event.request.intent.slots.episodeNumber.value);
  var that = this;

  audiosearch.searchEpisodes("show_id:27").then(function (results) {

    if (results.total_results !== 0) {

      Object.assign(that.attributes, {
        "STATE": states.DESCRIPTION,
        "currentEpisodeInfo": results.results[0]
        }
      );

      var speechOutput = "I found an episode called " +  that.attributes.currentEpisodeInfo.title + DESCRIPTION_STATE_HELP_MESSAGE;
      that.emit(":ask", speechOutput);

    } else {
      var output = "no results found";
      that.emit(":ask", output);
    }

  }
);
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
