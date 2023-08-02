// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                     T I M E T A B L E                                          //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



// GLOBALS
// WE USE GLOBALS HERE INSTEAD OF CORE_STATE BECAUSE COMPUTATION COULD GET INTENSE WITH HUNDREDS OF TIMETABLE SLOTS ON SCREEN
var TIMETABLE_HOUR_START,  
    TIMETABLE_HOUR_END,
	TIMETABLE_TIME_START,
	TIMETABLE_TIME_END,
	TIMETABLE_MIN_TIME,
	TIMETABLE_MIN_HEIGHT,
	TIMETABLE_SLOT_MARGIN,
	TIMETABLE_DAY_SLOTS;
	


async function Timetable_OnLoad(module, data)
{  
 Core_State_Set("timetable", "module", module);
 
 // 0. SET CONFIG GLOBALS
 TIMETABLE_HOUR_START   = Core_Config(["operations", "timetable", "time-opening"], "08:30");
 TIMETABLE_HOUR_END     = Core_Config(["operations", "timetable", "time-closing"], "22:30");
 
 TIMETABLE_TIME_START   = Time_To_Minutes(TIMETABLE_HOUR_START); 
 TIMETABLE_TIME_END     = Time_To_Minutes(TIMETABLE_HOUR_END); 

 TIMETABLE_MIN_TIME    = parseInt(Core_Config(["operations", "timetable", "time-segment"], "30")); // MINUTES
 TIMETABLE_MIN_HEIGHT  = 32;                                                                       // PIXELS FOR A MIN_TIME MINUTES SLOT
 
 TIMETABLE_SLOT_MARGIN = 4;

 TIMETABLE_DAY_SLOTS   = (TIMETABLE_TIME_END - TIMETABLE_TIME_START) / TIMETABLE_MIN_TIME;
 
 
  
 // 1. VIEW

 // SET BY ANOTHER MODULE?  
 var view = Core_State_Get("timetable", "view", false);
 
 // SET BY URL?
 if(!view)
 {
  var view = Client_Location_Parameter("view");
 }
 
 
 // STILL NO VIEW? DEFAULT TO CENTER-TEACHERS
 if(!view) var view = "center-teachers"; 
 
 Core_State_Set("timetable", "view", view);
 
 
 
 // 2. DATE
 
 // SET BY ANOTHER MODULE? 
 var date = Core_State_Get("timetable", "date", false);
 
 // SET BY URL?
 if(!date)
 {
  var date = Client_Location_Parameter("date");
 }
 
 // STILL NO DATE? SET IT TO TODAY
 if(!date) var date = Date_Now();
 
 Timetable_Set_Date(date);
 
 
 
 
 // 3. CENTER
 
 // SET BY ANOTHER MODULE? 
 var center = Core_State_Get("timetable", "center", false);
 
 // SET BY URL?
 if(!center)
 {
  var center = Client_Location_Parameter("center");
 }
 
 // STILL NO CENTER? SET IT TO USER'S HOME CENTER
 if(!center) var center = User_Center();
 
 Core_State_Set("timetable", "center", center);
 
 
 // 3b. ROOM
 
 // SET BY ANOTHER MODULE? 
 var room = Core_State_Get("timetable", "room", false);
 
 // SET BY URL?
 if(!room)
 {
  var room = Client_Location_Parameter("room");
 }
 
 // STILL NO CENTER? SET IT TO USER'S HOME CENTER
 if(!room) var room = User_Center();
 
 Core_State_Set("timetable", "room", room);
 
 
 
 // 4. USER
 
 // SET BY ANOTHER MODULE? 
 var user = Core_State_Get("timetable", "user", false);
 
 // SET BY URL?
 if(!user)
 {
  var user = Client_Location_Parameter("user");
 }
 
 // STILL NO USER? SET IT TO USER'S HOME CENTER
 if(!user) var user = User_Id();
 
 Core_State_Set("timetable", "user", user);
 
 
 
 
 // GET DATA
 Core_State_Set("timetable", "center-last", false);
 
 await Timetable_Function("Data");
}



async function Timetable_Header_SelectCenter()
{
 var select = UI_Element_Find("timetable-center");
 var center = select.value;
 
 Core_State_Set("timetable", "center", center);
 
 // RELOAD ROOMS, TEACHERS, AND COURSES
 await Timetable_Data_Center("week");
 
 // UPDATE ENTITIES (DISPLAYING THE RIGHT ROOMS AND TEACHERS)
 await Timetable_Header_UpdateEntities("teacher:all");
 
 // UPDATE TIMETABLE
 await Timetable_Update();
}



async function Timetable_Header_UpdateEntities(selected)
{
 var module = Core_State_Get("timetable", "module");

 var center = Core_State_Get("timetable", "center", User_Center());  
 var type   = UI_Element_Find(module, "timetable-type").value;
 console.log(type);

 
 var select = UI_Element_Find("timetable-entity");
 Document_Select_Clear(select);
 
 switch(type)
 {
  case "teachers":
	// ALL TEACHERS
	Document_Select_AddOption(select, UI_Language_String("timetable", "header all"), "teacher:all");
 
    // EMPTY ROW
    Document_Select_AddOption(select, "", "").disabled = true;
 
	// TEACHERS
	var teachers = Core_State_Get("timetable", "teachers", []);
	for(var teacher of teachers)
	{
	 Document_Select_AddOption(select, [teacher["firstname"], teacher["lastname"]].join(" "), "teacher:" + teacher["id"]); 
	}
	
	var selected = "teacher:all";
  break;
 
 
  case "rooms":
	// ALL ROOMS
	var option = Document_Select_AddOption(select, UI_Language_String("timetable", "header all"), "room:all");
 
    // EMPTY ROW
    Document_Select_AddOption(select, "", "").disabled = true;
  
	// ROOMS
	var rooms = Core_State_Get("timetable", "rooms", {});
	for(var id in rooms)
	{
	 Document_Select_AddOption(select, id, "room:" + id); 
	}
	
	var selected = "room:all";
  break;
  
  
  case "courses":
	// EMPTY ROW
    Document_Select_AddOption(select, "", "").disabled = true;
  
	// COURSES
	var courses = Core_State_Get("timetable", "courses", {});
	for(var course of courses)
	{
     var text = course["name"] || course["id"];
	 Document_Select_AddOption(select, text, "course:" + course["id"]); 
	}
	
	var selected = "course:";
  break;
 }
 
 
 // ON ENTITY SELECTION
 select.onchange = 
 async function()
 {
  var select = UI_Element_Find("timetable-entity");
  var entity = select.value.split(":");
  console.log(entity);
  
  switch(entity[0])
  {
   case "teacher":
	switch(entity[1])
	{
     case "all":
		Core_State_Set("timetable", "view", "center-teachers");
		
		await Timetable_Update();
	 break;
	 
	 default:
		Core_State_Set("timetable", "view", "teacher-week");
		Core_State_Set("timetable", "user", entity[1]); 
		
		await Timetable_Update();
	 break;
	}
   break;
   
   case "room":
	switch(entity[1])
	{
     case "all":
		Core_State_Set("timetable", "view", "center-rooms");
		
		await Timetable_Update();
	 break;
	 
	 default:
		Core_State_Set("timetable", "view", "room-week");
		Core_State_Set("timetable", "room", entity[1]); 
		
		await Timetable_Update();
	 break;
	}
   break;
   
   case "course":
	switch(entity[1])
	{
     case "all":
		Core_State_Set("timetable", "view", "center-courses");
		
		await Timetable_Update();
	 break;
	 
	 default:
		Core_State_Set("timetable", "view", "course-week");
		Core_State_Set("timetable", "course", entity[1]); 
		
		await Timetable_Update();
	 break;
	}
   break;
  }
 }
 
 
 if(selected) 
 {
  console.log(selected);
  select.value = selected;
  select.onchange();
 }
}




async function Timetable_OnShow(module, data)
{
 // HEADER: AVAILABLE CENTERS
 var centers = Centers_Available();
 var center  = Core_State_Get("timetable", "center", User_Center());
 var select  = UI_Element_Find(module, "timetable-center");
 for(var item of centers)
 {
  var option   = new Option();
  option.value = item["id"];
  option.text  = item["name"];
  
  if(item["id"] == center) option.selected = true;
  
  select.appendChild(option);
 }
 
 select.onchange = Timetable_Header_SelectCenter;
 
 
 // HEADER: ENTITY TYPES
 var select = UI_Element_Find(module, "timetable-type");
 for(var item of ["teachers", "rooms", "courses"])
 { 
  Document_Select_AddOption(select, UI_Language_String("timetable", "header " + item) , item);
 }
 select.value    = "teachers";
 select.onchange = 
 function()
 {
  Timetable_Header_UpdateEntities();
 }
 
 Timetable_Header_UpdateEntities();
 
 
 var durations = UI_Menu_FromObject("durations", Core_Config(["lesson-durations"]), false, Timetable_Menu_New);
 
 var menu = UI_Menu_Create("slot-menu", 
 // MENU ITEMS
 {
  new:
  {
   icon:    "square-plus", 
   text:    UI_Language_String("timetable/menus", "lesson new"),
   state:   "enabled",
   tag:     "new",
   func:    false,
   submenu: durations
  },
      
  copy:
  {
   icon:  "clipboard", 
   text:  UI_Language_String("timetable/menus", "lesson copy"),
   state: "enabled",
   tag:   "modify",
   func:  Timetable_Menu_Copy
  },
  
  paste:
  {
   icon:  "paste", 
   text:  UI_Language_String("timetable/menus", "lesson paste"),
   state: "enabled",
   tag:   "modify",
   func:  Timetable_Menu_Paste
  },
  
  delete:
  {
   icon:  "trash-can", 
   text:  UI_Language_String("timetable/menus", "lesson delete"),
   state: "enabled",
   tag:   "modify",
   func:  Timetable_Menu_Delete
  }
 },
 {
  onshow: Timetable_Menu_Show
 });
 
 Core_State_Set("timetable", "slot-menu", menu);
 
 
 
 // SET BY USER ROLE
 switch(User_Config("operate-on-timetables"))
 {
  case "self":
	// DISABLE CENTER AND TEACHER SELECTOR AND SELECT VIEW MODE = TEACHER-WEEK, TEACHER = MYSELF
	Core_State_Set("timetable", "view", "teacher-week");
	
	var select           = UI_Element_Find(module, "timetable-center");
	//select.style.display = "none";
	select.value         = User_Center();
	
	var select           = UI_Element_Find(module, "timetable-type");
	//select.style.display = "none";
	select.value         = "teachers";
	
	var select           = UI_Element_Find(module, "timetable-entity");
	//select.style.display = "none";
	select.value         = "teacher:" + User_Id();
  break;
 }

	
 // DISPLAY
 Timetable_Display();
}




async function Timetable_OnUnload()
{
}








// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          C O R E                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Timetable_Function(name)
{
 var view = Core_State_Get("timetable", "view");
 view     = view.split("-");
 name     = "Timetable_" + String_Capitalize_Initial(view[0]) + String_Capitalize_Initial(view[1]) + "_" + name;
 f        = Safe_Function(name);
 
 console.log(name);
 return await f();
}



async function Timetable_Update()
{
 await Timetable_Function("Data");
 Core_State_Set("timetable", "force-reload", false);
 

 await Timetable_Display();	
}



async function Timetable_Set_Date(date)
{
 Core_State_Set("timetable", "date", date);
 
 var day = Date_Portion(date, "date-only");
 Core_State_Set("timetable", "day", date);
 
 var range =
 { 
  from: day + "0000",
  to:   day + "2359"
 }
 Core_State_Set("timetable", "day-range", range);
 
 var week = Date_Portion(Date_Week_FirstDay(date), "date-only");
 Core_State_Set("timetable", "week", week);
 
 var range =
 { 
  from: week + "0000",
  to:   Date_Portion(Date_Add_Days(day, 7), "date-only") + "2359"
 }
 Core_State_Set("timetable", "week-range", range);
}





async function Timetable_Display()
{
 var date     = Core_State_Get("timetable", "date");
 var view     = Core_State_Get("timetable", "view");
 var classes  = Core_State_Get("timetable", "classes");
 var teachers = Core_State_Get("timetable", "teachers");
  
 
 // CREATE AND SETUP TIMETABLE
 var timetable = UI_Element_Create("timetable/timetable");
 Core_State_Set("timetable", "display", timetable);
 
 UI_Element_Find(timetable, "nav-goto").onclick   = Timetable_Navigation_GoTo;
 UI_Element_Find(timetable, "nav-search").onclick = Timetable_Navigation_Search;
 UI_Element_Find(timetable, "nav-prev").onclick   = Timetable_Navigation_Prev;
 UI_Element_Find(timetable, "nav-next").onclick   = Timetable_Navigation_Next;
 UI_Element_Find(timetable, "nav-update").onclick = Timetable_Update;
 
  
 // SYNC HEADERS AND DATA SCROLLING
 var timetable_slots   = UI_Element_Find(timetable, "slots");
 var timetable_time    = UI_Element_Find(timetable, "time"); 
 var timetable_headers = UI_Element_Find(timetable, "headers");
 
 timetable_slots.onscroll =
 function()
 {
  timetable_time.scrollTop     = timetable_slots.scrollTop;
  timetable_headers.scrollLeft = timetable_slots.scrollLeft;
 }
 
 

 // FIRST COLUMN (HEADER): DISPLAY HOURS
 var column  = UI_Element_Find(timetable, "time");
 
 var time_scan = TIMETABLE_TIME_START;
 while(time_scan < TIMETABLE_TIME_END)
 {
  var time          = Time_From_Minutes(time_scan);
  var slot          = UI_Element_Create("timetable/slot-time", {time});
  slot.style.height = TIMETABLE_MIN_HEIGHT + "px";
  
  column.appendChild(slot);
  
  time_scan = time_scan + TIMETABLE_MIN_TIME; 
 }
 

 // DISPLAY CLASSES COLUMNS
 await Timetable_Function("Display");
 
 
 // RENDER
 var container       = UI_Element_Find("module-page");
 container.innerHTML = "";
 container.appendChild(timetable);
 
 
 
 // HIGHLIGHT CREATED CLASS IF ANY
 var id = Core_State_Get("timetable", "class-created");
 if(id)
 {
  var slot = UI_Element_Find(timetable, "class-" + id);
  Document_Element_Animate(slot, "zoomIn 0.75s 1");  
  
  Core_State_Set("timetable", "class-created", false);
 }
 
 // HIGHLIGHT UPDATED CLASS IF ANY
 var id = Core_State_Get("timetable", "class-updated");
 if(id)
 {
  var slot = UI_Element_Find(timetable, "class-" + id);
  Document_Element_Animate(slot, "flash 1.5s 1");  
  
  Core_State_Set("timetable", "class-updated", false);
 }
 
}




// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                            U I                                                 //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

function Timetable_Slot_Display(template = "open", data = {}, display = {}, onclick)
{
 var slot   = UI_Element_Create("timetable/slot-" + template);
 var config = {};
 
 var type   = data["type"];
 if(type)
 {
  var config = Core_Config(["lesson-types", type], {});
 }
 
 if(config["color"]) slot.style.backgroundColor = config["color"];
 
 
 // FIELDS THAT WILL BE ALWAYS DISPLAYED
 display["id"]    = true;
 
 // SCAN FIELDS
 for(var field in display)
 {
  var element = UI_Element_Find(slot, field);
  if(element)
  {
   if(!display[field]) element.style.display = "none";
   else
   switch(field)
   {
    case "id":
		if(data["online"] == 1) var online = "<li class = 'fa fa-globe'></li>" + " "; else var online = "";
			
		if(data["seats_taken"] >= data["seats_total"]) element.style.backgroundColor = "var(--color-alert)";
		else
		if(data["seats_taken"] == data["seats_total"] -1) element.style.backgroundColor = "var(--color-soso)";	
		
		Document_Element_SetData(slot, "uid", "class-" + data["id"]);
		Document_Element_SetData(element, "classid", data["id"]);
		element.innerHTML = online + "#" + data["id"];
		
		// CLICKING ON THE ID COPIES IT TO CLIPBOARD
		element.onclick = 
		function(event)
		{
	     var element = event.currentTarget;		
	     event.stopPropagation();
		 
		 var id = Document_Element_GetData(element, "classid");
	     navigator.clipboard.writeText(id);
		 
		 Document_Element_Animate(element, "fadeIn 1s");
		}
    break;
    
    case "teacher":
	    // IF NO TEACHER ID, DISPLAY "NO TEACHER YET"
		if(!data["teacher_id"])
		{
	     var name = UI_Language_String("timetable/slot", "teacher missing");
		}
		else
		{
		 // FIND TEACHER ID IN CURRENTLY LOADED TEACHERS. IF NOT AVAILABLE, USE GENERIC STRING
		 var name     = UI_Language_String("timetable/slot", "teacher unknown");
		
		 var teachers = Core_State_Get("timetable", "teachers");
		 for(var teacher of teachers)
		 {
	      if(teacher["id"] == data["teacher_id"])
		  {
	       var name = [teacher["firstname"] || "", teacher["lastname"] || ""].join(" ").trim("");
		   break;
		  }
		 }
		}
		
		element.innerHTML = "<li class = 'fa fa-person-chalkboard'></li>" + " " + name;
    break;
	
	case "center":
	    var name = Centers_Name(data["center_id"]);
	    if(!name) name = UI_Language_String("timetable/slot", "center unknown");
		
		element.innerHTML = "<li class = 'fa-solid fa-building'></li>" + " " + name;
	break;
   
    case "room":
	    if(!data["classroom_id"])
		{
	     var name = UI_Language_String("timetable/slot", "room TBD");
		}
		else
		{
	     var name = data["classroom_id"];
		}
	   
		element.innerHTML = "<li class = 'fa fa-chalkboard'></li>" + " " + name;
    break;
   
    case "lesson":
		element.innerHTML = "<li class = 'fa fa-book'></li>" + " " + (data["lesson_id"] || "") || "";
    break;

    default:
	 element.innerHTML = data[field] || "";
    break;
   }
  }
  
 }
 
 
 // SPECIAL CASE: IF ONLY ONE LOCATION ELEMENT IS DISPLAYED, REMOVE GAPS
 if(!display["center"] || !display["room"])
 {
  var element = UI_Element_Find(slot, "location");
  if(element) Document_CSS_PurgeClasses(element, "gap-");
 }
 
 var time     = Time_To_Minutes(Date_Portion(data["date_start"], "time-only")); 
 var position = (time - TIMETABLE_TIME_START) / TIMETABLE_MIN_TIME;
 var size     = data["duration"] / TIMETABLE_MIN_TIME;
	   
 slot.style.position = "absolute";
 slot.style.left     = (TIMETABLE_SLOT_MARGIN / 2) + "px";
 slot.style.width    = "calc(100% - " + TIMETABLE_SLOT_MARGIN + "px)";
 slot.style.top      = ((position * TIMETABLE_MIN_HEIGHT) + (TIMETABLE_SLOT_MARGIN/2)) + "px";
 slot.style.height   = ((size     * TIMETABLE_MIN_HEIGHT) - TIMETABLE_SLOT_MARGIN) + "px";

 Document_Element_SetData(slot,   "type", template);
 Document_Element_SetObject(slot, "data", data);
 slot.onclick = onclick;

 var menu = Core_State_Get("timetable", "slot-menu");
 UI_Menu_Assign(slot, menu, {direction:"bottom right"}); 

 return slot;
}




async function Timetable_Slot_View(event)
{
 var element = event.currentTarget;
 var data    = Document_Element_GetObject(element, "data");

 // PRESERVE SCROLL POSITION
 Timetable_View_Save();

 // DISPLAY POPUP
 await Class_Display(data["id"]);
 
 // IF MODIFIED, RELOAD AND DISPLAY CLASS
 if(Core_State_Get("classes", ["display", "updated"]))
 {
  // RELOAD
  var updated = await Core_Api("Classes_List_ById", {ids:[data["id"]], fields:"id,type,date_start,online,duration,teacher_id,ta1_id,ta2_id,ta3_id,center_id,classroom_id,lesson_id,seats_total,seats_taken,course_id"});
  updated     = updated[0];
  
  // FIND AND REPLACE
  var classes = Core_State_Get("timetable", "classes");
  var i       = Timetable_Data_GetClass(data["id"], "index");
  classes[i]  = updated;
 
  // DISPLAY
  Core_State_Set("timetable", "class-updated", data["id"]);
  await Timetable_Display();
  
  // RESTORE SCROLL POSITION
  Timetable_View_Restore();
 }
}





function Timetable_Column_Fill(column, data = {})
{
 var time_scan = TIMETABLE_TIME_START;
 
 while(time_scan < TIMETABLE_TIME_END) 
 {
  var slot_data           = Object.assign({}, data);
  
  var date                = slot_data["date"];
  slot_data["date_start"] = date + Time_From_Minutes(time_scan, "");
  slot_data["duration"]   = TIMETABLE_MIN_TIME;
  var slot                = Timetable_Slot_Display("empty", slot_data, []);
  slot.style.zIndex       = 0;
	
  column.appendChild(slot); 
  time_scan = time_scan + TIMETABLE_MIN_TIME;
 }  
 
}


function Timetable_View_Save()
{
 // PRESERVE SCROLL POSITION
 var slots  = UI_Element_Find("slots");
 var scroll = {top:slots.scrollTop, left:slots.scrollLeft};
 
 Core_State_Set("timetable", ["view-scroll"], scroll);
}



function Timetable_View_Restore()
{
 // RESTORE SCROLL POSITION
 var scroll = Core_State_Get("timetable", ["view-scroll"], {});
 
 var slots        = UI_Element_Find("slots");
 slots.scrollTop  = scroll["top"];
 slots.scrollLeft = scroll["left"];
}







// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                    N A V I G A T I O N                                         //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Timetable_Navigation_Prev(event)
{
 Timetable_View_Save();
 
 var view = Core_State_Get("timetable", "view-range");
 
 switch(view)
 {
  case "day":
	
	var date = Core_State_Get("timetable", "day");
	date     = Date_Add_Days(date, -1);
	
	Timetable_Set_Date(date);
	
	await Timetable_Update();	
  break;
  
  case "week":
	
	var date = Core_State_Get("timetable", "week");
	date     = Date_Add_Days(date, -7);
	
	Timetable_Set_Date(date);
	
	await Timetable_Update();	
  break;
 }
 
 Timetable_View_Restore();
}



async function Timetable_Navigation_Next(event)
{
 Timetable_View_Save();
 
 var view = Core_State_Get("timetable", "view-range");
 
 switch(view)
 {
  case "day":
	
	var date = Core_State_Get("timetable", "day");
	date     = Date_Add_Days(date, 1);
	
	Timetable_Set_Date(date);
	
	await Timetable_Update();
  break;
  
  case "week":
	
	var date = Core_State_Get("timetable", "week");
	date     = Date_Add_Days(date, 7);
	
	Timetable_Set_Date(date);
	
	await Timetable_Update();	
  break;
 }
 
 Timetable_View_Restore();
}




async function Timetable_Navigation_GoTo(event)
{
 var element  = event.currentTarget;
 var position = Document_Element_Corner(element, "center");
 
 var date = await Client_Picker("date", position);
 if(date)
 {
  Timetable_View_Save();
  
  date = Date_From_Input(date);
  
  Timetable_Set_Date(date);
  await Timetable_Update();	
  
  Timetable_View_Restore();
 }

}




async function Timetable_Navigation_Search(event)
{
 var element = event.currentTarget;
}





// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          D A T A                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Timetable_Data_Center(range = "day")
{
 // DETERMINE TIME PERIOD
 var day       = Core_State_Get("timetable", "day");
 var week      = Core_State_Get("timetable", "week");
 var center    = Core_State_Get("timetable", "center");
 
 var range     = Core_State_Get("timetable", range + "-range");
 var date_from = range["from"];
 var date_to   = range["to"];
 
 
 // LOAD CLASSES FROM GIVEN TIME PERIOD / CENTER
 var classes = await Core_Api("Classes_List_ByCenter", 
 {
  center_id:center, 
  date_from, 
  date_to, 
  fields:"id,type,date_start,online,duration,teacher_id,ta1_id,ta2_id,ta3_id,classroom_id,lesson_id,seats_total,seats_taken,course_id", 
 });
 
 
 Core_State_Set("timetable", "classes", classes);
 
 
 // IF CENTER HAS CHANGED, WE NEED TO RELOAD SOME CENTER-RELATED DATA
 if(Core_State_Get("timetable", "force-reload") || !Core_State_Get("timetable", "center-last") || (Core_State_Get("timetable", "center-last") != Core_State_Get("timetable", "center")))
 {
  // LOAD ALL TEACHERS FOR THIS CENTER
  var teachers = await Core_Api("Users_List_ByCenter", {center, role:"teacher", fields:"id,firstname,lastname", order:"firstname,lastname"});
  Core_State_Set("timetable", "teachers", teachers); 
 
  // LOAD ROOMS FOR THIS CENTER
  var rooms = await Core_Api("Center_Rooms", {center});
  Core_State_Set("timetable", "rooms", rooms); 
  
  // LOAD COURSES FOR THIS CENTER
  var courses = await Core_Api("Courses_Ongoing", {centers:[center]});
  Core_State_Set("timetable", "courses", courses); 
 }
 
 
 // SET CENTER
 Core_State_Set("timetable", "center-last", center);
}




async function Timetable_Data_User(user, range = "day")
{
 Core_State_Set("timetable", "user", user);
 
 
 // DETERMINE TIME PERIOD
 var day       = Core_State_Get("timetable", "day");
 var week      = Core_State_Get("timetable", "week");
 
 var range     = Core_State_Get("timetable", range + "-range");
 var date_from = range["from"];
 var date_to   = range["to"];
 
 
 // LOAD CLASSES FROM GIVEN TIME PERIOD / CENTER
 var classes = await Core_Api("Classes_List_ByTeacher", 
 {
  teacher_id:user, 
  date_from, 
  date_to, 
  fields:"id,type,date_start,duration,online,teacher_id,ta1_id,ta2_id,ta3_id,center_id,classroom_id,lesson_id,seats_total,seats_taken,course_id", 
 });
 
 
 Core_State_Set("timetable", "classes", classes);
}




async function Timetable_Data_Room(center, room, range = "day")
{
 Core_State_Set("timetable", "center", center);
 Core_State_Set("timetable", "room", room);
 
 
 // DETERMINE TIME PERIOD
 var day       = Core_State_Get("timetable", "day");
 var week      = Core_State_Get("timetable", "week");
 
 var range     = Core_State_Get("timetable", range + "-range");
 var date_from = range["from"];
 var date_to   = range["to"];
 
 
 // LOAD CLASSES FROM GIVEN TIME PERIOD / CENTER
 var classes = await Core_Api("Classes_List_ByRoom", 
 {
  center_id:center,
  classroom_id:room, 
  date_from, 
  date_to, 
  fields:"id,type,date_start,online,duration,teacher_id,ta1_id,ta2_id,ta3_id,classroom_id,lesson_id,seats_total,seats_taken,course_id", 
 });
 
 Core_State_Set("timetable", "classes", classes);
}




async function Timetable_Data_Course(course, range = "week")
{
 Core_State_Set("timetable", "course", course);
 
 
 // DETERMINE TIME PERIOD
 var day       = Core_State_Get("timetable", "day");
 var week      = Core_State_Get("timetable", "week");
 
 var range     = Core_State_Get("timetable", range + "-range");
 var date_from = range["from"];
 var date_to   = range["to"];
 
 
 // LOAD CLASSES FROM GIVEN TIME PERIOD / CENTER
 var classes = await Core_Api("Classes_List_ByCourse", 
 {
  course_id:course,
  date_from, 
  date_to, 
  fields:"id,type,date_start,online,duration,teacher_id,ta1_id,ta2_id,ta3_id,center_id,classroom_id,lesson_id,seats_total,seats_taken,course_id", 
 });
 
 Core_State_Set("timetable", "classes", classes);
}





function Timetable_Data_GetClass(id, mode = "data")
{
 switch(mode)
 {
  case "data":
  case "index":
    var classes = Core_State_Get("timetable", "classes");
	var i = 0;
	
	for(var item of classes) 
	{
	 if(item["id"] == id)
	 {   
      if(mode == "index") return i; else return item;
	 }
	 
	 i++;
	}
  break;
  

  case "slot":
   var element = UI_Element_Find("class-" + data["id"]);
   
   return element;
  break;
 }
}






// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                            M E N U                                             //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Timetable_Menu_Show(menu, event)
{
 var element = event.currentTarget; 
 var type    = Document_Element_GetData(element, "type");
 var data    = Document_Element_GetObject(element, "data");
 
 Core_State_Set("timetable", "selected-class", data);
 
 var items = Document_Element_GetObject(menu, "items");
 
 switch(type)
 {
  case "empty":
	items["new"]["state"]    = "enabled";
	items["delete"]["state"] = "hidden";
	items["copy"]["state"]   = "hidden";
	
	var copied = Core_State_Get("timetable", "class-copied", false);
	if(copied)
	{
	 items["paste"]["state"]  = "enabled";
	}
	else
	{
	 items["paste"]["state"]  = "disabled";
	}	
  break;
  
  case "open":
	items["new"]["state"]    = "hidden";
	items["delete"]["state"] = "enabled";
	items["copy"]["state"]   = "enabled";
	items["paste"]["state"]  = "hidden";
  break;
 }
 
 
}

async function Timetable_Menu_Delete()
{
 var data = Core_State_Get("timetable", "selected-class");
 
 // CONFIRM
 var code     = data["id"].padStart(6, "0");
 var title    = UI_Language_String("timetable/popups", "class delete title"); 
 var content  = UI_Language_String("timetable/popups", "class delete text", {id:code}); 
 var picture  = Resources_URL("images/cover-alert.jpg");
 //Doan Nhat Nam 15/06/2023 Check lesson belongs to a course 
  var check = data["course_id"];
  if(check != null){
      content = UI_Language_String("timetable/popups", "class fail delete text"); 
      await UI_Popup_Create({title, content, picture}, undefined, undefined)
  }
  else{
    var confirm = await UI_Popup_Code(title, content, picture, code);
    if(!confirm) return;
    
    // DELETE FROM DB
    await Core_Api("Class_Cancel", {class_id:data["id"]});
    
    
    // DELETE FROM MEMORY
    var classes = Core_State_Get("timetable", "classes");
    for(var item of classes) 
    {
      if(item["id"] == data["id"])
      {
      Array_Element_Delete(classes, item);
      
      var element = UI_Element_Find("class-" + data["id"]);
      if(element) await Document_Element_Animate(element, "zoomOut 0.75s 1");  
    
      break;
      }
    }
    // UPDATE
    await Timetable_Display();
  }
 //Doan Nhat Nam 15/06/2023 Check lesson belongs to a course 
 
}



async function Timetable_Menu_New(item)
{
 var data     = Core_State_Get("timetable", "selected-class");
 var duration = Document_Element_GetData(item, "uid");
 
 var request         = {};
 request["center"]   = data["center"];
 request["room"]     = data["room"];
 request["date"]     = data["date_start"]; 
 request["teacher"]  = data["teacher"];
 request["duration"] = duration;
 request["utc"]      = true;
 console.log(request);
 
 var response        = await Core_Api("Class_Validate", request);
 console.log(response); 
 
 if(response["fail"])
 {
  var picture = Resources_URL("images/cover-deny.png");
  var title   = UI_Language_String("timetable/popups", "create fail title"); 
  var content = UI_Language_String("timetable/popups", "create " + response["fail"]);
  
  await UI_Popup_Alert(title, content, picture);
  
  return;
 }
 
 // TEACHER IS SET, ROOM ISN'T
 if(request["teacher"] && !request["room"])
 {
  // PICK A ROOM
  var room = await Centers_Room_Select(response["rooms"], false, false, {online:true});
  if(!room) return;
  
  var online = (room == "online");
  
  // CREATE
  var create =
  {
   center_id:    data["center"],
   classroom_id: room,
   date_start:   data["date_start"],
   duration,
   teacher_id:   data["teacher"],
   online
  }
 }
 else
 // ROOM IS SET, TEACHER ISN'T
 if(request["room"] && !request["teacher"])
 {
  // PICK A TEACHER
  var title   = UI_Language_String("timetable/popups", "teacher select title");
  var teacher = await Users_Popup_SelectFromList(Object_To_Array(response["teachers"]), {firstname:true, lastname:true}, "users/table-fields");
  if(!teacher) return;
  
  var teacher_id  = teacher["id"];
  
  // CREATE
  var create =
  {
   center_id:    data["center"],
   classroom_id: data["room"],
   date_start:   data["date_start"],
   duration,
   teacher_id
  }
 }
 
 
 // UPDATE DB
 var newclass         = await Core_Api("Class_Create", {data:create, utc:true, info:true});
  
 // UPDATE IN MEMORY
 var classes = Core_State_Get("timetable", "classes");
 classes.push(newclass);
  
  
 // UPDATE TIMETABLE
 Core_State_Set("timetable", "class-created", newclass["id"]);
 
 
 Timetable_Scroll_Save();
 
 await Timetable_Display();
 
 Timetable_Scroll_Restore();
}



async function Timetable_Menu_Copy()
{
}



async function Timetable_Menu_Paste()
{
}


function Timetable_Scroll_Save()
{
 var timetable = Core_State_Get("timetable", "display");
 if(!timetable) 
 {
  Core_State_Set("timetable", "scroll", false);
  return;
 }
 
 var slots      = UI_Element_Find(timetable, "slots");
 var scroll     = {};
 scroll["left"] = slots.scrollLeft;
 scroll["top"]  = slots.scrollTop;
 
 Core_State_Set("timetable", "scroll", scroll);
}



function Timetable_Scroll_Restore()
{
 var timetable = Core_State_Get("timetable", "display");
 if(!timetable) return;
 
 var scroll    = Core_State_Get("timetable", "scroll", scroll);
 if(!scroll) return;
 
 var slots        = UI_Element_Find(timetable, "slots");
 slots.scrollLeft = scroll["left"];
 slots.scrollTop  = scroll["top"];
}