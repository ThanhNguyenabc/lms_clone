// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      T I M E   O F F                                           //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Timeoff_OnLoad(module, data)
{
 var page = await Timeoff_Display();
 
 UI_Element_Find(module, "module-page").appendChild(page); 
}



async function Timeoff_OnShow(module, data)
{
 // FIRST UPDATE
 Timeoff_Calendar();
}




async function Timeoff_OnUnload()
{
}




async function Timeoff_Display(options)
{
 var display =  UI_Element_Create("timeoff/display");
 Core_State_Set("timeoff", "display", display);
 
 
 // ROLES 
 var roles = ["teacher", "ta"];
 
 
 // ENTITIES FOR WHICH TO SET TIME OFF
 var entities = User_Config("set-timeoff", "myself");
 entities = entities.split(",");
 
 
 var def    = false;
 var select = UI_Element_Find(display, "header-entity");
 for(var entity of entities)
 {
  switch(entity)
  {
   case "myself":
        var text        = UI_Language_String("timeoff", "entity myself").toUpperCase();
		var value       = "";
		var option      = Document_Select_AddOption(select, text, value);
        option.disabled = true;		
		
		var user        = await User_Read(true, {});
        var text        = user["firstname"] + " " + user["lastname"];
		var value       = User_Id();
		var option      = Document_Select_AddOption(select, text, value);
        option.onclick  = false;	
		
		var option      = Document_Select_AddOption(select, "", "");
		option.disabled = true;
		
		if(!def) var def = User_Id();
   break;
   
   case "center":
		var text        = UI_Language_String("timeoff", "entity centers").toUpperCase();
		var value       = "";
		var option      = Document_Select_AddOption(select, text, value);
        option.disabled = true;		
		
        var text        = Centers_Name(User_Center());
		var value       = User_Center();
		var option      = Document_Select_AddOption(select, text, value);
        option.onclick  = false;	
		
		var option      = Document_Select_AddOption(select, "", "");
		option.disabled = true;
   break;
   
   case "teachers":
		var users        = await Core_Api("Users_List_ByCenter", {role:roles, center:[User_Center()], fields:"role,id,firstname,lastname", order:"firstname,lastname"});
	    users            = Array_Catalog_ByField(users, "role");
	 	
		for(var role of roles)
		{
	     var text        = UI_Language_Object(Core_Config(["roles", role], {}), "").toUpperCase();
		 var value       = "";
		 var option      = Document_Select_AddOption(select, text, value);
         option.disabled = true;		
	 	 
		 for(var user of users[role])
		 {
          var text        = user["firstname"] + " " + user["lastname"];
	 	  var value       = user["id"]
		  var option      = Document_Select_AddOption(select, text, value);
          option.onclick  = false;	
		 }
		 
		 var option      = Document_Select_AddOption(select, "", "");
		 option.disabled = true;;
		}
		
		var option      = Document_Select_AddOption(select, "", "");
		option.disabled = true;
   break;
   
   case "global":
   break;
  }
 }
 
 select.value    = def;
 select.onchange = Timeoff_Calendar;
 
 
 // MONTHS
 var thismonth = parseInt(Date_Get(Date_Now(), "month"));
 var select    = UI_Element_Find(display, "header-month");
 for(var month = 1; month <= 12; month++)
 {
  var name   = Date_Month_Name(month).toUpperCase();
  var option = Document_Select_AddOption(select, name, month);
 }
 select.value    = thismonth;
 select.onchange = Timeoff_Calendar;
 
 
 // YEARS
 var thisyear = parseInt(Date_Get(Date_Now(), "year"));
 var select   = UI_Element_Find(display, "header-year");
 for(var year = thisyear - 2; year <= thisyear + 2; year++)
 {
  var option = Document_Select_AddOption(select, year, year);
 }
 select.value    = thisyear;
 select.onchange = Timeoff_Calendar;
 
 
 await Timeoff_Calendar();
 
 return display;
}





// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                   R E A D  /  W R I T E                                        //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Timeoff_Read(entity, file)
{
 if(entity == "global") 
 {
  var source = file;
 }
 else 
 {
  // NUMERICAL = USER
  if(!isNaN(entity))
  {
   var source = "users/" + entity + "/" + file;
  }
  else
  // NON NUMERICAL = CENTER
  {
   var source = "centers/" + entity + "/" + file;
  }
 }
 
 Core_State_Set("timeoff", "source", source);
 var data = await Core_Api("Timeoff_Read", {source});
 
 return data;
}




async function Timeoff_Item_Update(event)
{     
 var source  = Core_State_Get("timeoff", "source");
 
 var element = event.currentTarget;
 element     = Document_Element_FindParent(element, "uid", "item");
 
 var data    = Core_State_Get("timeoff", "current-data");
 var id      = Document_Element_GetData(element,   "id");
 var item    = Document_Element_GetObject(element, "item");
 
 // UPDATE ITEM LOCALLY
 item["notes"]    = UI_Element_Find(element, "notes").value;
 

 // STORE
 await Core_Api("Timeoff_Update", {source, id, item}); 
}





async function Timeoff_Item_Delete(event)
{     
 var source  = Core_State_Get("timeoff", "source");
 
 var element = event.currentTarget;
 element     = Document_Element_FindParent(element, "uid", "item");
 
 var data    = Core_State_Get("timeoff", "current-data");
 var id      = Document_Element_GetData(element, "id");
 var item    = Document_Element_GetObject(element, "item");
 
 
 // DELETE
 Array_Element_DeleteAt(data, id);
 await Core_Api("Timeoff_Delete", {source, id}); 
 

 // REDRAW CALENDAR
 var cell = Core_State_Get("timeoff", "current-cell", cell);
 var day  = Core_State_Get("timeoff", "current-day",  day);
 
 await Timeoff_Calendar(false);
 Timeoff_List(cell, day);
}






// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                             U I                                                //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Timeoff_Calendar(reload)
{
 var display = Core_State_Get("timeoff", "display");
 
 UI_Element_Find(display, "timeoff-list-panel").style.visibility = "hidden";
 
 var option = Document_Select_SelectedOption(UI_Element_Find(display, "header-entity"));
 var entity = option.value;
  
 var year   = UI_Element_Find(display, "header-year").value;
 var month  = UI_Element_Find(display, "header-month").value;
 
 // LOAD DATA?
 if(reload || (Core_State_Get("timeoff", "current-entity") != entity))
 { 
  var data = await Timeoff_Read(entity, "timeoff");
  
  Core_State_Set("timeoff", "current-data",   data);
  Core_State_Set("timeoff", "current-entity", entity);
 }
 else
 {
  var data = Core_State_Get("timeoff", "current-data", {});
 }
 
 // CREATE CALENDAR
 var calendar = UI_Calendar(month, year, data, {emptyactive:true, onclick:Timeoff_List,
 activeday:
 function(day, data)
 {
  var items = Timeoff_Day(data, day);
  return (items.length > 0);
 }});
 
 
 // DRAW CALENDAR
 var container       = UI_Element_Find(display, "timeoff-calendar");
 container.innerHTML = "";
 
 // EMPTY ITEMS LIST
 Timeoff_List(false);
 
 container.appendChild(calendar);
}




async function Timeoff_Add(event)
{
 var source = Core_State_Get("timeoff", "source");
 var cell   = Core_State_Get("timeoff", "current-cell", cell);
 var day    = Core_State_Get("timeoff", "current-day",  day);
   
   
 // SET UP POPUP CONTENT
 var content = UI_Element_Create("timeoff/popup-day-set", {}, {language:"timeoff/popups"});
  
 // UPDATE TOTAL
 var showtotal =
 function()
 {
  var time_from  = UI_Element_Find(content, "time_from").value;
  var time_to    = UI_Element_Find(content, "time_to").value;
    
  var date_from  = day + String_Filter_AllowDigits(time_from);
  var date_to    = day + String_Filter_AllowDigits(time_to);
	
  UI_Element_Find(content, "time_total").value = Timeoff_Duration_Text(date_from, date_to); 
 }
  
 
 // TIME_FROM INPUT
 var element   = UI_Element_Find(content, "time_from"); 
 element.value = Core_Config(["operations", "lessons", "first"]);
 element.onchange = showtotal; 
   
 // TIME_TO INPUT
 var element   = UI_Element_Find(content, "time_to"); 
 element.value = Core_Config(["operations", "lessons", "last"]);
 element.onchange = showtotal; 
  
 showtotal();
  
 var buttons = [];
 
 // "SET" BUTTON
 var text    = UI_Language_String("timeoff/popups", "day set button");
 var onclick =
 async function(popup)
 {
  var time_from  = UI_Element_Find(content, "time_from").value;
  var time_to    = UI_Element_Find(content, "time_to").value;
  
  var date_from  = day + String_Filter_AllowDigits(time_from);
  var date_to    = day + String_Filter_AllowDigits(time_to);
  
  var item       = {date_from, date_to};

  await Core_Api("Timeoff_Add", {source, item});   
  
  await Timeoff_Calendar(true);
  Timeoff_List(cell, day);
  
  UI_Popup_Close(popup);
 }
 
 buttons.push({text, onclick});
 
  
 // OPEN POPUP
 var picture = Resources_URL("images/cover-logout.png");
 var date    = Date_Format(day, UI_Language_Current(true), "date-short-weekday-noyear");
 var title   = UI_Language_String("timeoff/popups", "day set title", {date}); 
  
 await UI_Popup_Create({content, title, picture}, buttons, "flexi", {escape:true, open:true});  
}




function Timeoff_List(cell, day)
{
 var display = Core_State_Get("timeoff", "display");
 
 if(!cell)
 {
  UI_Element_Find(display, "timeoff-date").innerHTML = "";
  UI_Element_Find(display, "timeoff-list").innerHTML = "";	
  
  return;
 }	 
 
 
 Core_State_Set("timeoff", "current-cell", cell);
 Core_State_Set("timeoff", "current-day",  day);
 
 var data  = Core_State_Get("timeoff", "current-data");
 var items = Timeoff_Day(data, day);

 UI_Element_Find(display, "timeoff-date").innerHTML = Date_Format(day, UI_Language_Current(true), "date-long-weekday"); 
 
 var container       = UI_Element_Find(display, "timeoff-list");
 container.innerHTML = "";
 
 // EXISTING ITEMS
 for(var item of items)
 {
  var id = data.indexOf(item);
  
  var time_from = Date_Portion(item["date_from"], "time-timecode");
  var time_to   = Date_Portion(item["date_to"],   "time-timecode");
  var duration  = Timeoff_Duration_Text(item["date_from"], item["date_to"]);
  var notes     = item["notes"] || "";
  
  var element = UI_Element_Create("timeoff/timeoff-item", {time_from, time_to, duration});
  
  Document_Element_SetData(element,   "id",   id);
  Document_Element_SetObject(element, "item", item);
  
  UI_Element_Find(element, "delete").onclick = Timeoff_Item_Delete;
  
  var input      = UI_Element_Find(element, "notes");
  input.value    = notes;
  input.onchange = Timeoff_Item_Update;
  
  container.appendChild(element);
 }
 
  // ADD NEW ITEM BUTTON
 var element     = UI_Element_Create("timeoff/timeoff-add");
 element.onclick = Timeoff_Add; 
 container.appendChild(element);
 
 UI_Element_Find(display, "timeoff-list-panel").style.visibility = "visible";
}







// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                        U T I L S                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Timeoff_Check(date_from, date_to, data)
{ 
 // CHECK INTERVAL?
 if(date_from && date_to)
 {
  for(var item of data)
  {
   var overlap = Numbers_Range_Intersect({from:date_from, to:date_to}, {from:item["date_from"], to:item["date_to"]});
   if(overlap) return true;
  }
 }
 else
 // CHECK SINGLE TIME ONLY?
 if(date_from)
 {
  var overlap = Numbers_Within(date_from, {from:item["date_from"], to:item["date_to"]});
  if(overlap) return true;
 }
 
 return false;
}



function Timeoff_Day(timeoff, day)
{
 var items = [];
 day       = Date_Portion(day, "date-only");
 
 for(var item of timeoff)
 {
  if(Date_Portion(item["date_from"], "date-only") == day)
  {
   items.push(item);
  }
 }
 
 return items;
}




function Timeoff_Duration_Text(date_from, date_to)
{
 var hours = Date_Distance(date_from, date_to, "hours");
     
 if(hours >= 8) var text = UI_Language_String("timeoff", "period fullday");
 else
 if(hours >= 4) var text = UI_Language_String("timeoff", "period halfday");
 else           
 var text = UI_Language_String("timeoff", "period hours", {hours});

 return text;
}