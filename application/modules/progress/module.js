// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       P R O G R E S S                                          //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Progress_OnLoad(module, data)
{
 // DETERMINE SELECTED CURRICULA. WE WILL DEFAULT TO "DEFAULT"

 
 // GET DATA FOR SELECTED CURRICULUM
 var curriculum  = "default";
 var classes     = 30; 
 var data        = await Core_Api("Progress_Curriculum_Data", {curriculum, classes}); 
 
 Core_State_Set("progress", "curriculum", curriculum);
 Core_State_Set("progress", "data",       data);
 
 
 
 // CALCULATE IN-TIME SCORES FOR AVERAGE ASSESSMENT AND SINGLE CORE SKILLS 
 var coreskills      = Object.keys(Safe_Get(data, ["skills", "core skills"], {}));
 data["core-skills"] = coreskills;
 
 for(var item of data["classes"])
 {
  item["overall"]      = Assessment_Report_Grade(item["assessment"] || {});
  item["core skills"]  = Assessment_Report_Grade(item["assessment"] || {}, coreskills);
 }
 
 
 
 // CALCULATE AVERAGES FOR EXTRA SKILLS
 var extraskills      = Object.keys(Safe_Get(data, ["skills", "extra skills"], {}));
 data["extra-skills"] = extraskills; 
 
 data["extraskills-averages"] = {};
 for(var skill of extraskills)
 {
  // COLLECT VALUES AND AVERAGE
  var score = 0;
  var c     = 0;
  for(var item of data["projects"])
  {
   var value = Safe_Get(item, ["assessment", skill]);
   
   if(value)
   {
	score = score + parseInt(value);
    c++;
   }
  }	
  
  if(c == 0) var score = 0; else score = score / c;
  
  data["extraskills-averages"][skill] = score;
 }
 


  
 // HEADER
 var header = UI_Header("progress",
 {
  overall:
  {
   text :   UI_Language_String("progress", "module header overall"),
   icons:   [],
   onclick: Progress_Overall
  },
 
  core:
  {
   text :   UI_Language_String("progress", "module header core"),
   icons:   [],
   onclick: Progress_Core
  },
 
  extra:
  {
   text :   UI_Language_String("progress", "module header extra"),
   icons:   [],
   onclick: Progress_Extra
  },
 
  outcomes:
  {
   text :   UI_Language_String("progress", "module header outcomes"),
   icons:   [],
   onclick: Progress_Outcomes
  },
  
  vocabulary:
  {
   text :   UI_Language_String("progress", "module header vocabulary"),
   icons:   [],
   onclick: Progress_Vocabulary
  }
 },

 {selectfirst:false, css:"color-noted", template:"big"});
 
 Core_State_Set("progress", "header", header);
 UI_Element_Find(module, "module-header").appendChild(header);
}



async function Progress_OnShow(module, data)
{
 var header = Core_State_Get("progress", "header");
 
 UI_Header_Set(header, "overall", true);
}




async function Progress_OnUnload()
{
}




// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          M O R E                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Progress_Compare_Skillset(set_a, set_b)
{
 distances = [];
 
 for(var skill in set_a)
 {
  var d              = Math.abs(set_a[skill] - set_b[skill]);  
  if(isNaN(d)) var d = 5;
  
  distances.push(d);
 }

 var similarity = (5 - Object_Values_Average(distances)) / 5;
 
 return similarity;
}





function Progress_Dataset_Skillset(scores)
{
 var data   = Core_State_Get("progress", "data");
 var skills = Safe_Get(data, ["skills", "extra skills"]);
 
 var set   = {labels:[], scores:[]};
 
 for(var skill in skills)
 {
  var info  = Safe_Get(skills, [skill, "info"], {});  
  var label = UI_Language_Object(info) || skill;
  
  set["scores"].push(parseFloat(scores[skill]));
  set["labels"].push(label);
 }
 
 return set;
}





function Progress_Skills_ViewData(item)
{
 var chart = item["chart"];
 var skill = item["skill"];
 
 for(var set of chart.data.datasets)
 {
  if(skill == "all") 
  {
   set.hidden = false;
  }
  else
  {
   set.hidden = set["skill"] != skill;
  }
 }
 
 // TRIGGER CHART RE-ANIMATION
 chart.reset(); 
 chart.draw(); 
 chart.update();
}
