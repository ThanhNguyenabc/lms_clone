// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       S E A R C H                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Classes_Search_Display(fixed = {}, options = {}, resources = {})
{
 // RESET BOOKING POPUP IF ANY
 Core_State_Set("classes", "booking-popup", false);
 
 
 // CREATE DISPLAY 
 var display = UI_Element_Create("classes/search-display", {}, {language:"classes/search-display"});
 
 // 1. SET UP RESOURCES
 
 // CENTERS
 var centers = resources["centers"] || Array_From_Fields(Centers_Available(), "id");
 if(fixed["center"]) Array_PushUnique(centers, fixed["center"]);
 
 
 // LESSON TYPES
 var types = resources["types"]   || Object.keys(Core_Config("lesson-types")); 
 if(fixed["type"]) Array_PushUnique(types, fixed["type"]);
 
 
 // LESSONS CONTENT
 var lessons = await Resources_Lessons();
 lessons     = lessons["list"];
 
 switch(typeof resources["lessons"])
 {
  // FILTER: ONLY LESSONS BEGINNING WITH THIS TAG
  case "string":
	var filtered = [];
	var filter   = resources["lessons"].toLowerCase();
	for(var lesson of lessons) if(lesson.toLowerCase().startsWith(filter)) filtered.push(lesson);
	
	lessons = filtered;
  break;
  
  // EXPLICIT LIST
  case "object":
	lessons = resources["lessons"];
  break;
 }
 
 if(fixed["lesson"]) Array_PushUnique(lessons, fixed["lesson"]);
 
 

 
 
 // 2. SET UP DROPWDOWNS
 
 // SEARCH: CENTERS
 var select = UI_Element_Find(display, "search-center");
 
 Document_Select_AddOption(select, "", "");
 for(var center of centers)
 {
  var text  = Centers_Name(center); 
  var value = center;
  Document_Select_AddOption(select, text, value);
 }
 
 select.value = fixed["center"] || User_Center();
 
 
 // SEARCH: LESSON TYPES
 var select = UI_Element_Find(display, "search-type");
 
 Document_Select_AddOption(select, "", "");
 for(var type of types)
 {
  var text  = UI_Language_Object(Core_Config(["lesson-types", type], {}), type);
  var value = type;
  Document_Select_AddOption(select, text, value);
 }
 

 
 // SEARCH: LESSON CONTENT 
 var select = UI_Element_Find(display, "search-lesson");
 
 Document_Select_AddOption(select, "", "");
 for(var lesson of lessons)
 {
  Document_Select_AddOption(select, lesson, lesson);
 }

 // SEARCH: DATE FROM
 var select = UI_Element_Find(display, "search-datefrom");
 
 UI_Select_FromDatapage(select, "classes/search-datefrom");
 
 
 // SEARCH: DATE TO
 var select = UI_Element_Find(display, "search-dateto");
 
 UI_Select_FromDatapage(select, "classes/search-dateto");
 
 
 // SEARCH: TIME
 var select = UI_Element_Find(display, "search-time");
 
 Document_Select_AddOption(select, "", "");
 UI_Select_FromDatapage(select, Core_Config("shifts"));
 
 select.onchange = Classes_Search_DisplayResults;
 
 
 // OPTIONS: ONLINE
 var select = UI_Element_Find(display, "options-online");
 
 Document_Select_AddOption(select, "", "");
 UI_Select_FromDatapage(select, "classes/options-online");
 
 
 // OPTIONS: TEACHER
 var select = UI_Element_Find(display, "options-teacher");
 
 Document_Select_AddOption(select, "", "");
 UI_Select_FromDatapage(select, "classes/options-teacher");


 // OPTIONS: OVERBOOK
 var select = UI_Element_Find(display, "options-seat");
 
 Document_Select_AddOption(select, "", "");
 UI_Select_FromDatapage(select, "classes/options-seat");
  
 
 
 



 // 3. SHOW / HIDE FIELDS DEPENDING ON FIXED SEARCH FIELDS
 for(var field of ["center", "type", "lesson", "datefrom", "dateto", ,"seat", "online", "time"])
 {
  var box    = UI_Element_Find(display, "box-search-" + field);
  var select = UI_Element_Find(box, "search-" + field);
  
  if(fixed[field])
  {	 console.log("hide " + field);
   Document_Element_Disable(select, "style-disabled");
   if(!options["nohide"]) box.style.display = "none";
   
   select.value = fixed[field];
  }
 }
 
 
 
 
 // 4. SHOW / HIDE FIELDS DEPENDING ON FIXED OPTIONS FIELDS
 for(var field of ["seat", "online", "teacher"])
 {
  var box    = UI_Element_Find(display, "box-options-" + field);
  var select = UI_Element_Find(box, "options-" + field);
  
  if(options[field])
  {	 
   Document_Element_Disable(select, "style-disabled");
   if(!options["nohide"]) box.style.display = "none";
   
   select.value = fixed[field];
  }
 }
 
 
 // SEARCH BUTTON
 var button     = UI_Element_Find(display, "search-button");
 button.onclick = Classes_Search_Execute;
 
 

/*
 
 // BOOK BUTTON
 var button     = UI_Element_Find(display, "book-button");
 button.onclick = Booking_Book; 
*/


 // 5. STORE STATE
 Core_State_Set("classes", "search-fixed",     fixed);
 Core_State_Set("classes", "search-options",   options);
 Core_State_Set("classes", "search-resources", resources);
 
 Core_State_Set("classes", "search-display",   display);
 
 
 // 6. AUTOSEARCH
 if(options["autosearch"])
 {
  // HIDE SEARCH PANEL
  UI_Element_Find(display, "panel-search").style.display = "none";
  
  // SEARCH AWAY
  Classes_Search_Execute();
 }
 
 
 
 return display;
}





async function Classes_Search_Execute()
{
 var display = Core_State_Get("classes", "search-display");
 var options = Core_State_Get("classes", "search-options");
  
 // DETERMINE SEARCH OPTIONS BASED ON SEARCH PANEL VALUES
 var search = {};
 
 
 // CENTER
 var center = UI_Element_Find(display, "search-center").value;
 if(center) search["centers"] = [center];
 
 
 // TYPE
 search["type"] = UI_Element_Find(display, "search-type").value; 
 
 
 // LESSON
 search["lesson"] = UI_Element_Find(display, "search-lesson").value;
 
 
 // DATE FROM
 var period          = UI_Element_Find(display, "search-datefrom").value;
 search["date_from"] = Date_Period_Time(period, "start");
 
 
 // DATE TO
 var period          = UI_Element_Find(display, "search-dateto").value;
 search["date_to"] = Date_Period_Time(period, "end");
 
 
 
 var options       = {};
 options["fields"] = "id,date_start,date_end,teacher_id,center_id,online,lesson_id";
 
 // TEACHER REQUIRED?
 switch(UI_Element_Find(display, "options-teacher").value)
 {
  case "required":
	options["teacher"] = true;
  break;
  
  case "not required":
	options["teacher"] = false;
  break;
 }
 
 
 // FREE SEAT REQUIRED?
 switch(UI_Element_Find(display, "options-seat").value)
 {
  case "required":
	options["seat"] = true;
  break;
  
  case "not required":
	options["seat"] = false;
  break;
 }
 
 
 // ONLINE / OFFLINE?
 switch(UI_Element_Find(display, "options-online").value)
 {
  case "yes":
	options["online"] = true;
  break;
  
  case "no":
	options["online"] = false;
  break;
 }
 


 
 // EXECUTE SEARCH
 var classes = await Core_Api("Classes_Search", {search, options, info:{teacher:true}});
 Core_State_Set("classes", "search-results", classes);
 
 
 // DISPLAY RESULTS
 Classes_Search_DisplayResults();
}





function Classes_Search_DisplayResults()
{ 
 var display = Core_State_Get("classes", "search-display");
 
 var panel       = UI_Element_Find(display, "search-results"); 
 panel.innerHTML = "";
 
 // CLEAR DETAILS
 UI_Element_Find(display, "panel-detail").style.visibility = "hidden";


 // GET RESULTS
 var classes = Core_State_Get("classes", "search-results", false); 
 if(classes === false) return;
 
 
 // FILTER RESULTS BY TIME
 var filter = UI_Element_Find(display, "search-time").value;
 
 if(!filter)
 {
  var filtered = classes;
 }
 else
 {
  filter    = Core_Config(["shifts", filter]);
  time_from = Time_To_Minutes(filter["from"]);
  time_to   = Time_To_Minutes(filter["to"]);
  
  var filtered  = [];
  for(var item of classes)
  {
   var time = Time_To_Minutes(Date_Portion(item["date_start"], "time-only")); 
   if(Numbers_Between(time, time_from, time_to))
   {
	filtered.push(item);
   }
  }
 }



 // PROCESS FILTERED LIST
 if(filtered.length == 0) return;
 
 for(var item of filtered)
 {
  item["day"] = Date_Portion(item["date_start"], "date-only");
 }
 
 

 // ASSEMBLE LIST
 var list = UI_List_Items(filtered, ["style-outlined-accented", "outline-inner"], Classes_Search_DisplayDetails, {style:"vertical", overflow:true, sections:"day"},
 
 // ITEMS
 function(item)
 { 
  var info = Class_Info(item);
  
  var element = UI_Element_Create("classes/search-item", info);
  Document_Element_SetObject(element, "item", item);
  
  return element;
 },
 
 // SECTIONS
 function(section, item)
 {
  var day     = Date_Format(section, UI_Language_Current(true), "date-long-weekday-noyear");
  
  var element = UI_Element_Create("classes/search-section", {day});
  return element;
 });
 
 
 
 // DISPLAY
 panel.appendChild(list);
 panel.style.visibility = "visible";
}





async function Classes_Search_DisplayDetails(element, item)
{
 var display   = Core_State_Get("classes", "search-display");
 var options   = Core_State_Get("classes", "search-options");
 var resources = Core_State_Get("classes", "search-resources");
  
 // DISPLAY
 if(!item) var item = Document_Element_GetObject(element, "item");
 var page = await Class_Preview(item["id"], {noactions:true, attendance:false});
 
 // BUTTONS
 UI_Element_Find(display, "preview-buttons").innerHTML = "";
 
 // BOOKING
 if(options["book"])
 {
  var button  = UI_Element_Create("core/button-small-stretch", {text:UI_Language_String("classes/search-display", "button book")});
  var student = resources["student"];

  Document_Element_SetObject(button, "student", student); 
  Document_Element_SetObject(button, "class", item);
  
  button.onclick = Classes_Search_Book;
  
  UI_Element_Find(display, "preview-buttons").appendChild(button);
 }
 
 
 var panel       = UI_Element_Find(display, "search-detail");
 panel.innerHTML = "";
 panel.appendChild(page);
 

 // SHOW
 Core_State_Set("classes", "class", item);
 UI_Element_Find(display, "panel-detail").style.visibility = "visible"; 
}



async function Classes_Search_Book(event)
{
 var element   = event.currentTarget;
 var student   = Document_Element_GetObject(element, "student");
 var data      = Document_Element_GetObject(element, "class");
 var resources = Core_State_Get("classes", "search-resources"); 
 var lesson    = Core_State_Get("classes", ["preview", "lesson"]);
 
 // IF STUDENT ID PASSED RATHER THAN THE WHOLE STUDENT, READ IT
 if(student && typeof student != "object")
 {
  student = await Core_Api("User_Read", {user_id:student, fields:"id,firstname,lastname"});
 }
 
 // IF NO STUDENT SELECTED, PICK ONE MANUALLY 
 if(!student)
 {
  var student = await Users_Popup_SelectFromSearch(resources["centers"], ["student"], "id,firstname,lastname", 25, "firstname,lastname");
  if(!student) return;
 }
 
 
 // GET INFO STORED BY PREVIEW
 var info         = {};
 info["lesson"]   = Core_State_Get("classes", ["preview", "class", "info", "lesson_id"]);
 info["class_id"] = Core_State_Get("classes", ["preview", "class", "info", "id"]);
 info["title"]    = UI_Language_Object(Core_State_Get("classes", ["preview", "lesson", "title"], {}));
 
 var date         = Core_State_Get("classes", ["preview", "class", "info", "date_start"]);
 info["date"]     = Date_Format(date, UI_Language_Current(true), "date-long-weekday");
 
 info["name"]     = [student["firstname"] || "", student["lastname"] || ""].join(" ").trim();
 
 
 // CONFIRMATION POPUP 
 var title    = UI_Language_String("classes/popups", "book confirm title");
 var text     = UI_Language_String("classes/popups", "book confirm text", info);
 var picture  = Resources_URL("images/cover-booking.png");
 
 var confirm  = await UI_Popup_Confirm(title, text, picture);
 if(!confirm) return;
 
 // BOOK SEAT
 var seat           = {};
 seat["student_id"] = student["id"];
 
 var seat_id = await Core_Api("Class_Seat_Add", {class_id:info["class_id"], data:seat});
 
 // IF THE SEARCH WAS LAUNCHED IN AUTOSEARCH & BOOKING MODE, CLOSE THE POPUP
 // THIS WILL ALSO RESOLVE THE BOOKING PROMISE
 var popup = Core_State_Get("classes", "booking-popup");
 if(popup)
 {
  Core_State_Set("classes", "booked-seat", seat_id);
  UI_Popup_Close(popup);
 }
 else
 {
  // RELOAD PREVIEW
  var item = Core_State_Get("classes", "class");
  Classes_Search_DisplayDetails(false, item);
 }
 
 // RETURN BOOKED SEAT
 return seat_id;
}





async function Classes_Search_Popup(fixed = {}, options = {}, resources = {})
{
 // RESET BOOKING RESULT
 Core_State_Set("classes", "booked-seat",  false);
 
 // CREATE SEARCH DISPLAY
 var content = await Classes_Search_Display(fixed, options, resources);
 
 if(options["autosearch"])
 {
  var template = "auto";
 }
 else
 {
  var template = "standard";
 }
 
 // CREATE BOOKING PROMISE
 var promise = new Promise(async(resolve, reject) =>
 { 
 
  // CREATE POPUP AND FILL IT WITH SEARCH DISPLAY
  var popup = await UI_Popup_Create({content}, [], "classes/search-popup-" + template, {escape:true, open:true, onclose:
  function()
  {
   // ON POPUP CLOSED, MAKE THE BOOKING PROMISE RETURN THE BOOKED SEAT (IF ANY)
   var seat = Core_State_Get("classes", "booked-seat");
   
   resolve(seat);
  }});
  
  // SET BOOKING POPUP SO THAT UPON BOOKING ACTION SUCCESSFUL, IT WILL BE CLOSED AND THE 
  // BOOKING PROMISE WILL BE RESOLVED
  Core_State_Set("classes", "booking-popup", popup);
 });
 
 return promise;
}