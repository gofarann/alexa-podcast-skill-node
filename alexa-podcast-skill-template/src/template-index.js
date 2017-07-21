'use strict';

var Alexa = require('alexa-sdk');
var sizeof = require('object-sizeof');


require('dotenv').config();

Alexa.appId = '';

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

// TODO: fill in the name of the podcast (string) used in utterances
var podcast = "";

/* TODO: fill in the audiosear.ch podcast id. audiosearch_podcast_id is the episode id (integer) used in API searches
can be found at this API endpoint: https://www.audiosear.ch/api/search/shows/
i.e. Stuff You Should Know id = 358 according to https://www.audiosear.ch/api/search/shows/stuff%20you%20should%20know
*/
var audiosearch_podcast_id = "";


var WELCOME_MESSAGE = "Welcome to the " + podcast + " episode lookup skill. ";
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
// ---------------------------------------- Section 2. States  -----------------------------------------
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


  /*
  NOTE: the searh by episode number function only works if the podcast identifies each episode by a unique number
  comment out if the podcast has no unique episode identifier
  */
  "SearchByEpisodeNumberIntent": function() {
    this.handler.state = states.SEARCH_MODE;
    SearchByEpisodeNumberIntentHandler.call(this);
  },


  "PlayEpisodeIntent": function() {
    this.handler.state = states.STREAM_MODE;

    if(this.attributes.currentEpisodeInfo){
      var title = this.attributes.currentEpisodeInfo.title;

      /*TODO: replace 'title' with how your podcast generates the */
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

  "NewSessionIntent": function(){
    NewSessionIntentHandler.call(this);
  },

  "SearchByDateCreatedIntent": function(){
    SearchByDateCreatedIntentHandler.call(this);
  },

  "SearchByEpisodeNumberIntent": function() {
    /*
    NOTE: this function only works if the podcast identifies each episode by a unique number
    comment out if the podcast has no unique episode identifier
    */
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
    if(this.attributes.currentEpisodeInfo){
      var title = this.attributes.currentEpisodeInfo.title;
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

      if(this.attributes.currentEpisodeInfo){
        var title = this.attributes.currentEpisodeInfo.title;
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
    }

  });

  var streamModeHandlers = Alexa.CreateStateHandler(states.STREAM_MODE, {

    "PlayEpisodeIntent": function() {
      this.handler.state = states.STREAM_MODE;
      if(this.attributes.currentEpisodeInfo){
        var title = this.attributes.currentEpisodeInfo.title;
        PlayEpisodeIntentHandler.call(this, title);
      } else {
        this.emit(":tell", "Sorry, I couldn't play this episode. ");
      }
    },

    "AMAZON.PauseIntent": function(){
      this.response.audioPlayerStop();
      this.response.speak('Paused. See you next time!');
      this.emit(':responseReady');

    },

    // "AMAZON.ResumeIntent": function(){
    //   this.response.audioPlayerPlay();
    //   this.response.speak('Resuming episode.');
    //   this.emit(':responseReady');
    // },

    "AMAZON.StartOver": function(){
      var title = this.attributes.currentEpisodeInfo.title;
      PlayEpisodeIntentHandler.call(this, title.substr(1, title.indexOf(':')-1));
    },

    "Unhandled": function(){
      this.emit(":ask", "Sorry, I couldn't stream this episode. " + NEW_SEARCH_MESSAGE + 'or' + END_SESSION_MESSAGE);
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

      var title = this.attributes.currentEpisodeInfo.title;
      PlayEpisodeIntentHandler.call(this, title);
    },

    'AMAZON.StopIntent': function () {
      this.emit(":tell", "Ok.");
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
    /*
    NOTE: this function only works if the podcast identifies each episode by a unique number
    */
    var episodeNumber = this.event.request.intent.slots.episodeNumber.value;
    var query = "title:" + episodeNumber;
    var that = this;

    audiosearch.searchEpisodes(query, {"filters[show_id]":audiosearch_podcast_id}).then(function (results) {
      if (results.total_results !== 0) {
        Object.assign(that.attributes, {
          "STATE": states.DESCRIPTION,
          "currentEpisodeInfo": results.results[0]
        }
      );
      var speechOutput = "I found an episode called " +  that.attributes.currentEpisodeInfo.title + "." + DESCRIPTION_MODE_HELP_MESSAGE;
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
    var searchTopic = this.event.request.intent.slots.searchTopic;
    Object.assign(this.attributes, {
      "searchQuery": searchTopic
    });
  }

  if(this.attributes.onResult !== undefined){
    var count = this.attributes.onResult + 1;
    Object.assign(this.attributes, {
      "onResult": count
    });
  } else {
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
  this.emit(":ask", speechOutput);
}

function PlayEpisodeIntentHandler(podcast){
  this.handler.state = states.STREAM_MODE;

  var playBehavior = 'REPLACE_ALL';
  /* this will vary based on where mp3s of this podcast are located.
  if the url does not exist in this.attributes.currentEpisodeInfo.identifier
  uncomment the generatePodcastUrl function in this file and create your own custom url function */
  var podcastUrl = this.attributes.currentEpisodeInfo.identifier;
  // var podcastUrl = generatePodcastUrl();
  var token = "0";
  var offsetInMilliseconds = 0;

  this.response.audioPlayerPlay(playBehavior, podcastUrl, token, null, offsetInMilliseconds);
  this.emit(':responseReady');

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

  //construct query
  var dateQueryStart = "[" + oneWeekAgo(this.attributes.dateQuery);
  var dateQueryEnd = this.attributes.dateQuery + "]";
  var query = "date_created:" + dateQueryStart + ", " + dateQueryEnd;

  var that = this;

  //search API
  audiosearch.searchEpisodes(query, {"filters[show_id]":audiosearch_podcast_id, "sort_by":"date_created", "sort_order":"asc"}).then(function (results) {
    if (results.total_results !== 0){

      Object.assign(that.attributes, {
        "currentEpisodeInfo": results.results[0]
      });

      var speechOutput = generateResultSpeechOutput(that.attributes.currentEpisodeInfo.title);
      that.emit(":ask", speechOutput);

    } else {
      that.emit(":ask", "Sorry, I couldn't find any episodes from that date search." + NEW_SEARCH_MESSAGE);
    }

  });



}


// =====================================================================================================
// ------------------------------------ Section 3.  Helper Functions  ----------------------------------
// =====================================================================================================

// NOTE: if mp3 url does not exist in the API response, you can create a custom function here.
// function generatePodcastUrl(episodeNumber) {
//     return
// }


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


// =====================================================================================================
// ------------------------------------ Section 4.  Date Functions  ------------------------------------
// =====================================================================================================



// ------------------------------------ Closest Day of Week Before Functions  --------------------------

function oneWeekAgo(dateQuery) {
  var d = new Date(dateQuery);
  var lastWeek = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7);
  return formatDate(lastWeek) ;
}

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
