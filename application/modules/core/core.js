// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          C O R E                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

application = {};


function Core_Init(partner)
{
 application["html"]                  = application_html; 
 application["data"]                  = application_data;
 application["config"]                = application_config;

 application["user"]                  = {};
 
 application["state"]                 = {};
 application["state"]["core"]         = {};
 application["state"]["core"]["lang"] = Client_Language_Get();

 Safe_Set(application, ["config", "partner", "name"], partner);
}




async function Core_User()
{
 var user = Safe_Get(application, ["user"], {});
 var data = await Core_Api("User_Read", {options:{settings:true, permissions:true}});
 
 Object.assign(user, data);
 Safe_Set(application, ["user"], user);
 
 return user;
}



function Core_Config(config, def)
{
 if(typeof config == "string") var config = [config];
 
 return Safe_Get(application, ["config", ...config], def);
}





async function Core_Login(id, password)
{
 var response = await Core_Api("Core_Login", {user_id:id, password:password});

 if(typeof response == "string")
 {
  switch(response)
  {
   case "no":
   break;
   
   case "nouser":
   break;
  
   case "wrongpass":
   break;
  }

  return false;  
 }
 else
 {
  application["user"] = response;
  return true;
 }
}



async function Core_Logout()
{
 await Core_Api("Core_Logout", {});
 
 delete application["user"];
}



async function Core_Reload()
{
 var initial = Core_State_Get("core", ["initial-page"], "home");
 
 await Module_Load(initial, document.body);
}




function Core_State_Get(module, field = [], def)
{
 if(typeof field == "string") field = [field];
 
 return Safe_Get(application, ["state", module, ...field], def);
}




function Core_State_Set(module, field = [], value)
{
 if(typeof field == "string") field = [field];
 
 return Safe_Set(application, ["state", module, ...field], value);
}





async function Core_Api(func, params = {}, options = {type:"json"})
{
 var url      = Path_Folder(document.location.origin + document.location.pathname) + "/api.php?f=" + func;  
 var response = await Request_Post(url, params, options["type"]);
 
 return response;
}




async function Core_Service(service, params, options = {type:"json"})
{
 // FIRST CHECK IF IT'S A CONFIGURED SERVICE
 var url = Core_Config(["system", "services", service]) || service;
 url     = document.location.origin + "/services/" + url;
 
 // CALL
 var response = await Request_Post(url, params, options["type"]);
 
 // RETURN
 return response;
}




async function Core_Script(service, params, options = {type:"text"})
{
 // FIRST CHECK IF IT'S A CONFIGURED SERVICE
 var url = document.location.origin + document.location.pathname + "services/" + service;
 
 // CALL
 var response = await Request_Post(url, params, options["type"]);
 
 // RETURN
 return response;
}






function Core_Data_Page(pageid)
{
 if(!pageid.includes("/")) pageid = pageid + "/module";
 
 var page = Safe_Get(application, ["data", pageid], {});
 
 return page;
}





function Core_Data_Pages(module)
{
 var data  = Object_Subset(application["data"], module);
 var pages = Object.keys(data);

 for(var i in pages) pages[i] = pages[i].replace(module + "/", "");

 return pages;
}





function Core_Data_Section(pageid, section)
{
 var page = Core_Data_Page(pageid);
 
 var data = Safe_Get(page, [section]);
 return data; 
}





function Core_Data_Sections(pageid)
{
 var page = Core_Data_Page(pageid);
 
 var sections = Object.keys(page);
 return sections; 
}




function Core_Data_Keys(pageid, section)
{
 var page = Core_Data_Page(pageid);
 
 var data = Safe_Get(page, [section], {});
 
 var keys = Object.keys(data);
 return keys; 
}




function Core_Data_Value(pageid, section, field, def)
{
 var page = Core_Data_Page(pageid);
 
 var value = Safe_Get(page, [section, field], def);
 
 return value;
}



function Core_Magic()
{
 if(Client_Location_Parameter("magic") == 137) return true;
 
 return User_Can("cast-spells");
}




async function Core_App_Register(worker)
{
 var registration = Core_State_Get("core", ["app", "registration"]);
 if(registration) return registration;
 
 window.addEventListener("beforeinstallprompt", 
 function(event)
 {
  Core_State_Set("core", ["app", "installer"], event);
  
  event.preventDefault();
 });
 
 var registration = await navigator.serviceWorker.register(worker);
 Core_State_Set("core", ["app", "registration"], registration);
  
 return registration;
}



async function Core_App_Install()
{
 var installer = Core_State_Get("core", ["app", "installer"]);
 
 if(installer) 
 {
  var result = await installer.prompt();
  return result.outcome;
 }
 
 return "unavailable";
}