// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                             A S S E S S M E N T  /  L I S T                                    //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Assessment_List_Display(teacher_id, managed = false)
{
 // IF SPECIFIC TEACHER AND TEACHER NOT CURRENT USER, LOAD IT
 if(teacher_id && teacher_id != User_Id()) 
 { 
  var user = await Core_Api("User_Read", {user_id:teacher_id, options:{fields:"id,firstname,lastname"}});
 }
 else
 {
  var user = Core_User();
 }
 
 
 // CREATE DISPLAY
 var display = UI_Element_Create("assessment/list-display");
 Core_State_Set("assessment", "list-display", display);
 
 
 // IF LIST OF MANAGED TEACHERS, SHOW SELECTOR
 if(managed)
 {  
  // IF IT'S NOT A LIST BUT JUST A "TRUE" FLAG, BUILD THE LIST BY CALLING API
  if(typeof managed != "object")
  {
   var managed = await Core_Api("Users_List_ByManager", {manager_id:user["id"], fields:"id,firstname,lastname"});
  }

  var selector = UI_Element_Find(display, "selector");
  var select   = UI_Element_Find(selector, "teachers");
  
  // ADD MAIN USER TO THE LIST
  var name = [user["firstname"] || "", user["lastname"] || ""].join(" ").trim();
  Document_Select_AddOption(select, name, user["id"]);
  
  for(var teacher of managed)
  {
   var name = [teacher["firstname"] || "", teacher["lastname"] || ""].join(" ").trim();
   Document_Select_AddOption(select, name, teacher["id"]);
  }
  
  select.value = user["id"];
  
  select.onchange = 
  function()
  {
   Assessment_List_Teacher(select.value);
  }
  
  selector.style.display = "flex";
 }
 
 await Assessment_List_Teacher(user["id"]);


 return display;
}




async function Assessment_List_Teacher(teacher_id)
{
 var display = Core_State_Get("assessment", "list-display");
  
 // HIDE DETAIL VIEW
 UI_Element_Find(display, "detail").style.visibility = "hidden";


 // GET CLASS ASSESSMENT DATA
 var period     = parseInt(User_Config("admin-days", -30));
 var date_from  = Date_Portion(Date_Add_Days(Date_Now(), period), "no-seconds");
 var date_to    = Date_Portion(Date_Now(), "no-seconds");
 var data       = await Core_Api("Assessment_Status", {teacher_id, date_from, date_to, options:{incomplete:true}});


 // PROCESS DATA
 
 // SECTION
 for(var item of data) 
 {
  item["period"] = Date_Format_Period(Date_Now(), item["date_start"], {locale:UI_Language_Current(true), conversational:true});
 }
 
 // SORT BY DATE AND CLASS ID
 data.sort(
 function(a, b)
 {
  if(a["date_start"] < b["date_start"]) return 1;
  else
  if(a["date_start"] > b["date_start"]) return -1;
  else
  {
   if(a["class_id"] < b["class_id"]) return 1;
   else
   if(a["class_id"] > b["class_id"]) return -1;
   else   
   return 0;
  }
 });
 
 
 // ASSEMBLE DISPLAY
 var list = UI_List_Items(data, ["style-outlined-accented", "outline-inner"], Assessment_List_Seat, {style:"vertical", overflow:true, sections:"period"},
 
 // ITEMS
 function(item)
 {  
  var locale      = UI_Language_Current(true);
  var info        = {};
  info["date"]    = Date_Format(item["date_start"], locale, "date-shortmonth-weekday-noyear") + ", " + Date_Format(item["date_start"], locale, "time-only");
  info["lesson"]  = item["lesson_id"];
  info["student"] = [Safe_Get(item, ["student", "firstname"], ""), Safe_Get(item, ["student", "lastname"], "")].join(" ").trim();
  
  info["todo"]    = UI_Language_String("assessment/list", "todo") + " ";
  for(var token of item["todo"] || [])
  {console.log(token);
   var icon     = Core_Data_Value("assessment/categories", token, "icon");
   var title    = UI_Language_String("assessment/categories", token);
   
   info["todo"] = info["todo"] + "<li class = 'fa fa-" + icon + "' title = '" + title + "'></li>";
  }
 
  var element = UI_Element_Create("assessment/list-item", info);  
  Document_Element_SetObject(element, "item", item);
  
  return element; 
 },
 
 // SECTIONS
 function(section, item)
 {
  var element = UI_Element_Create("assessment/list-section", {period:section.toUpperCase()});  
  return element;
 });
 


 // DISPLAY LIST 
 var container       = UI_Element_Find(display, "list");
 container.innerHTML = "";
 container.appendChild(list);
}




async function Assessment_List_Seat(element)
{
 var item            = Document_Element_GetObject(element, "item");
 var display         = Core_State_Get("assessment", "list-display");
  
 var page            = await Assessment_Assess_Seat(item["id"]);
 
 var container       = UI_Element_Find(display, "detail");
 container.innerHTML = "";
 container.appendChild(page);
 
 container.style.visibility = "visible";
}