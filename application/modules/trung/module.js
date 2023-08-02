// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                     T E M P L A T E                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Trung_OnLoad(module, data)
{
 console.log(data);
 
 Core_State_Set("trung", ["stairs", "step"], 0);
 
 var step = Core_State_Get("trung", ["stairs", "step"]);
}



async function Trung_OnShow(module, data)
{
 var container = UI_Element_Find(module, "module-page");
 
 var users     = await Core_Api("Users_Read", {ids:[137, 103, 102]});
 
 for(var id in users)
 {
  var user     = users[id];
  var element  = UI_Element_Create("trung/red-box", {count:user["firstname"]}, {});
  
  Document_Element_SetObject(element, "user", user);
  
  element.onclick = 
  function(event)
  {
   var element = event.currentTarget;
   var user    = Document_Element_GetObject(element, "user");
   
   alert(user["lastname"]);
  }
  
  container.appendChild(element);
 }
 

}




async function Trung_OnUnload()
{
}





// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          M O R E                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//