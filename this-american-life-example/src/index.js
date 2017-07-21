'use strict';

var Alexa = require('alexa-sdk');
var sizeof = require('object-sizeof');


require('dotenv').config();

Alexa.appId = 'amzn1.ask.skill.6eb79e40-418c-4d22-8617-04048048d025';


exports.handler = function(event, context, callback){
  var alexa = Alexa.handler(event, context, callback);
  alexa.registerHandlers(launchHandlers, startSearchHandlers, descriptionHandlers, streamModeHandlers, multipleResultsHandlers);
  alexa.execute();
};

// =====================================================================================================
// --------------------------------- Audiosear.ch API Setup --------------------------------------------
// =====================================================================================================

var Audiosearch = require('audiosearch-client-node');
var app_id = process.env.APP_ID;
var secret_key =  process.env.SECRET_KEY;
var audiosearch = new Audiosearch(app_id, secret_key);

// =====================================================================================================
// --------------------------------- Section 1. Data and Text strings  ---------------------------------
// =====================================================================================================

var skillName = "Alexa This American Life Lookup";

var WELCOME_MESSAGE = "Welcome to the This American Life episode lookup skill. ";
var HELP_MESSAGE = SEARCH_MODE_HELP_MESSAGE + "For example, 'Find an episode about economics'." + "You can also say 'New Session' to start a new search.";

var DESCRIPTION_MODE_HELP_MESSAGE = "Here are some things you can say: 'play this episode', or 'description'";
var SEARCH_MODE_HELP_MESSAGE = "You can find episodes by episode number, topic, or date published";
var STREAM_MODE_HELP_MESSAGE = "";
var MULTIPLE_RESULTS_MODE_HELP_MESSAGE = "You can say 'Next Result' to get the next search result, or " + NEW_SEARCH_MESSAGE;
var END_SESSION_MESSAGE = "'End Session' to exit";

var SHUTDOWN_MESSAGE = "Ok.";
var UNHANDELED_MESSAGE = "I'm not sure what that means, ";


var NEW_SEARCH_MESSAGE = "You can say 'New Session' to start a new search";

// =====================================================================================================
// --------------------------------- Section 2. States  ------------------------------------------------
// =====================================================================================================

var states = {
  SEARCH_MODE: "_SEARCH_MODE",
  DESCRIPTION: "_DESCRIPTION",
  STREAM_MODE: "_STREAM_MODE",
  MULTIPLE_RESULTS_MODE: "_MULTIPLE_RESULTS_MODE"
};

var launchHandlers = {
  'LaunchRequest': function () {
    this.emit(':ask', WELCOME_MESSAGE + SEARCH_MODE_HELP_MESSAGE);

  },

  "SearchByEpisodeNumberIntent": function() {
    this.handler.state = states.SEARCH_MODE;
    SearchByEpisodeNumberIntentHandler.call(this);
  },


  "PlayEpisodeIntent": function() {
    this.handler.state = states.STREAM_MODE;

    if(this.attributes.currentEpisodeInfo){
      var title = generateTALTitle(this.attributes.currentEpisodeInfo.title);
      PlayEpisodeIntentHandler.call(this, title);

    } else {
      this.emit(":ask", "You haven't specified an episode" + SEARCH_MODE_HELP_MESSAGE);
    }
  },

  "SearchByTopicIntent": function(){
    this.handler.state = states.SEARCH_MODE;
    SearchByTopicIntentHandler.call(this);
  },

  "Unhandled": function() {
    this.response.audioPlayerStop();
    this.response.speak("Audio stopped.");
    this.emit(':responseReady');

  },

  "SearchByDateCreatedIntent": function(){
    SearchByDateCreatedIntentHandler.call(this);
  },

  'EndSessionIntent': function(){
    EndSessionIntentHandler.call(this);
  },

  "NewSessionIntent": function(){
    NewSessionIntentHandler.call(this);
  },

  'AMAZON.HelpIntent': function () {
    this.emit(":ask", HELP_MESSAGE);
  },

  'AMAZON.StopIntent': function () {
    EndSessionIntentHandler.call(this);
  }

};

var startSearchHandlers = Alexa.CreateStateHandler(states.SEARCH_MODE, {

  ///////////// custom intents //////////////
  "NewSessionIntent": function(){
    NewSessionIntentHandler.call(this);
  },

  "SearchByDateCreatedIntent": function(){
    SearchByDateCreatedIntentHandler.call(this);
  },

  "SearchByEpisodeNumberIntent": function() {
    SearchByEpisodeNumberIntentHandler.call(this);
  },

  //handle "read me the description" intent
  "ReadDescriptionIntent": function(){
    this.handler.state = states.DESCRIPTION;
    ReadDescriptionIntentHandler.call(this);
  },

  "SearchByTopicIntent": function(){
    SearchByTopicIntentHandler.call(this);
  },

  "Unhandled": function() {
    this.emit(":ask", UNHANDELED_MESSAGE + NEW_SEARCH_MESSAGE + "or" + END_SESSION_MESSAGE);
  },

  "PlayEpisodeIntent": function(){
    this.handler.state = states.STREAM_MODE;

    if(this.attributes.currentEpisodeInfo){
      var title = generateTALTitle(this.attributes.currentEpisodeInfo.title);
      PlayEpisodeIntentHandler.call(this, title);
    } else {
      this.emit(":tell", "Sorry, I couldn't play this episode. " + SEARCH_MODE_HELP_MESSAGE);
    }
  },


  'AMAZON.HelpIntent': function () {
    this.emit(":ask", HELP_MESSAGE);
  },

  'AMAZON.StopIntent': function () {
    EndSessionIntentHandler.call(this);
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
        var title = generateTALTitle(this.attributes.currentEpisodeInfo.title);
        PlayEpisodeIntentHandler.call(this, title);
      } else {
        this.emit(":tell", "Sorry, you have to search for an episode first before playing it.");
      }
    },

    "NewSessionIntent": function(){
      this.handler.state = states.SEARCH_MODE;
      NewSessionIntentHandler.call(this);
    },

    'EndSessionIntent': function(){
      EndSessionIntentHandler.call(this);
    },


    "AMAZON.RepeatIntent": function() {
      var output;
      if(this.attributes.currentEpisodeInfo.description){
        output = this.attributes.currentEpisodeInfo.description;
      }
      else {
        output = "I can't recall what I said before. " + DESCRIPTION_MODE_HELP_MESSAGE;
      }
      this.emit(":ask", output);
    },

    "Unhandled": function(){
      this.emit(":ask", "Sorry, I don't understand that request. " + DESCRIPTION_MODE_HELP_MESSAGE + 'or' + END_SESSION_MESSAGE);
    },

    'AMAZON.HelpIntent': function () {
      this.emit(":ask", DESCRIPTION_MODE_HELP_MESSAGE);
    },

    'AMAZON.StopIntent': function () {
      EndSessionIntentHandler.call(this);
    }

  });

  var streamModeHandlers = Alexa.CreateStateHandler(states.STREAM_MODE, {

    "PlayEpisodeIntent": function() {
      this.handler.state = states.STREAM_MODE;
      if(this.attributes.currentEpisodeInfo){
        var title = generateTALTitle(this.attributes.currentEpisodeInfo.title);
        PlayEpisodeIntentHandler.call(this, title);
      } else {
        this.emit(":tell", "Sorry, I couldn't play this episode. ");
      }
    },

    'AMAZON.PauseIntent' : function () {
     this.response.audioPlayerStop();
     this.response.speak('Paused. See you next time!');
     this.emit(':responseReady');
    },



    // "AMAZON.ResumeIntent": function(){
    //   this.response.audioPlayerPlay();
    //   this.response.speak('Resuming episode.');
    //   this.emit(':responseReady');
    // },

    "AMAZON.StartOverIntent": function(){
      var title = generateTALTitle(this.attributes.currentEpisodeInfo.title);
      PlayEpisodeIntentHandler.call(this, title);
    },

    "Unhandled": function(){
      this.emit(":ask", "Sorry, I couldn't stream this episode. " + NEW_SEARCH_MESSAGE + ' or ' + END_SESSION_MESSAGE);
    },

    "NewSessionIntent": function(){
      this.handler.state = states.SEARCH_MODE;
      NewSessionIntentHandler.call(this);
    },


    "ReadDescriptionIntent": function(){
      this.handler.state = states.DESCRIPTION;
      ReadDescriptionIntentHandler.call(this);
    },

    'EndSessionIntent': function(){
      EndSessionIntentHandler.call(this);
    },

    'NextResultIntent': function(){
      if (this.attributes.searchQuery !== undefined){
      SearchByTopicIntentHandler.call(this);
    } else {
      this.emit(":tell", "Sorry, the next episode functionality is only available after you search by a topic." + NEW_SEARCH_MESSAGE);
      }
    },

    'AMAZON.HelpIntent': function () {
      this.emit(":ask", HELP_MESSAGE);
    },

    'AMAZON.StopIntent': function () {
      EndSessionIntentHandler.call(this);
    }

  });

  var multipleResultsHandlers = Alexa.CreateStateHandler(states.MULTIPLE_RESULTS_MODE, {
    "NextResultIntent": function(){
      SearchByTopicIntentHandler.call(this);
    },

    "ReadDescriptionIntent": function(){
      ReadDescriptionIntentHandler.call(this);
    },

    "Unhandled": function(){
      this.emit(":ask", UNHANDELED_MESSAGE + "You can say 'Description', 'Play This Episode', 'Next Result, or 'End Session' to quit.'");
    },

    "NewSessionIntent": function(){
      this.handler.state = states.SEARCH_MODE;

      Object.assign(this.attributes, {
        "onResult": undefined
      });

      NewSessionIntentHandler.call(this);

    },

    "PlayEpisodeIntent": function(){
      this.handler.state = states.STREAM_MODE;
      var title = generateTALTitle(this.attributes.currentEpisodeInfo.title);
      PlayEpisodeIntentHandler.call(this, title);
    },

    'EndSessionIntent': function(){
      EndSessionIntentHandler.call(this);
    },

    'AMAZON.HelpIntent': function () {
      this.emit(":ask", MULTIPLE_RESULTS_MODE_HELP_MESSAGE);
    },

    'AMAZON.StopIntent': function () {
      EndSessionIntentHandler.call(this);
    }



  });

  // =====================================================================================================
  // --------------------------------- Section 3. Intent Handlers  ---------------------------------------
  // =====================================================================================================

  function SearchByEpisodeNumberIntentHandler(){
    var episodeNumber = this.event.request.intent.slots.episodeNumber.value;
    var query = "title:" + episodeNumber;
    var that = this;

    audiosearch.searchEpisodes(query, {"filters[show_id]":27}).then(function (results) {
      if (results.total_results !== 0) {
        Object.assign(that.attributes, {
          "STATE": states.DESCRIPTION,
          "currentEpisodeInfo": results.results[0]
        }
      );
      var speechOutput = "I found an episode called " +  that.attributes.currentEpisodeInfo.title + ". " + DESCRIPTION_MODE_HELP_MESSAGE;
      that.emit(":ask", speechOutput);
    } else {
      var output = "no results found";
      that.emit(":ask", output);
    }
  });
}

function SearchByTopicIntentHandler(){
  this.handler.state = states.MULTIPLE_RESULTS_MODE;

  if(this.attributes.searchQuery === undefined){
    // do this when this is the first search
    var searchTopic = this.event.request.intent.slots.searchTopic;

    Object.assign(this.attributes, {
      "searchQuery": searchTopic
    });
  } else {
    // do this when there is an existing searchQuery in the attributes
    // nothing because there is already a searchTopic attribute
  }

  if(this.attributes.onResult !== undefined){
    // do this when this is NOT the first search
    var count = this.attributes.onResult + 1;
    Object.assign(this.attributes, {
      "onResult": count
    });
  } else {
    // do this when this is the first search
    Object.assign(this.attributes, {
      "onResult": 1
    });
  }
  var that = this;

  audiosearch.searchEpisodes(that.attributes.searchQuery.value, {"filters[show_id]":27, "size":1, "from":that.attributes.onResult}).then(function (results) {

    if (results.total_results !== 0 && sizeof(results.results[0]) < 24000){
      Object.assign(that.attributes, {
        "STATE": states.MULTIPLE_RESULTS_MODE,
        "currentEpisodeInfo": results.results[0],
      }
    );
    var speechOutput = generateResultSpeechOutput(that.attributes.currentEpisodeInfo.title);
    that.emit(":ask", speechOutput);

  } else if (results.total_results !== 0 && sizeof(results.results[0]) >= 24000){

      that.emit(":tell", "sorry, this search was too broad. Please say 'new session' to search for a narrower topic");

    } else {

      var output = "Sorry, I couldn't find an episode on that topic. " + NEW_SEARCH_MESSAGE;
      that.emit(":ask", output);
    }
  });
}

function ReadDescriptionIntentHandler(){
  var description = this.attributes.currentEpisodeInfo.description;
  var speechOutput = generateSSMLOutput(description);
  this.emit(":tell", speechOutput);
}

function PlayEpisodeIntentHandler(podcast){
  this.handler.state = states.STREAM_MODE;

  if (parseInt(podcast) >= 537){
    this.emit(":ask", "sorry, episode before five hundred thirty seven aren't available for streaming. " + NEW_SEARCH_MESSAGE);
  } else {

    var playBehavior = 'REPLACE_ALL';
    var podcastUrl = generatePodcastUrl(podcast);
    var token = "0";
    var offsetInMilliseconds = 0;

    this.response.audioPlayerPlay(playBehavior, podcastUrl, token, null, offsetInMilliseconds);

    Object.assign(this.attributes, {
      "shouldEndSession": false
    });

    this.emit(':responseReady');

  }
}

function EndSessionIntentHandler(){

  Object.assign(this.attributes, {
    "shouldEndSession": true
  });
  this.emit(':tell', SHUTDOWN_MESSAGE);
}

function NewSessionIntentHandler(){

  Object.assign(this.attributes, {
    "currentEpisodeInfo": {}
  });
  this.emit(":ask", "You've started a new session. " +  SEARCH_MODE_HELP_MESSAGE);

}

function SearchByDateCreatedIntentHandler(){
  this.handler.state = states.SEARCH_MODE;
  var searchDate;

  // this handles if the return is a week of the year
  var userDateInput = this.event.request.intent.slots.dateCreated.value;

  if (userDateInput.includes("W") === true){
    var wk = Number(userDateInput.slice(-2));
    var yr = Number(userDateInput.substring(0,4));
    searchDate = String(getDateOfWeek(wk, yr));

    Object.assign(this.attributes, {
      "dateQuery": searchDate
    });

  } else {
     searchDate = this.event.request.intent.slots.dateCreated.value;
     Object.assign(this.attributes, {
       "dateQuery": searchDate
     });
  }

  var query = "date_created:" + closestSundayBefore(this.attributes.dateQuery);
  var that = this;

  audiosearch.searchEpisodes(query, {"filters[show_id]":27}).then(function (results) {
    if (results.total_results === 0) {
      var query = "date_created:" + closestMondayAfter(that.attributes.dateQuery);
      audiosearch.searchEpisodes(query,{"filters[show_id]":27}).then(function (results) {
        if (results.total_results !== 0){
          Object.assign(that.attributes, {
            "currentEpisodeInfo": results.results[0],
          }
        );
        var speechOutput = generateResultSpeechOutput(that.attributes.currentEpisodeInfo.title);
        that.emit(":ask", speechOutput);

      } else {
        var output = "Sorry, I couldn't find an episode based on that date. " + NEW_SEARCH_MESSAGE;
        that.emit(":ask", output);
      }
    });

  } else {
    Object.assign(that.attributes, {
      "currentEpisodeInfo": results.results[0],
      }
    );

    var speechOutput = generateResultSpeechOutput(that.attributes.currentEpisodeInfo.title);
    that.emit(":ask", speechOutput);

    }
  });
}
// =====================================================================================================
// ------------------------------------ Section 3.  Helper Functions  ----------------------------------
// =====================================================================================================

function getRandomEpisodeNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function generatePodcastUrl(episodeNumber) {
  if (parseInt(episodeNumber) <= 536){
    return "https://audio.thisamericanlife.org/jomamashouse/ismymamashouse/" + episodeNumber + ".mp3";
  }
  else {
    // return "https://audio.thisamericanlife.org/podcast/" + episodeNumber + ".mp3";
    // return "https://assets.thisamericanlife.co/podcasts/" + episodeNumber + ".mp3";
    // return "https://www.thisamericanlife.org/play_full.php?play=" + episodeNumber;

  }
}

function closestSundayBefore(dateQuery) {
  var d = new Date(dateQuery);

  if (d.getDay() !== 0){
    d.setDate(d.getDate() - (d.getDay() + 6) % 7);
    // minus 1 gets the sunday
    var sunday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
    return formatDate(sunday);
  } else {
    return formatDate(d);
  }
}

function closestMondayAfter(dateQuery) {
  var d = new Date(dateQuery);

  if (d.getDay() !== 1){
    d.setDate(d.getDate() - (d.getDay() + 6) % 7);
    // plus 7 gets the monday week before
    var monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7);
    return formatDate(monday);
  } else {
    return formatDate(d);
  }
}

function closestMondayBefore(dateQuery) {
  var d = new Date(dateQuery);

  if (d.getDay() !== 1){
    d.setDate(d.getDate() - (d.getDay() + 6) % 7);
    // plus 7 gets the monday week before
    var monday = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return formatDate(monday);
  } else {
    return formatDate(d);
  }
}

// this is going to always return sunday
function getDateOfWeek(w, y) {
    var d = (1 + (w - 1) * 7);
    return formatDate(new Date(y, 0, d));
}

function formatDate(date) {
  var d = new Date(date),
  month = '' + (d.getMonth() + 1),
  day = '' + d.getDate(),
  year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

function generateResultSpeechOutput(title){
  var speechOutput = "I found this episode: " + title + "." + " You can say 'Description', or 'Play This Episode.'";
  if (speechOutput.length < 8000){
    return speechOutput;
  } else {
    return "the response size is too big. You can say new session to start a new search";
  }
}

function generateSSMLOutput(phrase){
  if (phrase.includes("<") || phrase.length >= 8000) {
    return "Sorry, I could not generate the description. You can say 'Play Episode' or 'New Session' to start a new search";
  } else {
    return phrase;
  }
}

function generateTALTitle(title){
  return title.substr(1, title.indexOf(':')-1);
}
