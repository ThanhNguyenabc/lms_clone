// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      B O O K   P A G E                                         //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Bookpage_OnLoad(module, data)
{
}



async function Bookpage_OnShow(module, data)
{
 var lesson = Client_Location_Parameter("lesson");
 
 var page   = await Lesson_Bookpage_Render(lesson);
 
 module.appendChild(page);
 
 // IF PRINT SIZE REQUIRED...
 if(Client_Location_Parameter("print"))
 {
  Document_CSS_UnsetClass(module, "content-centered");
  module.style.alignItems = "center"; 
  module.style.overflow   = "auto";
 }
 else
 // IF PRINT SIZE IS NOT REQUIRED, RESIZE TO SCREEN
 {
  Document_Element_FitContent(page);
  Bookpage_Adjust(page);
 }
 
 console.log(page);
}




async function Bookpage_OnUnload()
{
}





// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          M O R E                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//