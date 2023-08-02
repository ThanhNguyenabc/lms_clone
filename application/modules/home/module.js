// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                           H O M E                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Home_OnLoad(module, data)
{
 var user = Safe_Get(application, ["user"], {});
 
 var home = Core_Config(["roles", user["role"], "home"]) || user["role"];
 
 
 // MULTIPAGE MODULE
 Module_Page_Set(home);
}




async function Home_OnShow(module, data)
{
}




async function Home_OnUnload()
{
}