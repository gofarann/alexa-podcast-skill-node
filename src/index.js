
'use strict';
var Alexa = require("alexa-sdk");

// var APP_ID = undefined;

// =====================================================================================================
// --------------------------------- Section 1. Data and Text strings  ---------------------------------
// =====================================================================================================

var data = [
  { number: 1, title: "New Beginnings", description: "Our program's very first broadcast.", date: "1995-11-17" },
];

var skillName = "Alexa This American Life Lookup";

var WELCOME_MESSAGE = "Find a specific episode or discover new content. For example, " + getGenericHelpMessage(data);

var HELP_MESSAGE = "I can help you find an episode by number, contributor, or content. ";

var NEW_SEARCH_MESSAGE = getGenericHelpMessage(data);

var DESCRIPTION_STATE_HELP_MESSAGE = "Here are some things you can say: Tell me more, or play this episode";

var MULTIPLE_RESULTS_STATE_HELP_MESSAGE = "Sorry, please say the title or number of the episode you would like to play";

var SHUTDOWN_MESSAGE = "Ok.";

var EXIT_SKILL_MESSAGE = "Ok.";

// =====================================================================================================
// ------------------------------ Section 2. Skill Code - Intent Handlers  -----------------------------
// =====================================================================================================

var states = {
    SEARCHMODE: "_SEARCHMODE",
    // DESCRIPTION: "_DESCRIPTION",
    // MULTIPLE_RESULTS: "_MULTIPLE_RESULTS"
};


const newSessionHandlers = {
    "LaunchRequest": function() {
        this.handler.state = states.SEARCHMODE;
        this.emit(":ask", WELCOME_MESSAGE, getGenericHelpMessage(data));
    },
    "SearchByEpisodeNumberIntent": function() {
        console.log("SEARCH INTENT");
        this.handler.state = states.SEARCHMODE;
        this.emitWithState("SearchByEpisodeNumberIntent");
    },
    // generic amazon intents
    "AMAZON.YesIntent": function() {
        this.emit(":ask", getGenericHelpMessage(data), getGenericHelpMessage(data));
    },
    "AMAZON.NoIntent": function() {
         this.emit(":tell", SHUTDOWN_MESSAGE);
    },
     "AMAZON.RepeatIntent": function() {
         this.emit(":ask", HELP_MESSAGE, getGenericHelpMessage(data));
    },
     "AMAZON.StopIntent": function() {
         this.emit(":tell", EXIT_SKILL_MESSAGE);
    },
     "AMAZON.CancelIntent": function() {
         this.emit(":tell", EXIT_SKILL_MESSAGE);
    },
     "AMAZON.StartOverIntent": function() {
         this.handler.state = states.SEARCHMODE;
         var output = "Ok, starting over." + getGenericHelpMessage(data);
         this.emit(":ask", output, output);
    },
     "AMAZON.HelpIntent": function() {
         this.emit(":ask", HELP_MESSAGE + getGenericHelpMessage(data), getGenericHelpMessage(data));
    },
     "SessionEndedRequest": function() {
         this.emit("AMAZON.StopIntent");
    },
     "Unhandled": function() {
         this.handler.state = states.SEARCHMODE;
         this.emitWithState("SearchByEpisodeNumberIntent");
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
        console.log("repeating last speech");
      }
      else{
        output = getGenericHelpMessage(data);
        console.log("no last speech availble. outputting standard help message.");
      }
      this.emit(":ask",output, output);
    },

    "SearchByEpisodeNumberIntent": function() {
      SearchByEpisodeNumberHandler.call(this);
    },
    // generic amazon handlers

    "AMAZON.HelpIntent": function() {
        this.emit(":ask", getGenericHelpMessage(data), getGenericHelpMessage(data));
    },
    "AMAZON.StopIntent": function() {
        this.emit(":tell", EXIT_SKILL_MESSAGE);
    },
    "AMAZON.CancelIntent": function() {
        this.emit(":tell", EXIT_SKILL_MESSAGE);
    },
    "AMAZON.StartOverIntent": function() {
        this.handler.state = states.SEARCHMODE;
        var output = "Ok, starting over." + getGenericHelpMessage(data);
        this.emit(":ask", output, output);
    },
    "SessionEndedRequest": function() {
        this.emit("AMAZON.StopIntent");
    },
    "Unhandled": function() {
        console.log("Unhandled intent in startSearchHandlers");
        this.emit(":ask", SEARCH_STATE_HELP_MESSAGE, SEARCH_STATE_HELP_MESSAGE);
    }
});


// ------------------------- END of Intent Handlers  ---------------------------------


function SearchByEpisodeNumberHandler(){
  var episodeNumber = this.event.request;
  var searchQuery = this.event.request.intent.slots[episodeNumber].value;
  var searchResults = searchDatabase(data, searchQuery);

  if (searchResults.count === 1) { //one result found
    this.handler.state = states.DESCRIPTION; // change state to description
    console.log("match was found");
    this.emitWithState("TellMeThisIntent");
  } else {
    //no match found
    console.log("no match found");
    console.log("searchQuery was  = " + searchQuery);
    console.log("searchResults.results was  = " + searchResults);
    output = "no results found";
    this.emit(":ask", output);
  }
};


function searchDatabase(dataset, searchQuery, searchType) {
    var matchFound = false;
    var results = [];

    //beginning search
    for (var i = 0; i < dataset.length; i++) {
        if (sanitizeSearchQuery(searchQuery) === dataset[i][searchType]) {
            results.push(dataset[i]);
            matchFound = true;
        }
        if ((i == dataset.length - 1) && (matchFound === false)) {
        //this means that we are on the last record, and no match was found
            matchFound = false;
            console.log("no match was found using " + searchType);
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
// ------------------------------- Section 3. Generating Speech Messages -------------------------------
// =====================================================================================================

function generateSearchResultsMessage(searchQuery,results){
    var sentence;
    var details;
    var prompt;

    if (results){
      switch (true) {
      case (results.length === 0):
          sentence = "Hmm. I couldn't find " + searchQuery + ". " + getGenericHelpMessage(data);
          break;
      case (results.length == 1):
          var episode = results[0];
          details = episode.title + " " + episode.number + " from " + episode.date;
          prompt = generateNextPromptMessage(episode,"current");
          sentence = details + prompt;
          console.log(sentence);
          break;
      case (results.length > 1):
          sentence = "I found " + results.length + " matching results";
          break;
      }
    }
    else{
      sentence = "Sorry, I didn't quite get that. " + getGenericHelpMessage(data);
    }
    return sentence;
}

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
