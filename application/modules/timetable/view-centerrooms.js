async function Timetable_CenterRooms_Data()
{
 var center = Core_State_Get("timetable", "center", User_Center());
 var day    = Core_State_Get("timetable", "day");  
   
 Core_State_Set("timetable", "view-range", "day");
 Core_State_Set("timetable", "view-details", 
 {
  id      : true,
  teacher : true,
  center  : false,
  lesson  : true,
  room    : false,
  time    : false
 });
 
 await Timetable_Data_Center("day");
}



async function Timetable_CenterRooms_Display()
{
 var center    = Core_State_Get("timetable", "center");
  
 var timetable = Core_State_Get("timetable", "display");
 var date      = Core_State_Get("timetable", "date");
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
 var classes = Array_Catalog_ByField(classes, "classroom_id");
 
 for(var classroom_id in classes)
 {
  classes[classroom_id] = Array_Catalog_ByField(classes[classroom_id], "date_day");
 }

 // GET ROOMS 
 var rooms = Core_State_Get("timetable", "rooms");


 // ONE COLUMN PER ROOM
 for(var id in rooms)
 {     
  // COLUMN HEADER
  var caption    = id;
  var subcaption = "";
  
  var header          = UI_Element_Create("timetable/column-header", {caption, subcaption});
  headers.appendChild(header);
  
 
  // COLUMN DATA
  var column = UI_Element_Create("timetable/column-slots", {id, caption});
  column.style.height = (TIMETABLE_MIN_HEIGHT * TIMETABLE_DAY_SLOTS) + "px"; 
 

  // FIRST, FILL LOWEST COLUMN LAYER WITH EMPTY SLOTS
  var data        = {};
  data["center"]  = center;
  data["room"]    = id;
  data["date"]    = day; 
  data["teacher"] = false;
  
  Timetable_Column_Fill(column, data);
 
 
  // CREATE CLASSES SLOTS ON A HIGHER LAYER
  console.log(classes);
  var items = Safe_Get(classes, [id, day], []); 
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


