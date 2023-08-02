async function Timetable_RoomWeek_Data()
{
 var center = Core_State_Get("timetable", "center", User_Center());
 var room   = Core_State_Get("timetable", "room", "");
 var week   = Core_State_Get("timetable", "week");  
  
 Core_State_Set("timetable", "view-range", "week");
 Core_State_Set("timetable", "view-details", 
 {
  id      : true,
  teacher : true,
  center  : false,
  lesson  : true,
  room    : false,
  time    : false
 });
 
 await Timetable_Data_Room(center, room, "week");
}



async function Timetable_RoomWeek_Display()
{
 var center = Core_State_Get("timetable", "center", User_Center());
 var room   = Core_State_Get("timetable", "room", "");
 
 var timetable = Core_State_Get("timetable", "display");
 var date      = Core_State_Get("timetable", "date");
 var classes   = Core_State_Get("timetable", "classes");

 var headers   = UI_Element_Find(timetable, "headers"); 
 var slots     = UI_Element_Find(timetable, "slots"); 
 
 // NAVIGATION HEADER
 var week = Core_State_Get("timetable", "week"); 
 var text = "Week Of " + Date_Format(week, UI_Language_Current(true), "date-short-noyear");
 UI_Element_Find(timetable, "nav-date").innerHTML = text;
 
	
 // ORGANIZE DATA
 for(var item of classes) item["day"]  = Date_Portion(item["date_start"], "date-only");  
 var classes = Array_Catalog_ByField(classes, "day");
	
	
 // ONE COLUMN PER DAY
 for(var i = 0; i<7; i++)
 {
  var weekday    = Date_Portion(Date_Add_Days(week, i), "date-only");
     
  // COLUMN HEADER
  var caption    = Date_Weekday_Name(Date_Weekday_Get(weekday), "long", UI_Language_Current());
  var subcaption = Date_Format(weekday, UI_Language_Current(true), "date-short-noyear");
	 
  var header     = UI_Element_Create("timetable/column-header", {caption, subcaption});
  headers.appendChild(header);
	 
	 
  // COLUMN DATA
  var column = UI_Element_Create("timetable/column-slots", {id:weekday});
  column.style.height = (TIMETABLE_MIN_HEIGHT * TIMETABLE_DAY_SLOTS) + "px"; 
	 

  // FIRST, FILL LOWEST COLUMN LAYER WITH EMPTY SLOTS
  var data        = {};
  data["center"]  = center;
  data["room"]    = room;
  data["date"]    = weekday; 
  data["teacher"] = false;
    
  Timetable_Column_Fill(column, data);
	 
	 
  // CREATE CLASSES SLOTS ON A HIGHER LAYER
  var items = Safe_Get(classes, [weekday], []); 
  for(var item of items)
  {
   var slot          = Timetable_Slot_Display("open", item, Core_State_Get("timetable", "view-details", {}) , Timetable_Slot_View);
   slot.style.zIndex = 100;
	  
   column.appendChild(slot);
  }
	 
	 
  // DISPLAY COLUMN
  slots.appendChild(column);
 }
 
}


