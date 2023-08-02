// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       C L A S S E S                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Classes_Load(id, options = {})
{
 // OPTIONS:  users
 var classdata = await Core_Api("Class_Read", {class_id:id, options:options});
  
 return classdata;
}




async function Class_Preview(id, options = {})
// OPTIONAL CONTROLS:
// - online      (boolean)
// - assessment  (function)
// - classroom   (function)
// - quickassess (div)
{
 var classitem = await Classes_Load(id, {seats:true, students:true});
 var classdata = classitem["info"];
 var lesson    = await Lesson_Load(classdata["lesson_id"], {outcomes:true});
 
 Core_State_Set("classes", ["preview", "class"],  classitem);
 Core_State_Set("classes", ["preview", "lesson"], lesson);
 
 // CLASS PREVIEW
 var page   = UI_Element_Create("classes/class-preview");
 
 // COVER IMAGE
 var cover    = UI_Element_Find(page, "cover");
 var source   = "content/lessons/" + classdata["lesson_id"] + "/cover.png";
 var fallback = Resources_URL("images/cover-lesson.jpg");
 Document_Image_Load(cover, [source, fallback]);
 
 
 // TITLE
 var title = UI_Element_Find(page, "title");
 var text  = UI_Language_Object(lesson["title"]) || "";
 var line  = UI_Element_Create("classes/class-preview-title", {text});
 title.appendChild(line);
 
 // OUTCOMES
 var outcomes = lesson["outcomes"] || {};
 for(id in outcomes)
 {
  var outcome = Safe_Get(outcomes, [id, "info"]);
  var line    = UI_Element_Create("classes/class-preview-aim", {text:UI_Language_Object(outcome)});
  title.appendChild(line);
 }
 
 
 // STUDENTS
 var container = UI_Element_Find(page, "students");
 var seats     = classitem["seats"] || [];
 
 for(var seat of seats)
 {
  var student = seat["student"] || {};
  
  
  if(options["attendance"])
  {
   var more = UI_Element_Create("core/control-dropdown-small");
   
   Document_Select_AddOption(more, "", "");   
   UI_Select_FromDatapage(more, "assessment/attendance-short");
  }
  else
  {
   var more = false;
  }

  var item    = User_Card(student, "item-stretch", more);
  
  if(options["quickassess"])
  {
   Document_CSS_SetClass(item, "style-clickable");
   Document_Element_SetObject(item, "seat", seat);
  
   item.onclick = 
   async function(event)
   {
    var element = event.currentTarget;
    var seat    = Document_Element_GetObject(element, "seat");
    
    var page            = await Assessment_Assess_Seat(seat["id"], sections = {all:true});
    var container       = options["quickassess"];
    container.innerHTML = "";
    container.appendChild(page);
   }
  }
  
  container.appendChild(item);
 }
 
 
 // ACTIONS
 if(options["noactions"])
 {
  UI_Element_Find(page, "actions").style.display = "none";
 }
 
 
 var container = UI_Element_Find(page, "actions-standard");
 
 // ASSESSMENT
 if(options["assessment"])
 {
  // OPEN CLASSROOM
  var text       = UI_Language_String("classes/class-preview", "button assessment");
  var button     = UI_Element_Create("core/button-small-light", {text}); 
  Document_Element_SetObject(button, "class", classdata);
  container.appendChild(button);
  button.onclick = 
  async function(event)
  {
   var element = event.currentTarget;
   var data    = Document_Element_GetObject(element, "class");
   
   await Assessment_Class_Display(data["id"], {popup:true});
  }
 }
 
 
 // CLASSROOM
 if(options["classroom"])
 {
  // OPEN CLASSROOM
  var text       = UI_Language_String("classes/class-preview", "button classroom");
  var button     = UI_Element_Create("core/button-small-light", {text}); 
  Document_Element_SetObject(button, "class", classdata);
  container.appendChild(button);
  button.onclick = options["classroom"];
 }
  
 
 if(options["online"])
 {
  // ONLINE
  var container = UI_Element_Find(page, "actions-online");
 
  // URL
  var element         = UI_Element_Create("core/control-edit-plain"); 
  element.placeholder = UI_Language_String("classes/class-preview", "caption stream"); 
  element.value       = classdata["classroom_url"] || "";
  Document_Element_SetObject(element, "class", classdata);
 
  element.onchange    = 
  function(event)
  {
   var element = event.currentTarget;
   var data    = Document_Element_GetObject(element, "class");
    
   data["classroom_url"] = element.value;
   Core_Api("Class_Field_Set", {id:data["id"], field:"classroom_url", value:element.value});
  }  
 
  container.appendChild(element);
 
  // OPEN URL
  var button     = UI_Element_Create("core/button-square-light", {text:"<li class = 'fa fa-arrow-up-right-from-square'></li>"}); 
  Document_Element_SetObject(button, "class", classdata);
 
  button.onclick = 
  function(event)
  {
   var element = event.currentTarget;
   var data    = Document_Element_GetObject(element, "class");
  
   window.open(data["classroom_url"], "classroom", "popup, fullscreen=yes");
  }
 
  container.appendChild(button);
 }
 
 
 return page;
}



function Class_Info(item)
{
 var data        = {};
 var locale      = UI_Language_Current(true);
  
 data["date"]    = Date_Format(item["date_start"], locale, "date-shortmonth-weekday-noyear");
 data["lesson"]  = item["lesson_id"];
 data["time"]    = Date_Format(item["date_start"], locale, "time-only") + "<br>" + Date_Format(item["date_end"], locale, "time-only");
 data["teacher"] = [Safe_Get(item, ["teacher", "firstname"], ""), Safe_Get(item, ["teacher", "lastname"], "")].join(" ").trim();
  
 if(item["online"] == 1)
 {
  data["online"] = "<li class = 'fa fa-globe'></li>";
 }
 else
 {
  data["online"] = "";
 }
 
 return data;
}