using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Web;

namespace ProjectTemplate
{
    public class Suggestion
    {
        //container to hold all info related to a single suggestion
        public int postId;
        public int empId;
        public string post;
        public string proposedSolution;
        public string date;
        public string likes;
        public string anon;
        public string checkboxData;

    }
}