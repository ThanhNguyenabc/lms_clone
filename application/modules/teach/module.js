// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                           T E A C H                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Teach_OnLoad(module, data)
{
 var thismonth = parseInt(Date_Get(Date_Now(), "month"));
 var select    = UI_Element_Find(module, "header-month");
 for(var month = 1; month <= 12; month++)
 {
  var name   = Date_Month_Name(month).toUpperCase();
  var option = Document_Select_AddOption(select, name, month);
 }
 select.value    = thismonth;
 select.onchange = Teach_Month_Select;
 
 var thisyear = parseInt(Date_Get(Date_Now(), "year"));
 var select   = UI_Element_Find(module, "header-year");
 for(var year = thisyear - 5; year <= thisyear + 1; year++)
 {
  var option = Document_Select_AddOption(select, year, year);
 }
 select.value    = thisyear;
 select.onchange = Teach_Month_Select;
}




async function Teach_OnUnload()
{
}





async function Teach_OnShow(module, data)
{
 Teach_Month_Select();
}









async function Teach_Month_Select()
{
 // GET MONTH
 var year      = UI_Element_Find("header-year").value;
 var month     = UI_Element_Find("header-month").value;
 var container = UI_Element_Find("classes-calendar");
 
 date_from     = Date_Portion(year + month.toString().padStart(2, "0") + "01000000", "no-seconds");
 date_to       = Date_Portion(Date_Add_Months(date_from, 1), "no-seconds");


 // GET CLASSES AND ORGANIZE THEM BY DAY
 var classes = await Core_Api("Classes_List_ByTeacher", {date_from, date_to});
 for(var item of classes) item["day"] = Date_Portion(item["date_start"], "date-only");
 classes = Array_Catalog_ByField(classes, "day");
  
 Teach_Calendar_Month(container, month, year, classes);
}




async function Teach_Calendar_Month(container, month, year, classes = [])
{
 var classes = Core_State_Get("teach", "classes", classes);
 var today   = Date_Portion(Date_Now(), "date-only");
 var locale  = UI_Language_Current(true);
 
 
 // CLEAR ASSESSMENT PANEL
 UI_Element_Find("student-assessment").innerHTML = "";
  
 // CLEAR CLASS PREVIEW 
 UI_Element_Find("class-preview").style.visibility = "hidden";
 UI_Element_Find("class-preview").innerHTML = "";
 
 
 // CLEAR CLASSES LIST
 UI_Element_Find("classes-list").style.visibility = "hidden";
 UI_Element_Find("classes-list").innerHTML = "";
 
 
 // CREATE CALENDAR 
 var table = UI_Table("cursive");
 
 
 // HEADER
 var row = UI_Table_Row(table); 
 for(var i = 1; i <= 7; i++)
 {
  var cell       = UI_Table_Cell(row, {type:"header"});  
  cell.innerHTML = Date_Weekday_Name(i, "short", locale); 
 }
 
 
 
 var days   = Date_Month_ListDays(month, year);
 
 // FIRST ROW: SEE HOW MANY CELLS WE NEED TO SKIP TO GET TO THE FIRST DAY OF THE MONTH
 var row = UI_Table_Row(table); 
 
 var first = Date_Weekday_Get(days[0]);
 for(var weekday = 1; weekday < first; weekday++)
 {
  var cell              = UI_Table_Cell(row);
  cell.style.visibility = "hidden";
  
  row.appendChild(cell);
 }	 


 // NOW WE PROCEED: KEEP ADDING DAYS
 var d = 0;
 while(d < days.length)
 {	 
  var weekday = Date_Weekday_Get(days[d]);
  
  var cell       = UI_Table_Cell(row); 
  cell.innerHTML = Date_Get(days[d], "day"); 
  
  var day = Date_Portion(days[d], "date-only");
  if(classes[day])
  {
   cell.onclick               = Teach_Calendar_Day;
   cell.style.backgroundColor = "var(--color-noted)";
   Document_CSS_SetClass(cell, "style-clickable");
 
   Document_Element_SetObject(cell, "classes", classes[day]);
  }
  else
  {
  }
  
  if(day == today) 
  {
   cell.style.backgroundColor = "var(--color-alert-light)";
   Document_Element_Animate(cell, "flash 1.5s ease-in-out 1.5");
  }
  
  if(weekday == 7)
  {
   var row = false;
   
   // START NEW ROW UNLESS THIS WAS ALSO THE FINAL DAY
   if(d != (days.length -1))
   {
    var row = UI_Table_Row(table);
   }
  }
  
  d++;
 }
 
 container.innerHTML = "";
 container.appendChild(table);
 
 Core_State_Set("teach", ["calendar", "table"], table);
}




async function Teach_Calendar_Day(event)
{
 var element = event.currentTarget;
 var classes = Document_Element_GetObject(element, "classes");
 
 var table   = Core_State_Get("teach", ["calendar", "table"]);
 var cells   = Document_Element_GetObject(table, "cells");
 
 // HIGHLIGHT SELECTED DAY 
 Document_Conditional_Class(cells, "style-outlined-accented", element);


 // CLEAR CLASS PREVIEW 
 UI_Element_Find("class-preview").style.visibility = "hidden";
 UI_Element_Find("class-preview").innerHTML = "";
 
 
 // DISPLAY CLASSES FOR THE DAY
 var container       = UI_Element_Find("classes-list");
 container.innerHTML = "";
 
 var now     = Date_Portion(Date_Now(), "no-seconds");
 var current = false;
 
 for(var item of classes)
 { 
  var time    = Date_Format(item["date_start"], "en-US", "time-only") + " - " + Date_Format(item["date_end"], "en-US", "time-only")
  var center  = item["center_id"];
  var code    = item["lesson_id"];
  var element = UI_Element_Create("teach/class-item", {time, center, code});
  
  Document_Element_SetObject(element, "class", item);
  element.onclick    = Teach_Class_Preview; 
  
  container.appendChild(element);
  
  // IS THIS THE CURRENT CLASS?
  if(Numbers_Between(now, item["date_start"], item["date_end"]))
  { 
   current = element;
  }
 }
 
 container.style.visibility = "visible";
 
 
 // IF THERE IS A CLASS RIGHT NOW, BLINK AND SCROLL INTO VIEW AUTOMATICALLY
 if(current)
 {
  Document_Element_Animate(current, "flash 1.5s 3");
  current.scrollIntoView({behavior: "smooth", block: "center"})
 }
}




async function Teach_Class_Preview(event)
{
 var element   = event.currentTarget;
 var classitem = Document_Element_GetObject(element, "class");
 
 Core_State_Set("teach", ["calendar", "selected-class"], element); 
 var container = UI_Element_Find("classes-list");
 Document_Conditional_Class(container, "style-outlined-accented", element);
 
 
 var page = await Class_Preview(classitem["id"], 
 {
  classroom   : Teach_Class_Start, 
  assessment  : Teach_Class_Assess, 
  online      : true, 
  attendance  : false, 
  quickassess : UI_Element_Find("student-assessment")
 });
  
 
 // CLEAR ASSESSMENT PANEL
 UI_Element_Find("student-assessment").innerHTML = "";
 
 
 // DISPLAY
 var container       = UI_Element_Find("class-preview");
 container.innerHTML = "";
 container.appendChild(page);
 
 container.style.visibility = "visible";
}




async function Teach_Class_Start(event, id)
{
 if(!id)
 {
  var element   = event.currentTarget;
  var classdata = Document_Element_GetObject(element, "class");
  var id        = classdata["id"];
 }
 
 Core_State_Set("global", ["view-class"], id);
 Module_Load("classroom");
}



async function Teach_Class_Assess(event, id)
{
 if(!id)
 {
  var element   = event.currentTarget;
  var classdata = Document_Element_GetObject(element, "class");
  var id        = classdata["id"];
 }
 
 await Assessment_Assess_Class(id);
}