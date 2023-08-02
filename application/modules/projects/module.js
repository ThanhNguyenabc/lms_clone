// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       P R O J E C T S                                          //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Projects_OnLoad(module, data)
{
 Core_State_Set("projects", "data", data);
 
 var role = User_Role();
 var page = UI_Element_Create("projects/page-" + role);
 
 // ADD INFO TO PROJECTS (USED FOR SECTIONS)
 for(var project of data)
 {
  project["period"] = Date_Format_Period(Date_Now(), project["date_due"], {locale:UI_Language_Current(true), conversational:true});
 }
 
 var onclick = Safe_Function("Projects_" + String_Capitalize_Initial(role) + "_DisplayProject", function(){});
 
 // ASSEMBLE DISPLAY
 var list = UI_List_Items(data, ["style-outlined-accented"], onclick, {style:"vertical", overflow:true, sections:"period", animate:true/*, selected:upcoming, highlight:"style-outlined-alert"*/},
 // ITEMS
 function(project)
 {  
  var element = UI_Element_Create("projects/project-thumbnail");
  Document_Element_SetObject(element, "project", project);
  
  // TITLE
  var data    = Safe_Get(project, ["data", "title"], {});
  var title   = UI_Language_Object(data);
  UI_Element_Find(element, "title").innerHTML = title;
  
  // DATE
  var data = Safe_Get(project, ["date_due"], Date_Now());
  var date = UI_Language_Date(data, 
  {
   weekday: "long", 
   day:     "numeric", 
   month:   "long"  
  });
  UI_Element_Find(element, "date").innerHTML = UI_Language_String("projects/projects", "date due", {date});
  
  
  // COVER
  var image   = UI_Element_Find(element, "picture");
  var cover   = Resources_URL("projects/" + project["project_id"] + "/cover.png", "content");
  var def     = Resources_URL("images/cover-project.png");
  Document_Image_Load(image, [cover, def]);
  
  
  // ASSESSMENT PRESENT?
  if(project["assessment"])
  {
   var icon = UI_Element_Find(element, "assessment");
   icon.style.display = "flex";
  }
  

  // DUE SOON?
  var due  = project["date_due"] || Date_Now();
  var days = Date_Distance(Date_Now(), due, "days");
  
  if(days <= 2)
  {
   var icon = UI_Element_Find(element, "due");
   icon.style.display = "flex";
   Document_Element_Animate(icon, "flash 1.5s 1.5");
  }
  
  return element;
 },
 
 // SECTIONS
 function(section, item)
 {
  var period = UI_Language_String("projects/projects", "date due", {date:section}).toUpperCase();
  
  var element = UI_Element_Create("projects/list-section", {period});  
  return element;
 });
 
 
 
 // LIST PROJECTS
 var container       = UI_Element_Find(page, "projects-list");
 container.innerHTML = "";
 container.appendChild(list);
 
 UI_Element_Find(module, "module-page").appendChild(page);
}



async function Projects_OnShow(module, data)
{
}




async function Projects_OnUnload()
{
}








// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          M O R E                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Projects_Group_OpenFile(event)
{
 var element = event.currentTarget;
 var url     = Document_Element_GetData(element, "url");
 
 var display = UI_Element_Create("projects/project-display");
 display.src = url;
  
 var container       = UI_Element_Find("project-display");
 container.innerHTML = "";
 container.appendChild(display);
 
 
 //window.open(url);
}



async function Projects_Student_DisplayProject(element)
{
 var project  = Document_Element_GetObject(element, "project");
 Core_State_Set("projects", "current", project);
 
 var files = {};
 
 
 // MAIN PROJECT FILE
 files["project"] =
 {
  text   : UI_Language_String("projects/files", "file project"),
  onclick: Projects_Student_DisplayProjectfile
 }
 
 
 // OTHER FILES
 var info     = await Core_Api("Project_Read", {id:project["project_id"], files:true});
 var items    = [];
 var filter   = Core_Data_Value("projects/files", "files", "student").split(",");
 for(var file of info["files"])
 {  
  var name = String_Simplify(Path_RemoveExtension(Path_Filename(file)))
  if(filter.includes(name))
  {
   files[name] =
   {
	text:   UI_Language_String("projects/files", "file " + name),
	file,
	onclick: Projects_Student_DisplayFile 
   }
  }
 }
 
 // ASSESSMENT
 var disabled = !project["assessment"];

 files["assessment"] =
 {
  text: UI_Language_String("projects/files", "file assessment"),
  onclick:Projects_Student_DisplayAssessment,
  disabled
 }
 
 
 
 
 var header = UI_Header("header-files", files, {selectfirst:false, css:"color-noted"});
  
 
 // DISPLAY
 var container       = UI_Element_Find("project-files");
 container.innerHTML = "";
 container.appendChild(header);
 
 var container       = UI_Element_Find("project-display");
 container.innerHTML = "";
 
 var panel = UI_Element_Find("project-panel");
 panel.style.visibility = "visible";
}





async function Projects_Student_DisplayFile(item)
{
 var display = UI_Element_Create("projects/project-display");
 display.src = item["file"];
 
 var container       = UI_Element_Find("project-display");
 container.innerHTML = "";
 container.appendChild(display);
}




async function Projects_Student_DisplayProjectfile(element)
{
 var project = Core_State_Get("projects", "current");
 url         = project["url"];
  
 var display = UI_Element_Create("projects/project-display");
 display.src = url;
 
 var container       = UI_Element_Find("project-display");
 container.innerHTML = "";
 container.appendChild(display);
}




async function Projects_Student_DisplayAssessment(element)
{
 var project    = Core_State_Get("projects", "current");
 var skills     = Safe_Get(project, ["data", "skills"], {});
 var list       = Object.values(skills);
 var aims       = await Core_Api("Outcomes_Read", {list, folder:"skills"});

 var text       = Assessment_Category_Transcribe(aims, project["assessment"]);
 
 
 
 var display = UI_Element_Create("projects/project-assessment-student");
  
 var row     = Assessment_Display_Feedback(project["assigner_id"], text);
 display.appendChild(row);
 
 var row     = Assessment_Display_Assessment("extra skills", aims, project["assessment"]);
 display.appendChild(row);
 
 
 var container       = UI_Element_Find("project-display");
 container.innerHTML = "";
 container.appendChild(display);
}



async function Projects_Teacher_DisplayProject(event)
{
 var display  = Core_State_Get("projects", "list-display");
 
 var element  = event.currentTarget;
 var project  = Document_Element_GetObject(element, "project");
 Core_State_Set("projects", "current", project);
 
 var groups = await Core_Api("Project_List_Students", {project_id:project["id"]});
 console.log(groups);
 
 var container       = UI_Element_Find(display, "project-groups");
 container.innerHTML = "";
 
 for(var n in groups)
 {
  var students = groups[n] || [];
  
  var item     = Project_Group_Display(n, students, {assess:Projects_Teacher_Assess, file:Projects_Group_OpenFile});
 
  container.appendChild(item);
 }
}



async function Projects_Teacher_Assess(event)
{
 var element = event.currentTarget;
 var student = Document_Element_GetObject(element, "student");
 var project = Core_State_Get("projects", "current", project);
  
 var skills  = Safe_Get(project, ["data", "skills"], {});
 var list    = Object.values(skills);
 var aims    = await Core_Api("Outcomes_Read", {list, folder:"skills"});
 
 var display = UI_Element_Create("projects/project-assessment-teacher");
 var section = Assessment_Section(student["firstname"], aims, student["assessment"], 
 async function(event)
 {
  var element = event.currentTarget;
  var skill   = Document_Element_GetData(element, "uid");
  
  if(!student["assessment"]) student["assessment"] = [];
  
  Safe_Set(student, ["assessment", skill], element.value); 
  await Core_Api("Assessment_Outcome_Store", {table:"projects_students", id:student["id"], field:skill, value:element.value}); 
 });
 
 display.appendChild(section);
 
 var container       = UI_Element_Find("project-display");
 container.innerHTML = "";
 container.appendChild(display);
}