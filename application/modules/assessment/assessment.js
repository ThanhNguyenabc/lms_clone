// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                   A S S E S S M E N T                                          //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Assessment_Assess_Seat(seat_id, sections = {all:true})
{
 // LOAD REQUIRED DATA, INCLUDING STUDENT'S PERFORMANCE OF 5 PAST CLASSES AND PREPARATION FOR THIS ONE
 var data    = await Core_Api("Assessment_Seat_Data", {seat_id, options:{performance:5, preparation:true}});
 var student = Safe_Get(data, ["seat", "student"], {});


 console.log(data);
 
 // PROCESS ASSESSMENT JSON
 var assessment = Safe_Get(data, ["seat", "assessment"], "");
 assessment     = Safe_JSON(assessment, {});
 Safe_Set(data, ["seat", "assessment"], assessment);
 
 
 // CREATE PAGE 
 var page = Assessment_Page("seat", {student:student});
 var seat = Safe_Get(data, ["seat"], {});
 Document_Element_SetObject(page, "data", data); 
 
 
 // STUDENT INFO
 var element = UI_Element_Find(page, "picture");
 User_Picture_Load(element, student);
 

 // PAST PERFORMANCE CHART
 var borderColor     = Document_CSS_GetVariable("color-noted");
 var backgroundColor = Color_Hex_ToRGBA(Document_CSS_GetVariable("color-noted"), 0.5);
 
 var set    = Safe_Get(data, ["performance"]);
 var labels = Array(set.length).fill("");
 
 var chart  = UI_Chart_Lines(labels,
 // DATA
 [
  {data:set, borderColor, backgroundColor, fill:true}, 
 ],
 
 // OPTIONS
 {
  interpolation : true,
  min           : 0,
  max           : 5
 },
 
 // Y FORMATTER
 Assessment_Chart_FormatAxis); 
 
 
 UI_Element_Find(page, "chart-recentclasses").appendChild(chart);
 
 UI_Element_Find(page, "title-recentclasses").innerHTML = UI_Language_String("assessment/preparation", "recentclasses title", {n:set.length});



 // SELF PREPARATION CHART
 var sets        = [];
 var preparation = data["preparation"] || {};
 for(var key in preparation)
 {
  var set = {};
  
  var score              = preparation[key];
  var color              = Assessment_Grade_Display(score, "color");
  var label              = UI_Language_String("assessment/preparation", key + " label");
  
  set["label"]           = label;
  set["data"]            = [score];
  set["borderColor"]     = color;
  set["backgroundColor"] = Color_Hex_ToRGBA(color, 0.5);
  
  sets.push(set);
 }
 
 var chart = UI_Chart_Bars(sets, {min:0, max:1});
 UI_Element_Find(page, "chart-studymaterials").appendChild(chart);
 
 UI_Element_Find(page, "title-studymaterials").innerHTML = UI_Language_String("assessment/preparation", "materials title");


 // OUTCOMES ETC. 
 var content  = UI_Element_Find(page, "content");


 // 1. ATTENDANCE
 if(sections["attendance"] || sections["all"])
 {
  // SECTION
  var caption = UI_Language_String("assessment/assess", "section attendance"); 
  var section = Assessment_Section("attendance");
  var items   = UI_Element_Find(section, "items");
  content.appendChild(section);
  
  // ATTENDANCE
  var item    = Assessment_Item("attendance", "select", seat, Assessment_Record_SeatField);
  items.appendChild(item);
 }
 
 console.log(data);
 
 // 2. OUTCOMES AND SKILLS
 if(sections["outcomes"] || sections["all"])
 {
  var assessment = Safe_Get(data, ["seat", "assessment"]); 
  
  for(var category of ["outcomes", "core skills"])
  {
   var outcomes = Safe_Get(data, ["lesson", category], {});
  
   if(outcomes && Object.keys(outcomes).length > 0)
   {
    // SECTION
	var caption = UI_Language_String("assessment/assess", "section " + category); 
    var section = Assessment_Section(category, outcomes, assessment, Assessment_Record_Outcome);
   
    content.appendChild(section);
   }
  }
 
 }
 
 
 // 3. FEEDBACK AND BEHAVIOR
 if(sections["feedback"] || sections["all"])
 {
  var section = Assessment_Section("feedback");
  var items   = UI_Element_Find(section, "items");
  content.appendChild(section);
   
  var item    = Assessment_Item("behavior", "select", seat, Assessment_Record_SeatField);
  items.appendChild(item);
  
  var item    = Assessment_Item("feedback", "text", seat, Assessment_Record_SeatField);
  items.appendChild(item);
 }
 
 
 return page;
}




async function Assessment_Class_Display(class_id, options = {})
{
 var display = UI_Table();
 
 
 // LOAD CLASS WITH SEATS
 var classdata = await Classes_Load(class_id, {seats:true, users:true});
 
 // LOAD LESSON
 var lesson_id = Safe_Get(classdata, ["info", "lesson_id"], "null");
 var lesson    = await Lesson_Load(lesson_id, {all:true});

 // ASSESSABLES
 var outcomes = lesson["outcomes"]    || {};
 var skills   = lesson["core skills"] || {};
 
 console.log(classdata);
 console.log(lesson);
 
 
 var table = UI_Table("standard", {fixed:true});
 
 // HEADER
 var row = UI_Table_Row(table, {fixed:true});
 
 // STUDENT
 var cell       = UI_Table_Cell(row, {type:"header"});
 cell.innerHTML = "";
 
 // OUTCOMES
 for(var id in outcomes)
 {
  var outcome    = outcomes[id]    || {};
  var info       = outcome["info"] || {};
  var text       = UI_Language_Object(info, id);
  
  var cell       = UI_Table_Cell(row, {type:"header"});
  cell.innerHTML = text;
 }
 
 // SKILLS
 for(var id in skills)
 {
  var skill      = skills[id]    || {};
  var info       = skill["info"] || {};
  var text       = UI_Language_Object(info, id);
  
  var cell       = UI_Table_Cell(row, {type:"header"});
  cell.innerHTML = text;
 }
 
 // BEHAVIOR
 var cell       = UI_Table_Cell(row, {type:"header"});
 cell.innerHTML = UI_Language_String("assessment/assess", "item behavior");
 
 // ATTENDANCE
 var cell       = UI_Table_Cell(row, {type:"header"});
 cell.innerHTML = UI_Language_String("assessment/assess", "item attendance");
 

 
 // FOR EACH SEAT
 var seats = classdata["seats"] || [];
 for(var seat of seats)
 {
  var row = UI_Table_Row(table);
  
  seat["assessment"] = Safe_JSON(seat["assessment"], {});
  
  // STUDENT INFO
  var student = seat["student"] || {};
  
  var element = UI_Element_Create("assessment/class-cell-student");
  var name    = [student["firstname"] || "", student["lastname"] || ""].join(" ").trim();
  UI_Element_Find(element, "name").innerHTML = name;
  
  User_Picture_Load(UI_Element_Find(element, "picture"), student);
  
  var cell = UI_Table_Cell(row);
  cell.appendChild(element);
  
  
  
  // FOR EACH OUTCOME
  for(var id in outcomes)
  {
   var outcome    = outcomes[id]    || {};
  
   var select  = UI_Element_Create("core/control-dropdown-small");
   Document_Select_AddOption(select, "", "");
   for(var value = 1; value <= 5; value++)
   {
	var scale = outcome["lv " + value] || {};
	var text  = value + " / " + UI_Language_Object(scale, value);
    Document_Select_AddOption(select, text, value);
   }
   
   Document_Element_SetData(select, "seat", seat["id"]);
   Document_Element_SetData(select, "field", id);
   Document_Element_SetData(select, "type", "assessment");
   
   select.value    = Safe_Get(seat, ["assessment", id]);
   select.onchange = Assessment_Class_UpdateSeat;
   
   var cell = UI_Table_Cell(row);
   cell.appendChild(select);
  }
  
  
  // FOR EACH SKILL
  for(var id in skills)
  {
   var skill = skills[id];
   
   var select  = UI_Element_Create("core/control-dropdown-small");
   Document_Select_AddOption(select, "", "");
   for(var value = 1; value <= 5; value++)
   {
	var scale = skill["lv " + value] || {};
	var text  = value + " / " + UI_Language_Object(scale, value);
    Document_Select_AddOption(select, text, value);
   }
   
   Document_Element_SetData(select, "seat", seat["id"]);
   Document_Element_SetData(select, "field", id);
   Document_Element_SetData(select, "type", "assessment");
   
   select.value    = Safe_Get(seat, ["assessment", id]);
   select.onchange = Assessment_Class_UpdateSeat;
   
   var cell = UI_Table_Cell(row);
   cell.appendChild(select);
  }
  

  // BEHAVIOR
  var select  = UI_Element_Create("core/control-dropdown-small");
  Document_Select_AddOption(select, "", "");
  UI_Select_FromDatapage(select, "assessment/behavior");
  
  Document_Element_SetData(select, "seat", seat["id"]);
  Document_Element_SetData(select, "field", "behavior");
  Document_Element_SetData(select, "type", "seat");
  
  select.value    = seat["behavior"];
  select.onchange = Assessment_Class_UpdateSeat;
  
  var cell = UI_Table_Cell(row);
  cell.appendChild(select);
  
  
  
  // ATTENDANCE
  var select  = UI_Element_Create("core/control-dropdown-small");
  Document_Select_AddOption(select, "", "");
  UI_Select_FromDatapage(select, "assessment/attendance-short");
  
  Document_Element_SetData(select, "seat", seat["id"]);
  Document_Element_SetData(select, "field", "attendance");
  Document_Element_SetData(select, "type", "seat");
  
  select.value = seat["attendance"];
  select.onchange = Assessment_Class_UpdateSeat;
  
  var cell = UI_Table_Cell(row);
  cell.appendChild(select);
 }
 
 if(options["popup"])
 {
  var popup = await UI_Popup_Create({content:table}, [], "assessment/class-popup", {escape:true, open:true});
  
  return popup;
 }
 else
 {
  return table;
 }
}




async function Assessment_Class_UpdateSeat(event)
{
 var element = event.currentTarget;
 var id      = Document_Element_GetData(element, "seat");
 var type    = Document_Element_GetData(element, "type");
 var field   = Document_Element_GetData(element, "field");
 var value   = element.value;
 
 console.log("Update ", id, type, field, value);
 
 switch(type)
 {
  case "seat":
	await Core_Api("Class_Seat_SetField", {id, field, value});
  break;
  
  case "assessment":
	await Core_Api("Assessment_Outcome_Store", {table:"classes_seats", id, field, value}); 
  break;
 }
 
 // SYNC ASSESSMENT, ATTENDANCE AND BEHAVIOR FOR SEATS THAT ARE SOMEHOW "CONNECTED" TO THIS ONE (COURSE / SESSION)
 Core_Api("Class_Seats_Sync", {id});
}





// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      E L E M E N T S                                           //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Assessment_Page(template, data)
{
 var student = Safe_Get(data, ["student"], {});
 
 var page    = UI_Element_Create("assessment/page-" + template, student);
 
 return page;
}





function Assessment_Section(category, outcomes, assessment, onchange)
{
 assessment  = assessment || {};
 
 var caption = UI_Language_String("assessment/assess", "section " + category); 
 caption     = caption.replace("section", ""); // TRICK: IF "section" APPEARS IN THE STRING, IT MEANS A STANDARD ONE WAS NOT FOUND. SO WE INTERPRET "CATEGORY" AS THE INTENDED CAPTION
 
 var section = UI_Element_Create("assessment/section", {caption});
 Document_Element_SetData(section, "uid", "section-" + category);
 
 // DISPLAY A ROW FOR EACH ONE OF THE PROVIDED OUTCOMES
 
 if(outcomes)
 {
  var items    = UI_Element_Find(section, "items");
  for(var id in outcomes)
  {
   // GET OUTCOME INFO
   var outcome = outcomes[id];
   var info    = Safe_Get(outcome, ["info"], {});
  
   // CREATE ROW
   var item    = Assessment_Item(id, "select", assessment, onchange, {fill:false, caption:info});
   var select  = UI_Element_Find(item, id);
  

   // POPULATE ROW SELECT WITH OUTCOME SCORES
   Document_Select_AddOption(select, "", "");
	  
   var scores = Object_Subset(outcome, "lv");
   for(var score in scores)
   {
    var value  = String_Filter_AllowDigits(score);
   
    var option = outcome[score];   
    var text   = value + " / " + UI_Language_Object(option);
   
    Document_Select_AddOption(select, text, value, option);
   }
 
   select.value = assessment[id];

   section.appendChild(item);
  }
 }
 
 return section;
}




function Assessment_Item(id, type = "select", data, onchange, options = {fill:true})
{
 data = data || {};
	
 // IF CAPTION IS SPECIFIED AS A LANGUAGE OBJECT...
 if(options["caption"])
 {
  var caption = UI_Language_Object(options["caption"]);
 }
 else
 // OTHERWISE, GET THE CAPTION FROM STANDARD ASSESSMENT INFO
 {
  var caption = UI_Language_String("assessment/assess", "item " + id); 
 }
 
 
 // CREATE ITEM (ROW) AND LINK IT TO THE DATA IT ALTERS
 var item = UI_Element_Create("assessment/item-" + type, {id:id, caption:caption});
 Document_Element_SetObject(item, "data", data);



 // ITEM CONTROL (SELECT, TEXT, ETC.)
 var control = UI_Element_Find(item, id);
 if(control)
 {
 
  if(type == "select" & options["fill"])
  {
   Document_Select_AddOption(control, "", "");
   UI_Select_FromDatapage(control, "assessment/" + id); 
  } 
 
  // SET CURRENT DATA VALUE
  if(data) 
  {
   control.value = data[id];
  }
  
  // CONTROL ONCHANGE 
  if(onchange) control.onchange = onchange;
 }


 return item;
}







// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       E V E N T S                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Assessment_Record_SeatField(event)
{
 var select = event.currentTarget;
 var page   = Document_Element_FindParent(select, "uid", "page");
 var data   = Document_Element_GetObject(page, "data");
 var seat   = data["seat"] || {};

 var field  = Document_Element_GetData(select, "uid");
 var value  = select.value;
 
 // STORE IN DB
 await Core_Api("Class_Seat_SetField", {id:seat["id"], field:field, value:value}); 
 
 // SYNC ASSESSMENT, ATTENDANCE AND BEHAVIOR FOR SEATS THAT ARE SOMEHOW "CONNECTED" TO THIS ONE (COURSE / SESSION)
 Core_Api("Class_Seats_Sync", {id:seat["id"]});
 
 // STORE IN LOCAL DATA
 Safe_Set(seat, [field], value);
}




async function Assessment_Record_Outcome(event)
{
 var select     = event.currentTarget;
 var page       = Document_Element_FindParent(select, "uid", "page");
 var data       = Document_Element_GetObject(page, "data");
 
 var seat_id    = Safe_Get(data, ["seat", "id"]); 
 var outcome_id = Document_Element_GetData(select, "uid");
 var value      = select.value;
 
 // STORE IN DB 
 await Core_Api("Assessment_Outcome_Store", {table:"classes_seats", id:seat_id, field:outcome_id, value}); 
 
 // SYNC ASSESSMENT, ATTENDANCE AND BEHAVIOR FOR SEATS THAT ARE SOMEHOW "CONNECTED" TO THIS ONE (COURSE / SESSION)
 Core_Api("Class_Seats_Sync", {id:seat_id});
 
 // UPDATE LOCALLY CACHED DATA
 Safe_Set(data, ["seat", "assessment", outcome_id], value);
}









// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      R E P O R T I N G                                         //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



function Assessment_Grade_Display(value, what = "text")
{
 var grades = Core_Data_Page("assessment/grades");
 var keys   = Object.keys(grades);
 
 // FIX IT
 if(value < 0) value = 0; if(value > 1) value = 1;
 
 for(var key of keys)
 {
  var v         = String_Filter_AllowDigits(key);
  var threshold = Module_Config("assessment", "grade-" + v, 0);
  
  if(value >= threshold)
  {
   var data = Core_Data_Section("assessment/grades", "grade " + v);	 
   
   switch(what)
   {
	case "color":
		var color = Document_CSS_GetVariable("color-" + data["color"]);
		
		return color;
	break;
	
    case "text":
		var text = UI_Language_Object(data);
		
		return text;
	break;
	
	case "data":
	
		return data;
	break;
   }
   
  }
 }
}





function Assessment_Report_Grade(assessment, fields = false)
{
 if(!fields) var values = assessment;
 else
 {
  var values = {};
  for(var field of fields) values[field] = assessment[field];
 }

 var average = Object_Values_Average(values);
 
 return average;
}




function Assessment_Category_Transcribe(category, assessment, threshold = 3)
{
 var parts = {good:[], bad:[]};
 
 // SEPARATE GOOD FROM BAD OUTCOMES ACCORDING TO THRESHOLD
 for(var outcome_id in category)
 {
  for(var assessment_id in assessment)
  {
   if(assessment_id == outcome_id)
   {
    var value = assessment[assessment_id];
    var info  = Safe_Get(category, [assessment_id, "lv " + value]);
    var text  = UI_Language_Object(info);
    
	if(text)
	{
     if(value < threshold) parts["bad"].push(text); else parts["good"].push(text);
	}
	
   }
  }
 }

 
 // DECODE
 var paragraphs = [];
 var person     =  UI_Language_String("assessment/assess", "readable assessment you");
   
   
 // PUT TOGETHER THE GOOD FIRST, THEN THE BAD. ADD A "," BETWEEN PARTS, "AND" ON THE LAST
 for(var category of ["good", "bad"])
 {
  var text      = "";
  var tokens    = parts[category];
  
  for(var i = 0; i<tokens.length; i++)
  {
   text = text + tokens[i];
  
   if(i == tokens.length - 2)
   {
    text = text + " " + UI_Language_String("assessment/assess", "readable assessment and") + " ";
   }
   else
   if(i < tokens.length - 1)
   {
    text = text + ", ";
   }
  }
  
  
  // IF AT LEAST ONE LINE OF TEXT, ADD PARAGRAPH
  if(text != "") 
  {
   paragraphs.push(
   {
	category: category, 
	text:     person + " " + text
   });
  }
  
 }

 
 // ASSEMBLE GOOD AND BAD 
 switch(paragraphs.length)
 {
  case 0:
	var text = "";
  break;
 
  case 1: 
	// ONLY GOOD OR ONLY BAD
    var text = String_Capitalize_Initial(paragraphs[0]["text"]);
  break;
 
  default:
    // GOOD AND BAD
    var however = UI_Language_String("assessment/assess", "readable assessment however");
    var text    = String_Capitalize_Initial(paragraphs[0]["text"]) + ". " + String_Capitalize_Initial(however) + ", " + paragraphs[1]["text"];
  break;
 }
 
 return text;
}




function Assessment_Report_Transcribe(outcomes, assessment, more = {}, threshold = 3)
{
 var paragraphs = [];
 
 // BEHAVIOR DATA, IF AVAILABLE
 var parts = [];
 
 if(more["behavior"])
 {
  var behavior = more["behavior"];
  var text     = UI_Language_String("assessment/behavior", behavior);  
  text         = text.toLowerCase();
  text         = UI_Language_String("assessment/assess", "readable assessment behavior", {text});
  
  parts.push(text);  
 }
 
 if(more["attendance"])
 {
  var attendance = more["attendance"];
  
  var text       = UI_Language_String("assessment/attendance", attendance);  
  text           = text.toLowerCase();
  text           = UI_Language_String("assessment/assess", "readable assessment attendance", {text});
  
  // IF THE CLASS WAS MISSED, STOP HERE. JUST RETURN THE "MISSED CLASS" TEXT.
  if(attendance == "miss") return text;
  
  parts.push(text);  
 }
 
 // BEHAVIOR OR ATTENDANCE ONLY
 if(parts.length == 1)
 {
  paragraphs.push(parts[0]);
 }
 else
 // ATTENDANCE AND BEHAVIOR
 if(parts.length == 2)
 {
  var timely    = (attendance == "yes");
  var attentive = (parseInt(String_Filter_AllowDigits(behavior)) >= 3);
 
  // TIMELY AND ATTENTIVE
  if(timely && attentive)   var connector  = "and";
  
  // TIMELY BUT NOT ATTENTIVE
  if(timely && !attentive)  var connector  = "but";
  
  // LATE BUT ATTENTIVE
  if(!timely && attentive)  var connector  = "however";
	  
  // LATE AND NOT ATTENTIVE
  if(!timely && !attentive) var connector = "and";
  
  var text = parts[1] + ", " + UI_Language_String("assessment/assess", "readable assessment " + connector) + " " + parts[0].toLowerCase();
  paragraphs.push(text);
 }
 
 
 
 // ONE PARAGRAPH PER CATEGORY (OUTCOMES, CORE SKILLS, EXTRA SKILLS, ETC. ...)
 for(var id in outcomes)
 { 
  var category = outcomes[id];
  
  var text = Assessment_Category_Transcribe(category, assessment, threshold)
  
  if(text.trim()) paragraphs.push(text);
 }



 // EXPLICIT FEEDBACK
 if(more["feedback"])
 {
  var text = more["feedback"].trim();
  text     = String_Capitalize_Initial(text);
  
  if(text) paragraphs.push(text);
 }


 
 // OVERALL GRADING
 var grade = Assessment_Report_Grade(assessment);
 grade     = Math.floor(grade);
 
 if(grade < 1 || isNaN(grade))
 {
  // NOT GRADED YET
 }
 else
 {
  grade    = UI_Language_String("assessment/grades", "grade " + grade);
  var text = String_Capitalize_Initial(UI_Language_String("assessment/assess", "readable assessment grading")) + ": " + grade.toUpperCase();
  
  paragraphs.push(text);
 }
  
 
 // JOIN ALL PARAGRAPHS
 for(var i in paragraphs) paragraphs[i] += ". ";
 var text = paragraphs.join("<br><br>");	
 
 
 // FINAL CLEANUP
 text = text.trim();
 
 if(text == "") text = UI_Language_String("assessment/assess", "assessment nothing");
 
 return text; 
}




function Assessment_Report_ChartData(items, thresholdspage, options = {emptysets:false})
{
 var chartdata  = [];
 
 var page       = Core_Data_Page(thresholdspage);
 var thresholds = Object_To_Pairs(page, "threshold");
 
 var catalog    = Object_Catalog_ByNumericValue(items, "score", thresholds);
 var keys       = Object.keys(thresholds);
 keys           = keys.reverse();
 
 for(var key of keys)
 {
  var datapoint      = {};
  var points         = catalog[key] || [];
  
  if(points.length > 0 || options["emptysets"])
  {
   datapoint["value"] = points.length;
   datapoint["color"] = Document_CSS_GetVariable("color-" + key);
   datapoint["label"] = UI_Language_String(thresholdspage, key);
   
   chartdata.push(datapoint);
  }
 }
 
 return chartdata;
}




function Assessment_Chart_FormatAxis(value)
{  
 var string = "grade " + value;
 
 if(UI_Language_Exists("assessment/grades", string)) 
 {
  var text = UI_Language_String("assessment/grades", string); 
 }
 else 
 {
  var text = ""; 
 }
  
 return text;
}





function Assessment_Display_Score(container, score)
{ 
 // UNDEFINED SCORE = NOT SCORED YET
 if(typeof score == "undefined")
 {
  var score   = 0;
  var disable = true;
 }
 else
 {
  var disable = false;
 }
 
 
 // DISPLAY STARS
 for(var i = 1; i<=5; i++)
 {
  if(i <= score) var template = "full"; else var template = "empty";
  var point = UI_Element_Create("assessment/point-" + template);
  
  if(disable) Document_Element_Disable(point, "style-disabled");  

  container.appendChild(point);
 }
}




function Assessment_Display_Assessment(category, outcomes, assessment)
{
 var row            = UI_Element_Create("assessment/display-assessment");
 
 // COVER PICTURE
 var element        = UI_Element_Find(row, "cover");
 if(element)
 {
  var url           = Resources_URL("images/cover-" + category + ".jpg");
  var fallback      = Resources_URL("");
  Document_Image_Load(element, [url, fallback]);
  
  // COVER CAPTION
  var element       = UI_Element_Find(row, "caption");
  element.innerHTML = UI_Language_String("assessment/display", category);
 }
 
 
 // OUTCOMES
 var container = UI_Element_Find(row, "outcomes");
 for(var id in outcomes)
 { 
  var outcome = outcomes[id];
  var text    = String_Capitalize_Initial(UI_Language_Object(outcome["info"]));
    
  var score   = assessment[id];
  var item    = UI_Element_Create("assessment/display-assessment-item", {text}); 
  var points  = UI_Element_Find(item, "score");
  Assessment_Display_Score(points, score);
  
  container.appendChild(item);  
 } 
 
 return row;
}





function Assessment_Display_Feedback(teacher_id, text)
{
 var row        = UI_Element_Create("assessment/display-feedback"); 
 UI_Element_Find(row, "teacher-assessment").innerHTML = text;
 
 var picture  = UI_Element_Find(row, "teacher-picture");
 User_Picture_Load(picture, teacher_id, "teacher");
 
 return row;
}