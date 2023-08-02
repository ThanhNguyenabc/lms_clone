// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         V I D E O                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Activity_Video_Run(source, display, config)
{
 var player = await Video_Load(source); 
 Core_State_Set("activity", ["data"], player); 
 
 config["onend"] = Activity_Video_Finish;
 
 Video_Setup(display, player, config);
}




async function Activity_Video_Finish(player)
{
 var terms  = Core_State_Get("activity", ["data"]);
 var config = Core_State_Get("activity", ["config"]);
 
 Core_State_Set("activity", ["result"], {score:1, data:[]});
 
 var popup = Core_State_Get("activity", ["popup"]); 
 await UI_Popup_Close(popup); 
}