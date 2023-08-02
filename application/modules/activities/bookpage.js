// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                     B O O K P A G E                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Activity_Bookpage_Run(source, display, config)
{	
 var page               = await Lesson_Bookpage_Render(Path_Filename(Path_Folder(source)));
 page.style.height      = "90vh";
 page.style.aspectRatio = 1.4;

 var frame   = await UI_Frame_Flexi(Resources_URL("images/frames/book-classic"), 32);
 Document_CSS_SetClass(frame, "border-rounded");
 var content = UI_Element_Find(frame, "content");

 display.innerHTML = "";
 display.appendChild(frame);
 
 content.appendChild(page);

 Document_Element_FitContent(page, 0.01);
 Bookpage_Adjust(page);
}




async function Activity_Bookpage_Finish(player)
{
 var popup = Core_State_Get("activity", ["popup"]); 
 await UI_Popup_Close(popup); 
}