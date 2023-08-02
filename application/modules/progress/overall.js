async function Progress_Overall()
{
 var data = Core_State_Get("progress", "data", []);
 var page = UI_Element_Create("progress/overall");
 
 // DATASET
 var set = [];
 for(var item of data["classes"])
 {
  set.push(item["overall"]); 
 }	 

 //var set = Dataset_Compute_CumulativeAverages(data["classes"], 5, "overall");

 // LABELS AND COLOR
 var labels          = Array(set.length).fill("");
 var borderColor     = Document_CSS_GetVariable("color-noted");
 var backgroundColor = Color_Hex_ToRGBA(Document_CSS_GetVariable("color-noted"), 0.5);
 
 var chart  = UI_Chart_Lines(labels,
 // DATA
 [
  {data:set, borderColor, backgroundColor, fill:true}, 
 ],

 // OPTIONS
 {
  responsive    : true,
  interpolation : true,
  min           : 0,
  max           : 5
 },
 
 // Y FORMATTER
 Assessment_Chart_FormatAxis,
 
 // X FORMATTER,
 false,
 
 // ONCLICK
 Progress_Overall_DisplayClass
 ); 
 
 UI_Element_Find(page, "classes-chart").appendChild(chart);
 
 
 // SET SOME INTERACTIONS
 UI_Element_Find(page, "class-detail").onclick    = Progress_Overall_HideClass;
 UI_Element_Find(page, "class-thumbnail").onclick = Progress_Overall_ViewClass;
 
 
 var container       = UI_Element_Find("module-page");
 container.innerHTML = "";
 container.appendChild(page);
}





async function Progress_Overall_DisplayClass(point, event)
{
 var data     = Core_State_Get("progress", "data");
 var index    = point.index;
 var item     = Safe_Get(data, ["classes", index], {});
 
 var title    = UI_Language_Object(item["lesson_title"] || {});
 var date     = UI_Language_Date(item["date_start"], "date-time-compact")
 var cover    = Resources_URL("cover.png", "lesson", item["lesson_id"]); 
 var fallback = "";
 
 UI_Element_Find("class-title").innerHTML = title;
 UI_Element_Find("class-date").innerHTML  = date;
 
 Document_Image_Load(UI_Element_Find("class-cover"), [cover, fallback]);
 
 UI_Element_Find("class-detail").style.display = "flex";
 
 Core_State_Set("progress", "seat-id", item["id"]);
}






function Progress_Overall_HideClass(event)
{
 UI_Element_Find("class-detail").style.display = "none";
}






async function Progress_Overall_ViewClass(event)
{
 var seat_id = Core_State_Get("progress", "seat-id");
 
 await Module_Load("course");
 await Course_Class_Display(false, seat_id);
 
 //Course_Class_DisplayAssessment();
}