"use strict";

// Global Variables
var empID;
var currentEmployee;
var currentManager;
var directReports = [];
var allSuggestions = [];
var allEmployees = [];
var allMeetings = [];
var filterMode = 'department';
var contentPanels = ['logonPanel', 'homeDisplayPanel', 'suggestionPanel', 'suggestionDisplayPanel', 'suggestionDetailsPanel', 'meetingPanel', 'meetingDetailsPanel'];

// On load call function to show logon panel
$(document).ready(function () {
	showPanel("logonPanel")
});

// Function manages the active HTML content panel.  
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

// Function used to clear all form inputs and system variables at logoff
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

// Reset input fields for meeting form
function clearMeeting() {
	$('#meetingPanel').find('textarea').val('');
	$('#meetingPanel').find('input[type="hidden"]').val('');
}

// Clears suggestion dynamic content containers 
function clearSuggestionPannels() {
	$("#suggestionsContainer").empty();
	$("#suggestionDetails").empty();
	$("#suggestionReplies").empty();
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
	filterMode = 'department';
}

// Cancel button action on new 1-on-1 meeting form, return to home panel
function cancelMeeting() {
	goHome()
}

// Cancel button action on idea form, return to home panel
function cancelSuggestion() {
	goHome()
}

// Logon function called from logon form submission.
function logOn(userId, pass) {
	// Web service URL and parameters, returns boolean result
	var webMethod = "ProjectServices.asmx/LogOn";
	var parameters = "{\"uid\":\"" + encodeURI(userId) + "\",\"pass\":\"" + encodeURI(pass) + "\"}";

	//jQuery ajax method
	$.ajax({
		type: "POST",
		url: webMethod,
		data: parameters,
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function (msg) {
			// If logon is successful, function calls to get user information and show the header
			if (msg.d) {
				getUser();
				showHeader();
			}
			// If login fails, notify user to on alert popup window
			else {
				alert("Log on failed.");
			}
		},
		error: function (e) {
			alert("LogOn web service communication error.");
		}
	});
}

// Function makes call to get the employeeID of the logged in user. Uses that value to call getEmployees function
function getUser() {
	// Web service URL, no parameters needed for this call.
	var webMethod = "ProjectServices.asmx/GetUserID";
	$.ajax({
		type: "POST",
		url: webMethod,
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function (msg) {
			// If data is returned form our GetUserID call, parse the value as an int, and pass it along as a parameter to getEmployees
			if (msg.d) {
				empID = parseInt(msg.d);
				getEmployees(empID);
			}
			else {
				console.log('Check data issue calling GetUserID web service.');
			}
		},
		error: function (e) {
			alert("GetUserID web service communication error.");
		}
	});
}

// Function gets all active employees. Then using the user id of the active user identifies the logged in employee record, their manager, and direct reports
function getEmployees(id) {
	// Web service URL, will use the function's id parameter to pass along in this call
	var webMethod = "ProjectServices.asmx/GetAllEmployees";
	$.ajax({
		type: "POST",
		url: webMethod,
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function (msg) {
			// If data is returned, identify and populate global variable allEmployees. 
			// Use allEmployees to find and populate currentEmployee record, currentManager, and directReports
			if (msg.d) {
				allEmployees = msg.d;

				// Find the logged in user in allEmployees
				currentEmployee = allEmployees.find(function (employee) {
					return employee.empUserId === id;
				});

				// Check if the logged in user has a manager
				if (currentEmployee.empManager && currentEmployee.empManager !== 0) {
					// Find the manager in allEmployees
					currentManager = allEmployees.find(function (manager) {
						return manager.empId === currentEmployee.empManager;
					});
				}

				// Find direct reports to current user
				directReports = allEmployees.filter(function (employee) {
					return employee.empManager === currentEmployee.empId;
				});

				// Call to function that uses the employee variables we just discovered and populates the user's home display panel
				updateHomeDisplay();
			}
			else {
				console.log('Check data issue calling GetAllEmployees web service.');
			}
		},
		error: function (e) {
			alert("GetAllEmployees web service communication error.");
		}
	});
}

// Function makes a web service call to end the current user session. Logs the user off both at the client and at the server
function logOff() {
	// Web service URL and parameters, returns boolean result
	var webMethod = "ProjectServices.asmx/LogOff";
	$.ajax({
		type: "POST",
		url: webMethod,
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function (msg) {
			// If log off is successful, make function calls to reset user data and restore default view
			if (msg.d) {
				clearData();
				hideHeader();
				showPanel('logonPanel');
			}
			else {
				console.log('Check data issue calling LogOff web service.');
			}
		},
		error: function (e) {
			alert("LogOff web service communication error.");
		}
	});
}

// Once logged in, show header
function showHeader() {
	$(".app-header").css("display", "flex");
}

// Once logged out, hide header
function hideHeader() {
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

// On the header, profile icon action to access user profile. Currently no action is taken.
function openUserProfile() {
	
}

// Function to populate home screen display user details, manager (if avaialble), and direct reports (if available)
function updateHomeDisplay() {
	$("#userInfoHtml").empty();
	var userInfoHtml = `
        <div class="userInfoCard">
            <h3>My Profile</h3>
            <p><strong>${currentEmployee.empFirstName} ${currentEmployee.empLastName}</strong><br>
            ${currentEmployee.empTitle}<br>
			${currentEmployee.empDepartment}</p>
        </div>
    `;

	if (currentManager) {
		userInfoHtml += `
            <div class="userInfoCard">
                <h3>My Manager</h3>
                <p><strong>${currentManager.empFirstName} ${currentManager.empLastName}</strong><br>
                ${currentManager.empTitle}<br>
				${currentManager.empDepartment}</p>
            </div>
        `;
	}

	// Direct reports will link to trigger a 1-on-1 meeting by making a call to initiateOneOnOne()
	if (directReports && directReports.length > 0) {
		userInfoHtml += `<div class="userInfoCard"><h3>Direct Reports</h3><ul>`;
		directReports.forEach(function (report) {
			userInfoHtml += `<li><a href="#" onclick="initiateOneOnOne(${report.empId});">${report.empFirstName} ${report.empLastName}</a> - ${report.empDepartment}</li>`;
		});
		userInfoHtml += `</ul><p>Click on a name to host a 1-on-1 meeting.</p></div>`;
	}

	$("#userInfoHtml").html(userInfoHtml);

	// Once employee information is posted, make call to load 1-on-1 meeting history
	loadMeetingHistory();

	// Show the Home Display Panel
	showPanel('homeDisplayPanel');
}

// Function will load all suggestion posts from the database into the suggestionDisplayPanel. Utilize the GetSuggestions web service.
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
				// Empty html div container
				$("#suggestionsContainer").empty();

				// Store suggestions globally, in reverse order newest on top
				allSuggestions = msg.d.reverse();

				// Filter suggestions if filterMode is 'department'
				var filteredSuggestions;
				if (filterMode === 'department') {
					filteredSuggestions = allSuggestions.filter(function (suggestion) {
						return suggestion.dept === currentEmployee.empDepartment;
					});
				} else {
					filteredSuggestions = allSuggestions;
				}
				
				// Use a for loop to iterate over the filtered suggestions array
				for (var i = 0; i < filteredSuggestions.length; i++) {
					var suggestion = filteredSuggestions[i];
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
							<div class="suggestionDetail"><strong><a href="#" onclick="displaySuggestionDetails('${suggestion.postId}'); return false;">#${suggestion.postId}</a></strong>  ${suggestion.date}</div>
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
			alert("GetSuggestions web service communication error.");
		}
	});
}

// Function will dive into a single suggestion. Display the suggestion details and pass along the current post ID to displaySuggestionComments function
function displaySuggestionDetails(postID) {

	// Empty container
	$("#suggestionDetails").empty();
	
	// Get the current suggestion based on the index passed into the function. Modify display name and department if the suggestion is annonymous or not
	var suggestion = allSuggestions.find(function (idea) {
		return idea.postId === parseInt(postID,10);
	});
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
			alert("GetComments web service communication error.");
		}
	});
}

// Function button action from new suggestions form. Post new entry into the database.
function submitSuggestion() {
	// Web service URL and parameters, void no return.
	var webMethod = "ProjectServices.asmx/NewSuggestion";
	// Collect form field values
	var anonymous = $('input[name="anonymous"]:checked').val();
	var summary = $('#summary').val();
	var benefitExplanation = $('#benefitExplanation').val();
	// Collect selected suggestion types in an array and encode each
	var suggestionTypes = [];
	$('input[name="suggestionType"]:checked').each(function () {
		var suggestionType = encodeURI($(this).val());
		suggestionTypes.push(suggestionType);
	});
	// String together all variables into parameters string
	var parameters = "{\"post\":\"" + encodeURI(summary) + "\",\"proposedSolution\":\"" + encodeURI(benefitExplanation) + "\",\"anon\":\"" + encodeURI(anonymous) + "\",\"checkboxData\":\"" + encodeURI(suggestionTypes) + "\"}";

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
			alert("Failed to submit new idea. Please try again.");
		}
	});
}

// Function button action from comment form of a suggestion detail panel. Post new comment into the database
function postReply() {
	// Web service URL and parameters, void no return.
	var webMethod = "ProjectServices.asmx/AddComment";
	// Collect form field values
	var currentPostID = $('#currentPostId').val();
	var comment = $('#comment').val();
	// String together all variables into parameters string
	var parameters = "{\"postId\":\"" + encodeURI(currentPostID) + "\",\"comment\":\"" + encodeURI(comment) + "\"}";

	$.ajax({
		type: "POST",
		url: webMethod,
		data: parameters,
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function (msg) {
			$('#comment').val(""); // Clear comment form			
			displaySuggestionComments(currentPostID); // Refresh the comments section
		},
		error: function (e) {
			alert("Failed to submit comment. Please try again.");
		}
	});
}

// Function URL anchor action from home display panel to bring up and populate new 1-on-1 meeting form
function initiateOneOnOne(directReportId) {
	// Set the IDs in the hidden fields
	$('#meetingMgrID').val(empID);
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

// Function button action from meeting form. Post meetin record into the database.
function submitMeetingDetails() {
	// Web service URL and parameters, void no return.
	var webMethod = "ProjectServices.asmx/NewOneOnOneAnswers";
	// Collect form field values
	var templateID = 1; // hard coded for now, ultimately manager may select from multiple templates
	var meetingMgrID = $('#meetingMgrID').val();
	var meetingEmpID = $('#meetingEmpID').val();
	var meetingA1 = $('#meetingA1').val();
	var meetingA2 = $('#meetingA2').val();
	var meetingA3 = $('#meetingA3').val();
	var meetingA4 = $('#meetingA4').val();
	var meetingA5 = $('#meetingA5').val();
	var meetingA6 = $('#meetingA6').val();
	// String together all variables into parameters string
	var parameters = "{\"templateId\":\"" + encodeURI(templateID) + "\",\"empId\":\"" + encodeURI(meetingEmpID) + "\",\"mgrId\":\"" + encodeURI(meetingMgrID) + "\",\"firstAnswer\":\"" + encodeURI(meetingA1)
					+ "\",\"secondAnswer\":\"" + encodeURI(meetingA2) + "\",\"thirdAnswer\":\"" + encodeURI(meetingA3) + "\",\"fourthAnswer\":\"" + encodeURI(meetingA4) + "\",\"fifthAnswer\":\""
					+ encodeURI(meetingA5) + "\",\"sixthAnswer\":\"" + encodeURI(meetingA6) + "\"}";

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

// Function to get 1-on-1 meeting history and load it into home panel
function loadMeetingHistory() {
	// Web service URL
	var webMethod = "ProjectServices.asmx/GetMeetings";
	$.ajax({
		type: "POST",
		url: webMethod,
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function (msg) {
			$("#meetingHistory").empty(); // Clear previous content regardless of outcome
			if (msg.d && msg.d.length > 0) {
				allMeetings = msg.d.reverse(); // Populate global variable for meeting details. This will be needed when we dive into meeting details later
				var meetingsHtml = `
                    <div class="meetingsContainer">
                        <h3>1-on-1 Meeting History</h3>
                        <ul class="meetingsList">
                `;
				// Add list item for each meeting. Add URl anchor to loadMeetingDetails()
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
			alert("GetMeetings web service communication error.");
		}
	});
}

// Function to build meeting history display panel
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

// Function used to toggle display of "recent feedback" page. Updates global variable for filterMode
// Used to control display to "My Department" or "Company Wide"
function toggleFilterMode() {
	var isChecked = $("#departmentToggle").is(":checked");

	filterMode = isChecked ? 'all' : 'department';
	$("#toggleLabel").text(filterMode === 'all' ? "Company Wide" : "My Department");

	// Reload suggestions based on the new filter mode
	loadSuggestions();
}