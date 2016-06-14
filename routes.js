var request = require('request');
var utils = require('./utils.js');
var log = utils.richLogging;
var tmrFormatter = require('./tmr.js').format;
var intermediateFormatter = require('./intermediate.js').format;

var isEvent = function(word) {
	if(word["is-in-subtree"] != undefined
			&& word["is-in-subtree"] == "EVENTS"){
		return true;
	}
	return false;
};

var eventsFirst = function(sentenceTmr) {
	var results = [];

	// For each word in a sentence
	for (var wordKey in sentenceTmr) {
		var wordTmr = sentenceTmr[wordKey];
		wordTmr["word-key"] = wordKey;

		// If the word is an event
		if (isEvent(wordTmr)) {
			// Prepend it to our results
			results.unshift(wordTmr);
		} else {
			// Append it to our results
			results.push(wordTmr);
		}
	}

	// Results should have all events, in no particular order,
	// in front of all non-events, in no particular order
	return results;
};

// Think about input
// Split multiple TMR possibilities
//
// Lowercase anything with a lowercase except concept and is-in-subtree
// Handle weird list behavior
// Fix minimization
// Fix highlighting

module.exports = {
	index: function(req, res) {
		// Homepage
		log.info("Serving INDEX");
		res.render("index", {
			debugging: false
		});
	},
	tmr: function(req, res) {
		// Multiple TMR viewer
		log.info("Received SENTENCE");

		var inputData = req.body.inputData;

		if (inputData == "") {
			inputData = utils.exampleTMR;
		} else {
			inputData = intermediateFormatter(inputData).TMRList;
		}

		var results = [];

		for (var entry in inputData) {
			var sentenceId = inputData[entry]["sent-num"];
			var sentence = inputData[entry].sentence;

			for (var tmrIndex in inputData[entry].results) {
				var formattedResult = tmrFormatter({
					"sentenceId": sentenceId,
					"sentence": sentence,
					"tmrIndex": tmrIndex,
					"tmr": inputData[entry].results[tmrIndex].TMR
				});
				results.push(formattedResult);
			}
		}

		res.render("multitmr", {
			"debugging": false,
			"results": results,
			"data": JSON.stringify(results),
			"clientscripts": [
				{script: "client.js"}
			]
		});
	},
	intermediate: function(req, res) {
		log.info("Serving INTERMEDIATE");
		var raw = utils.exampleIntermediate;
		if(req.body.inputData != ">"){
			raw = req.body.inputData.replace(/\\n/g, '');
		}
		var results = intermediateFormatter(raw);
		/*
		var tmrData = tmrFormatter(results.TMR);
		var entities = tmrData.entities;
		results.tmrData = tmrData;
		results.tmrString = JSON.stringify(tmrData);
		results.dataString = JSON.stringify(results.lexEntries);
		*/
		res.render("intermediate", {
			results: results,
			data: JSON.stringify(results),
			clientscripts: [
				{script: "intermediateclient.js"}
			]
		});
	}
};
