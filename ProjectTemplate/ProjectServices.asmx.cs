using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Services;
using MySql.Data;
using MySql.Data.MySqlClient;
using System.Data;
using System.Web.UI.WebControls;
using System.Security.Principal;
using Org.BouncyCastle.Bcpg;
using System.Web.Services.Description;

namespace ProjectTemplate
{
	[WebService(Namespace = "http://tempuri.org/")]
	[WebServiceBinding(ConformsTo = WsiProfiles.BasicProfile1_1)]
	[System.ComponentModel.ToolboxItem(false)]
	[System.Web.Script.Services.ScriptService]

	public class ProjectServices : System.Web.Services.WebService
	{
		////////////////////////////////////////////////////////////////////////
		///replace the values of these variables with your database credentials
		////////////////////////////////////////////////////////////////////////
		private string dbID = "spring2024team7";
		private string dbPass = "spring2024team7";
		private string dbName = "spring2024team7";
		////////////////////////////////////////////////////////////////////////
		
		////////////////////////////////////////////////////////////////////////
		///call this method anywhere that you need the connection string!
		////////////////////////////////////////////////////////////////////////
		private string getConString() {
			return "SERVER=107.180.1.16; PORT=3306; DATABASE=" + dbName+"; UID=" + dbID + "; PASSWORD=" + dbPass;
        }
		////////////////////////////////////////////////////////////////////////



		/////////////////////////////////////////////////////////////////////////
		//don't forget to include this decoration above each method that you want
		//to be exposed as a web service!
		[WebMethod(EnableSession = true)]
		/////////////////////////////////////////////////////////////////////////
		public string TestConnection()
		{
			try
			{
				string testQuery = "select * from test_connection";

				////////////////////////////////////////////////////////////////////////
				///here's an example of using the getConString method!
				////////////////////////////////////////////////////////////////////////
				MySqlConnection con = new MySqlConnection(getConString());
				////////////////////////////////////////////////////////////////////////

				MySqlCommand cmd = new MySqlCommand(testQuery, con);
				MySqlDataAdapter adapter = new MySqlDataAdapter(cmd);
				DataTable table = new DataTable();
				adapter.Fill(table);
				return "Success!";
			}
			catch (Exception e)
			{
				return "Something went wrong, please check your credentials and db name and try again.  Error: "+e.Message;
			}
		}

        [WebMethod(EnableSession = true)] //NOTICE: gotta enable session on each individual method
        public bool LogOn(string uid, string pass)
        {
            //we return this flag to tell them if they logged in or not
            bool success = false;

			//our connection string comes from our web.config file like we talked about earlier
			string sqlConnectString = getConString();
            //here's our query.  A basic select with nothing fancy.  Note the parameters that begin with @
            //NOTICE: we added admin to what we pull, so that we can store it along with the id in the session
            string sqlSelect = "SELECT UserID, Admin, Employees.EmpID, Employees.ManagerID FROM Users " +
                "INNER JOIN Employees ON Users.EmpID=Employees.EmpID " +
                "WHERE LoginID=@idValue and LoginPass=@passValue;";

            //set up our connection object to be ready to use our connection string
            MySqlConnection sqlConnection = new MySqlConnection(sqlConnectString);
            //set up our command object to use our connection, and our query
            MySqlCommand sqlCommand = new MySqlCommand(sqlSelect, sqlConnection);

            //tell our command to replace the @parameters with real values
            //we decode them because they came to us via the web so they were encoded
            //for transmission (funky characters escaped, mostly)
            sqlCommand.Parameters.AddWithValue("@idValue", HttpUtility.UrlDecode(uid));
            sqlCommand.Parameters.AddWithValue("@passValue", HttpUtility.UrlDecode(pass));

            //a data adapter acts like a bridge between our command object and 
            //the data we are trying to get back and put in a table object
            MySqlDataAdapter sqlDa = new MySqlDataAdapter(sqlCommand);
            //here's the table we want to fill with the results from our query
            DataTable sqlDt = new DataTable();
            //here we go filling it!
            sqlDa.Fill(sqlDt);
            //check to see if any rows were returned.  If they were, it means it's 
            //a legit account
            if (sqlDt.Rows.Count > 0)
            {
                //if we found an account, store the userId, admin status, empId, and managerId in the session
                //so we can check those values later on other method calls to see if they 
                //are 1) logged in at all, 2) admin or not, 3) what their empId is, 4) who their manager is
                Session["UserID"] = sqlDt.Rows[0]["UserID"];
                Session["Admin"] = sqlDt.Rows[0]["Admin"];
                Session["EmpID"] = sqlDt.Rows[0]["EmpID"];
                Session["ManagerID"] = sqlDt.Rows[0]["ManagerID"];
                success = true;
            }
            //return the result!
            return success;
        }

        [WebMethod(EnableSession = true)]
        public bool LogOff()
        {
            //if they log off, then we remove the session.  That way, if they access
            //again later they have to log back on in order for their ID to be back
            //in the session!
            Session.Abandon();
            return true;
        }

        [WebMethod(EnableSession = true)]
        public void NewAccount(string uid, string pass, string fName, string lName, string dept, string admin, string title, string manager)
        {
            string sqlConnectString = getConString();
            //this query inserts into Employees and Users table in database with appropriate values. 
            //the only thing fancy about this query is SELECT LAST_INSERT_ID() at the end.  All that
            //does is tell mySql server to return the primary key of the last inserted row.
            string sqlSelect = "insert into Employees (EmpFName, EmpLName, DeptID, TitleID, ManagerID) " +
                "values(@fnameValue, @lnameValue, @deptValue, @titleValue, @managerValue); " +
                "insert into Users (LoginID, LoginPass, EmpID, Admin) " +
                "values(@idValue, @passValue, (SELECT EmpID from Employees WHERE EmpFName=@fnameValue AND EmpLName=@lnameValue), @adminValue); " +
                "SELECT LAST_INSERT_ID();";

            MySqlConnection sqlConnection = new MySqlConnection(sqlConnectString);
            MySqlCommand sqlCommand = new MySqlCommand(sqlSelect, sqlConnection);

            sqlCommand.Parameters.AddWithValue("@idValue", HttpUtility.UrlDecode(uid));
            sqlCommand.Parameters.AddWithValue("@passValue", HttpUtility.UrlDecode(pass));
            sqlCommand.Parameters.AddWithValue("@fnameValue", HttpUtility.UrlDecode(fName));
            sqlCommand.Parameters.AddWithValue("@lnameValue", HttpUtility.UrlDecode(lName));
            sqlCommand.Parameters.AddWithValue("@deptValue", HttpUtility.UrlDecode(dept));
            sqlCommand.Parameters.AddWithValue("@adminValue", HttpUtility.UrlDecode(admin));
            sqlCommand.Parameters.AddWithValue("@titleValue", HttpUtility.UrlDecode(title));
            sqlCommand.Parameters.AddWithValue("@managerValue", HttpUtility.UrlDecode(manager));

            //this time, we're not using a data adapter to fill a data table.  We're just
            //opening the connection, telling our command to "executescalar" which says basically
            //execute the query and just hand me back the number the query returns (the ID, remember?).
            //don't forget to close the connection!
            sqlConnection.Open();
            //we're using a try/catch so that if the query errors out we can handle it gracefully
            //by closing the connection and moving on
            try
            {
                int empId = Convert.ToInt32(sqlCommand.ExecuteScalar());
                //here, you could use this empID for additional queries regarding
                //the requested employee.  Really this is just an example to show you
                //a query where you get the primary key of the inserted row back from
                //the database!
            }
            catch (Exception e)
            {
            }
            sqlConnection.Close();
        }

        [WebMethod(EnableSession = true)]
        public void DeleteAccount(string id)
        {
            if (Convert.ToInt32(Session["Admin"]) == 1)
            {
                string sqlConnectString = getConString();
                //this is a simple update, with parameters to pass in values
                string sqlSelect = "update Employees SET IsDeleted=1 WHERE EmpID=@idValue;";

                MySqlConnection sqlConnection = new MySqlConnection(sqlConnectString);
                MySqlCommand sqlCommand = new MySqlCommand(sqlSelect, sqlConnection);

                sqlCommand.Parameters.AddWithValue("@idValue", HttpUtility.UrlDecode(id));

                sqlConnection.Open();
                try
                {
                    sqlCommand.ExecuteNonQuery();
                }
                catch (Exception e)
                {
                }
                sqlConnection.Close();
            }
        }

        [WebMethod(EnableSession = true)]
        public void RestoreAccount(string id)
        {
            if (Convert.ToInt32(Session["Admin"]) == 1)
            {
                string sqlConnectString = getConString();
                //this is a simple update, with parameters to pass in values
                string sqlSelect = "update Employees SET IsDeleted=0 WHERE EmpID=@idValue;";

                MySqlConnection sqlConnection = new MySqlConnection(sqlConnectString);
                MySqlCommand sqlCommand = new MySqlCommand(sqlSelect, sqlConnection);

                sqlCommand.Parameters.AddWithValue("@idValue", HttpUtility.UrlDecode(id));

                sqlConnection.Open();
                try
                {
                    sqlCommand.ExecuteNonQuery();
                }
                catch (Exception e)
                {
                }
                sqlConnection.Close();
            }
        }


        [WebMethod(EnableSession = true)]
        public void NewSuggestion(string post, string proposedSolution, string anon, string checkboxData)
        {
            //convert stored Session EmpID to an integer
            int empId = Convert.ToInt32(Session["EmpID"]);

            string sqlConnectString = getConString();
            //the only thing fancy about this query is SELECT LAST_INSERT_ID() at the end.  All that
            //does is tell mySql server to return the primary key of the last inserted row.
            string sqlSelect = "insert into Posts (EmpID, Post, ProposedSolution, Date, Anon, CheckboxData) " +
                "values(@empIdValue, @postValue, @proposedSolutionValue, CURRENT_TIMESTAMP, @anonValue, @checkboxDataValue); " +
                "SELECT LAST_INSERT_ID();";

            MySqlConnection sqlConnection = new MySqlConnection(sqlConnectString);
            MySqlCommand sqlCommand = new MySqlCommand(sqlSelect, sqlConnection);

            sqlCommand.Parameters.AddWithValue("@empIdValue", empId);
            sqlCommand.Parameters.AddWithValue("@postValue", HttpUtility.UrlDecode(post));
            sqlCommand.Parameters.AddWithValue("@proposedSolutionValue", HttpUtility.UrlDecode(proposedSolution));
            sqlCommand.Parameters.AddWithValue("@anonValue", HttpUtility.UrlDecode(anon));
            sqlCommand.Parameters.AddWithValue("@checkboxDataValue", HttpUtility.UrlDecode(checkboxData));

            //this time, we're not using a data adapter to fill a data table.  We're just
            //opening the connection, telling our command to "executescalar" which says basically
            //execute the query and just hand me back the number the query returns (the ID, remember?).
            //don't forget to close the connection!
            sqlConnection.Open();
            //we're using a try/catch so that if the query errors out we can handle it gracefully
            //by closing the connection and moving on
            try
            {
                int postID = Convert.ToInt32(sqlCommand.ExecuteScalar());
                //here, you could use this postID for additional queries regarding
                //the requested post.  Really this is just an example to show you
                //a query where you get the primary key of the inserted row back from
                //the database!
            }
            catch (Exception e)
            {
            }
            sqlConnection.Close();
        }

        [WebMethod(EnableSession = true)]
        public Suggestion[] GetSuggestions()
        {
            //check out the return type.  It's an array of Suggestion objects.  You can look at our custom Suggestion class in this solution to see that it's 
            //just a container for public class-level variables.  It's a simple container that asp.net will have no trouble converting into json.  When we return
            //sets of information, it's a good idea to create a custom container class to represent instances (or rows) of that information, and then return an array
            //of those objects. Keeps everything simple.

            //WE ONLY SHARE DATA WITH LOGGED IN USERS!
            if (Session["UserID"] != null)
            {
                DataTable sqlDt = new DataTable("suggestions");

                string sqlConnectString = getConString();
                string sqlSelect = "select Posts.PostID, Employees.EmpID, Employees.EmpFName, Employees.EmpLName, Departments.Dept, Posts.Post, Posts.ProposedSolution, " + 
                    "Posts.Date, Posts.Likes, Posts.Anon, Posts.CheckboxData " +
                    "FROM Posts INNER JOIN Employees ON Posts.EmpID=Employees.EmpID " +
                    "INNER JOIN Departments ON Employees.DeptID = Departments.DeptID " +
                    "ORDER BY Date;";

                MySqlConnection sqlConnection = new MySqlConnection(sqlConnectString);
                MySqlCommand sqlCommand = new MySqlCommand(sqlSelect, sqlConnection);

                //gonna use this to fill a data table
                MySqlDataAdapter sqlDa = new MySqlDataAdapter(sqlCommand);
                //filling the data table
                sqlDa.Fill(sqlDt);

                //loop through each row in the dataset, creating instances
                //of our container class Suggestion.  Fill each object with
                //data from the rows, then dump them in a list.
                List<Suggestion> suggestions = new List<Suggestion>();
                for (int i = 0; i < sqlDt.Rows.Count; i++)
                {
                    //check for anonymity. only display minimal information if anonymous is true.
                    if (sqlDt.Columns.Contains("Anon"))
                    {
                        string isAnon = Convert.ToString(sqlDt.Rows[i]["Anon"]);

                        if (isAnon == "true")
                        {
                            suggestions.Add(new Suggestion
                            {
                                postId = Convert.ToInt32(sqlDt.Rows[i]["PostID"]),
                                post = sqlDt.Rows[i]["Post"].ToString(),
                                proposedSolution = sqlDt.Rows[i]["ProposedSolution"].ToString(),
                                date = sqlDt.Rows[i]["Date"].ToString(),
                                likes = sqlDt.Rows[i]["Likes"].ToString(),
                                anon = "true",
                                checkboxData = sqlDt.Rows[i]["CheckboxData"].ToString()
                            });
                        }
                        else
                        {
                            suggestions.Add(new Suggestion
                            {
                                postId = Convert.ToInt32(sqlDt.Rows[i]["PostID"]),
                                empId = Convert.ToInt32(sqlDt.Rows[i]["EmpID"]),
                                empFirstName = sqlDt.Rows[i]["EmpFName"].ToString(),
                                empLastName = sqlDt.Rows[i]["EmpLName"].ToString(),
                                dept = sqlDt.Rows[i]["Dept"].ToString(),
                                post = sqlDt.Rows[i]["Post"].ToString(),
                                proposedSolution = sqlDt.Rows[i]["ProposedSolution"].ToString(),
                                date = sqlDt.Rows[i]["Date"].ToString(),
                                likes = sqlDt.Rows[i]["Likes"].ToString(),
                                anon = sqlDt.Rows[i]["Anon"].ToString(),
                                checkboxData = sqlDt.Rows[i]["CheckboxData"].ToString()
                            });
                        }
                    }
                }
                //convert the list of suggestions to an array and return!
                return suggestions.ToArray();
            }
            else
            {
                //if they're not logged in, return an empty array
                return new Suggestion[0];
            }
        }

        [WebMethod(EnableSession = true)]
        public void AddComment(string postId, string comment)
        {
            string sqlConnectString = getConString();
            //the only thing fancy about this query is SELECT LAST_INSERT_ID() at the end.  All that
            //does is tell mySql server to return the primary key of the last inserted row.
            string sqlSelect = "insert into Comments (EmpID, PostID, Comment, Date) " +
                "values(@empIdValue, @postIdValue, @commentValue, CURRENT_TIMESTAMP); SELECT LAST_INSERT_ID();";

            MySqlConnection sqlConnection = new MySqlConnection(sqlConnectString);
            MySqlCommand sqlCommand = new MySqlCommand(sqlSelect, sqlConnection);

            sqlCommand.Parameters.AddWithValue("@empIdValue", Convert.ToInt32(Session["EmpID"]));
            sqlCommand.Parameters.AddWithValue("@postIdValue", HttpUtility.UrlDecode(postId));
            sqlCommand.Parameters.AddWithValue("@commentValue", HttpUtility.UrlDecode(comment));

            //this time, we're not using a data adapter to fill a data table.  We're just
            //opening the connection, telling our command to "executescalar" which says basically
            //execute the query and just hand me back the number the query returns (the ID, remember?).
            //don't forget to close the connection!
            sqlConnection.Open();
            //we're using a try/catch so that if the query errors out we can handle it gracefully
            //by closing the connection and moving on
            try
            {
                int commentID = Convert.ToInt32(sqlCommand.ExecuteScalar());
                //here, you could use this commentID for additional queries regarding
                //the requested comment.  Really this is just an example to show you
                //a query where you get the primary key of the inserted row back from
                //the database!
            }
            catch (Exception e)
            {
            }
            sqlConnection.Close();
        }

        [WebMethod(EnableSession = true)]
        public Comment[] GetComments(string postId)
        {
            //check out the return type.  It's an array of Comment objects.  You can look at our custom Comment class in this solution to see that it's 
            //just a container for public class-level variables.  It's a simple container that asp.net will have no trouble converting into json.  When we return
            //sets of information, it's a good idea to create a custom container class to represent instances (or rows) of that information, and then return an array of those objects.  
            //Keeps everything simple.

            //WE ONLY SHARE DATA WITH LOGGED IN USERS!
            if (Session["UserID"] != null)
            {
                DataTable sqlDt = new DataTable("comments");

                string sqlConnectString = getConString();
                string sqlSelect = "select Comments.CommentID, Employees.EmpID, Employees.EmpFName, Employees.EmpLName, Departments.Dept, Comments.Comment, " +
                    "Comments.Date, Comments.Likes " +
                    "FROM Comments INNER JOIN Employees ON Comments.EmpID=Employees.EmpID " +
                    "INNER JOIN Departments on Employees.DeptID=Departments.DeptID " +
                    "WHERE PostID=@postIdValue;";

                MySqlConnection sqlConnection = new MySqlConnection(sqlConnectString);
                MySqlCommand sqlCommand = new MySqlCommand(sqlSelect, sqlConnection);

                sqlCommand.Parameters.AddWithValue("@postIdValue", HttpUtility.UrlDecode(postId));

                //gonna use this to fill a data table
                MySqlDataAdapter sqlDa = new MySqlDataAdapter(sqlCommand);
                //filling the data table
                sqlDa.Fill(sqlDt);

                //loop through each row in the dataset, creating instances
                //of our container class Comment.  Fill each object with
                //data from the rows, then dump them in a list.
                List<Comment> comments = new List<Comment>();
                for (int i = 0; i < sqlDt.Rows.Count; i++)
                {

                    comments.Add(new Comment
                    {
                        commentId = Convert.ToInt32(sqlDt.Rows[i]["CommentID"]),
                        empId = Convert.ToInt32(sqlDt.Rows[i]["EmpID"]),
                        empFirstName = sqlDt.Rows[i]["EmpFName"].ToString(),
                        empLastName = sqlDt.Rows[i]["EmpLName"].ToString(),
                        dept = sqlDt.Rows[i]["Dept"].ToString(),
                        postComment = sqlDt.Rows[i]["Comment"].ToString(),
                        date = sqlDt.Rows[i]["Date"].ToString(),
                        likes = sqlDt.Rows[i]["Likes"].ToString(),
                    });
                }
                //convert the list of suggestions to an array and return!
                return comments.ToArray();
            }
            else
            {
                //if they're not logged in, return an empty array
                return new Comment[0];
            }
        }
        [WebMethod(EnableSession = true)]
        public Employee[] GetDirectReports()
        {
            //check out the return type.  It's an array of Employee objects.  You can look at our custom Employoee class in this solution to see that it's 
            //just a container for public class-level variables.  It's a simple container that asp.net will have no trouble converting into json.  When we return
            //sets of information, it's a good idea to create a custom container class to represent instances (or rows) of that information, and then return an array of those objects.  
            //Keeps everything simple.

            //WE ONLY SHARE DATA WITH LOGGED IN USERS!
            if (Session["UserID"] != null)
            {
                //convert session ManagerID into integer
                int empId = Convert.ToInt32(Session["EmpID"]);
                DataTable sqlDt = new DataTable("directReports");

                string sqlConnectString = getConString();
                string sqlSelect = "select Employees.EmpID, Employees.EmpFName, Employees.EmpLName, Departments.Dept, Titles.Title, Employees.ManagerID " +
                    "FROM Employees " +
                    "INNER JOIN Departments ON Employees.DeptID=Departments.DeptID " +
                    "INNER JOIN Titles ON Employees.TitleID=Titles.TitleID " +
                    "WHERE ManagerID=@empIdValue AND IsDeleted=0;";

                MySqlConnection sqlConnection = new MySqlConnection(sqlConnectString);
                MySqlCommand sqlCommand = new MySqlCommand(sqlSelect, sqlConnection);

                sqlCommand.Parameters.AddWithValue("@empIdValue", empId);

                //gonna use this to fill a data table
                MySqlDataAdapter sqlDa = new MySqlDataAdapter(sqlCommand);
                //filling the data table
                sqlDa.Fill(sqlDt);

                //loop through each row in the dataset, creating instances
                //of our container class Comment.  Fill each object with
                //data from the rows, then dump them in a list.
                List<Employee> directReports = new List<Employee>();
                for (int i = 0; i < sqlDt.Rows.Count; i++)
                {

                    directReports.Add(new Employee
                    {
                        empId = Convert.ToInt32(sqlDt.Rows[i]["EmpID"]),
                        empFirstName = sqlDt.Rows[i]["EmpFName"].ToString(),
                        empLastName = sqlDt.Rows[i]["EmpLName"].ToString(),
                        empDepartment = sqlDt.Rows[i]["Dept"].ToString(),
                        empTitle = sqlDt.Rows[i]["Title"].ToString(),
                        empManager = Convert.ToInt32(sqlDt.Rows[i]["ManagerID"]),
                    });
                }
                //convert the list of suggestions to an array and return!
                return directReports.ToArray();
            }
            else
            {
                //if they're not logged in, return an empty array
                return new Employee[0];
            }
        }

        [WebMethod(EnableSession = true)]
        public Employee[] GetAllEmployees()
        {
            //check out the return type.  It's an array of Employee objects.  You can look at our custom Employoee class in this solution to see that it's 
            //just a container for public class-level variables.  It's a simple container that asp.net will have no trouble converting into json.  When we return
            //sets of information, it's a good idea to create a custom container class to represent instances (or rows) of that information, and then return an array of those objects.  
            //Keeps everything simple.

            //WE ONLY SHARE DATA WITH LOGGED IN USERS!
            if (Session["UserID"] != null)
            {

                DataTable sqlDt = new DataTable("allEmployees");

                string sqlConnectString = getConString();
                string sqlSelect = "select Employees.EmpID, Employees.EmpFName, Employees.EmpLName, Departments.Dept, Titles.Title, ifNull(Employees.ManagerID,0) as ManagerID " +
                    "FROM Employees " +
                    "INNER JOIN Departments ON Employees.DeptID=Departments.DeptID " +
                    "INNER JOIN Titles ON Employees.TitleID=Titles.TitleID " +
                    "WHERE IsDeleted=0 " +
                    "ORDER BY EmpFName;";

                MySqlConnection sqlConnection = new MySqlConnection(sqlConnectString);
                MySqlCommand sqlCommand = new MySqlCommand(sqlSelect, sqlConnection);

                //gonna use this to fill a data table
                MySqlDataAdapter sqlDa = new MySqlDataAdapter(sqlCommand);
                //filling the data table
                sqlDa.Fill(sqlDt);

                //loop through each row in the dataset, creating instances
                //of our container class Comment.  Fill each object with
                //data from the rows, then dump them in a list.
                List<Employee> allEmployees = new List<Employee>();
                for (int i = 0; i < sqlDt.Rows.Count; i++)
                {
                    allEmployees.Add(new Employee
                    {
                        empId = Convert.ToInt32(sqlDt.Rows[i]["EmpID"]),
                        empFirstName = sqlDt.Rows[i]["EmpFName"].ToString(),
                        empLastName = sqlDt.Rows[i]["EmpLName"].ToString(),
                        empDepartment = sqlDt.Rows[i]["Dept"].ToString(),
                        empTitle = sqlDt.Rows[i]["Title"].ToString(),
                        empManager = Convert.ToInt32(sqlDt.Rows[i]["ManagerID"]),

                    });
                }
                //convert the list of suggestions to an array and return!
                return allEmployees.ToArray();
            }
            else
            {
                //if they're not logged in, return an empty array
                return new Employee[0];
            }
        }

        [WebMethod(EnableSession = true)]
        public string GetUserID()
        {
            // Check if the user is logged in
            if (Session["UserID"] != null)
            {
                // Return the UserID from the session
                return Session["UserID"].ToString();
            }
            else
            {
                // Return a message indicating that the user is not logged in
                return "User is not logged in.";
            }
        }

        [WebMethod(EnableSession = true)]
        public void NewOneOnOneAnswers(string templateId, string empId, string mgrId, string firstAnswer, string secondAnswer, string thirdAnswer, string fourthAnswer, string fifthAnswer, string sixthAnswer)
        {

            string sqlConnectString = getConString();
            //the only thing fancy about this query is SELECT LAST_INSERT_ID() at the end.  All that
            //does is tell mySql server to return the primary key of the last inserted row.
            string sqlSelect = "insert into Meetings (Date, TemplateID, EmpID, ManagerID, A1, A2, A3, A4, A5, A6) " +
                "values(CURRENT_TIMESTAMP, @templateIdValue, @empIdValue, @mgrIdValue, " +
                "@firstAnswerValue, @secondAnswerValue, @thirdAnswerValue, @fourthAnswerValue, @fifthAnswerValue, @sixthAnswerValue); " +
                "SELECT LAST_INSERT_ID();";

            MySqlConnection sqlConnection = new MySqlConnection(sqlConnectString);
            MySqlCommand sqlCommand = new MySqlCommand(sqlSelect, sqlConnection);

            sqlCommand.Parameters.AddWithValue("@templateIdValue", HttpUtility.UrlDecode(templateId));
            sqlCommand.Parameters.AddWithValue("@empIdValue", HttpUtility.UrlDecode(empId));
            sqlCommand.Parameters.AddWithValue("@mgrIdValue", HttpUtility.UrlDecode(mgrId));
            sqlCommand.Parameters.AddWithValue("@firstAnswerValue", HttpUtility.UrlDecode(firstAnswer));
            sqlCommand.Parameters.AddWithValue("@secondAnswerValue", HttpUtility.UrlDecode(secondAnswer));
            sqlCommand.Parameters.AddWithValue("@thirdAnswerValue", HttpUtility.UrlDecode(thirdAnswer));
            sqlCommand.Parameters.AddWithValue("@fourthAnswerValue", HttpUtility.UrlDecode(fourthAnswer));
            sqlCommand.Parameters.AddWithValue("@fifthAnswerValue", HttpUtility.UrlDecode(fifthAnswer));
            sqlCommand.Parameters.AddWithValue("@sixthAnswerValue", HttpUtility.UrlDecode(sixthAnswer));

            //this time, we're not using a data adapter to fill a data table.  We're just
            //opening the connection, telling our command to "executescalar" which says basically
            //execute the query and just hand me back the number the query returns (the ID, remember?).
            //don't forget to close the connection!
            sqlConnection.Open();
            //we're using a try/catch so that if the query errors out we can handle it gracefully
            //by closing the connection and moving on
            try
            {
                int meetingId = Convert.ToInt32(sqlCommand.ExecuteScalar());
                //here, you could use this postID for additional queries regarding
                //the requested post.  Really this is just an example to show you
                //a query where you get the primary key of the inserted row back from
                //the database!
            }
            catch (Exception e)
            {
            }
            sqlConnection.Close();
        }

        [WebMethod(EnableSession = true)]
        public void NewOneOnOneTemplate(string firstQuestion, string secondQuestion, string thirdQuestion, string fourthQuestion, string fifthQuestion, string sixthQuestion)
        {
            if (Convert.ToInt32(Session["Admin"]) == 1)
            {
                string sqlConnectString = getConString();
                //the only thing fancy about this query is SELECT LAST_INSERT_ID() at the end.  All that
                //does is tell mySql server to return the primary key of the last inserted row.
                string sqlSelect = "insert into MeetingTemplate (Q1, Q2, Q3, Q4, Q5, Q6) " +
                    "values (@firstQuestionValue, @secondQuestionValue, @thirdQuestionValue, @fourthQuestionValue, @fifthQuestionValue, @sixthQuestionValue); " +
                    "SELECT LAST_INSERT_ID();";

                MySqlConnection sqlConnection = new MySqlConnection(sqlConnectString);
                MySqlCommand sqlCommand = new MySqlCommand(sqlSelect, sqlConnection);

                sqlCommand.Parameters.AddWithValue("@firstQuestionValue", HttpUtility.UrlDecode(firstQuestion));
                sqlCommand.Parameters.AddWithValue("@secondQuestionValue", HttpUtility.UrlDecode(secondQuestion));
                sqlCommand.Parameters.AddWithValue("@thirdQuestionValue", HttpUtility.UrlDecode(thirdQuestion));
                sqlCommand.Parameters.AddWithValue("@fourthQuestionValue", HttpUtility.UrlDecode(fourthQuestion));
                sqlCommand.Parameters.AddWithValue("@fifthQuestionValue", HttpUtility.UrlDecode(fifthQuestion));
                sqlCommand.Parameters.AddWithValue("@sixthQuestionValue", HttpUtility.UrlDecode(sixthQuestion));

                //this time, we're not using a data adapter to fill a data table.  We're just
                //opening the connection, telling our command to "executescalar" which says basically
                //execute the query and just hand me back the number the query returns (the ID, remember?).
                //don't forget to close the connection!
                sqlConnection.Open();
                //we're using a try/catch so that if the query errors out we can handle it gracefully
                //by closing the connection and moving on
                try
                {
                    int meetingId = Convert.ToInt32(sqlCommand.ExecuteScalar());
                    //here, you could use this postID for additional queries regarding
                    //the requested post.  Really this is just an example to show you
                    //a query where you get the primary key of the inserted row back from
                    //the database!
                }
                catch (Exception e)
                {
                }
                sqlConnection.Close();

            }
        }
        [WebMethod(EnableSession = true)]
        public Meeting[] GetMeetings()
        {
            //check out the return type.  It's an array of Meeting objects.  You can look at our custom Meeting class in this solution to see that it's 
            //just a container for public class-level variables.  It's a simple container that asp.net will have no trouble converting into json.  When we return
            //sets of information, it's a good idea to create a custom container class to represent instances (or rows) of that information, and then return an array of those objects.  
            //Keeps everything simple.

            //WE ONLY SHARE DATA WITH LOGGED IN USERS!
            if (Session["UserID"] != null)
            {

                DataTable sqlDt = new DataTable("meetings");

                string sqlConnectString = getConString();
                string sqlSelect = "select MeetingID, Date, EMP.EmpFName, EMP.EmpLName, Titles.Title, Departments.Dept, Meetings.ManagerID, " +
                    "MGR.EmpFName as MgrFName, MGR.EmpLName as MgrLName, A1, A2, A3, A4, A5, A6, Q1, Q2, Q3, Q4, Q5, Q6 " +
                    "FROM Meetings " +
                    "INNER JOIN Employees as EMP ON Meetings.EmpID=EMP.EmpID " +
                    "INNER JOIN Employees as MGR ON Meetings.ManagerID=MGR.EmpID " +
                    "INNER JOIN Departments ON EMP.DeptID=Departments.DeptID " +
                    "INNER JOIN Titles ON EMP.TitleID=Titles.TitleID " +
                    "INNER JOIN MeetingTemplate on MeetingTemplate.TemplateID=Meetings.TemplateID " +
                    "WHERE Meetings.EmpID=@empIdValue or  Meetings.ManagerID=@empIdValue " +
                    "ORDER BY Date;";

                MySqlConnection sqlConnection = new MySqlConnection(sqlConnectString);
                MySqlCommand sqlCommand = new MySqlCommand(sqlSelect, sqlConnection);

                sqlCommand.Parameters.AddWithValue("@empIdValue", Convert.ToInt32(Session["EmpID"]));

                //gonna use this to fill a data table
                MySqlDataAdapter sqlDa = new MySqlDataAdapter(sqlCommand);
                //filling the data table
                sqlDa.Fill(sqlDt);

                //loop through each row in the dataset, creating instances
                //of our container class Comment.  Fill each object with
                //data from the rows, then dump them in a list.
                List<Meeting> allMeetings = new List<Meeting>();
                for (int i = 0; i < sqlDt.Rows.Count; i++)
                {
                    allMeetings.Add(new Meeting
                    {
                        meetingId = Convert.ToInt32(sqlDt.Rows[i]["MeetingID"]),
                        date = Convert.ToDateTime(sqlDt.Rows[i]["Date"]).ToString("M/d/yyyy"),
                        empId = Convert.ToInt32(Session["EmpID"]),
                        empFirstName = sqlDt.Rows[i]["EmpFName"].ToString(),
                        empLastName = sqlDt.Rows[i]["EmpLName"].ToString(),
                        empDepartment = sqlDt.Rows[i]["Dept"].ToString(),
                        empTitle = sqlDt.Rows[i]["Title"].ToString(),
                        empMgrId = Convert.ToInt32(sqlDt.Rows[i]["ManagerID"]),
                        mgrFirstName = sqlDt.Rows[i]["MgrFName"].ToString(),
                        mgrLastName = sqlDt.Rows[i]["MgrLName"].ToString(),
                        answerOne = sqlDt.Rows[i]["A1"].ToString(),
                        answerTwo = sqlDt.Rows[i]["A2"].ToString(),
                        answerThree = sqlDt.Rows[i]["A3"].ToString(),
                        answerFour = sqlDt.Rows[i]["A4"].ToString(),
                        answerFive = sqlDt.Rows[i]["A5"].ToString(),
                        answerSix = sqlDt.Rows[i]["A6"].ToString(),
                        questionOne = sqlDt.Rows[i]["Q1"].ToString(),
                        questionTwo = sqlDt.Rows[i]["Q2"].ToString(),
                        questionThree = sqlDt.Rows[i]["Q3"].ToString(),
                        questionFour = sqlDt.Rows[i]["Q4"].ToString(),
                        questionFive = sqlDt.Rows[i]["Q5"].ToString(),
                        questionSix = sqlDt.Rows[i]["Q6"].ToString(),

                    });
                }
                //convert the list of suggestions to an array and return!
                return allMeetings.ToArray();
            }
            else
            {
                //if they're not logged in, return an empty array
                return new Meeting[0];
            }
        }

    }
}
