using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Web;

namespace ProjectTemplate
{
    public class Employee
    {
        //container to hold all info related to a single employee
        public int empId;
        public string empFirstName;
        public string empLastName;
        public string empDepartment;
        public string empTitle;
        public int empManager;
        public string mgrFirstName;
        public string mgrLastName;
        public int empUserId;

    }
}