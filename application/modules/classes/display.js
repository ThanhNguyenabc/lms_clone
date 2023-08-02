
// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                        D I S P L A Y                                           //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



async function Class_Display(id, options = {})
{
 var data = await Core_Api("Class_Read", {class_id:id, options:{users:true, seats:true}});
 Core_State_Set("classes", ["display", "data"], data);
 Core_State_Set("classes", ["display", "modified"], false);
 
 //console.log(data);
 
 var buttons = [];
 
 if(options["delete"])
 {
  var button = 
  {
   text: "delete",
   onclick: false
  }
  
  buttons.push(button);
 }
  
 var center     = Safe_Get(data, ["info", "center_id"]);
 var date_start = Safe_Get(data, ["info", "date_start"]);
 var date_end   = Safe_Get(data, ["info", "date_end"]);  
 
 var time_from = Date_Portion(date_start, "time-timecode");
 var time_to   = Date_Portion(date_end,   "time-timecode");
 var title     = Centers_Name(center) + " / " + Date_Format(date_start, UI_Language_Current(true), "date-long-weekday") + " / " + time_from + " - " + time_to;
 
 var content = UI_Element_Create("classes/class-display", {id:"#" + id, title}, {language:"classes/class-display"});
 Core_State_Set("classes", ["display", "content"], content);


 // STAFF
 Class_Display_Staff();
 
 
 // STUDENTS
 Class_Display_Students();
 
 
 // SLOT
 Class_Display_Data();
 
 var promise = new Promise(async(resolve, reject) =>
 { 
  await UI_Popup_Create({content}, buttons, "classes/class-popup", {escape:true, open:true, onclose:
  async function()
  {
   // OPTIONAL RELOAD AND RETURN
   if(options["reload"]) var data = await Core_Api("Class_Read", {class_id:id, options:{users:true, seats:true}});
   
   resolve(data);
  }});
  
 });
 
 return promise;
}




function Class_Display_Data()
{
 var data      = Core_State_Get("classes", ["display", "data"]);
 var content   = Core_State_Get("classes", ["display", "content"]);
 
 
 // TYPE
 var element      = UI_Element_Find(content, "class-type");
 UI_Select_FromConfig(element, ["lesson-types"]);
 var type         = Safe_Get(data, ["info", "type"], "");
 element.value    = type;
 element.onchange = Class_Display_UpdateField;
 
 // CENTER
 var element   = UI_Element_Find(content, "class-center");
 var center    = Safe_Get(data, ["info", "center_id"], "");
 var text      = Centers_Name(center);
 element.value = text;
 element.setAttribute("readonly", true);
 
 
 // ROOM
 var element     = UI_Element_Find(content, "class-room");
 var room        = Safe_Get(data, ["info", "classroom_id"], "");
 element.value   = room;
 element.setAttribute("readonly", true);
 Document_CSS_SetClass(element, "style-clickable");
 element.onclick = Class_Display_ChangeRoom;
 
 // ONLINE
 var element      = UI_Element_Find(content, "class-online");
 UI_Select_FromDatapage(element, "classes/online");
 var online       = Safe_Get(data, ["info", "online"], "0");
 element.value    = online;
 element.onchange = Class_Display_ChangeOnline;
 
 Document_Event_Trigger(element, "change");

 
 
 // STREAM URL
 var element      = UI_Element_Find(content, "class-classroom_url");
 var url          = Safe_Get(data, ["info", "classroom_url"], "");
 element.value    = url;
 element.onchange = Class_Display_UpdateStream;
 
 // LESSON
 var element     = UI_Element_Find(content, "class-lesson");
 var lesson      = Safe_Get(data, ["info", "lesson_id"], "");
 element.value   = lesson;
 element.setAttribute("readonly", true);
 Document_CSS_SetClass(element, "style-clickable");
 element.onclick = Class_Display_ChangeLesson;
 
 // DATE
 var element     = UI_Element_Find(content, "class-date");
 var date        = Safe_Get(data, ["info", "date_start"], "");
 element.value   = Date_To_Input(date);
 element.setAttribute("readonly", true);
 
 // TIME
 var element     = UI_Element_Find(content, "class-time");
 var time        = Date_Portion(Safe_Get(data, ["info", "date_start"], ""), "time-timecode");
 element.setAttribute("readonly", true);
 element.value   = time;
 
 // SEATS
 var element      = UI_Element_Find(content, "class-seats");
 var seats        = Safe_Get(data, ["info", "seats_total"], "");
 element.setAttribute("readonly", true);
 element.value    = seats;
 element.onchange = Class_Display_UpdateField;
  
 // DURATION
 var element     = UI_Element_Find(content, "class-duration");
 var duration    = Safe_Get(data, ["info", "duration"], "");
 element.setAttribute("readonly", true);
 element.value   = Time_Format_Period(duration, UI_Language_Current(), " ");
 
 // NOTES
 var element      = UI_Element_Find(content, "class-notes");
 var notes        = Safe_Get(data, ["info", "notes"], "");
 element.value    = notes;
 element.onchange = Class_Display_UpdateField;
}




function Class_Display_Students()
{
 var data      = Core_State_Get("classes", ["display", "data"]);
 var content   = Core_State_Get("classes", ["display", "content"]);
 
 var container       = UI_Element_Find(content, "class-students");
 container.innerHTML = "";
  
 for(var seat of data["seats"])
 {
  var user = seat["student"];
  if(user)
  {
   var element = UI_Element_Create("classes/class-user", user);
   var picture = UI_Element_Find(element, "picture");
   
   var actions    = UI_Element_Find(element, "actions");
   
   var action     = UI_Element_Create("classes/user-action", {style:"solid", icon:"trash-can"});
   Document_Element_SetObject(action, "seat", seat);
   action.onclick = Class_Display_RemoveStudent;
   actions.appendChild(action);
   
   var hint       = UI_Language_String("classes/user", "attendance hint");
   var action     = UI_Element_Create("classes/user-checkbox", {hint});
   switch(seat["attendance"])
   {
    case "yes":
	case "late":
		action.checked = true;
	break;
	
	case "no":
		action.checked = false;
	break;
	
    default:
		action.indeterminate = true;
	break;
   }	   
   Document_Element_SetObject(action, "seat", seat);
   action.onclick = Class_Display_SetAttendance;
   actions.appendChild(action);
   

   User_Picture_Load(picture, user);
   
   container.appendChild(element);
  }
 }
 
 var element    = UI_Element_Create("classes/class-user-add", {position:""});
 container.appendChild(element);
 
 var actions    = UI_Element_Find(element, "actions");
 var action     = UI_Element_Create("classes/user-action", {style:"regular", icon:"square-plus"});
 action.onclick = Class_Display_AddStudent;
 actions.appendChild(action);
}




function Class_Display_Staff()
{
 var data      = Core_State_Get("classes", ["display", "data"]);
 var content   = Core_State_Get("classes", ["display", "content"]);
 
 var container       = UI_Element_Find(content, "class-staff");
 container.innerHTML = "";
 
 var positions = Core_Data_Sections("classes/class-staff");
 for(var position of positions)
 {
  var user = data[position];
  if(user)
  {
   var element = UI_Element_Create("classes/class-user", user);
   var picture = UI_Element_Find(element, "picture");
   
   User_Picture_Load(picture, user);
   
   var actions    = UI_Element_Find(element, "actions");
   
   var action     = UI_Element_Create("classes/user-action", {style:"solid", icon:"trash-can"});
   Document_Element_SetData(action, "position", position);
   action.onclick = Class_Display_UnsetStaff;
   actions.appendChild(action);
   
   container.appendChild(element);
  }
  else
  {
   var text    = UI_Language_String("classes/class-staff", position);
   var element = UI_Element_Create("classes/class-user-add", {position:text});
   
   var actions = UI_Element_Find(element, "actions");
  
   var action     = UI_Element_Create("classes/user-action", {style:"regular", icon:"square-plus"});
   Document_Element_SetData(action, "position", position);
   action.onclick = Class_Display_SetStaff;
   actions.appendChild(action);
   
   container.appendChild(element);
  }
 }
 
}




async function Class_Display_UpdateStream(event)
{
 var element  = event.currentTarget;
 var data     = Core_State_Get("classes", ["display", "data"]);
 var class_id = Safe_Get(data, ["info", "id"]);

 Safe_Set(data, ["classroom_url"], element.value);
 await Core_Api("Class_Field_Set", {id:class_id, field:"classroom_url", value:element.value});
 
 Core_State_Set("classes", ["display", "updated"], true);
}





async function Class_Display_UpdateField(event)
{
 var element  = event.currentTarget;
 var data     = Core_State_Get("classes", ["display", "data"]);
 var class_id = Safe_Get(data, ["info", "id"]);
 
 // EXTRACT FIELD FROM ELEMENT'S UID
 var field    = Document_Element_GetData(element, "uid").split("-")[1];
 
 // UPDATE IN MEMORY
 Safe_Set(data, [field], element.value);
 
 // UPDATE DB
 await Core_Api("Class_Field_Set", {id:class_id, field, value:element.value});
 
 // MARK CLASS AS UPDATED
 Core_State_Set("classes", ["display", "updated"], true);
}





async function Class_Display_UnsetStaff(event)
{
 var element  = event.currentTarget;
 var data     = Core_State_Get("classes", ["display", "data"]);
 var class_id = Safe_Get(data, ["info", "id"]); 
 
 // DETERMINE ROLE
 var position = Document_Element_GetData(element, "position");
 var role     = Core_Data_Value("classes/class-staff", position, "role");
 

 // CONFIRMATION POPUP
 var text     = UI_Language_Object(Core_Config(["roles"])[role]);
 var title    = UI_Language_String("classes/popups", "staff delete title", {role:text}); 
 var content  = UI_Language_String("classes/popups", "staff delete text", {role:text}); 
 var picture  = Resources_URL("images/cover-logout.png");
 
 var confirm  = await UI_Popup_Confirm(title, content, picture);
 if(!confirm) return;
 
 
 
 // DETERMINE DATE
 var dates      = [];
 var date_start = Safe_Get(data, ["info", "date_start"]);
 var date_end   = Safe_Get(data, ["info", "date_end"]);
 dates.push({date_start, date_end});

 
 // UNSET STAFF
 var field = Core_Data_Value("classes/class-staff", position, "field");
 await Core_Api("Class_Field_Set", {id:class_id, field, value:null});
 
 
 // RELOAD CLASS
 var data     = await Core_Api("Class_Read", {class_id, options:{users:true, seats:true}});
 Core_State_Set("classes", ["display", "data"], data);
 
 // REFRESH STAFF DISPLAY
 Class_Display_Staff();
 
 Core_State_Set("classes", ["display", "updated"], true);
}




async function Class_Display_SetStaff(event)
{
 var element  = event.currentTarget;
 var data     = Core_State_Get("classes", ["display", "data"]);
 var class_id = Safe_Get(data, ["info", "id"]); 
 
 // DETERMINE ROLE
 var position = Document_Element_GetData(element, "position");
 var role     = Core_Data_Value("classes/class-staff", position, "role");
 
 // DETERMINE CENTERS
 var center   = Safe_Get(data, ["info", "center_id"], User_Center());
 var centers  = Centers_Related(center, true);
 
 // DETERMINE DATE
 var dates      = [];
 var date_start = Safe_Get(data, ["info", "date_start"]);
 var date_end   = Safe_Get(data, ["info", "date_end"]);
 dates.push({date_start, date_end});
 
 var users = await Core_Api("Users_Available_Teach", {centers, roles:[role], dates, 
 options:
 {
  info:"firstname,lastname",
  utc: false
 }});
 
 users     = Object_To_Array(users);
 
 var user  = await Users_Popup_SelectFromList(users, {id:true, firstname:true, lastname:true}, "users/table-fields");
 if(!user) return;
 
 
 // SET STAFF
 var field = Core_Data_Value("classes/class-staff", position, "field");
 await Core_Api("Class_Field_Set", {id:class_id, field, value:user["id"]});
 
 
 // RELOAD CLASS
 var data     = await Core_Api("Class_Read", {class_id, options:{users:true, seats:true}});
 Core_State_Set("classes", ["display", "data"], data);
 
 // REFRESH STAFF DISPLAY
 Class_Display_Staff();
 
 Core_State_Set("classes", ["display", "updated"], true);
}



async function Class_Display_ChangeOnline(event)
{
 var element  = event.currentTarget;
 var data     = Core_State_Get("classes", ["display", "data"]);
 var class_id = Safe_Get(data, ["info", "id"]); 
 
 // DEPENDING ON ONLINE OR NOT, DISPLAY OR DO NOT DISPLAY THE "STREAM URL" FIELD
 var display = Core_State_Get("classes", ["display", "content"]);  
 if(element.value == "0")
 {
  UI_Element_Find(display, "row-stream").style.visibility = "hidden";
 }
 else
 {
  UI_Element_Find(display, "row-stream").style.visibility = "visible";
 }
 
 
 // UPDATE MEMORY & DB
 Safe_Set(data, ["info", "online"], element.value);
 await Core_Api("Class_Field_Set", {id:class_id, field:"online", value:element.value});
 
 Core_State_Set("classes", ["display", "updated"], true);
}



async function Class_Display_ChangeRoom(event)
{
 var element  = event.currentTarget;
 var data     = Core_State_Get("classes", ["display", "data"]);
 var class_id = Safe_Get(data, ["info", "id"]); 
 
 
 // CLASS CURRENT CENTER AND ROOM
 var center   = Safe_Get(data, ["info", "center_id"], "");
 var oldroom  = Safe_Get(data, ["info", "classroom_id"], "");
 
 
 // CLASS DATE, NEEDED TO CHECK ROOM AVAILABILITY
 var dates      = [];
 var date_start = Safe_Get(data, ["info", "date_start"]);
 var date_end   = Safe_Get(data, ["info", "date_end"]);
 dates.push({date_start, date_end});


 // FIND AVAILABLE ROOMS
 var rooms   = await Core_Api("Center_Rooms_Available", {center, dates, options:{utc:true}}); 
 
 
 // PICK ROOM FROM AVAILABLE ONES 
 var options = [];
 
 var option   = new Option();
 option.text  = oldroom;
 option.value = oldroom;
 options.push(option);
 
 for(var room of rooms)
 {
  option       = new Option();
  option.text  = room;
  option.value = room;
  
  options.push(option);
 }
 
 var newroom = await UI_Popup_Select(false, false, false, options); console.log(newroom);
 if(!newroom || newroom == oldroom) return;


 // UPDATE ROOM IN MEMORY
 Safe_Set(data, ["info", "classroom_id"], newroom);
 await Core_Api("Class_Field_Set", {id:class_id, field:"classroom_id", value:newroom});

 // UPDATE DISPLAY
 Class_Display_Data();
 
 Core_State_Set("classes", ["display", "updated"], true);
}







async function Class_Display_ChangeLesson(event)
{
 var element  = event.currentTarget;
 var data     = Core_State_Get("classes", ["display", "data"]);
 var class_id = Safe_Get(data, ["info", "id"]); 
 
 // CLASS CURRENT LESSON
 var lesson   = Safe_Get(data, ["info", "lesson_id"], "");
 
 var newlesson = await Lesson_Popup_SelectFromCatalog(lesson);
 if(!newlesson || newlesson == lesson) return;

 
 // CHANGING LESSON ALSO CHANGES CLASS TYPE
 var info    = await Core_Api("Lesson_Info", {lesson:newlesson, sections:["info"]});
 var newtype = Safe_Get(info, ["info", "type"], "standard");
 

 // UPDATE ROOM IN MEMORY
 Safe_Set(data, ["info", "lesson_id"], newlesson);
 Safe_Set(data, ["info", "type"],      newtype);
 
 await Core_Api("Class_Field_Set", {id:class_id, field:"lesson_id", value:newlesson});
 await Core_Api("Class_Field_Set", {id:class_id, field:"type",      value:newtype});


 // UPDATE DISPLAY
 Class_Display_Data();
 
 Core_State_Set("classes", ["display", "updated"], true);
}



async function Class_Display_SetAttendance(event)
{
 var element = event.currentTarget;
 var seat    = Document_Element_GetObject(element, "seat");
 
 if(element.checked) 
 {
  var value = "yes";
 }
 else 
 {
  var value = "no";
 }	 
 
 await Core_Api("Class_Seat_SetField", {id:seat["id"], field:"attendance", value});
 
 // SYNC ASSESSMENT, ATTENDANCE AND BEHAVIOR FOR SEATS THAT ARE SOMEHOW "CONNECTED" TO THIS ONE (COURSE / SESSION)
 Core_Api("Class_Seats_Sync", {id:seat["id"]});
}


async function Class_Display_AddStudent(event)
{
 var element  = event.currentTarget;
 var data     = Core_State_Get("classes", ["display", "data"]);
 var class_id = Safe_Get(data, ["info", "id"]); 
 

 // DETERMINE CENTERS
 var center   = Safe_Get(data, ["info", "center_id"], User_Center());
 var centers  = Centers_Related(center, true);
 
 // ROLES
 var roles    = ["student"];
 
 
 var user  = await Users_Popup_SelectFromSearch(centers, roles, "firstname,lastname", "25", "id");
 if(!user) return;
 
 
 // ADD STUDENT (SEAT)
 var seat =
 {
  student_id:user["id"]
 }
 await Core_Api("Class_Seat_Add", {class_id, data:seat});
 
 
 // RELOAD CLASS
 var data     = await Core_Api("Class_Read", {class_id, options:{users:true, seats:true}});
 Core_State_Set("classes", ["display", "data"], data);
 
 // REFRESH STAFF DISPLAY
 Class_Display_Students();
 
 Core_State_Set("classes", ["display", "updated"], true);
}




async function Class_Display_RemoveStudent(event)
{
 var element  = event.currentTarget;
 var data     = Core_State_Get("classes", ["display", "data"]);
 var class_id = Safe_Get(data, ["info", "id"]); 
 var seat     = Document_Element_GetObject(element, "seat");
 
 // CONFIRMATION POPUP
 var name     = [Safe_Get(seat, ["student", "firstname"], ""), Safe_Get(seat, ["student", "lastname"], "")].join(" ");
 var title    = UI_Language_String("classes/popups", "student delete title"); 
 var content  = UI_Language_String("classes/popups", "student delete text", {name}); 
 var picture  = Resources_URL("images/cover-logout.png");
 
 var confirm  = await UI_Popup_Confirm(title, content, picture);
 if(!confirm) return;
 
 await Core_Api("Class_Seat_Cancel", {id:seat["id"]});
 
 
 // RELOAD CLASS
 var data     = await Core_Api("Class_Read", {class_id, options:{users:true, seats:true}});
 Core_State_Set("classes", ["display", "data"], data);
 
 // REFRESH STAFF DISPLAY
 Class_Display_Students();
 
 Core_State_Set("classes", ["display", "updated"], true);
}
