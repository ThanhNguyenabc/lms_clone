
async function Progress_Extra()
{
 var data        = Core_State_Get("progress", "data", []);
 var curriculum  = Core_State_Get("progress", "curriculum");
 var page        = UI_Element_Create("progress/extra");
 var extraskills = data["extra-skills"] || [];
 
 
 
 var color           = "color-noted";
 var borderColor     = Document_CSS_GetVariable(color);
 var backgroundColor = Color_Hex_ToRGBA(Document_CSS_GetVariable(color), 0.5);
  
 var dataset         = Progress_Dataset_Skillset(data["extraskills-averages"]);
 var chart           = UI_Chart_Radar(dataset["labels"], [{data:dataset["scores"], borderColor, backgroundColor}], {min:0, max:5, responsive:false}, {width:"160px", height:"160px", zIndex:100});
 UI_Element_Find(page, "extra-skills-chart").appendChild(chart);



 // MATCHING PROFILE
 var profiles        = Object_Subset(data["curriculum"], "profile");
 var max             = 0;
 var similar         = "none";
 for(var profile in profiles)
 {
  var similarity = Progress_Compare_Skillset(profiles[profile], data["extraskills-averages"]); 
  
  if(similarity > max)
  {
   max     = similarity;  
   similar = profile;
  }
 }
 
 similarity = max;
 
 
 var color           = "color-alert";
 var borderColor     = Document_CSS_GetVariable(color);
 var backgroundColor = Color_Hex_ToRGBA(Document_CSS_GetVariable(color), 0.5);
  
 var dataset         = Progress_Dataset_Skillset(profiles[similar]);
 var chart           = UI_Chart_Radar(dataset["labels"], [{data:dataset["scores"], borderColor, backgroundColor}], {min:0, max:5, responsive:false}, {width:"160px", height:"160px", zIndex:100});
 UI_Element_Find(page, "profile-match-chart").appendChild(chart);
 
 // DISPLAY PROFILE NAME 
 similar = "profile researcher";
 similarity = Math.floor(100 * similarity);
 UI_Element_Find(page, "profile-match-name").innerHTML = UI_Language_Object(profiles[similar]).toUpperCase() + " (" + similarity + "%)";
 
 
 // DISPLAY PROFILE PICTURE
 UI_Element_Find(page, "profile-match-picture").src     = Resources_URL(similar.replace("profile ", "") + ".jpg", "curriculum", curriculum);
 
 Document_Element_Animate(UI_Element_Find(page, "profile-match-picture"), "flipInY 1.5s"); 
 Document_Element_Animate(UI_Element_Find(page, "profile-match-name"), "slideInRight 1s"); 
 
 
 var container       = UI_Element_Find("module-page");
 container.innerHTML = "";
 container.appendChild(page);
}