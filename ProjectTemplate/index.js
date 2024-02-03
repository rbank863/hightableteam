"use strict";

$(document).ready(function () {
	showPanel("logonPanel")
});

var contentPanels = ['logonPanel', 'suggestionPanel'];

function showPanel(panelId) {
	// Iterate through all content panels
	for (var i = 0; i < contentPanels.length; i++) {
		if (panelId == contentPanels[i]) {
			$("#" + contentPanels[i]).css("display", "block"); // Show the selected panel
		} else {
			$("#" + contentPanels[i]).css("display", "none"); // Hide other panels
		}
	}
}



//this function clears data from all panels
function clearData() {
	clearLogon();
	clearNewSuggestion();
}

//resets login inputs
function clearLogon() {
	$('#logonId, #logonPassword').val("");
}

//resets new suggestion inputs
function clearNewSuggestion() {
	$('#summary, #otherText, #benefitExplanation').val('');
	$('#anonymousYes, #anonymousNo').prop('checked', false);
	$('#productivity, #methods, #service, #revenue, #costs, #other').prop('checked', false);
}



function testButtonHandler() {
	var webMethod = "ProjectServices.asmx/TestConnection";
	var parameters = "{}";

	//jQuery ajax method
	$.ajax({
		type: "POST",
		url: webMethod,
		data: parameters,
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function (msg) {
			var responseFromServer = msg.d;
			alert(responseFromServer);
		},
		error: function (e) {
			alert("this code will only execute if javascript is unable to access the webservice");
		}
	})
}
function logOn(userId, pass) {
	//the url of the webservice we will be talking to
	var webMethod = "ProjectServices.asmx/LogOn";
	//the parameters we will pass the service (in json format because curly braces)
	//note we encode the values for transmission over the web.  All the \'s are just
	//because we want to wrap our keynames and values in double quotes so we have to
	//escape the double quotes (because the overall string we're creating is in double quotes!)
	var parameters = "{\"uid\":\"" + encodeURI(userId) + "\",\"pass\":\"" + encodeURI(pass) + "\"}";

	//jQuery ajax method
	$.ajax({
		//post is more secure than get, and allows
		//us to send big data if we want.  really just
		//depends on the way the service you're talking to is set up, though
		type: "POST",
		//the url is set to the string we created above
		url: webMethod,
		//same with the data
		data: parameters,
		//these next two key/value pairs say we intend to talk in JSON format
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		//jQuery sends the data and asynchronously waits for a response.  when it
		//gets a response, it calls the function mapped to the success key here
		success: function (msg) {
			//the server response is in the msg object passed in to the function here
			//since our logon web method simply returns a true/false, that value is mapped
			//to a generic property of the server response called d (I assume short for data
			//but honestly I don't know...)
			if (msg.d) {
				showMenu();
				showPanel('suggestionPanel');
				//LoadAccounts();
				alert("Log on successeful!");
			}
			else {
				//server replied false, so let the user know
				//the logon failed
				alert("Log on failed.");
			}
		},
		error: function (e) {
			//if something goes wrong in the mechanics of delivering the
			//message to the server or the server processing that message,
			//then this function mapped to the error key is executed rather
			//than the one mapped to the success key.  This is just a garbage
			//alert becaue I'm lazy
			alert("boo...");
		}
	});
}

function submitSuggestion() {
	// The URL of the web service for submitting suggestions
	var webMethod = "ProjectServices.asmx/NewSuggestion";

	// Collect field values
	var encodedAnonymous = $('input[name="anonymous"]:checked').val();
	var encodedSummary = $('#summary').val();
	var encodedBenefitExplanation = $('#benefitExplanation').val();

	// Collect selected suggestion types in an array and encode each
	var suggestionTypes = [];
	$('input[name="suggestionType"]:checked').each(function () {
		var suggestionType = encodeURI($(this).val());
		suggestionTypes.push(suggestionType);
	});

	// Create a data object with the suggestion data
	var data = JSON.stringify({
		anonymous: encodedAnonymous,
		summary: encodedSummary,
		suggestionTypes: suggestionTypes,
		benefitExplanation: encodedBenefitExplanation
	});

	console.log(data);

	$.ajax({
		type: "POST",
		url: webMethod,
		data: JSON.stringify(data),
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function (msg) {
			// Handle success, e.g., show a success message to the user
			alert("Suggestion submitted successfully!");
			clearSuggestionPanelData();
		},
		error: function (e) {
			// Handle error, e.g., display an error message
			alert("Failed to submit suggestion. Please try again.");
		}
	});
}

function showMenu() {
	$("#menu").css("display", "flex"); // Adjust to "flex" to maintain the flex container properties
}

function hideMenu() {

	$("#menu").css("display", "none"); // Adjust to "flex" to maintain the flex container properties
}


//logs the user off both at the client and at the server
function logOff() {

	var webMethod = "ProjectServices.asmx/LogOff";
	$.ajax({
		type: "POST",
		url: webMethod,
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function (msg) {
			if (msg.d) {
				//we logged off, so go back to logon page,
				//stop checking messages
				//and clear the chat panel
				hideMenu();
				clearData();
				showPanel('logonPanel');
			}
			else {
			}
		},
		error: function (e) {
			alert("boo...");
		}
	});
}