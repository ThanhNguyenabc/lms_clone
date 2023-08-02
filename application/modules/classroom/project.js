// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                        P R O J E C T                                           //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Classroom_Manage_DisplayProject()
{
 var class_id       = Core_State_Get("classroom", ["class", "info", "id"]);
 var project_source = Core_State_Get("classroom", ["lesson", "project", "source"]);
  
 // IF A PROJECT HASN'T BEEN ALLOCATED YET, DO IT 
 var project_id = Core_State_Get("classroom", ["class", "info", "project_id"]);
 var teacher_id = Core_State_Get("classroom", ["class", "info", "teacher_id"]);
 
 if(!project_id)
 { 
  project_id     = await Core_Api("Project_Create", {project_id:project_source, class_id, teacher_id});
  await Core_Api("Class_Field_Set", {id:class_id, field:"project_id", value:project_id});
 }
	


 // PROJECT	
 var project = await Project_Read(project_source) || {};
 Core_State_Set("classroom", "project", project);
 
 var title = UI_Language_Object(project["title"]);
 var page  = UI_Element_Create("classroom/project-page", {title}, {language:"classroom/projects"});
 
 var files     = UI_List_Files(project["files"], "download", {style:"icons"});
 var container = UI_Element_Find(page, "project-files");
 container.appendChild(files);
 

 
 // GROUPS
 var groups    = await Core_Api("Project_List_Students", {project_id});
 var maxgroups = 9;
 var container = UI_Element_Find(page, "project-groups");
 
 for(var n = 1; n <= maxgroups; n++)
 {
  var group   = groups[n] || [];
  var box     = Project_Group_Display(n, group, options = {remove:Classroom_Project_RemoveStudent, file:false})
  
  container.appendChild(box);
 }
 
 
 // SET UP DRAGGING STUDENTS TO GROUPS
 var sources = Document_Element_Children(UI_Element_Find("presentation-students"));
 var destinations = Document_Element_Children(UI_Element_Find(page, "project-groups"));
 
 Document_Handler_DragVirtual(sources, destinations, "style-outlined-accented",
 // DRAG START
 function(event)
 {
  var element = event.srcElement;
  var seat    = Document_Element_GetObject(element, "seat");
  var student = seat["student"] || {};
  
  Core_State_Set("classroom", "dragging-student", student);
 },
 
 function(event)
 // DRAG DROP
 {
  var element = event.srcElement;
  
  var student = Core_State_Get("classroom", "dragging-student");
  
  Classroom_Project_AddStudent(student, element);
 });
 
 var container       = UI_Element_Find("presentation-panel-right");
 container.innerHTML = "";
 container.appendChild(page);
}




async function Classroom_Project_AddStudent(student, group)
{	  
 var project = Core_State_Get("classroom", "project");
 
 
 // TRACE BACK TO GROUP CONTAINER
 group = Document_Element_FindParent(group, "group");

 var class_id      = Core_State_Get("classroom", ["class", "info", "id"]);
 var student_id    = student["id"]
 var name          = student["firstname"];
 var group_id      = Document_Element_GetData(group, "group");
 var project_id    = Core_State_Get("classroom", ["class", "info", "project_id"]);
 
  
 // ALREADY PRESENT IN ONE OF THE GROUPS?
 var ingroup = false;
 var groups  = Document_Element_Children(UI_Element_Find("project-groups"), "group");;
 for(var box of groups)
 {
  var element = Document_Element_FindChild(box, "student_id", student_id);
  if(element)
  {
   var ingroup = box;
   break;
  }
 }
 
 // PRESENT IN THIS SAME GROUP: REJECT
 if(ingroup == group)
 {
  await Document_Element_Animate(element, "rubberBand 0.5s 1");
  return;
 }
 
 // PRESENT IN ANOTHER GROUP: REMOVE FIRST
 if(ingroup)
 {
  element.remove();
 }
 
 
 // ASSIGN

 // CREATE DATABASE RECORD
 var days          = Safe_Get(project, ["info", "duration"], 365);
 var assignment_id = await Core_Api("Project_Assign_Student", {project_id, student_id, group_id, days});
 var item          = UI_Element_Create("classroom/project-group-item", {name});  
 
 // GENERATE FILE BASED ON ASSIGNMENT ID
 var name          = assignment_id + "-" + group_id; 
 var url           = await Core_Service("file-create", {name, type:"slides"});
 
 // UPDATE DATABASE RECORD
 await Core_Api("Project_File_Set", {assignment_id, url});

   
 var img = UI_Element_Find(item, "image");
 User_Picture_Load(img, student["id"], "student");
 
 UI_Element_Find(item, "remove").onclick = Classroom_Project_RemoveStudent;
 
 Document_Element_SetData(item, "project_id", project_id);
 Document_Element_SetData(item, "student_id", student_id);
   
 group.appendChild(item);
 Document_Element_Animate(item, "bounceIn 0.5s 1");
}



async function Classroom_Project_RemoveStudent(event)
{
 var element    = event.currentTarget;
 var item       = Document_Element_FindParent(element, "project_id");
 var project_id = Document_Element_GetData(item, "project_id");
 var student_id = Document_Element_GetData(item, "student_id");
 
 Core_Api("Project_Remove_Student", {project_id, student_id}); 
 
 await Document_Element_Animate(item, "bounceOut 0.5s 1");
 item.remove();
}




async function Classroom_Project_Display()
{


  
}


async function Classroom_Project_Assign()
{
}



async function Classroom_Project_DownloadFile(item)
{
}