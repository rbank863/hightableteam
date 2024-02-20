"use strict";

// Global Variables
var empID;
var currentEmployee;
var currentManager;
var directReports = [];
var allSuggestions = [];
var allEmployees = [];
var allMeetings = [];
// On load call function to show logon panel
$(document).ready(function () {
	showPanel("logonPanel")
});

var contentPanels = ['logonPanel', 'homeDisplayPanel', 'suggestionPanel', 'suggestionDisplayPanel', 'suggestionDetailsPanel', 'meetingPanel', 'meetingDetailsPanel'];
// Function to manage active content panel. 
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

// Function used to clear all form inpurs and system variables at logoff
function clearData() {
	clearLogon();
	clearNewSuggestion();
	clearSuggestionPannels();
	clearMeeting();
	clearUserData();
}

// Resets input fields on logon form
function clearLogon() {
	$('#logonId, #logonPassword').val("");
}

// Resets input fields on suggestion form
function clearNewSuggestion() {
	$('#summary, #otherText, #benefitExplanation, #comment').val('');
	$('#anonymousYes').prop('checked', false);
	$('#anonymousNo').prop('checked', true);
	$('#productivity, #methods, #service, #revenue, #costs, #personnel').prop('checked', false);
}

// Clears suggestion dynamic content containers 
function clearSuggestionPannels() {
	$("#suggestionsContainer").empty();
	$("#suggestionDetails").empty();
	$("#suggestionReplies").empty();
}

// Reset input fields for meeting form
function clearMeeting() {
	$('#meetingPanel').find('textarea').val('');
	$('#meetingPanel').find('input[type="hidden"]').val('');
}

// Reset global variables
function clearUserData() {
	empID = undefined;
	currentEmployee = undefined;
	currentManager = undefined;
	directReports = [];
	allSuggestions = [];
	allEmployees = [];
	allMeetings = [];
}

// Allows for cancel of a new meeting form. Calls function to clear inputs and returns user to home screen
function cancelMeeting() {
	goHome()
}

// Allows for cancel of a suggestion form. Calls function to clear inputs and returns user to home screen
function cancelSuggestion() {
	goHome()
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
				showMenu();
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

// Function makes call to get the employeeID of the logged in user. Uses that value to call getEmployees function
function getUser() {

	var webMethod = "ProjectServices.asmx/GetUserID";
	$.ajax({
		type: "POST",
		url: webMethod,
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function (msg) {
			if (msg.d) {
				empID = parseInt(msg.d);
				getEmployees(empID);
			}
			else {
				console.log('Something went wrong');
			}
		},
		error: function (e) {
			alert("boo...");
		}
	});
}

// This function gets all active employees. Then using the employeeID of the active user identifies the logged in user, manager, and direct reports
function getEmployees(id) {

	var webMethod = "ProjectServices.asmx/GetAllEmployees";
	$.ajax({
		type: "POST",
		url: webMethod,
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function (msg) {
			if (msg.d) {
				allEmployees = msg.d;

				// Find the logged in user in allEmployees
				currentEmployee = allEmployees.find(function (employee) {
					return employee.empUserId === id;
				});

				console.log(currentEmployee);

				// Check if the logged in user has a manager
				if (currentEmployee.empManager && currentEmployee.empManager !== 0) {
					// Find the manager in allEmployees
					currentManager = allEmployees.find(function (manager) {
						return manager.empUserId === currentEmployee.empManager;
					});
				}

				// Find all direct reports to current user
				directReports = allEmployees.filter(function (employee) {
					return employee.empManager === currentEmployee.empUserId;
				});

				updateHomeDisplay();
			}
			else {
				console.log('Something went wrong');
			}
		},
		error: function (e) {
			alert("boo...");
		}
	});
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

// Once logged in, call to show menu will bring up navigation system
function showMenu() {
	$(".app-header").css("display", "flex");
}

// Once logged out, hide navigation system
function hideMenu() {
	$(".app-header").css("display", "none");

	var menu = $("#slideOutMenu");
	if (menu.width() === 250) {
		menu.width(0);
	}
}

// Simple function to clear form inputs and display the home panel
function goHome() {
	showPanel('homeDisplayPanel')
	clearNewSuggestion();
	clearMeeting();
}

// Toggle slide out menu in and out by changing width
function toggleHamburgerMenu() {
	var menu = $("#slideOutMenu");
	if (menu.width() === 250) {
		menu.width(0);
	} else {
		menu.width(250);
	}
}

// On the navigation system is icon to access user profile. Currently no action is taken.
function openUserProfile() {
	
}

// Home screen display user details, manager (if avaialble), and direct reports (if available)
function updateHomeDisplay() {
	$("#userInfoHtml").empty();
	var userInfoHtml = `
        <div class="userInfoCard">
            <h3>My Profile</h3>
            <p><strong>${currentEmployee.empFirstName} ${currentEmployee.empLastName}</strong><br>
            ${currentEmployee.empDepartment}</p>
        </div>
    `;

	if (currentManager) {
		userInfoHtml += `
            <div class="userInfoCard">
                <h3>My Manager</h3>
                <p><strong>${currentManager.empFirstName} ${currentManager.empLastName}</strong><br>
                ${currentManager.empDepartment}</p>
            </div>
        `;
	}

	// Direct reports will link to trigger a 1-on-1 meeting
	if (directReports && directReports.length > 0) {
		userInfoHtml += `<div class="userInfoCard"><h3>Direct Reports</h3><ul>`;
		directReports.forEach(function (report) {
			userInfoHtml += `<li><a href="#" onclick="initiateOneOnOne(${report.empId});">${report.empFirstName} ${report.empLastName}</a> - ${report.empDepartment}</li>`;
		});
		userInfoHtml += `</ul><p>Click on a name to host a 1-on-1 meeting.</p></div>`;
	}

	$("#userInfoHtml").html(userInfoHtml);

	loadMeetingHistory();

	// Show the Home Display Panel
	showPanel('homeDisplayPanel');
}

// This function will load all suggestion posts from the database into the suggestionDisplayPanel. Utilize the GetSuggestions web service.
function loadSuggestions() {

	// Clear forms in case user clicks out of them to view feedback
	clearNewSuggestion();
	clearMeeting();

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
			loadSuggestions(); // after successful new submission, load recent feedback display
		},
		error: function (e) {
			// Handle error, e.g., display an error message
			alert("Failed to submit suggestion. Please try again.");
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

function initiateOneOnOne(directReportId) {
	// Set the IDs in the hidden fields
	$('#meetingMgrID').val(userID);
	$('#meetingEmpID').val(directReportId);

	var managerName = currentEmployee.empFirstName + " " + currentEmployee.empLastName;
	$('#managerName').text(managerName);

	var directReportEmployee = allEmployees.find(function (directReport) {
		return directReport.empId === directReportId;
	});
	var employeeName = directReportEmployee.empFirstName + " " + directReportEmployee.empLastName;
	$('#employeeName').text(employeeName);

	// Show the 1-on-1 meeting panel
	showPanel('meetingPanel');
}
function submitMeetingDetails() {

	// The URL of the web service for submitting suggestions
	var webMethod = "ProjectServices.asmx/NewOneOnOneAnswers";

	// Get form values
	var templateID = 1; // hard coded for now, ultimately manager may select from multiple templates
	var meetingMgrID = $('#meetingMgrID').val();
	var meetingEmpID = $('#meetingEmpID').val();
	var meetingA1 = $('#meetingA1').val();
	var meetingA2 = $('#meetingA2').val();
	var meetingA3 = $('#meetingA3').val();
	var meetingA4 = $('#meetingA4').val();
	var meetingA5 = $('#meetingA5').val();
	var meetingA6 = $('#meetingA6').val();

	var parameters = "{\"templateId\":\"" + encodeURI(templateID) + "\",\"empId\":\"" + encodeURI(meetingEmpID) + "\",\"mgrId\":\"" + encodeURI(meetingMgrID) + "\",\"firstAnswer\":\"" + encodeURI(meetingA1)
					+ "\",\"secondAnswer\":\"" + encodeURI(meetingA2) + "\",\"thirdAnswer\":\"" + encodeURI(meetingA3) + "\",\"fourthAnswer\":\"" + encodeURI(meetingA4) + "\",\"fifthAnswer\":\""
					+ encodeURI(meetingA5) + "\",\"sixthAnswer\":\"" + encodeURI(meetingA6) + "\"}";
	console.log(parameters);

	$.ajax({
		type: "POST",
		url: webMethod,
		data: parameters,
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function (msg) {
			clearMeeting();	// clear meeting form inputs
			updateHomeDisplay() // update home display to refresh list fo previous 1on1 meetings
		},
		error: function (e) {
			alert("Failed to submit 1-on-1 meeting details. Please try again.");
		}
	});
}

// Load 1on1 meeting history table on homepanel
function loadMeetingHistory() {

	var webMethod = "ProjectServices.asmx/GetMeetings";
	$.ajax({
		type: "POST",
		url: webMethod,
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function (msg) {
			$("#meetingHistory").empty(); // Clear previous content regardless of outcome
			if (msg.d && msg.d.length > 0) {
				allMeetings = msg.d.reverse();
				var meetingsHtml = `
                    <div class="meetingsContainer">
                        <h3>1-on-1 Meeting History</h3>
                        <ul class="meetingsList">
                `;
				// Add list item for each meeting
				for (var i = 0; i < allMeetings.length; i++) {
					var meeting = allMeetings[i];
					meetingsHtml += `
                        <li><a href="#" onclick="loadMeetingDetails(${meeting.meetingId});">${meeting.date}</a> - ${meeting.empFirstName} ${meeting.empLastName} & ${meeting.mgrFirstName} ${meeting.mgrLastName}</li>
                    `;
				}
				meetingsHtml += `
                        </ul>
                    </div>
                `;
				// Append meeting list to home panel
				$("#meetingHistory").append(meetingsHtml);
			} else {
				// Display message when no meeting history is found
				$("#meetingHistory").html(`
                    <div class="meetingsContainer">
                        <h3>1-on-1 Meeting History</h3>
                        <p>No meeting history found.</p>
                    </div>
                `);
			}
		},
		error: function (e) {
			alert("boo...");
		}
	});
}

// Display meeting details
function loadMeetingDetails(meetingID) {
	var meeting = allMeetings.find(m => m.meetingId === meetingID);
	if (meeting) {
		// Populate employee and manager details
		$('#meetingEmployee').text(`${meeting.empFirstName} ${meeting.empLastName}`);
		$('#meetingDept').text(meeting.empDepartment);
		$('#meetingManager').text(`${meeting.mgrFirstName} ${meeting.mgrLastName}`);
		$('#meetingDate').text(meeting.date);

		// Populate the meeting Q/A details
		$('#question1').html(`<strong>${meeting.questionOne}</strong>`);
		$('#answer1').text(meeting.answerOne);
		$('#question2').html(`<strong>${meeting.questionTwo}</strong>`);
		$('#answer2').text(meeting.answerTwo);
		$('#question3').html(`<strong>${meeting.questionThree}</strong>`);
		$('#answer3').text(meeting.answerThree);
		$('#question4').html(`<strong>${meeting.questionFour}</strong>`);
		$('#answer4').text(meeting.answerFour);
		$('#question5').html(`<strong>${meeting.questionFive}</strong>`);
		$('#answer5').text(meeting.answerFive);
		$('#question6').html(`<strong>${meeting.questionSix}</strong>`);
		$('#answer6').text(meeting.answerSix);
	} 

	showPanel('meetingDetailsPanel');
}
