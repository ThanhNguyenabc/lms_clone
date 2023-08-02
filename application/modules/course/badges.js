// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          B A D G E S                                           //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Course_Class_DisplayBadges(container)
{
 var data   = Core_State_Get("course", ["class-data"]);
 var badges = Safe_Get(data, ["seat", "badges"], []);
 var page   = UI_Element_Create("course/class-badges");
 
 badges = Array_Catalog_Counts(badges);
 for(var id in badges)
 {
  var attract = Core_Data_Section("classroom/attract", id);  
  var message = UI_Language_Object(attract);
  var sound   = attract["sound"];
  var emoji   = attract["icon"];
  
  var count   = badges[id];
  
  var element = UI_Element_Create("course/class-badge", {emoji, count, message});
  Document_Element_SetData(element, "sound",   sound);
  Document_Element_SetData(element, "message", message);
  
  //element.onclick = 
  
  element.style.visibility = "hidden";
  page.appendChild(element);
 }

 Document_Element_AnimateChildren(page, "zoomIn 0.5s 1", 
 {
  delay:    250, 
  interval: 250, 
  onstart:
  function(element) 
  {
   element.style.visibility = "visible";
  }
 }); 

 container.innerHTML = "";
 container.appendChild(page);
}



