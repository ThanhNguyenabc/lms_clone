// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          D A T A                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//




function Data_Page_Complete(data, config, sections = false)
{
 var page = data;
 
 if(sections)
 {
  for(var section in config) 
  {
   if(!page[section]) page[section] = {};
  }
 }
 
 for(var section in config)
 {
  page[section] = data[section] || config[section];
 
  for(var field in config[section])
  {
   var value = Safe_Get(data, [section, field], undefined);
   if(value === undefined) var value = Safe_Get(config, [section, field]);
   
   Safe_Set(page, [section, field], value);
  }
 }
 
 return page;
}







function Data_Page_Sanitize(data, config, complete = false)
{
	
 // 1. CLEAN UP DATA FROM UNWANTED SECTIONS
 for(var section in data)
 {
  // ANALIZE SECTIONS. SECTIONS THAT ARE ARRAYS OR OBJECTS SHOULD BE SANITIZED.
  // WE SKIP SECTIONS THAT ARE INDIVIDUAL VALUES
  var sanitize_section = (typeof(data[section]) == "object" || typeof(data[section]) == "array");
  
  if(sanitize_section)
  {
   
   if(!Data_Key_Compliant(section, config))
   {
    delete data[section];
   }
   else
   {
	// SECTION VALIDATED. BUT NOW WE SHOULD SANITIZE ITS KEYS
	// REMEMBER WE MUST COMPARE WITH THE TEMPLATE SECTION FOR THAT SECTION, NOT THE SECTION ITSELF
	var section_template = String_Numtemplate_Derive(section) || section;
	
	for(var key in data[section])
	{
     var invalid_key = (typeof(data[section][key]) == "object" || typeof(data[section][key]) == "array");
	 
     if(invalid_key || !Data_Key_Compliant(key, config[section_template]))
	 {
	  delete data[section][key];
	 }
	}
	
   }
   
  }
  
 }
 
 
 // 2. COMPLETE WITH MISSIN STANDARD SECTIONS
 if(complete)
 {
  for(var id in config)
  {
   var info = String_Numtemplate_Info(id);
   if((info["digits"] == 0) && !data[id])
   {
    Data_Section_Add(data, config, id);
   }
  }
 }
 
}







function Data_Page_FromConfig(config = {})
{
 var data = {};

 
 // SCAN CONFIG SECTIONS
 for(var section_id in config)
 {
  var section = config[section_id];
  
  // CHECK IF SECTION IS A TEMPLATE
  var template = section_id.split(" ");
  digits       = template[template.length - 1] || "";
  if(digits.includes("N"))
  {
   template = template[0];
   digits   = digits.trim().length;
   var s_id = template + " " + "0".repeat(digits);
  }
  else
  {
   var s_id = section_id;
  }
  
  // CREATE DATA SECTION
  data[s_id] = {};
  
  // SCAN CONFIG SECTION'S KEYS
  for(var field_id in section)
  {
   // CHECK IF KEY IS A TEMPLATE
   var template = field_id.split(" ");
   digits       = template[template.length - 1] || "";
   if(digits.includes("N"))
   {
    template = template[0];
    digits   = digits.trim().length;
    var f_id = template + " " + "0".repeat(digits);
   }
   else
   {
	var f_id = field_id;
   }
   
   
   // GET DEFAULT VALUE FOR THIS FIELD
   var field = Object_From_String(config[section_id][field_id]);
   var value = field["default"] || "";
   
   
   data[s_id][f_id] = value;
  }
  
 }
 
 return data;
}




function Data_Config_Templates(config, section_id)
{ 
 var templates = {};
 
 // RETURN CONFIG SECTION TEMPLATES
 if(!section_id)
 {
  var keys = Object.keys(config);
 }
 else
 // RETURN SECTION FIELD TEMPLATES
 {
  // WE NEED TO DERIVE A TEMPLATE SECTION FROM THE SECTION ID, IN ORDER TO LOOK FOR TEMPLATE FIELDS IN IT
  var section_template = String_Numtemplate_Derive(section_id) || section_id;
  var section          = config[section_template];
  if(section) var keys = Object.keys(section); else var keys = [];
 }
 
 
 // DETERMINE WHICH KEYS ARE TEMPLATES (STRING WITH LAST PORTION BEING A SEQUENCE OF "N" = IT'S A TEMPLATE)
 for(var key of keys)
 {
  var name = key.split(" ");
  if(name.length > 1 && name[name.length -1].includes("N"))
  {
   var template = {};
   
   template["name"]   = name[0].trim();
   template["digits"] = name[name.length -1].trim().length;
  
   templates[key] = template;
  }
 }	 

 return templates;
}




// NOTE: CALL WITH config[section] IF NEED TO CHECK COMPLIANCY OF A FIELD
function Data_Key_Compliant(id, config, templateonly)
{
 // SCAN ALL KEYS AND SEE IF IT MATCHES ONE
 for(var key in config)
 {
  // IDENTICAL TO ONE OF THE KEYS? THEN IT COMPLIES
  if(id == key && !templateonly) return true;
   
  // MAYBE IT MATCHES A TEMPLATE? THEN IT COMPLIES
  var template = String_Numtemplate_Info(key);
  if(template["digits"] > 0 && String_Numtemplate_Comply(id, template)) return true;
 }
  
 return false;
}





function Data_Section_Add(data, config, templateid)
{
 var template = String_Numtemplate_Info(templateid);
 if(template["digits"] == 0) 
 {
  var id = templateid; 
 }
 else 
 {
  var sections = Object.keys(data);
  var id       = String_Numtemplate_Next(template, sections);
 }
 
 var section = {};
 for(var field in config[templateid])
 {
  var field_config = Object_From_String(config[templateid][field]);
  section[field]   = field_config["default"] || "";
 }
 
 data[id] = section;
 
 return {data:section, id};
}