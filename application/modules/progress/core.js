async function Progress_Core()
{
 var data       = Core_State_Get("progress", "data", []);
 var page       = UI_Element_Create("progress/core");
 var coreskills = data["core-skills"] || [];
 
 // DATASET
 var sets = [];
 
 var i    = 0;
 for(var skill of coreskills)
 {
  // COLLECT VALUES
  var set  = []; 
  for(var item of data["classes"])
  {
   var score = Safe_Get(item, ["assessment", skill]);
   set.push(score); 
  }	
  
  var set = Dataset_Compute_CumulativeAverages(data["classes"], ["assessment", skill], 5);

  // LABELS AND COLORS
  var color           = "color-wheel-" + i % 16;
  var labels          = Array(set.length).fill("");
  var borderColor     = Document_CSS_GetVariable(color);
  var backgroundColor = Color_Hex_ToRGBA(Document_CSS_GetVariable(color), 0.5);
  
  sets.push(
  {
   data: set,
   borderColor,
   backgroundColor,
   fill: true,
   skill
  });
  
  i++;
 }
 

 // CREATE CHART 
 var chart  = UI_Chart_Lines(labels,
 // DATA
 sets,

 // OPTIONS
 {
  responsive    : true,
  interpolation : true,
  min           : 0,
  max           : 5
 },
 
 // Y FORMATTER
 Assessment_Chart_FormatAxis); 
 
 UI_Element_Find(page, "core-skills-chart").appendChild(chart);
 
 
 // HEADER
 var items = {};

 items["all"] =
 {
  text :   UI_Language_String("progress", "coreskills header all"),
  icons:   [],
  skill:   "all",
  chart:   Document_Element_GetObject(chart, "chart"),
  onclick: Progress_Skills_ViewData
 }

 var i = 0;  
 for(var skill of coreskills)
 {
  items[skill]            = {};
  
  items[skill]["text"]    = UI_Language_Object(Safe_Get(data, ["skills", "core skills", skill, "info"], {}));
  items[skill]["icons"]   = [];
  items[skill]["color"]   = Document_CSS_GetVariable("color-wheel-" + i % 16);
  items[skill]["skill"]   = skill;
  items[skill]["chart"]   = Document_Element_GetObject(chart, "chart");
  items[skill]["onclick"] = Progress_Skills_ViewData;
  
  i++;
 }
 
 var header = UI_Header("switch-core-skill", items, {selectfirst:false, css:"color-noted"});
 UI_Element_Find(page, "core-skills-header").appendChild(header);
 
 
 var container       = UI_Element_Find("module-page");
 container.innerHTML = "";
 container.appendChild(page);
}