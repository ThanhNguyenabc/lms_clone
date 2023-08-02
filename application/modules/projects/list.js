// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                P R O J E C T S  /  L I S T                                     //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Projects_List_Display(teacher_id, managed = false)
{
 // IF SPECIFIC TEACHER AND TEACHER NOT CURRENT USER, LOAD IT
 if(teacher_id && teacher_id != User_Id()) 
 { 
  var user = await Core_Api("User_Read", {user_id:teacher_id, options:{fields:"id,firstname,lastname"}});
 }
 else
 {
  var user = Core_User();
 }
 
 
 // CREATE DISPLAY
 var display = UI_Element_Create("projects/list-display");
 Core_State_Set("projects", "list-display", display);
 
 
 // IF LIST OF MANAGED TEACHERS, SHOW SELECTOR
 if(managed)
 {  
  // IF IT'S NOT A LIST BUT JUST A "TRUE" FLAG, BUILD THE LIST BY CALLING API
  if(typeof managed != "object")
  {
   var managed = await Core_Api("Users_List_ByManager", {manager_id:user["id"], fields:"id,firstname,lastname"});
  }

  var selector = UI_Element_Find(display, "selector");
  var select   = UI_Element_Find(selector, "teachers");
  
  // ADD MAIN USER TO THE LIST
  var name = [user["firstname"] || "", user["lastname"] || ""].join(" ").trim();
  Document_Select_AddOption(select, name, user["id"]);
  
  for(var teacher of managed)
  {
   var name = [teacher["firstname"] || "", teacher["lastname"] || ""].join(" ").trim();
   Document_Select_AddOption(select, name, teacher["id"]);
  }
  
  select.value = user["id"];
  
  select.onchange = 
  function()
  {
   Projects_List_Teacher(select.value);
  }
  
  selector.style.display = "flex";
 }
 
 await Projects_List_Teacher(user["id"]);


 return display;
}




async function Projects_List_Teacher(teacher_id)
{
 var display = Core_State_Get("projects", "list-display");
  
 // HIDE DETAIL VIEW
 UI_Element_Find(display, "groups").style.visibility = "hidden";
 UI_Element_Find(display, "view").style.visibility   = "hidden";


 // GET CLASS ASSESSMENT DATA
 var period     = parseInt(User_Config("admin-days", -30)); period = -3000;
 var date_from  = Date_Portion(Date_Add_Days(Date_Now(), period), "no-seconds");
 var date_to    = Date_Portion(Date_Now(), "no-seconds");
 var data       = await Core_Api("Projects_List_ByTeacher", {teacher_id, date_from, date_to, options:{}});


 // PROCESS DATA
 
 // SECTION
 for(var item of data) item["period"] = Date_Format_Period(Date_Now(), item["date_start"], {locale:UI_Language_Current(true), conversational:true});
 
 // SORT BY DATE AND CLASS ID
 data.sort(
 function(a, b)
 {
  if(a["date_start"] < b["date_start"]) return 1;
  else
  if(a["date_start"] > b["date_start"]) return -1;
  else
  {
   return 0;
  }
 });
 
 
 // ASSEMBLE DISPLAY
 var list = UI_List_Items(data, ["style-outlined-accented", "outline-inner"], Projects_List_Project, {style:"vertical", overflow:true, sections:"period"},
 
 // ITEMS
 function(item)
 {  
  var locale      = UI_Language_Current(true);
  var info        = {};
  
  info["date"]    = Date_Format(item["date_start"], locale, "date-shortmonth-weekday-noyear") + ", " + Date_Format(item["date_start"], locale, "time-only");
  info["project"] = item["project_id"];
  
  var element = UI_Element_Create("projects/list-item", info);  
  Document_Element_SetObject(element, "item", item);
  
  return element; 
 },
 
 // SECTIONS
 function(section, item)
 {
  var element = UI_Element_Create("projects/list-section", {period:section.toUpperCase()});  
  return element;
 });
 


 // DISPLAY LIST 
 var container       = UI_Element_Find(display, "list");
 container.innerHTML = "";
 container.appendChild(list);
}




async function Projects_List_Project(element)
{
 var item    = Document_Element_GetObject(element, "item");
 var display = Core_State_Get("projects", "list-display");

 var info    = await Core_Api("Project_Read", {id:item["project_id"], files:true});
 Core_State_Set("projects", "view", info);
  
 var container       = UI_Element_Find(display, "groups");
 container.innerHTML = "";
  
 var groups = await Core_Api("Project_List_Students", {project_id:item["id"]});
 for(var n in groups)
 {
  var students = groups[n] || [];
  var element  = Project_Group_Display(n, students, 
  {
   assess: Projects_List_Assess, 
   file:   Projects_List_OpenFile
  });
  
  container.appendChild(element);
 }
 

 container.style.visibility = "visible";
}




async function Projects_List_Assess(event)
{
 var display = Core_State_Get("projects", "list-display");

 var element = event.currentTarget;
 var student = Document_Element_GetObject(element, "student");
 var info    = Core_State_Get("projects", "view"); console.log(info);
  
 var skills  = info["skills"] || {};
 var list    = Object.values(skills);
 var aims    = await Core_Api("Outcomes_Read", {list, folder:"skills"});
 
 var element = UI_Element_Create("projects/project-assessment-teacher");
 var section = Assessment_Section(student["firstname"], aims, student["assessment"], 
 async function(event)
 {
  var element = event.currentTarget;
  var skill   = Document_Element_GetData(element, "uid");
  
  if(!student["assessment"]) student["assessment"] = [];
  
  Safe_Set(student, ["assessment", skill], element.value); 
  await Core_Api("Assessment_Outcome_Store", {table:"projects_students", id:student["id"], field:skill, value:element.value}); 
 });
 
 element.appendChild(section);
 
 var container       = UI_Element_Find(display, "view");
 container.innerHTML = "";
 container.appendChild(element);
 
 container.style.visibility = "visible";
}




async function Projects_List_OpenFile(event)
{
 var display = Core_State_Get("projects", "list-display");
 
 var element = event.currentTarget;
 var url     = Document_Element_GetData(element, "url");
 
 var element = UI_Element_Create("projects/project-display");
 element.src = url;
  
 var container       = UI_Element_Find(display, "view");
 container.innerHTML = "";
 container.appendChild(element);
 
 container.style.visibility = "visible";
 //window.open(url);
}