// jshint ignore: start
'use strict';
var Alexa = require("alexa-sdk");

var APP_ID = undefined;

var data=[
  { number: 1, title: "New Beginnings", description: "Our program's very first broadcast.", date: "1995-11-17" },
];

var skillName = "Alexa This American Life Lookup";

var WELCOME_MESSAGE = "Find a specific episode or discover new content. For example, " + getGenericHelpMessage(data)

var HELP_MESSAGE = "I can help you find an episode by number, contributor, or content. "

var NEW_SEARCH_MESSAGE = getGenericHelpMessage(data);

var DESCRIPTION_STATE_HELP_MESSAGE = "Here are some things you can say: Tell me more, or play this episode";

var MULTIPLE_RESULTS_STATE_HELP_MESSAGE = "Sorry, please say the title or number of the episode you would like to play";

var SHUTDOWN_MESSAGE = "Ok.";

var EXIT_SKILL_MESSAGE = "Ok.";
