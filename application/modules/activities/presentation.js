// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                  P R E S E N T A T I O N                                       //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Activity_Presentation_Run(source, display, config)
{	
 // PREV SLIDE
 UI_Element_Find(display, "activity-prev").onclick =
 async function()
 {
  var presentation = Core_State_Get("activity", "presentation");
  
  await Presentation_Slide_Prev(presentation, true, true);
  
  var slide = Presentation_Slide_Current(presentation);
  
  await Presentation_Slide_PlayScripts(slide);
 }
 
 // NEXT SLIDE
 UI_Element_Find(display, "activity-next").onclick =
 async function()
 {
  var presentation = Core_State_Get("activity", "presentation");
  
  await Presentation_Slide_Next(presentation, true, true);
  
  var slide = Presentation_Slide_Current(presentation);
  await Presentation_Slide_PlayScripts(slide);
 }

 
 // LOAD AND SETUP PRESENTATION
 var container    = UI_Element_Find(display, "activity-body");
 var presentation = await Presentation_Load(source);
 Core_State_Set("activity", "presentation", presentation);
 
 Presentation_Assign(presentation, container);
 Presentation_Adapt(presentation);
 
 
 // FIRST SLIDE
 Presentation_Slide_Display(presentation["slides"][0]);
 var slide = Presentation_Slide_Current(presentation);
 Presentation_Slide_PlayScripts(slide);
}




async function Activity_Presentation_Finish(player)
{
 var popup = Core_State_Get("activity", ["popup"]); 
 await UI_Popup_Close(popup); 
}