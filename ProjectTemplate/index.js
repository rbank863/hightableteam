"use strict";

var allSuggestions = []; // Global array to store suggestions
var userID;
var user;
var allUsers = [];

$(document).ready(function () {
	showPanel("logonPanel")
});

var contentPanels = ['logonPanel', 'suggestionPanel', 'suggestionDisplayPanel', 'suggestionDetailsPanel'];

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
	clearSuggestionPannels();
}

//resets login inputs
function clearLogon() {
	$('#logonId, #logonPassword').val("");
}

//resets new suggestion inputs
function clearNewSuggestion() {
	$('#summary, #otherText, #benefitExplanation').val('');
	$('#anonymousYes').prop('checked', false);
	$('#anonymousNo').prop('checked', true);
	$('#productivity, #methods, #service, #revenue, #costs, #personnel').prop('checked', false);
}

function clearSuggestionPannels() {
	$("#suggestionsContainer").empty();
	$("#suggestionDetails").empty();
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
				getUser();
				getUsers();
				showMenu();
				loadSuggestions()
				showPanel('suggestionDisplayPanel');
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
	var anonymous = $('input[name="anonymous"]:checked').val();
	var summary = $('#summary').val();
	var benefitExplanation = $('#benefitExplanation').val();

	// Collect selected suggestion types in an array and encode each
	var suggestionTypes = [];
	$('input[name="suggestionType"]:checked').each(function () {
		var suggestionType = encodeURI($(this).val());
		suggestionTypes.push(suggestionType);
	});

	var parameters = "{\"post\":\"" + encodeURI(summary) + "\",\"proposedSolution\":\"" + encodeURI(benefitExplanation) + "\",\"anon\":\"" + encodeURI(anonymous) + "\",\"checkboxData\":\"" + encodeURI(suggestionTypes) + "\"}";
	console.log(parameters);

	$.ajax({
		type: "POST",
		url: webMethod,
		data: parameters,
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function (msg) {
			clearNewSuggestion();
		},
		error: function (e) {
			// Handle error, e.g., display an error message
			alert("Failed to submit suggestion. Please try again.");
		}
	});
}

function showMenu() {
	$("#menu").css("display", "flex");
}

function hideMenu() {

	$("#menu").css("display", "none");
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
				// Close the menu, clear all data in case user logs back in, and display the logonPanel
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

function getUser() {

	var webMethod = "ProjectServices.asmx/GetUserID";
	$.ajax({
		type: "POST",
		url: webMethod,
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function (msg) {
			if (msg.d) {
				userID = msg.d;
			}
			else {
			}
		},
		error: function (e) {
			alert("boo...");
		}
	});
}

function getUsers() {

	var webMethod = "ProjectServices.asmx/GetAllEmployees";
	$.ajax({
		type: "POST",
		url: webMethod,
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function (msg) {
			if (msg.d) {
				allUsers = msg.d;
				console.log(allUsers);
			}
			else {
			}
		},
		error: function (e) {
			alert("boo...");
		}
	});
}



// This function will load all suggestion posts from the database into the suggestionDisplayPanel. Utilize the GetSuggestions web service.
function loadSuggestions() {

	var webMethod = "ProjectServices.asmx/GetSuggestions";
	$.ajax({
		type: "POST",
		url: webMethod,
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function (msg) {
			if (msg.d) {
				// Empty container
				$("#suggestionsContainer").empty();

				// Store suggestions globally, in reverse order newest on top
				allSuggestions = msg.d.reverse();

				// Use a for loop to iterate over the suggestions array
				for (var i = 0; i < allSuggestions.length; i++) {
					var suggestion = allSuggestions[i];
					// Modify display name and department if the suggestion is annonymous or not
					var displayName = suggestion.anon === 'true' ? '' : `<div class="suggestionDetail"><strong>Name:</strong> ${suggestion.empFirstName + ' ' + suggestion.empLastName}</div>`;
					var displayDepartment = suggestion.anon === 'true' ? '' : `<div class="suggestionDetail"><strong>Department:</strong> ${suggestion.dept}</div>`;


					// Take the benefit categories array data, and provide formatting
					var benefitCategories = suggestion.checkboxData.split(',').map(function (category) {
						return category.trim();
					}).join(', ');

					// Format the details of the current suggestion and append it to the suggestionsContainer div as part of the suggestionDisplayPanel
					var suggestionHtml = `
						<div class="suggestionDisplayBox">
							<div class="suggestionDetail"><strong><a href="#" onclick="displaySuggestionDetails('${i}'); return false;">#${suggestion.postId}</a></strong>  ${suggestion.date}</div>
							${displayName}
							${displayDepartment}
							<div class="suggestionDetail"><strong>Suggestion:</strong> ${suggestion.post}</div>
							<div class="suggestionDetail"><strong>Benefit Explanation:</strong> ${suggestion.proposedSolution}</div>
							<div class="suggestionDetail"><strong>Benefit Categories:</strong> ${benefitCategories}</div>
						</div>
					`;
					// Append the suggestion HTML to the container
					$("#suggestionsContainer").append(suggestionHtml);
				}
				// After all suggesitons are loaded, display the suggestionDisplayPanel
				showPanel('suggestionDisplayPanel');
			}
			else {
				console.log('No suggestions found.');
			}
		},
		error: function (e) {
			alert("boo...");
		}
	});
}

// This function will dive into a single suggestion. Display the suggestion details and pass along the current post ID to displaySuggestionComments function
function displaySuggestionDetails(index) {

	// Empty container
	$("#suggestionDetails").empty();

	// Get the current suggestion based on the index passed into the function. Modify display name and department if the suggestion is annonymous or not
	var suggestion = allSuggestions[index];
	var displayName = suggestion.anon === 'true' ? '' : `<div class="suggestionDetail"><strong>Name:</strong> ${suggestion.empFirstName + ' ' + suggestion.empLastName}</div>`;
	var displayDepartment = suggestion.anon === 'true' ? '' : `<div class="suggestionDetail"><strong>Department:</strong> ${suggestion.dept}</div>`;

	// Set comment form variable to indicate current post ID
	$('#currentPostId').val(suggestion.postId)

	// Take the benefit categories array data, and provide formatting
	var benefitCategories = suggestion.checkboxData.split(',').map(function (category) {
		return category.trim();
	}).join(', ');

	// Format the details of the current suggestion and append it to the suggestionDetails div as part of the suggestionDetailsPanel
	var suggestionHtml = `
						<div class="suggestionDisplayBox">
							<div class="suggestionDetail"><strong>#${suggestion.postId}</a></strong>  ${suggestion.date}</div>
							${displayName}
							${displayDepartment}
							<div class="suggestionDetail"><strong>Suggestion:</strong> ${suggestion.post}</div>
							<div class="suggestionDetail"><strong>Benefit Categories:</strong> ${benefitCategories}</div>
							<div class="suggestionDetail"><strong>Benefit Explanation:</strong> ${suggestion.proposedSolution}</div>

						</div>
					`;
	$("#suggestionDetails").append(suggestionHtml);

	// Call fucntion to load comments
	displaySuggestionComments(suggestion.postId);

	// After the current suggesiton is loaded, display the suggestionDetailsPanel
	showPanel('suggestionDetailsPanel');

}

// Function will take the current post ID, and make a call to GetComments webservice to load all comments to the suggestion detail page
function displaySuggestionComments(postID) {
	// Empty dynamic section for suggestion comments
	$("#suggestionReplies").empty();

	// Load suggestion comments
	var webMethod = "ProjectServices.asmx/GetComments";
	var parameters = "{\"postId\":\"" + encodeURI(postID) + "\"}";
	$.ajax({
		type: "POST",
		url: webMethod,
		data: parameters,
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function (msg) {
			if (msg.d) {
				for (var i = 0; i < msg.d.length; i++) {
					var reply = msg.d[i];

					// Format the details of the current suggestion and append it to the suggestionsContainer div as part of the suggestionDisplayPanel
					var replyHtml = `
						<div class="suggestionDisplayBox">
							<div class="suggestionDetail"><strong> ${reply.empFirstName + ' ' + reply.empLastName}</strong> - ${reply.date}</div >
							<div class="suggestionDetail">${reply.postComment}</div>
						</div>
					`;
					// Append the suggestion HTML to the container
					$("#suggestionReplies").append(replyHtml);
				}
			}
			else {
				console.log('No replies found.');
			}
		},
		error: function (e) {
			alert("boo...");
		}
	});
}

// Function will take value from basic comment form and make webservice call to Add Comment.
// Adter adding comment clear the form and call the displaySuggestionComments function to reload comments from database
function postReply() {
	var webMethod = "ProjectServices.asmx/AddComment";
	var currentPostID = $('#currentPostId').val();
	var comment = $('#comment').val();
	var parameters = "{\"postId\":\"" + encodeURI(currentPostID) + "\",\"comment\":\"" + encodeURI(comment) + "\"}";
	$.ajax({
		type: "POST",
		url: webMethod,
		data: parameters,
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function (msg) {
			// Clear comment form
			$('#comment').val("");
			// Refresh the comments section
			displaySuggestionComments(currentPostID);
		},
		error: function (e) {
			// Handle error, e.g., display an error message
			alert("Failed to submit suggestion. Please try again.");
		}
	});
}