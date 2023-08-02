// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       P R O J E C T                                          //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Project_Read(id)
{
 var project = await Core_Api("Project_Read", {id});
 
 return project;
}



async function Project_Assign(student_id, class_id, project_group = 0, project_id)
{
 // CREATE STUDENT'S DATABASE RECORD
 var id   = await Core_Api("Project_Assign", {student_id, class_id, project_group, project_id});
 
 // CREATE (OR RETRIEVE) GROUP'S GOOGLE DRIVE LINK
 var url  = await Project_GetFile(class_id, project_id)
 
 return {id, url};
}





async function Project_GetFile(class_id = 0, project_id = 0)
{
 var name = class_id + "-" + project_group;
 var url  = await Request_Post(document.location.origin + "/services/google/file_create.php", {type : "slides", name}, "json");
 
 return url;
}




function Project_Group_Display(n, students, options = {})
{ 
 var element = UI_Element_Create("projects/project-group", {n}, {language:"classroom/projects"});
 Document_Element_SetData(element, "group", n);
 
 // FIND GROUP PROJECT FILE URL
 if(options["file"])
 {
  var url = Projects_Group_GetFile(students);
  if(url)
  {
   var icon           = UI_Element_Find(element, "file");
   Document_Element_SetData(icon, "url", url);
   
   icon.style.display = "flex";
   icon.onclick       = options["file"];
  }
 }
 
 
 // DISPLAY STUDENTS
 if(students)
 { 
  for(var student of students)
  {
   var item = UI_Element_Create("projects/project-student", {name:student["firstname"]});
    
   var img  = UI_Element_Find(item, "image");
   User_Picture_Load(img, student["student_id"], "student");
	
   for(var action of ["remove", "assess"])
   {
    if(options[action]) 
	{
     var icon     = UI_Element_Find(item, action);
     var onclick  = options[action];		
     icon.onclick = onclick; 
	 
	 icon.style.display = "flex";
	 
	 Document_Element_SetObject(icon, "student", student);
	}
   }
   
   Document_Element_SetData(item, "project_id", student["project_id"]);
   Document_Element_SetData(item, "student_id", student["student_id"]);
   
   element.appendChild(item);
  }
 }
 
 return element;
}





function Projects_Group_GetFile(students)
{
 for(var student of students)
 {
  if(student["url"]) return(student["url"]);
 }
}