// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       C E N T E R S                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Centers_List()
{
 var centers = Core_Config(["centers"]);
 for(var id in centers) centers[id]["id"] = id;
 
 return centers;
}




function Centers_Name(center)
{
 var name = Core_Config(["centers", center, "name"], "");
 
 return name;
}



function Centers_Center(center)
{ 
 var data   = Core_Config(["centers", center]);
 data["id"] = center; 
 
 return data;
}



function Centers_From_Cluster(cluster, onlyid)
{
 var centers = [];
 var list    = Centers_List();
 
 for(var id in list)
 {
  var center = list[id];
  if(center["cluster"] == cluster) 
  {
   if(onlyid) centers.push(id); 
   else 
   {
	centers.push(center);
   }
  }
 }
 
 return centers;
}




function Centers_Related(center, onlyid)
{
 var centers = Centers_List();
 var cluster = Safe_Get(centers, [center, "cluster"], false);
 
 if(!cluster) 
 {
  if(onlyid) return [center];
  else
  {
   center = centers[center];
   return [center];
  }
 }
 
 var related = Centers_From_Cluster(cluster, onlyid);
 return related;
}



function Centers_Available(available)
{
 if(!available) var available = Core_Config(["roles", User_Role(), "operate-on-centers"], "none");
 var centers = [];
 
 switch(available)
 {
  case "home":
	centers.push(Centers_Center(User_Center()));
  break;
  
  case "cluster":
	centers.push(...Centers_Related(User_Center()));
  break;
  
  case "all":		
	centers.push(...Object_To_Array(Centers_List()));
  break;
 }
 
 return centers;
}



async function Centers_Rooms(center)
{
 var rooms = Core_Api("Center_Rooms", {center});
 
 return rooms;
}



async function Centers_Room_Select(rooms, center, dates, config = {})
{
 // BOTH CENTER AND DATES SPECIFIED: GET ROOMS FROM AVAILABILITY QUERY
 if(center && dates)
 {
  var rooms = await Core_Api("Center_Rooms_Available", {center, dates, options:{utc:true}}); 
 }
 
 
 // CENTER SPECIFIED, BUT NOT DATES: GET ROOMS FROM CENTER'S WHOLE LIST
 if(center && !dates)
 {
  var rooms = await Centers_Rooms(center);
  rooms     = Object.keys(rooms);
 }
 
 
 // NO ROOMS 
 if(!rooms) rooms = [];
 
 
 // BUILD OPTIONS LIST
 var options = [];
 
 if(config["nullfirst"])
 {
  var option   = new Option();
  option.text  = "";
  option.value = "";
  options.push(option);
 }
 
 console.log(rooms);
 for(var room of rooms)
 {
  option       = new Option();
  option.text  = room;
  option.value = room;
  
  options.push(option);
 }
 
 if(config["online"])
 {
  var option   = new Option();
  option.text  = UI_Language_String("centers/popups", "room online");
  option.value = "online";
  options.push(option);
 }
 
 
 var title = config["title"] || UI_Language_String("centers/popups", "room select title");
 
 var room = await UI_Popup_Select(title, false, false, options);
 return room;
}