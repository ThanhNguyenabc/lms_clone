// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                    M E S S A G E S                                             //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Messages_OnLoad(module, data)
{
 
}



async function Messages_OnShow(module, data)
{
 var items = {};
 
 for(var group of ["unread", "this week", "last week", "last month"])
 {
  var item        = {};
  
  item["icons"]   = [];
  item["text"]    = UI_Language_String("messages/groups", group);
  item["period"]  = Core_Data_Value("messages/groups", group, "period");
  item["onclick"] = Messages_List;
  
  items[group]    = item;
 }
 
 var header = UI_Header("classes", items, {selectfirst:false, css:"color-noted", template:"big"});
 UI_Header_Set(header, "unread", true);

 UI_Element_Find(module, "module-header").appendChild(header);
}




async function Messages_OnUnload()
{
}





// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          M O R E                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Messages_List(item)
{
 UI_Element_Find("message-display").style.visibility = "hidden";
 
 // LOAD OR RETRIEVE MESSAGES
 if(item)
 {
  var period   = item["period"];
 
  switch(period) 
  {
   case "unread":
	 var range  = {from:undefined, to:undefined};
	 var unread = true;
   break;
   
   default:
	 var range  = Date_Range(period);
	 var unread = false;
   break;
  }
 
  var messages = await Core_Api("Messages_List", {date_from:range["from"], date_to:range["to"], options:{unread, users:true}});
  Core_State_Set("messages", "data",    messages);
  Core_State_Set("messages", "section", item);
 }
 else
 {
  var messages = Core_State_Get("messages", "data", messages);
 }
 
 
 
 // NO MESSAGES?
 if(messages.length == 0)
 {  
  Core_State_Set("messages", "list", false);
 
  var none            = UI_Element_Create("messages/message-none");
   
  var container       = UI_Element_Find("messages-list");
  container.innerHTML = "";
  container.appendChild(none);
 
  return;
 }
  
  
  
 // LIST MESSAGES 
 var list = UI_List_Items(messages, ["style-outlined-accented", "outline-inner"], Messages_Message_Open, {style:"vertical", overflow:true},
 function(message)
 {  
  console.log(message);
  
  // SENDER
  var sender = [Safe_Get(message, ["sender", "firstname"], ""), Safe_Get(message, ["sender", "lastname"], "")].join("");
  
  // SUBJECT
  var subject = Safe_Get(message, "subject", "");
  
  
  // CREATE ITEM
  var item = UI_Element_Create("messages/message-item", {sender, subject});
  Document_Element_SetData(item, "message", message["id"]);
  
  // SENDER PICTURE
  var picture = UI_Element_Find(item, "picture");
  
  if(message["sender_id"])
  {
   User_Picture_Load(picture, message["sender_id"]);
  }
  else
  {
  }
  
  // READ/UNREAD
  if(message["date_read"]) 
  {
   Document_CSS_SetClass(item, "style-translucent-medium");
  }
  
  
  // ACTIONS
  var actions = UI_Element_Find(item, "actions");
  
  
  // DELETE
  var element = UI_Element_Create("messages/icon", {icon:"trash-can"});
  Document_Element_SetData(element, "message", message["id"]);
  element.onclick = Messages_Message_Delete;
  actions.appendChild(element);
  
  // SET READ/UNREAD
  if(message["date_read"]) 
  {
   var icon = "envelope-open";
  }
  else
  {
   var icon = "envelope";
  }
  

  return item;
 });
 
 Core_State_Set("messages", "list", list);
 
 
 // DISPLAY LIST
 var container       = UI_Element_Find("messages-list");
 container.innerHTML = "";
 container.appendChild(list);
}




async function Messages_Message_Open(element)
{
 var id      = Document_Element_GetData(element, "message");
 var message = await Core_Api("Messages_Read", {id});
 
 
 // DISPLAY
 var display = UI_Element_Find("message-display");
 Messages_Message_Display(message, display);
 
 display.style.visibility = "visible";
 

 // SET MESSAGE AS READ 
 await Core_Api("Messages_Set_Read", {id, read:true});
}




function Messages_Message_Display(message, container)
{
 // SUBJECT
 var text = message["subject"]; 
 UI_Element_Find(container, "message-subject").innerHTML = text; 
  
 // TEXT
 var text = message["text"]; 
 UI_Element_Find(container, "message-text").innerHTML = text;
}




async function Messages_Message_Delete(event)
{
 var element = event.currentTarget;
 var id      = Document_Element_GetData(element, "message");
 
 // CONFIRM
 var title    = UI_Language_String("messages/popups", "delete title"); 
 var content  = UI_Language_String("messages/popups", "delete text"); 
 var picture  = Resources_URL("images/cover-alert.jpg");
 
 var confirm = await UI_Popup_Confirm(title, content, picture);
 if(!confirm) return;
 
 
 //DELETE
 await Core_Api("Messages_Delete", {id});
 UI_Element_Find("message-display").style.visibility = "hidden";
 
 
 // REFRESH LIST
 var section = Core_State_Get("messages", "section");
 await Messages_List(section);
}




async function Messages_Message_Popup(id)
{
 // LOAD MESSAGE
 var message = await Core_Api("Messages_Read", {id});
 
 // ENCAPSULATE
 var content = UI_Element_Create("messages/popup-content");
 Messages_Message_Display(message, content);
 
 // DISPLAY POPUP
 await UI_Popup_Intermission(false, content, false, 5);
 
 // SET MESSAGE AS READ 
 await Core_Api("Messages_Set_Read", {id, read:true});
}




async function Messages_Pending_Popups()
{
 var pending = await Core_Api("Messages_List", {options:{type:"popup", unread:true}});
 
 for(var message of pending)
 {
  await Messages_Message_Popup(message["id"]);
 }
}



async function Messages_Popup_SendMultiple(ids, options = {})
{
 var users = [];
 
 // COLLECT TEMPLATES
 var templates = await Core_Api("Core_Files_PartnerTemplates", {type:"messages"});
  
 // CREATE POPUP CONTENT
 var content = UI_Element_Create("messages/popup-sendmultiple", {}, {language:"messages/popups"});
 
 
 // USERS SPECIFIED
 if(Object_Is_Array(ids))
 {
  // READ USERS
  users = await Core_Api("Users_Read", {ids, fields:"id,firstname,lastname", options:{order:"firstname,lastname", array:true}});
 }
 else
 // USERS LOADED DYNAMICALLY BY QUERY
 {
  // ASSUME IDS IS A STANDARD QUERY NAME
  var name = ids; 
  users    = await Core_Api("Queries_Query", {name, fields:["id", "name", "lastname"]});
 }
 
 
 // DISPLAY USERS
 for(var user of users) 
 {
  user["text"]  = [user["firstname"], user["lastname"]].join(" ");
  user["value"] = "checked";
 }
 
 var list = UI_List_Checks(users, "tight"); 
 UI_Element_Find(content, "users").appendChild(list);

 
 // FILL TYPES SELECT
 var select = UI_Element_Find(content, "types");
 UI_Select_FromDatapage(select, "messages/types");
 select.value = "message";
 
 
 // FILL TEMPLATE SELECT
 var select = UI_Element_Find(content, "templates");
 Document_Select_AddOption(select, "", "");
 for(var template of templates) Document_Select_AddOption(select, template, template);
 
 select.onchange = 
 async function(event)
 {
  var element  = event.currentTarget;
  var template = element.value; 
  var html     = await Core_Api("Messages_Template", {template, data:options["data"] || {}});
  
  UI_Element_Find(content, "preview").innerHTML = html;
 }
 
 var button_send = 
 { 
  text   : UI_Language_String("messages/popups", "button send"), 
  onclick: 
  async function()
  {
   var users = [];
   var items = Document_Element_GetObject(list, "items");
   for(var item of items) if(item["value"]) users.push(item["id"]);
    
   
   // CONFIRM  
   var title    = UI_Language_String("messages/popups", "messages send title"); 
   var text     = UI_Language_String("messages/popups", "messages send text", {count:users.length}); 
   var picture  = Resources_URL("images/cover-alert.jpg");
   var confirm  = await UI_Popup_Confirm(title, text, picture);
   
   if(!confirm) return;
   
   
   // SEND
   var sender_id       = User_Id();
   var subject         = UI_Element_Find(content, "subject").value;
   var type            = UI_Element_Find(content, "types").value;
   var template        = UI_Element_Find(content, "templates").value;
   var date_expiration = Date_From_Input(UI_Element_Find(content, "expiration").value);
   if(!date_expiration) date_expiration = false;
   
   if(options["fields"]) var fields = options["fields"]; else var fields = false;
     
   await Core_Api("Messages_Send_Multiple", {sender_id, users, subject, options:{template, date_expiration, type, fields}});
   
   
   // CLOSE
   UI_Popup_Close(popup);
  }
 }
 
 // POPUP
 var popup = await UI_Popup_Create({content}, [button_send], "intermission-content", {open:true, escape:true});
}