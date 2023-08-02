async function Progress_Vocabulary()
{
 var page = UI_Element_Create("progress/vocabulary");
 
 var vocabulary = await Resources_Index("vocabulary-catalog");
 
 var terms      = await Core_Api("Progress_Data_Vocabulary");
 terms          = Object_To_Array(terms);
 Core_State_Set("progress", ["vocabulary", "terms"], terms);

 var container       = UI_Element_Find(page, "vocabulary-levels");
 //container.innerHTML = "";
 
 var n = 0;
 for(var level of ["pr", "a1", "a2", "b1", "b2"])
 {
  // CALCULATE PERCENTAGE OF LEARNED VOCAB
  var all = Safe_Get(vocabulary, ["by level", level], []);
  var i   = 0;
  for(var term of all)
  {
   if(terms.includes(term)) i++
  }
  i = i / all.length;
  
  var chartbox = UI_Element_Create("progress/outcomes-chart");
  
  
  var color = "color-wheel-" + n % 16;
  var full  = Document_CSS_GetVariable(color);
  var faint = Color_Hex_ToRGBA(Document_CSS_GetVariable(color), 0.25);
  
  chartdata = [{color:full, label:"", value:i}, {color:faint, label:"", value:1-i}];
  var chart = UI_Chart_Doughnut(chartdata, 0.67, {zIndex:100, tooltip:false}); 
  
  Document_Element_SetData(chart, "level",       level);
  Document_Element_SetData(chart, "colorfull",  full);
  Document_Element_SetData(chart, "colorfaint", faint);
  
  Document_CSS_SetClass(chart, "style-clickable");
  chart.onclick = Progress_Vocabulary_DisplayLevel;
  
  UI_Element_Find(chartbox, "text").innerHTML        = level.toUpperCase();
  UI_Element_Find(chartbox, "subtext").style.display = "none";
  UI_Element_Find(chartbox, "chart").appendChild(chart);
  
  container.appendChild(chartbox);
  
  n++;
 }
 
 var container       = UI_Element_Find("module-page");
 container.innerHTML = "";
 container.appendChild(page);
}





async function Progress_Vocabulary_DisplayLevel(event, chart)
{
 var element = event.currentTarget;
 var level   = Document_Element_GetData(element, "level"); 
 var full    = Document_Element_GetData(element, "colorfull"); 
 var faint   = Document_Element_GetData(element, "colorfaint"); 
 
 // GET OUTCOMES AND THEIR NAMES
 var terms      = Core_State_Get("progress", ["vocabulary", "terms"], []);
 var vocabulary = await Resources_Index("vocabulary-catalog");  
 
 var container       = UI_Element_Find("vocabulary-terms-list");
 container.innerHTML = "";
 
 // FOR EACH SLICE (MACRO OUTCOME) SET IT AS FAINT OR FULL BASED ON ACTUAL COUNT OF MICRO
 var chartdata = [];
 var basecolor = Document_CSS_GetVariable("color-dark");
 for(var term of vocabulary["by level"][level] || []) 
 {
  var element = UI_Element_Create("progress/vocabulary-term", {term:Vocabulary_Term_Purge(term)});
  
  if(terms.includes(term))
  {
   element.style.backgroundColor = full;
   Document_CSS_SetClass(element, "style-clickable");
   Document_Element_SetData(element, "term_id", term);
   
   element.onclick = 
   async function(event)
   {
	var element = event.currentTarget;
	var term_id = Document_Element_GetData(element, "term_id");
	
	var display = await Vocabulary_Term_Display(term_id, "big");
	
	var container = UI_Element_Find("vocabulary-term-detail");
	container.innerHTML = "";
	container.appendChild(display);
	
	
 	Document_Element_FitContent(container);
   }
  }
  else 
  {
   element.style.backgroundColor = faint;
   Document_Element_Disable(element, "style-disabled");
  }

  container.appendChild(element);    
 }
 
 UI_Element_Find("vocabulary-terms").style.display = "flex";
 
 // ANIMATE WORDS
 if(false)
 Document_Element_AnimateChildren(container, "fadeInUp 1s 1", 
 {
  appear: true,
  delay:   50, 
  interval: 50, 
  onstart:
  function(element) 
  {
  }
 });
}



async function Progress_Vocabulary_DisplayMacro(item, chart)
{ 
 // GET OUTCOMES AND THEIR NAMES
 var assessment = Core_State_Get("progress", ["outcomes", "assessment"], []);
 var outcomes   = await Resources_Index("outcomes-catalog"); 
 var names      = await Resources_Index("outcomes-" + UI_Language_Current());
 
 var items      = Safe_Get(outcomes, ["by parent", item["id"]], []);
 
 UI_Element_Find("level-micros-title").innerHTML = String_Capitalize_Initial(names[item["id"]]);
 
 var container  = UI_Element_Find("level-micros-list");
 container.innerHTML = "";
 for(var id of items)
 {
  var name  = String_Capitalize_Initial(names[id]);
  var score = assessment[id];
    
  var element                   = UI_Element_Create("progress/outcomes-item-micro", {name});
  element.style.backgroundColor = item["color"];
  
  if(typeof score == "undefined")
  {
   Document_Element_Disable(element, "style-disabled");
   var score = 0;
  }
  
  var meter = UI_Element_Find(element, "score");
  for(var i = 1; i<=5; i++)
  {
   if(i <= score) var template = "full"; else var template = "empty";
   var point = UI_Element_Create("progress/star-" + template);
  
   meter.appendChild(point);
  } 
  
  container.appendChild(element);
 }
}