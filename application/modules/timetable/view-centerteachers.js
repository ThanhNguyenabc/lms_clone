async function Timetable_CenterTeachers_Data()
{
 var center = Core_State_Get("timetable", "center", User_Center());
 var day    = Core_State_Get("timetable", "day");  
   
 Core_State_Set("timetable", "view-range", "day");
  
 Core_State_Set("timetable", "view-details", 
 {
  id      : true,
  teacher : false,
  center  : false,
  lesson  : true,
  room    : true,
  time    : false
 });

 await Timetable_Data_Center("day");
}



async function Timetable_CenterTeachers_Display()
{
 var timetable = Core_State_Get("timetable", "display");
 var date      = Core_State_Get("timetable", "date");
 var center    = Core_State_Get("timetable", "center");
 var classes   = Core_State_Get("timetable", "classes");
 var headers   = UI_Element_Find(timetable, "headers"); 
 var slots     = UI_Element_Find(timetable, "slots"); 
 
 
 // NAVIGATION HEADER
 var date = Core_State_Get("timetable", "day");
 var text = Date_Format(Core_State_Get("timetable", "day"), UI_Language_Current(true), "date-short-weekday-noyear");
 UI_Element_Find(timetable, "nav-date").innerHTML = text;
	
 var day  = Date_Portion(date, "date-only");
	
 // ORGANIZE DATA
 for(var item of classes) item["date_day"] = Date_Portion(item["date_start"], "date-only"); 
 var classes = Array_Catalog_ByField(classes, "teacher_id");
  
 for(var teacher_id in classes)
 {
  classes[teacher_id] = Array_Catalog_ByField(classes[teacher_id], "date_day");
 }
	
 // GET TEACHERS 
 var teachers = Core_State_Get("timetable", "teachers");
    
	
 // ONE COLUMN PER TEACHER
 for(var teacher of teachers)
 {
  var id         = teacher["id"];
     
  // COLUMN HEADER
  var caption    = teacher["firstname"] || "";
  var subcaption = teacher["lastname"]  || "";
	 
  var header          = UI_Element_Create("timetable/column-header", {caption, subcaption});
  headers.appendChild(header);
	 
	 
  // COLUMN DATA
  var column = UI_Element_Create("timetable/column-slots", {id:teacher["id"], caption});
  column.style.height = (TIMETABLE_MIN_HEIGHT * TIMETABLE_DAY_SLOTS) + "px"; 
	 

  // FIRST, FILL LOWEST COLUMN LAYER WITH EMPTY SLOTS
  var data        = {};
  data["center"]  = center;
  data["room"]    = false;
  data["date"]    = day; 
  data["teacher"] = teacher["id"];
  
  Timetable_Column_Fill(column, data);
	 
	 
  // CREATE CLASSES SLOTS ON A HIGHER LAYER
  var items = Safe_Get(classes, [teacher["id"], day], []); 
  for(var item of items)
  {
   var slot          = Timetable_Slot_Display("open", item, Core_State_Get("timetable", "view-details", {}), Timetable_Slot_View);
   slot.style.zIndex = 100;
	  
   column.appendChild(slot);
  }
	 
	 
  // DISPLAY COLUMN
  slots.appendChild(column);
 }
}