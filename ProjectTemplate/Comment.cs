using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Web;

namespace ProjectTemplate
{
    public class Comment
    {
        //container to hold all info related to a single comment
        public int commentId;
        public int empId;
        public string empFirstName;
        public string empLastName;
        public string dept;
        public string postComment;
        public string date;
        public string likes;
        
    }
}