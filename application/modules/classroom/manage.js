// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                        M A N A G E                                             //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

function Classroom_Manage()
{ 
 var presentation = Core_State_Get("classroom", ["presentation"]);
 
 
 
 // DISPLAY INFO
 var lesson    = Core_State_Get("classroom", ["lesson"]);
 var classdata = Core_State_Get("classroom", ["class"]);
 
 var title = lesson["title"] || {};
 title     = UI_Language_Object(title) || "";
 var date  = Safe_Get(classdata, ["info", "date_start"], "");
 date      = Date_Format(date);
 
 var info       = UI_Element_Find("header-info");
 info.innerHTML = title.toUpperCase() + " / " + date.toUpperCase();
 
 
 
 // DOCUMENTS MENU
 var documents = Safe_Get(lesson, "documents", []);
 var items     = {};
 for(var file of documents)
 {
  file = file || "";
  file = file.trim().toLowerCase();
  
  var item =
  {
   text:    String_Capitalize_Initial(file),
   state:   "enabled",
   tag:     file,
   func:    
   function(item)
   {
	var file = Document_Element_GetObject(item, "tag");
	Classroom_Manage_DisplayFile(file)
   }
  }
  
  items[file] = item;
 }
 var menu = UI_Menu_Create("files-menu", items);
 Core_State_Set("classroom", "files-menu", menu);
 
 
 
 // DISPLAY RIGHT PANEL SELECTOR
 var items  = {};
 
 items["lessonplan"] =
 {
  text    : UI_Language_String("classroom", "selector lessonplan caption"),
  onclick : Classroom_Manage_DisplayLessonplan
 }
 
 items["files"] =
 {
  text    : UI_Language_String("classroom", "selector files caption"),
  onclick : Classroom_Manage_DisplayFiles
 }
 
 items["instructions"] =
 {
  text :   UI_Language_String("classroom", "selector instructions caption"),
  onclick: Classroom_Manage_DisplayInstructions
 }
 
 items["assessment"] =
 {
  text :   UI_Language_String("classroom", "selector assessment caption"),
  onclick: Classroom_Manage_DisplayAssessment
 }
 
 items["project"] =
 {
  text :   UI_Language_String("classroom", "selector project caption"),
  onclick: Classroom_Manage_DisplayProject
 }
 
 var header = UI_Header("header-selector", items, {selectfirst:false, css:"color-noted"});
 Core_State_Set("classroom", "selector-right", header);
 Classroom_Manage_UpdateSelector();
 
 UI_Element_Find("header-right").appendChild(header);
 
 
 
 
 // SLIDES THUMBNAILS
 var list  = UI_Element_Find("presentation-thumbnails");
 for(var slide of presentation["slides"])
 {  
  // CREATE SLIDE THUMBNAIL
  var thumbnail              = UI_Element_Create("classroom/slide-thumbnail");
  thumbnail.onclick          = Classroom_Manage_SelectSlide;  
  slide["thumbnail"]         = thumbnail;
  Document_Element_SetObject(thumbnail, "slide", slide);
  
  
  // GET SLIDE MENU AND ASSIGN IT TO THE THUMBNAIL
  var menu = slide["menu"];
  UI_Menu_Assign(thumbnail, menu);
  
  
  // APPEND THUMBNAIL TO LIST AND RENDER
  list.appendChild(thumbnail);  
  Presentation_Slide_Render(slide, thumbnail);
 }
 
 
 // USERS
 var classdata = Core_State_Get("classroom", ["class"]);
 var seats     = classdata["seats"] || [];
 
 
 // CREATE USER CARDS
 var container = UI_Element_Find("presentation-students");
 var count     = 0;
 for(var seat of seats)
 { 
  var student = Safe_Get(seat, ["student"], {});
  
  var card    = User_Card(student, "compact");
  Document_CSS_SetClass(card, "style-clickable");
  Document_CSS_SetClass(card, "effect-highlight-outline");  
  Document_Element_SetObject(card, "seat", seat);
  
  card.style.visibility = "hidden";
  card.onclick          = Classroom_Manage_SelectStudent;
      
  // CARD MENU
  var items = {};
  
  // EMOJIS
  var emojis     = Core_Data_Page("classroom/attract");
  var menu       = UI_Menu_FromObject(student["id"], emojis, "category", Classroom_Manage_SendAttract);
  Document_Element_SetObject(menu, "student", student);
  Document_Element_SetObject(menu, "seat",    seat);
  
  UI_Menu_Assign(card, menu);
  
  container.appendChild(card);
  count = count + 1;
 }
 
 
 // FILL SPACE WITH EMPTY SLOTS
 // TOTAL SEATS ARE EITHER THE CLASS' SPECIFIED SEATS_TOTAL, OR THE MAXIMUM ALLOWED BY MODULE CONFIGURATION
 var total     = Safe_Get(classdata, ["info", "seats_total"], Module_Config("classroom", "student-slots", 0));
 
 for(var i = count; i< total; i++)
 {
  var card              = User_Card({}, "compact");
  card.style.visibility = "hidden";
  
  Document_CSS_PurgeClasses(card, "shadow");

  container.appendChild(card);  
 }
 
 
 
 // SWITCHES
 UI_Element_Find("switch-present").onclick    = Classroom_Manage_Present;
 
 UI_Element_Find("switch-timer").onclick      = Classroom_Manage_Timer;
 
 UI_Element_Find("switch-summary").onclick    = Classroom_Manage_LessonSummary;
 
 UI_Element_Find("switch-pointer").onclick    = Classroom_Manage_SwitchPointer;
 
 UI_Element_Find("switch-whiteboard").onclick = Classroom_Manage_SwitchWhiteboard;
 
 
 
 // ANIMATE ELEMENTS
 
 // SLIDE THUMBNAILS
 /*
 var container = UI_Element_Find("presentation-thumbnails");
 Document_Element_AnimateChildren(container, "slideInLeft 0.250s 1", 
 {
  delay:    250, 
  interval: 0, 
  onstart:
  function(element) 
  {
   element.style.visibility = "visible";
  }
 });
 */
 
 // STUDENTS
 var container = UI_Element_Find("presentation-students");
 Document_Element_AnimateChildren(container, "zoomIn 0.250s 1", 
 {
  delay:    125, 
  interval: 125, 
  onstart:
  function(element) 
  {
   element.style.visibility = "visible";
  }
 });
 
}



function Classroom_Manage_DisplayFiles()
{	 
 var menu     = Core_State_Get("classroom", "files-menu");
 var position = Document_Element_Corner(UI_Element_Find("files"), "bottom"); 
 
 setTimeout(
 function()
 {
  UI_Menu_Show(menu, position["left"], position["top"] + parseInt(Document_CSS_GetValue("gap-medium", "gap")) * 2, {direction:"bottom"});
 }, 125);
}



function Classroom_Manage_DisplayFile(file)
{
 var lesson = Core_State_Get("classroom", "lesson", {}); 
 
 var page = UI_Element_Create("classroom/document-container");
 page.src = "content/lessons/" + lesson["source"] + "/documents/" + file;
 
 // DISPLAY
 var container       = UI_Element_Find("presentation-panel-right");
 container.innerHTML = "";
 container.appendChild(page);
}



function Classroom_Manage_DisplayLessonplan()
{ 
 // SEARCH LESSON.PDF IN DOCUMENTS
 var lesson    = Core_State_Get("classroom", "lesson", {}); 
 var documents = Safe_Get(lesson, "documents", []);
 var plan      = false;
 
 for(var file of documents)
 {
  file = file || "";
  file = file.trim().toLowerCase();
  if(["lesson plan.pdf", "plan.pdf"].includes(file))
  {
   plan = file;
   break;
  }
 }

 if(!plan) return;

 Classroom_Manage_DisplayFile(plan);
}



function Classroom_Manage_DisplayInstructions()
{
 var slide = Core_State_Get("classroom", "current-slide");
 
 Classroom_Manage_SlideInstructions();
}




function Classroom_Manage_DisplayAssessment()
{
 var seat  = Core_State_Get("classroom", "current-seat");
 
 Classroom_Manage_SelectStudent(false, seat);
}





function Classroom_Manage_UpdateSelector(set)
{
 var header = Core_State_Get("classroom", "selector-right");
 
 // IF THERE IS A PROJECT ASSOCIATED TO THIS LESSON, ENABLE PROJECT TAB, OTHERWISE DISABLE
 var project = Core_State_Get("classroom", ["lesson", "project", "source"]);
 if(project) UI_Header_Enable(header, "project"); else UI_Header_Disable(header, "project");
 
 // IF THERE IS A SELECTED SLIDE, ENABLE INSTRUCTIONS TAB, OTHERWISE DISABLE
 var slide = Core_State_Get("classroom", "current-slide");
 if(slide) UI_Header_Enable(header, "instructions"); else UI_Header_Disable(header, "instructions"); 
 
 // IF THERE IS A SELECTED STUDENT, ENABLE ASSESSMENT TAB, OTHERWISE DISABLE
 var seat  = Core_State_Get("classroom", "current-seat");
 if(seat) UI_Header_Enable(header, "assessment");   else UI_Header_Disable(header, "assessment"); 
 
 if(set) UI_Header_Set(header, set);
}






async function Classroom_Manage_SelectStudent(event, seat)
{
 var container = UI_Element_Find("presentation-panel-right");
 var current   = Core_State_Get("classroom", ["current-seat"]);
 
 
 // IF COMING FROM A CLICK...
 if(!seat)
 {
  // GET STUDENT
  var element   = event.currentTarget;
  var seat      = Document_Element_GetObject(element, "seat");
 }
 
 
 Core_State_Set("classroom", ["current-seat"], seat);
 Classroom_Manage_UpdateSelector("assessment");
 
 // HIGHLIGHT CURRENT
 var list      = UI_Element_Find("presentation-students");
 Document_Conditional_Class(list, "style-outlined-accented", element); 
 
 // ASSEMBLE ASSESSMENT PAGE  
 var page    = await Assessment_Assess_Seat(seat["id"]);
 
 // DISPLAY
 container.innerHTML = "";
 container.appendChild(page);
}






function Classroom_Manage_SendVocabulary(item)
{  
 var id = Document_Element_GetData(item, "uid");
 
 Classroom_Manage_TriggerEvent("vocab", id);
}




function Classroom_Manage_SendAttract(item)
{ 
 var menu       = Document_Element_GetObject(item, "menu");
 var student    = Document_Element_GetObject(menu, "student"); 
 var seat       = Document_Element_GetObject(menu, "seat"); console.log(seat);
 
 var seat_id    = seat["id"];
 var student_id = student["id"]; 
 var attract_id = Document_Element_GetData(item, "uid");

 Classroom_Manage_TriggerEvent("attract", {seat_id, student_id, attract_id});
}




async function Classroom_Manage_Present()
{
 var projector = Core_State_Get("classroom", ["projector"]);
 var icon      = UI_Element_Find("switch-present");
 
 // ALREADY OPENED. CLOSE?
 if(projector)
 {
  /*
  var title    = UI_Language_String("classroom/manage", "popup close title"); 
  var content  = UI_Language_String("classroom/manage", "popup close subtitle"); 
  var picture  = Resources_URL("images/cover-presentation.jpg");

  var confirm  = await UI_Popup_Confirm(title, content, picture);
  */
  
  // CLOSE IT
  //if(confirm)
  //{
   // UPDATE SWITCH ICON
   Document_CSS_SetClass(icon,   "fa-tv");
   Document_CSS_UnsetClass(icon, "fa-rectangle-xmark");
   
   Classroom_Manage_TriggerEvent("close");
   Core_State_Set("classroom", ["projector"], false);
  //}
 }
 else
 if(true)
 {
  // ATTEMPT GETTING 2ND SCREEN INFO, IF ANY
  var info      = await Client_Screen_Info();
  var display   = info["secondary"][0] || info["primary"] || window.screen;
  var url       = Classroom_Link();
  
  var projector = window.open(url, "projector", "popup, width="+ display["availWidth"] + ", height=" + display["availHeight"] + ", fullscreen=yes");
  
  await Client_Wait(0.5);
  projector.moveTo(display["left"], display["top"]);
  
  await Client_Wait(0.5);
  projector.resizeTo(display["availWidth"], display["availHeight"]);
  
  Core_State_Set("classroom", ["projector"], projector);
 
 
  // UPDATE SWITCH ICON
  Document_CSS_SetClass(icon,   "fa-rectangle-xmark");
  Document_CSS_UnsetClass(icon, "fa-tv");
 }
}




async function Classroom_Manage_SwitchPointer()
{
 Classroom_Manage_TriggerEvent("pointer");
}



async function Classroom_Manage_SwitchWhiteboard()
{
 Classroom_Manage_TriggerEvent("wb-toggle");
}




async function Classroom_Manage_LessonSummary()
{
 var lesson = Core_State_Get("classroom", ["lesson"]);
 
 await Lesson_Summary_Popup(lesson);
}





async function Classroom_Manage_Timer()
{
 var duration = await Classroom_Present_TimerPopup();

 Classroom_Manage_TriggerEvent("timer", duration);
}






function Classroom_Manage_TriggerEvent(command, data)
{
 // IS A THIRD PARTY WEBSITE CURRENTLY OPENED IN THE PROJECTOR WINDOW?
 var link      = Core_State_Get("classroom", ["current-link"]);
 
 // WE CAN CHECK IF A PROJECTOR WINDOW IS OPENED ONLY IF IT'S NOT POINTING TO THIRD PART WEBSITES
 // OTHERWISE WE WILL CAUSE A SECURITY EXCEPTION (SIGH...)
 if(!link) 
 {
  var projector = Core_State_Get("classroom", ["projector"]);
 }
 
 // IF THERE IS A PROJECTOR OPENED - AND WE ARE CURRENTLY NOT SHOWING A 3RD PARTY WEBSITE, THEN TRIGGER THE EVENT WITHIN THE PROJECTOR
 if(projector && !link)
 {
  projector["Classroom_Present_TriggerEvent"](command, data);
 }
 else
 // WITH NO PROJECTOR WINDOW OPEN, WE TRIGGER THE EVENT WITHIN THIS SAME WINDOW
 {
  Classroom_Present_TriggerEvent(command, data);
 }
}




function Classroom_Manage_SlideInstructions()
{ 
 var slide = Core_State_Get("classroom", ["current-slide"], slide);
 if(slide)
 {	 
  var page            = UI_Element_Create("classroom/slide-page", {}, {language:"classroom/manage"});
  // COLLECT INSTRUCTIONS
  var text            = Safe_Get(slide, ["header", "teachertext"], "");
  text                = text.replaceAll("\n", "<br>");
  text                = text.replaceAll("\r\n", "<br>");

  var stage            = Safe_Get(slide, ["header", "stage"], "");
  stage                = stage.replaceAll("\n", "<br>");
  stage                = stage.replaceAll("\r\n", "<br>");
  stage                = UI_Language_String("presentation/stages", stage);
  
  if(text.trim() == "")
  {
   UI_Element_Find(page, "instructions-paragraph").style.display = "none";
  }
  else
  {
   UI_Element_Find(page, "instructions-paragraph").style.display = "flex";
   UI_Element_Find(page, "instructions").innerHTML = text;
   UI_Element_Find(page, "slide-stage").innerHTML = stage;
  }
  
  
  // COLLECT SCRIPTS
  console.log(slide["scripts"]);
  if(!slide["scripts"] || slide["scripts"].length == 0)
  {
   UI_Element_Find(page, "scripts-paragraph").style.display = "none";
  }
  else
  {
   for(var script of slide["scripts"])
   {
    var text     = script["name"] || script["id"];
    var item     = UI_Element_Create("classroom/slide-page-script", {text});
    Document_Element_SetObject(item, "tag", {slide_id:slide["id"], script_id:script["id"]});
   
    item.onclick = 
    function(event)
    {
     var element = event.currentTarget;
     Classroom_Manage_RunScript(element);
    }
   
    UI_Element_Find(page, "scripts").appendChild(item);
   }
   
   UI_Element_Find(page, "scripts-paragraph").style.display = "flex";
  }
  
  
  // DISPLAY
  var container       = UI_Element_Find("presentation-panel-right");
  container.innerHTML = "";
  container.appendChild(page);
 }
}




function Classroom_Manage_SelectSlide(event)
{
 var presentation = Core_State_Get("classroom", ["presentation"]);
 
 var element      = event.currentTarget;
 var slide        = Document_Element_GetObject(element, "slide");
 var index        = presentation["slides"].indexOf(slide); 

 // CENTER AND UPDATE SLIDE THUMBNAIL
 var thumbnail = slide["thumbnail"];
 var list      = UI_Element_Find("presentation-thumbnails");
 if(thumbnail)
 { 
  thumbnail.scrollIntoView({behavior: "smooth", block: "center"});
  Document_Conditional_Class(list, "style-outlined-accented", thumbnail); 
 }
 
 Core_State_Set("classroom", ["current-slide"],     slide);
 Core_State_Set("classroom", "current-slide-index", index);
 
 Classroom_Manage_UpdateSelector("instructions");
 Classroom_Manage_SlideInstructions();

 Classroom_Manage_TriggerEvent("slide", index);
}




function Classroom_Manage_RunScript(item)
{
 var data = Document_Element_GetObject(item, "tag");
 
 Classroom_Manage_TriggerEvent("script", data);
}





function Classroom_Manage_TriggerElement(item)
{
 var data = Document_Element_GetObject(item, "tag");
 
 Classroom_Manage_TriggerEvent("click", data);
}




function Classroom_Manage_ResetSlide(item)
{
 var presentation = Core_State_Get("classroom", ["presentation"]);
 var slide        = Document_Element_GetObject(item, "tag");
 var index        = presentation["slides"].indexOf(slide); 
 
 Classroom_Manage_TriggerEvent("reset", index);
}





function Classroom_Manage_OpenLink(item)
{
 var data           = Document_Element_GetObject(item, "tag");
 var url            = data["url"]; 
 
 window.open(url, "projector", "popup, width="+ screen.width + ", height=" + screen.height + ", fullscreen=yes");
 
 Core_State_Set("classroom", ["current-link"], url);
}




function Classroom_Manage_OpenDocument(item)
{
 // CHECK PROJECTOR ONLY IF THIS IS NOT THE SEPARATE "PRESENT" WINDOW
 if(Core_State_Get("classroom", "page") != "present")
 {
  var projector = Core_State_Get("classroom", ["projector"]);
  if(!projector) return;
 }
 
 var data = Document_Element_GetObject(item, "tag");
 var file = data["file"];

 Classroom_Manage_TriggerEvent("doc", file);
}



function Classroom_Manage_CleanProjector(item)
{
 Classroom_Manage_TriggerEvent("clean");
}