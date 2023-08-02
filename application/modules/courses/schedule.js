// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      S C H E D U L E                                           //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Courses_Schedule_Display()
{
 var course   = Core_State_Get("courses", "selected-course", {});
 var display  = Core_State_Get("courses", "course-display");
 var locale   = UI_Language_Current(true);
 
 var box       = UI_Element_Find(display, "course-schedule");
 box.innerHTML = "";

 for(var item of course["schedule"])
 {   
  var day      = Date_Weekday_Name(item["day"], "long", locale);
  var time     = Time_From_Minutes(item["time"]);
  
  var duration = UI_Language_Object(Core_Config(["lesson-durations", item["duration"] || 120]));
  duration     = duration.split(" ");
  duration     = duration[0] + String_Lowercase_Initial(duration[1])[0] + ".";
  
  var element = UI_Element_Create("courses/course-schedule-item", {day, time, duration});
  
  Document_Element_SetObject(element, "schedule", item);
  UI_Element_Find(element, "delete").onclick = Courses_Schedule_Delete;
  
  box.appendChild(element);
 }
 
 // ADD NEW
 var element = UI_Element_Create("courses/course-schedule-add");
 UI_Element_Find(element, "add").onclick = Courses_Schedule_Add;
 box.appendChild(element);
}




async function Courses_Schedule_Delete(event)
{
 var course   = Core_State_Get("courses", "selected-course", {});
 
 var element  = event.currentTarget;
 var parent   = Document_Element_FindParent(element, "item", "schedule");
 var item     = Document_Element_GetObject(parent, "schedule");
 
 Array_Element_Delete(course["schedule"], item);
 await Core_Api("Courses_Update_Field", {id:course["id"], field:"schedule", value:course["schedule"], json:true});
 
 Courses_Schedule_Display();
}




async function Courses_Schedule_Add()
{
 var course = Core_State_Get("courses", "selected-course", {});
 var locale = UI_Language_Current(true);
 
 // SET UP POPUP CONTENT
 var content = UI_Element_Create("courses/popup-schedule-item");
 
 
 // WEEK DAY
 var select = UI_Element_Find(content, "weekday");
 for(var i = 1; i<=7; i++)
 {
  var text  = Date_Weekday_Name(i, "long", locale);
  var value = i;
  
  Document_Select_AddOption(select, text, value);
 }
 
 
 // TIME
 var select = UI_Element_Find(content, "time");
 var from = Time_To_Minutes(Core_Config(["operations", "lessons", "first"]));
 var to   = Time_To_Minutes(Core_Config(["operations", "lessons", "last"]));
 while(from <= to)
 {
  var text  = Time_From_Minutes(from);
  var value = from;
  Document_Select_AddOption(select, text, value);
  
  from = from + 15;
 }
 
 
 // DURATION
 /*
 var select = UI_Element_Find(content, "duration");
 UI_Select_FromDatapage(select, Core_Config(["lesson-durations"]));
 select.value = 120;
 */
 
 // BUTTONS
 var text    = UI_Language_String("courses/popups", "schedule add button");
 var onclick =
 async function(popup)
 {
  var course   = Core_State_Get("courses", "selected-course", {});
  var day      = UI_Element_Find(popup, "weekday").value;
  var time     = UI_Element_Find(popup, "time").value;
  //var duration = UI_Element_Find(popup, "duration").value;
    
  course["schedule"].push({day, time});
  await Core_Api("Courses_Update_Field", {id:course["id"], field:"schedule", value:course["schedule"], json:true});
   
  Courses_Schedule_Display();
  
  UI_Popup_Close(popup);
 }
 
 await UI_Popup_Create({content}, [{text, onclick}], undefined, {escape:true, open:true});  
}



