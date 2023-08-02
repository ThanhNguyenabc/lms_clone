// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       D I S P L A Y                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Course_Class_DisplayActivities(content, state)
{
 var data          = Core_State_Get("course", ["class-data"]);
 var state         = state || Core_State_Get("course", ["class-state"]);
 var lesson_id     = Safe_Get(data, ["lesson", "source"]);
 
 content.innerHTML = "";
 
 
 // SPACER
 var element              = UI_Element_Create("core/separator-horizontal-minimal");
 element.style.visibility = "hidden";
 content.appendChild(element);
 
 
 // LESSON FOLDERS PLUS SOME MANDATORY CATEGORIES 
 var folders = [...data["content"]];
 folders.push("vocabulary");
  
 
 for(category of ["bookpage", "video", "test", "vocabulary", "documents", "presentation"])
 {
  for(var folder of folders) if(folder.includes(category))
  {
   var activity = String_Filter_AllowAlpha(folder);
   
   var f = Safe_Function("Course_Class_Activity" + String_Capitalize_Initial(activity));
   if(f)
   {
    var row = f(data, state, folder);
   
    content.appendChild(row);
   }
   
  }
 }
 
}




function Coirse_Class_(path, mode, data)
{ 

}



function Course_Class_DisplayAction(container, text, mode, state, source, template, config)
{
 var findscore = 
 function(path, mode, data, classdate)
 {
  path = path.toLowerCase().trim();
  path = path.replace("content/lessons/", ""); 
 
  for(var item of data)
  {  
   
   if(!classdate || item["date"] > classdate)
   {
	var source  = item["source"] || "";
    source      = source.toLowerCase().trim();  

    if(source == path && item["mode"] == mode)
    {
     var score = item["score"];
     if(score < 0) score = 0; else if(score > 1) score = 1;
    
     return score;
    } 
   }
   
  }

  return false;  
 }
	
	
 var action = UI_Element_Create("course/class-action-" + template, {text});  
 if(source) action.onclick = Course_Class_RunActivity;
 
 Document_Element_SetData(action, "mode",   mode);
 Document_Element_SetData(action, "state",  state);
 Document_Element_SetData(action, "source", source);
 
 if(config) Document_Element_SetObject(action, "config", config);
    
 // IF CLASS DATE IS SPECIFIED, ACTIVITY RESULTS WILL BE FILTERED BY PICKING ONLY RESULTS AFTER CLASS DATE.
 // SERVES TO DISTINGUISH BETWEEN "PRE" AND "POST" WITH TESTING ACTIVITIES
 var classdate = Safe_Get(config, "classdate", false);
	
 // COMPLETION CHECK 
 var element = UI_Element_Find(action, "completion");
 if(element)
 {
  var data = Core_State_Get("course", ["class-data", "scores"], []);
   
  var score = findscore(source, mode, data, classdate);
  
  if(score !== false)
  {
   if(Numbers_Between(score, 0, 0.33))
   {
	element.style.color = "var(--color-bad)";
	element.className   = "fa-solid fa-circle-exclamation";
   }
   else
   if(Numbers_Between(score, 0.33, 0.75))
   {
	element.style.color = "var(--color-soso)";
	element.className   = "fa-solid fa-circle-question";
   }
   else
   if(Numbers_Between(score, 0.75, 1))
   {
	element.style.color = "var(--color-good)";
	element.className   = "fa-solid fa-circle-check";
   }
  }
 }
	 
 container.appendChild(action);
 
 return action;
}





function Course_Class_DisplayChart(results, state)
{  
 switch(state)
 {
  case "pre":
    // SORT BY SCORE TO GET THE FIRST
	Array_Items_Sort(results, "date"); 
	var index = 0;
  break;
  
  case "post":
	// SORT BY SCORE TO GET THE BEST
	Array_Items_Sort(results, "score");
	var index = results.length -1;
  break;
 }
 
  
 var items      = Safe_Get(results, [index, "data"], {});
 var chartdata  = Assessment_Report_ChartData(items, "assessment/activities-thresholds");
  
 // IF NO DATA
 if(chartdata.length == 0)
 {
  chartdata = [{color:Document_CSS_GetVariable("color-dark"), label:"", value:1}];
  var chart = UI_Chart_Doughnut(chartdata, 0.67); 
  
  Document_Element_Disable(chart, "style-translucent-light");
 }
 else 
 {
  var chart = UI_Chart_Doughnut(chartdata, 0.67); 
 }	 
 
 return chart;
}





function Course_Class_DisplayChartText(container, results, state)
{ 
 // ANALYZE RESULTS
 if(results && results.length > 0)
 {
  Array_Items_Sort(results, "date"); 
  var first = results[0];
  
  Array_Items_Sort(results, "score");
  var best = results[results.length - 1];
  
  console.log(results);
  console.log(best, first);
  console.log("");
   
  if(results.length > 1)
  {
   if(best == first) 
   {
	var improvement = 0;
   }
   else
   {
    var improvement = Math.floor((best["score"] - first["score"]) * 100);	  
   }
   
   // FIX IMPROVEMENT
   //improvement = improvement * 2;
   if(improvement > 100) improvement = 100;
   if(improvement == 0) improvement = 1;
   
  }
 }
 
 
 // CHART TEXT
 if(!results)
 {
  var text    = "";
  var subtext = "";
 }
 else
 if(results.length == 0)
 {
  var text    = UI_Language_String("course/activities", "chart none text");
  var subtext = UI_Language_String("course/activities", "chart none subtext");
 }
 else
 switch(state)
 {
  case "pre":
	if(results.length > 0)
	{
     var text    = Assessment_Grade_Display(first["score"]); 
	 var subtext = "";		
	}
	else
	{
     //var text =
	}
  break;
   
  case "post":
	if(results.length == 1)
	{
     var text    = Assessment_Grade_Display(first["score"]); 
	 var subtext = UI_Language_String("course/activities", "chart post subtext");
	}
	else
    {
     var text    = Assessment_Grade_Display(best["score"]); 
	 var subtext = UI_Language_String("course/activities", "chart post improvement", {improvement});
	}
  break;
 }
 
 
 // DISPLAY
 UI_Element_Find(container, "chart-text").innerHTML    = text;
 UI_Element_Find(container, "chart-subtext").innerHTML = subtext;
}





