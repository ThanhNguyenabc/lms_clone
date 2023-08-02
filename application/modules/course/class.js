// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         C L A S S                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Course_Class(container, seat_id = false)
{
 var page = UI_Element_Create("course/class");
 
 // SET BY ANOTHER MODULE? 
 if(!seat_id)
 {
  var seat_id = Core_State_Get("course", ["view-seat"], false);
  if(seat_id)
  {
   // UNSET
   Core_State_Set("course", ["view-seat"], false);
  }
 }
 
 // SET BY URL?
 if(!seat_id)
 {
  var seat_id = Client_Location_Parameter("seat");
 }
 
 // STILL NO VALID SEAT TO READ? THEN LEAVE
 if(!seat_id) return;
 
 // SET SEAT AS CURRENT
 Core_State_Set("course", ["current-class"], seat_id);
 
 


 //LOAD DATA AND SET AS CURRENT
 var data           = await Core_Api("Course_Seat_Data", {seat_id}); 
 data["scores"]     = data["activities"];
 data["activities"] = Array_Catalog_ByField(data["scores"], "source");
 
 // UGLY FIX THAT SHOULD HAPPEN ON THE BACKEND
 Lesson_AdjustDocuments(data["lesson"]);
 
 
 Core_State_Set("course", ["class-data"], data);
 
 
 // LESSON ID FROM DATA
 var lesson_id  = Safe_Get(data, ["lesson", "source"]);
 Core_State_Set("course", ["current-lesson"], lesson_id);
 
 
 // DETERMINE IF WE ARE VIEWING THE CLASS BEFORE OR AFTER IT WAS HELD
 var date_end = Safe_Get(data, ["class", "date_end"], Date_Now());
 if(Date_Now() > date_end) var state = "post"; else var state = "pre";
 Core_State_Set("course", ["class-state"], state);
 
 

 
 // DISPLAY HEADER
 var header = UI_Element_Find(page, "class-header");
 
 
 // TITLE
 var title = Safe_Get(data, ["lesson", "title"], "");
 var text  = UI_Language_Object(title);
 UI_Element_Find(header, "lesson-title").innerHTML = text;
 

 // DATE
 var date = Safe_Get(data, ["class", "date_start"], "");
 var text = UI_Language_Date(date, 
 {
  weekday: "long", 
  day:     "numeric", 
  month:   "long"  
 });
 
 UI_Element_Find(header, "class-date").innerHTML = text;
  
  
 // TIME
 var date    = Safe_Get(data, ["class", "date_start"], "");
 var from    = Date_Get(date, ["hour", "minutes"], ":");
 var date    = Safe_Get(data, ["class", "date_end"], "");
 var to      = Date_Get(date, ["hour", "minutes"], ":");
 
 var element = UI_Element_Find(header, "class-time");
 element.innerHTML = UI_Language_String("course/header", "time", {from, to});
 
 
 
 // CENTER
 var center = Safe_Get(data, ["class", "center_id"]);
 text       = Centers_Name(center);
 
 var element = UI_Element_Find(header, "class-center");
 element.innerHTML = UI_Language_String("course/header", "center", {text});
 
 
 // TEACHER 
 var teacher_id = Safe_Get(data, ["teacher", "id"]);

 var text = [];
 for(var field of ["firstname", "lastname"])
 {
  var value = Safe_Get(data, ["teacher", field], "");
  if(value) text.push(value);
 }
 text = text.join(" ").trim();
 
 var element = UI_Element_Find(header, "class-teacher");
 element.innerHTML = UI_Language_String("course/header", "teacher", {text});
 
 
 
 // AIMS
 var date     = Safe_Get(data, ["class", "date_end"], "");
 if(date > Date_Now()) var period = "future"; else var period = "past";
 var text     = UI_Language_String("course/class", "header aims " + period);
 UI_Element_Find(header, "lesson-intro").innerHTML = text;
  
 var aims     = UI_Element_Find(header, "lesson-aims"); 
 var outcomes = Safe_Get(data, ["lesson", "outcomes"], {});
 var keys     = Object.keys(outcomes);
 for(var key of keys)
 {
  var outcome = Safe_Get(outcomes, [key, "info"], {});
  outcome     = UI_Language_Object(outcome) || "";
  var text    = "•" + "&nbsp;&nbsp;" + String_Capitalize_Initial(outcome);
  
  if(text) 
  {
   var aim  = UI_Element_Create("course/class-content-aim", {text});
   
   aims.appendChild(aim);
  }
 }
 
 
 // SWITCH
 var header = UI_Header("switches",
 {
  content:
  {
   text :   UI_Language_String("course/class", "header switch content"),
   icons:   [],
   onclick: function(){Course_Class_DisplayActivities(UI_Element_Find(page, "content-rows"))}
  },
  
  assessment:
  {
   text :   UI_Language_String("course/class", "header switch assessment"),
   icons:   [],
   onclick: function(){Course_Class_DisplayAssessment(UI_Element_Find(page, "content-rows"))}
  },
  
  badges:
  {
   text :   UI_Language_String("course/class", "header switch badges"),
   icons:   [],
   onclick: function(){Course_Class_DisplayBadges(UI_Element_Find(page, "content-rows"))}
  },
  
  stream:
  {
   text :   UI_Language_String("course/class", "header switch stream"),
   icons:   [],
   onclick: function(){Course_Class_DisplayStream(UI_Element_Find(page, "content-rows"))}
  }
 },
 
 {selectfirst:true, css:"color-noted"});
 
 
 // DISABLE STREAM ACCESS IF THIS CLASS IS NOT ONLINE 
 var streaming = Safe_Get(data, ["class", "online"], false);
 if(streaming == "0") 
 {
  UI_Header_Disable(header, "stream");
 }
  
 // DISABLE ASSESSMENT SWITCH IF CLASS NOT PAST YET
 var date_end = Date_Complete(Safe_Get(data, ["class", "date_start"], "")); 

 if(date_end > Date_Now())
 {
  UI_Header_Disable(header, "assessment");
  UI_Header_Disable(header, "badges");
 }
  
  
 UI_Element_Find(page, "switches").appendChild(header);
  
 
 // SETUP SWITCHES BETWEEN CLASS SECTIONS (ACTIVITIES, ASSESSMENT, ETC.)
 var elements = Document_Element_FindChildren(page, "display", undefined, ["recurse"]);
 for(var element of elements) element.onclick = Course_Class_Display;

 
 container.innerHTML = "";
 container.appendChild(page);
}



/*
function Course_Class_Display(event)
{
 var element   = event.currentTarget;
 var display   = Document_Element_GetData(element, "display");
 var container = UI_Element_Find("content-rows");
 
 var f = Safe_Function("Course_Class_Display" + String_Capitalize_Initial(display));
 if(f) f(container);
}
*/



async function Course_Class_RefreshData()
{
 var data = Core_State_Get("course", ["class-data"], data);
 
 var student_id     = User_Id();
 var source         = Core_State_Get("course", ["current-lesson"]);
 
 // ACTIVITIES RESULTS
 var results        = await Core_Api("Activities_Results_ReadBySource", {student_id, source, strict:false});
 data["scores"]     = results;
 data["activities"] = Array_Catalog_ByField(results, "source");
 
 Core_State_Set("course", ["class-data"], data);
}







async function Course_Class_UpdateCharts()
{
 var student_id = User_Id();
 var source     = Core_State_Get("course", ["current-lesson"]);
 
 var data       = await Core_Api("Activities_Results_ReadBySource", {student_id, source, strict:false});
 data           = Array_Catalog_ByField(data, "source");
 
 var container = UI_Element_Find("content-rows");
 for(var source in data)
 {
  var element = Document_Element_FindChild(container, "source", source);
  
  if(element)
  {
   var chart = UI_Element_Find(element, "chart");
  }
 }
 
 console.log(data);
}





async function Course_Class_RunActivity(event)
{
 // GET ACTIVITY INFO
 var element = event.currentTarget;
 
 var mode    = Document_Element_GetData(element,   "mode");
 var state   = Document_Element_GetData(element,   "state");
 var source  = Document_Element_GetData(element,   "source");
 var config  = Document_Element_GetObject(element, "config") || {};
 
 console.log(config);
 
 // DEFAULT CONFIG
 Object.assign(config,
 {
  escape:     true, 
  mode:       mode, 
  navigation: false, 
  student:    User_Id()
 });
 
 

 // RUN ACTIVITY
 console.log("Running Activity " + source + " in mode " + mode.toUpperCase() + "/" + state.toUpperCase());
 var result = await Activity_Run(source, config);

 // IF THERE IS A RESULT (ACTIVITY WASN'T CLOSED BEFORE THE END ETC.)
 if(result !== false && result !== undefined)
 {
  if(mode != "practice")
  {
   // IN PRE-LESSON STATE, DISPLAY "NOW YOU CAN PRACTICE" INTERMISSION INSTEAD OF RESULT
   if(state == "pre")
   {
    var title   = UI_Language_String("course/popups", "intermission practice title");
    var text    = UI_Language_String("course/popups", "intermission practice text");
    var picture = Resources_URL("images/intermission-activity-assessed.png");
    
	await Activity_Result_Store(result);
    await UI_Popup_Intermission(title, text, picture, 3);
   }
   else
   {
    // DISPLAY RESULT 
    await Activity_Result_Popup(result);
   }
  
   console.log("data refreshed");
  
   // REFRESH CLASS DATA
   await Course_Class_RefreshData();
  
   // REDRAW CONTENT
   Course_Class_DisplayActivities(UI_Element_Find("content-rows"));
  }
 }
}

