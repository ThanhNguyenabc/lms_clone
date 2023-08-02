// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       C O U R S E S                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//
var f = function(event) {
  Core_Api("Courses_Lock_Delete");
};

async function Courses_OnLoad(module, data)
{
 var page = await Courses_Display();
 
 UI_Element_Find(module, "module-page").appendChild(page);
 window.addEventListener("beforeunload", f);
}




async function Courses_OnShow(module, data)
{

}




async function Courses_OnUnload()
{
  await Core_Api("Courses_Lock_Delete");
  window.removeEventListener("beforeunload",f);
}




async function Courses_Display(options = {})
{
 var display = UI_Element_Create("courses/display");
 Core_State_Set("courses", "display", display);
 
 // ALL CENTERS
 var centers = Array_Organize_ByField(Centers_Available(), "id");
 
 // STORED SEARCH, IF ANY
 var search  = Core_State_Get("courses", "search", {});
 
 // DETERMINE AND STORE CENTERS AVAILABLE TO ME
 Core_State_Set("courses", "centers", centers);
  
  
 // CENTERS SELECT
 var select = UI_Element_Find(display, "search-centers");
 Document_Select_OptionsFromObjects(select, centers, "name", false);
 
 if(typeof search["centers"] != "undefined") Document_Select_SelectByValue(select, search["centers"]);
 

 
 // STATUS
 var select = UI_Element_Find(display, "search-status"); 
 Document_Select_AddOption(select, UI_Language_String("courses", "search any"), "");
 Document_Select_AddOption(select, "---", "").disabled = true;
 UI_Select_FromDatapage(select, "courses/course-status");
 
 if(typeof search["status"] != "undefined") select.value = search["status"];
 
 
 
 
 // ALL PROGRAMS
 var programs = Core_Config("programs");
 
 // PROGRAM SELECT
 var select = UI_Element_Find(display, "search-program");
 Document_Select_AddOption(select, UI_Language_String("courses", "search any"), "");
 Document_Select_AddOption(select, "---", "").disabled = true;
 Document_Select_OptionsFromObjects(select, programs, "name", false);
 
 if(typeof search["program"] != "undefined") select.value = search["program"];
 
 select.onchange = 
 function(event)
 {
  var display   = Core_State_Get("courses", "display");
  var element  = event.currentTarget;
  var program  = element.value;
  
  // ALL LEVELS
  var programs = Core_Config("programs", "");
  var levels   = Safe_Get(programs, [program, "levels"], "").split(",");
  
  // LEVEL SELECT
  var select = UI_Element_Find(display, "search-level");
  Document_Select_Clear(select);
  Document_Select_AddOption(select, UI_Language_String("courses", "search any"), "");
  Document_Select_AddOption(select, "---", false).disabled = true;
  Document_Select_OptionsFromValues(select, levels, levels);
  
  //if(typeof search["level"] != "undefined") select.value = search["level"];
 }
 
 
 
 // DATE MODES
 var select   = UI_Element_Find(display, "search-datemode");
 UI_Select_FromDatapage(select, "courses/search-date-modes");
 select.value = "ends-after";
 
 select.onchange = 
 function(event)
 {
  var element = event.currentTarget;
  var display = Core_State_Get("courses", "display");
  
  var input   = UI_Element_Find(display, "search-datefrom");
  if(element.value == "ongoing")
  {
   input.style.display = "none";
  }
  else 
  {
   input.style.display = "flex";
  }	  
 }
 
 
 // DATE 
 var input = UI_Element_Find(display, "search-datefrom");
 if(typeof search["date"] != "undefined") input.value = Date_To_Input(search["date"]); else input.value = Date_To_Input(Date_Now());
 
 
 // TIMEFROM TIMETO
 var select_from = UI_Element_Find(display, "search-timefrom");
 var select_to   = UI_Element_Find(display, "search-timeto");
 var time_start  = Time_To_Minutes(Core_Config(["operations", "timetable", "time-opening"], "01:00"));
 var time_end    = Time_To_Minutes(Core_Config(["operations", "timetable", "time-closing"], "24:00"));
 var time        = time_start;
 while(time <= time_end)
 {
  var text = Time_From_Minutes(time);
  
  Document_Select_AddOption(select_from, text, time);
  Document_Select_AddOption(select_to,   text, time);
  
  time = time + 30;
 }
 
 select_from.value    = time_start;
 select_to.value      = time_end;
 
	
 // DAYS 
 var select = UI_Element_Find(display, "search-days");
 var locale = UI_Language_Current(true);
 for(var day = 1; day<=7; day++)
 {
  var text = Date_Weekday_Name(day, "long", locale);
  Document_Select_AddOption(select, text, day);
 }
 

 // BUTTON SEARCH
 UI_Element_Find(display, "button-course-search").onclick = Courses_Search;
 
 // BUTTON CREATE
 UI_Element_Find(display, "button-course-new").onclick = Courses_New;

 return display;
}






// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          M O R E                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



async function Courses_Search(reload = true)
{
 var module = Core_State_Get("courses", "display");
 
 if(reload)
 {
  // SEARCH
  var centers   = [UI_Element_Find(module, "search-centers").value]                 || false;
  var program   = UI_Element_Find(module, "search-program").value                   || false;
  var level     = UI_Element_Find(module, "search-level").value                     || false;
  var status    = UI_Element_Find(module, "search-status").value                    || false;
  var date      = Date_From_Input(UI_Element_Find(module, "search-datefrom").value) || false;
  var date_mode = UI_Element_Find("search-datemode").value;
  
 
  var search    = {centers, program, level, date, date_mode, status, order:"date_start DESC"};
  Core_State_Set("courses", "search", search);
 
  var courses   = await Core_Api("Courses_List", search);
  Core_State_Set("courses", "data", courses);
 
  console.log(courses);
 }
 else
 { 
  var courses = Core_State_Get("courses", "data", []);
 }
 
 
 // FILTER THE RESULTS BY DATES/TIMES DATA
 var days      = Document_Input_Get(UI_Element_Find(module, "search-days"));
 var time_from = parseInt(UI_Element_Find(module, "search-timefrom").value);
 var time_to   = parseInt(UI_Element_Find(module, "search-timeto").value);

 var filtered = [];
  
 for(var course of courses)
 {  
  var validate = true;
  
  var schedule = course["schedule"] || [];
  for(var item of schedule)
  {
   // CHECK DAY
   if(days.length > 0 && !days.includes(item["day"])) 
   {
    validate = false;
	break;
   }
	
   // CHECK TIME
   if(!Numbers_Between(parseInt(item["time"]), time_from, time_to))
   {
    console.log("discarded for time " + item["time"] + " not between " + time_from + " and " + time_to);
    validate = false;
	break;
   }
  }
  
  if(validate) filtered.push(course);
 }
 
 var courses = filtered;
 
 await Courses_Search_Display(courses);
}




async function Courses_Search_Display(courses)
{
 var module = Core_State_Get("courses", "display");
 
 // ASSEMBLE RESULTS  
 var list = UI_List_Items(courses, ["style-outlined-accented", "outline-inner"], Courses_Course_Display, undefined,
 function(course)
 { 
  var locale   = UI_Language_Current(true);
  var centers  = Core_Config("centers");
  var programs = Core_Config("programs");
 
  var data              = {};
  
  data["name"]          = course["name"] || "#" + course["id"];
  
  data["date"]          = UI_Language_Date(course["date_start"], "monthdayyear-compact");
  data["center"]        = Safe_Get(centers,  [course["center_id"], "name"], course["center_id"]);
  data["program"]       = Safe_Get(programs, [course["program"], "name"], course["program"]) || UI_Language_String("courses/course-display", "no program");
  data["level"]         = course["level"] || UI_Language_String("courses/course-display", "no level");
  
  data["seats_taken"]   = course["seats"]["taken"] || 0;
  data["seats_total"]   = course["seats"]["total"] || 0;
  
  data["classes_taken"] = course["classes"]["taken"] || 0;
  data["classes_total"] = course["classes"]["total"] || 0;
  
  
  var days  = [];
  for(var item of course["schedule"] || [])
  {
   var day  = Date_Weekday_Name(item["day"], "short", locale);
   var time = Time_From_Minutes(item["time"]);
   
   days.push(day + " " + time);
  }
  data["days"] = days.join(", ");
  
  var element     = UI_Element_Create("courses/course-item", data);
  Document_Element_SetObject(element, "course", course);
  Document_Element_SetData(element, "course_id", course["id"]);
  
  return element;
 });

 Core_State_Set("courses", "courses-list", list);
 
 
 // DISPLAY RESULTS
 var container = UI_Element_Find(module, "courses-list"); 
 if(courses.length > 0)
 {
  container.innerHTML  = "";
  container.appendChild(list);

  container.style.visibility = "visible";
 }
 else
 {
  container.style.visibility = "hidden";
  container.innerHTML  = "";
 }
 

 // CLEAR COURSE DISPLAY
 UI_Element_Find(module, "course-display").innerHTML = ""; 
}




async function Courses_New()
{
 var title = UI_Language_String("courses/popups", "create course title");
 var text  = UI_Language_String("courses/popups", "create course text");
 var name  = await UI_Popup_Input(title, text);
 
 if(!name) return;
 
 var data           = {};
 data["name"]       = name;
 data["status"]     = "design";
 data["date_start"] = Date_Portion(Date_Now(), "date-only");
 data["center_id"]  = User_Center();
 
 // CREATE
 var id     = await Core_Api("Courses_New", {data});
 var course = await Core_Api("Courses_Read", {id});
 
 // RESET SEARCH, DISPLAY ONLY THIS NEWLY CREATED COURSE
 await Courses_Search_Display([course]);
 
 Courses_Course_Display(id);
}




async function Courses_Course_Display(element)
{
 // GLOBALS
 var locale   = UI_Language_Current(true);
 var centers  = Centers_Available();
 var programs = Core_Config("programs");
 
 
 // READ COURSE
 // IF THE PASSED ELEMENT IS A NUMBER OR STRING, THEN IT'S A DIRECT COURSE_ID
 if(typeof element != "object") 
 {
  var course_id = element;
 }
 else
 // OTHERWISE GET COURSE_ID FROM THE ELEMENT THAT TRIGGERED THE EVENT
 {
  var course_id = Document_Element_GetData(element, "course_id", {});
 }
 // READ
 var course    = await Core_Api("Courses_Read", {id:course_id, info:{all:true}});
 Core_State_Set("courses", "selected-course", course);
 
 // Check edit available
 var usercheck = await Core_Api("Course_Edit_Available",{id:course_id});
 if(usercheck != 0 && usercheck.id != User_Id()){
  
  let name = (usercheck.lastname ?? "") + " " + (usercheck.midname ?? "") + " " + (usercheck.firstname ?? "");
  let message = UI_Element_Create("courses/display-course-lock",{name:name});

  let container       = UI_Element_Find("course-display");
  container.innerHTML = "";
  container.appendChild(message);
  return
 } 
 
 // CREATE DISPLAY 
 var display = UI_Element_Create("courses/course-display", {}, {language:"courses/course-display"});
 Core_State_Set("courses", "course-display", display);

 
 // 1. SETUP CONTROLS
 
 // ID 
 var input      = UI_Element_Find(display, "course-id");
 input.readOnly = true;
 
 input.value    = course["id"];
 
 
 
 // NAME
 var input      = UI_Element_Find(display, "course-name");
 
 input.value    = course["name"] || "";
 input.onchange = Courses_Course_Update;
 
 
 
 // STATUS
 var select      = UI_Element_Find(display, "course-status");
 UI_Select_FromDatapage(select, "courses/course-status");
 
 select.value    = course["status"];
 select.onchange = Courses_Course_StatusChange;
 
 
 // CENTER
 var select      = UI_Element_Find(display, "course-center_id");
 var centers     = Core_State_Get("courses", "centers");
 Document_Select_AddOption(select, "", "");
 Document_Select_OptionsFromObjects(select, centers, "name", false);
 
 select.value    = course["center_id"];
 
 select.onchange = 
 async function(event)
 {
  await Courses_Course_Update(event); 
  await Courses_Course_UpdateRooms();
 }

 
 // PROGRAM
 var select   = UI_Element_Find(display, "course-program");
 var programs = Core_Config("programs");
 Document_Select_AddOption(select, "", "");
 Document_Select_OptionsFromObjects(select, programs, "name", false);
 
 select.value    = course["program"];
 select.onchange = 
 async function(event)
 {
  await Courses_Course_Update(event);
  await Courses_Course_UpdateLevels();
 }
 
 await Courses_Course_UpdateLevels();
 
 
 
 // LEVEL
 var select      = UI_Element_Find(display, "course-level");
 
 select.value    = course["level"];
 select.onchange = Courses_Course_Update;
 
 
 
 // LESSON DURATION
 var select = UI_Element_Find(display, "course-lesson_duration"); 
 UI_Select_FromDatapage(select, Core_Config(["lesson-durations"]));
 Document_Select_InsertOption(select, "", "");
 
 select.value    = course["lesson_duration"];
 select.onchange = Courses_Course_Update; 
 
 
 
 // TEACHER CONFIG
 var select = UI_Element_Find(display, "course-teacher_config"); 
 UI_Select_FromDatapage(select, Core_Config(["course-teacher-configs"]));
 Document_Select_InsertOption(select, "", "");
 
 select.value    = course["teacher_config"];
 select.onchange = Courses_Course_Update; 
 
 
 
 // DATE START
 var input      = UI_Element_Find(display, "course-date_start");
 
 input.value    = Date_To_Input(course["date_start"] || "");
 input.onchange = Courses_Course_Update;
 
 
 // DATE END
 var input      = UI_Element_Find(display, "course-date_end");
 input.readOnly = true;
 
 input.value    = Date_To_Input(course["date_end"] || "");
 input.onchange = Courses_Course_Update;
 
 
 
 // ROLL OUT CLASSES
 var icon       = UI_Element_Find(display, "course-classes-rollout");
 icon.onclick   = Courses_Classes_Rollout;
 
 // ROLL BACK CLASSES
 var icon       = UI_Element_Find(display, "course-classes-rollback");
 icon.onclick   = Courses_Classes_Rollback;

   
 // SEATS
 var select     = UI_Element_Find(display, "course-seats");
 for(var i = 1; i<30; i++)
 {
  Document_Select_AddOption(select, i, i);
 }
 
 select.value    = course["seats"] || 0;
 select.onchange = 
 async function(event)
 {
  await Courses_Course_Update(event);
  await Courses_Course_SetSeats();
 }
 
 
 // ROOMS
 var select      = UI_Element_Find(display, "course-room");
 select.onchange = Courses_Course_SetRoom;
 
 select.value    = course["room"] || "";
 Courses_Course_UpdateRooms();

 
 
 // NOTES
 var input      = UI_Element_Find(display, "course-notes");
 
 input.value    = course["notes"] || "";
 input.onchange = Courses_Course_Update;
   
   
 
 // 2. MORE DISPLAYS
 
 
 // 2A. SCHEDULE
 Courses_Schedule_Display();


 // 2B. STAFF
 Courses_Staff_Display();
 
 
 // 2C. STUDENTS
 Courses_Students_Display();
 

 // 2E. CLASSES
 Courses_Classes_Display();
 
 
 
 
 // 3. ENABLE/DISABLE SECTIONS BASED ON COURSE STATE / STATUS
 Courses_Course_UpdateUI();

 // CREATE COUNT LOG 
 Create_Course_Lock(course);
 
 var container       = UI_Element_Find("course-display");
 container.innerHTML = "";
 container.appendChild(display);
}




function Courses_Course_Unselect()
{
 UI_Element_Find("course-display").innerHTML = "";
 Core_State_Set("courses", "selected-course", false);
}




function Courses_Course_UpdateUI()
{
 var course   = Core_State_Get("courses", "selected-course", {});
 var display  = Core_State_Get("courses", "course-display");
 
 
 // IF ANY STAFF MEMBER IS SET, DO NOT ALLOW TO CHANGE TEACHER CONFIGURATION
 var select = UI_Element_Find(display, "course-teacher_config"); 
 if(Object_Valid(course["staff"]))
 {
  Document_Element_Disable(select, "style-disabled");
 }
 else
 {
  Document_Element_Restore(select, true);
 }
 
 
 var staff    = UI_Element_Find(display, "section-staff");
 var rollback = UI_Element_Find(display, "course-classes-rollback");
 var rollout  = UI_Element_Find(display, "course-classes-rollout");
 
 if(Courses_Course_Rolledout(course))
 {
  Document_Element_Restore(staff);
  Document_Element_Restore(rollback);
 }
 else
 {
  Document_Element_Disable(staff,    "style-disabled");
  Document_Element_Disable(rollback, "style-disabled");
 }

 Courses_Course_UpdateUI_ByStatus(course);
}


async function Courses_Course_StatusChange(event, element) {
  await Courses_Course_Update(event, element);
  let course   = Core_State_Get("courses", "selected-course", {});
  Courses_Course_UpdateUI_ByStatus(course);
}


function Courses_Course_UpdateUI_ByStatus(course) {
  const display  = Core_State_Get("courses", "course-display");
  const status = course["status"];
  const programm = UI_Element_Find(display, "course-program");
  const level = UI_Element_Find(display, "course-level");
  if(status !== "design") {
    Document_Element_Disable(programm, "style-disabled");
    Document_Element_Disable(level, "style-disabled");
  } else {
    Document_Element_Restore(programm);
    Document_Element_Restore(level);
  }

}

async function Courses_Course_UpdateLevels()
{
 var course   = Core_State_Get("courses", "selected-course", {});
 var display  = Core_State_Get("courses", "course-display");
 var select   = UI_Element_Find(display, "course-level");
  
 var programs = Core_Config("programs");
 var program  = course["program"];
 var levels   = Safe_Get(programs, [program, "levels"], "").split(",");
  
 Document_Select_Clear(select);
 Document_Select_AddOption(select, "", "");
 Document_Select_OptionsFromValues(select, levels, levels);
  
 select.value = course["level"];
}




async function Courses_Course_UpdateRooms()
{
 var course = Core_State_Get("courses", "selected-course", {});
 var rooms  = await Centers_Rooms(course["center_id"]);
 
 var display = Core_State_Get("courses", "course-display");
 var select  = UI_Element_Find(display, "course-room");
 Document_Select_Clear(select);

 Document_Select_AddOption(select, UI_Language_String("courses/rooms", "TBD"), "");
 Document_Select_AddOption(select, UI_Language_String("courses/rooms", "online"), "online");
 Document_Select_AddOption(select, "", "").disabled = true;
 
 for(var room in rooms)
 {
  Document_Select_AddOption(select, room, room);
 }
 
 select.value = course["room"];
}



async function Courses_Course_SetSeats(event)
{
 var course  = Core_State_Get("courses", "selected-course", {});
 
 var display = Core_State_Get("courses", "course-display");
 var element = UI_Element_Find(display, "course-seats");
 var seats   = element.value;
 var now     = Date_Now();
 
 await Core_Api("Classes_Batch_SetField", {field:"seats_total", value:seats, options:{course:course["id"], from:now}});
}


async function Courses_Course_SetRoom(event)
{
 var element = event.currentTarget;
 var room    = element.value;
 var course  = Core_State_Get("courses", "selected-course", {});
 var now     = Date_Now(); 
  
 // NOW DEPENDING ON WHAT ROOM IS CHOOSEN (TBD, ONLINE, OR ONE OF THE ACTUAL ROOMS) SET UP CLASSES
 switch(room)
 {
  case "":
	await Core_Api("Classes_Batch_SetField", {field:"classroom_id", value:null, options:{course:course["id"], from:now}});
	await Core_Api("Classes_Batch_SetField", {field:"online",       value:"0",  options:{course:course["id"], from:now}});
  break;
   
  case "online":
	await Core_Api("Classes_Batch_SetField", {field:"classroom_id", value:"online", options:{course:course["id"], from:now}});
	await Core_Api("Classes_Batch_SetField", {field:"online",       value:"1",      options:{course:course["id"], from:now}});
  break;
  
  default:
    // CONFIRM ROOM IS AVAILABLE THROUGHOUT ALL DATES
	var available = await Core_Api("Courses_Rooms_Available", {id:course["id"]});
		
	if(!available.includes(room))
	{
     if(available.length > 0) var rooms = available.join(", "); else var rooms = UI_Language_String("courses/popups", "room unavailable none");	     
		 
     var title    = UI_Language_String("courses/popups", "room unavailable title"); 
	 var content  = UI_Language_String("courses/popups", "room unavailable text", {rooms}); 
	 var picture  = Resources_URL("images/cover-alert.jpg");

	 var confirm  = await UI_Popup_Confirm(title, content, picture);

	 // IF NOT CONFIRMED, RESTORE ROOM TO PREVIOUS VALUE
	 if(!confirm) 
	 {
	  element.value = course["room"];
	  
	  return;
	 }
	}
	
	await Core_Api("Classes_Batch_SetField", {field:"classroom_id", value:room, options:{course:course["id"], from:now}});
	await Core_Api("Classes_Batch_SetField", {field:"online",       value:"0",  options:{course:course["id"], from:now}});
  break;
 }
 
 // UPDATE COURSE FIELD
 Courses_Course_Update(false, element); 
}



async function Courses_Course_Update(event, element)
{
 var course = Core_State_Get("courses", "selected-course", {});
 var id     = course["id"]; 
 
 Create_Course_Lock(course);
 if(!element) var element = event.currentTarget;
 
 var uid     = Document_Element_GetData(element, "uid");
 var field   = uid.split("-")[1];
 
 switch(element.type)
 {
  case "date":
	var value = Date_From_Input(element.value);
	var json  = false;
  break;
  
  default:
	var value = element.value;
	var json  = false;
  break;
 }
 
 course[field] = value;
 await Core_Api("Courses_Update_Field", {id, field, value, json});
}





async function Courses_Course_SwitchStatus()
{
 var course = Core_State_Get("courses", "selected-course", {});
 var id     = course["id"];
 
 switch(course["status"])
 {
  case "design":
    var title    = UI_Language_String("courses/popups", "status to-open title"); 
	var content  = UI_Language_String("courses/popups", "status to-open text"); 
	var picture  = Resources_URL("images/cover-alert.jpg");

	var confirm  = await UI_Popup_Confirm(title, content, picture);
	if(!confirm) return;
	
	Core_Api("Courses_Update_Field", {id, field:"status", value:"open"});
  break;
  
  case "open":
	var title    = UI_Language_String("courses/popups", "status to-design title"); 
	var content  = UI_Language_String("courses/popups", "status to-design text"); 
	var picture  = Resources_URL("images/cover-alert.jpg");

	var confirm  = await UI_Popup_Confirm(title, content, picture);
	if(!confirm) return;
	
	Core_Api("Courses_Update_Field", {id, field:"status", value:"design"});
  break;
 }
 
 Courses_Course_Display(id);
}





function Courses_Course_Rolledout(course)
{
 var classes   = course["classes"] || [];
 var rolledout = (classes.length > 0 && classes[0]["id"]);
 
 return rolledout;
}



async function Courses_Course_HighlightMissing(operation, missing)
{
 var uid     = Core_Data_Value("courses/popups", operation + " missing " + missing, "highlight");
 var element = UI_Element_Find("course-" + uid);
 
 await Document_Element_Animate(element.parentElement, "flash 1.5s 1.5");
}



async function Courses_Course_Delete(event)
{
 var course = Core_State_Get("courses", "selected-course", {});
 var id     = course["id"];
 
 // CONFIRM
 var code     = String(id).padStart(6, "0");
 var title    = UI_Language_String("courses/popups", "status delete title"); 
 var content  = UI_Language_String("courses/popups", "status delete text", {id:code}); 
 var picture  = Resources_URL("images/cover-alert.jpg");
 
 var confirm = await UI_Popup_Code(title, content, picture, code);
 if(!confirm) return;

 // DELETE FROM COURSES LIST
 var list    = Core_State_Get("courses", "courses-list", list);
 for(var element of list.children)
 {
  var course_id = Document_Element_GetData(element, "course_id", false);
  if(course_id == id)
  {
   element.remove();
   break;
  }
 }
 
 // HIDE DISPLAY
 Courses_Course_Unselect();
 
 // DELETE FROM DATABASE
 await Core_Api("Courses_Delete", {id});
}