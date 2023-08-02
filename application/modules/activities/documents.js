// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                     D O C U M E N T S                                          //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Activity_Documents_Run(source, display, config)
{
 // JUST LOAD DOCUMENT INTO THE IFRAME
 var iframe = UI_Element_Find(display, "document");
 
 // HERE MODE IS USED TO CARRY OVER FILENAME
 var file = config["mode"];
 
 if(Path_Extension(file.toLowerCase()) != "pdf") file = file + ".pdf";
	 
 iframe.src = source + "/" + file;
}




async function Activity_Documents_Finish(player)
{
 var popup = Core_State_Get("activity", ["popup"]); 
 await UI_Popup_Close(popup); 
}