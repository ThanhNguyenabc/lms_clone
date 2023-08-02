// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      P A R T N E R                                             //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

function Partner_Name()
{
 var name = Safe_Get(application, ["config", "partner", "name"], "default");
 
 return name;
}



function Partner_Data(section, field)
{
 var value = Safe_Get(application, ["config", "partner", section, field]);
 
 return value;
}




function Partner_Languages()
{
 var languages = {};
 
 var used = Partner_Data("localization", "languages");
 used     = used.split(",");
 
 
 var all = Core_Data_Page("core/languages");
 for(var id of used)
 {
  languages[id] = all[id];
 }
 
 return languages;
}