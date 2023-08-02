// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                        U T I L S                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

var utils = {};








// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                     O B J E C T S                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Object_Copy(obj)
{
 var copy = structuredClone(obj);
 return copy;
}



function Object_From_String(string, separator = ";", assigner = ":")
{
 if(typeof(string) != "string") return {};
 
 var obj = {};
    
 var tokens = string.split(separator);
 for(token of tokens)
 {
  token     = token.trim();
  var parts = token.split(assigner);
  
  if(parts.length > 0)
  {
   var field  = parts[0].trim();
  
   if(parts.length > 1) var value = parts[1].trim(); else value = undefined;
  
   obj[field] = value;
  }
 }
 
 return obj;
}




function Object_From_Paths(array, separator = "/")
{
 var obj = {};
 
 for(var string of array)
 {
  var item = string.split(separator);
  
  Safe_Set(obj, item, {});
 }
 
 return obj;
}





function Object_From_Objects(array, field)
{
 var obj = {};
 
 for(var item of array)
 {
  var id  = item[field];
  obj[id] = item;
 }
 
 return obj;
}






function Object_To_String(obj, separator = ";", assigner = ":")
{
 var tokens = [];
 
 for(var key in obj)
 {
  var token = key + assigner + " " + obj[key];
  
  tokens.push(token);
 }
 
 var string = tokens.join(separator);
 
 return string;
}






function Object_To_Pairs(source, field)
{
 var dest = {};
 
 for(var id in source)
 {
  dest[id] = source[id][field];
 }
 
 return dest;
}







function Object_To_Array(obj, mapkey)
{
 var array = [];
 var keys  = Object.keys(obj);
 
 for(var key of keys) 
 {
  var item = obj[key];
  array.push(item);
  
  if(mapkey) item[mapkey] = key;
 }
 
 return array;
}








function Object_Fields_MaxId(obj, tag)
{
 var subset = Object_Subset(obj, tag);
 var fields = Object.keys(subset);

 var max = 0;
 for(var field of fields) 
 {
  var id = parseInt(field.replace(tag, "").trim());
  
  if(id > max) max = id;
 }
 
 return id;
}





function Object_Fields_BrandSelf(obj, brand)
{
 var keys = Object.keys(obj);
 
 for(var key of keys) 
 {
  if(typeof obj[key] == "object" || typeof obj[key] == "array")
  {
   obj[key][brand] = key
  }
 }
}





function Object_Fields_Brand(obj, field, value)
{
 var keys = Object.keys(obj);
 
 for(var key of keys) 
 {
  if(typeof obj[key] == "object" || typeof obj[key] == "array")
  {
   obj[key][field] = value;
  }
 }
}





function Object_Values_Average(obj)
{
 var values = Object.values(obj);
 if(values.length == 0) return undefined;
 
 var sum = values.reduce((a, b) => parseInt(a) + parseInt(b), 0);
 var avg = (sum / values.length) || 0;
 
 return avg;
}




function Object_Catalog_ByNumericValue(obj, field, map = {})
{
 var catalog = {};
 
 for(var id in obj)
 {
  var item  = obj[id];
  var value = item[field];
  
  for(var key in map)
  {
   var upto = map[key];
  
   if((value <= upto) || (upto === undefined)) 
   {
	Safe_Push(catalog, key, item);
	break;
   }
   
  }
 }
 
 return catalog;
}






function Object_Map(obj, map, parent = false)
{ 
 if(!map) var map = [];
 
 var keys = Object.keys(obj);
 
 for(var key of keys)
 {
  var item         = {};
  item["key"]      = key;
  item["source"]   = obj[key];
  item["count"]    = 1;
  item["parent"]   = parent;
  item["children"] = [];
  
  if(parent) parent["children"].push(item);
  
  
  Object_Map(obj[key], map, item);
  
  var depth   = 0;
  var pointer = item["parent"];
  
  while(pointer)
  {
   pointer["count"]++;
   pointer = pointer["parent"];
   
   depth ++;
  }
  
  if(!map[depth]) map[depth] = [];
  
  map[depth].push(item);
 }
  
 return map;
}



function Object_Subset(obj, tag, mode = "starts-with")
{
 var sub  = {};
 var keys = Object.keys(obj);
 
 switch(mode)
 {
  case "starts-with":
	for(var key of keys) 
	{
     if(key.toLowerCase().startsWith(tag.toLowerCase()))
	 {
	  sub[key] = obj[key];
	 }
	}
  break;
  
  case "starts-without":
	for(var key of keys) 
	{
     if(!key.toLowerCase().startsWith(tag.toLowerCase()))
	 {
	  sub[key] = obj[key];
	 }
	}
  break;
  
  case "collect":
  {
	for(var key of keys)
	{
     if(tag.includes(key))
	 {
	  sub[key] = obj[key];
	 }
	}
  }
 }
 
 return sub;
}





function Object_Purge(obj, tag)
{
 var fields = Object.keys(Object_Subset(obj, tag));
 
 for(var field of fields) delete obj[field];
}





function Object_Is_Array(obj)
{
 return (typeof obj == "object") && Array.isArray(obj);
}




function Object_Valid(obj)
{
 return (typeof obj == "object") && (Object.keys(obj).length > 0);
}








// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      A R R A Y S                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Array_In(item, array)
{
 return array.includes(item);
}




function Array_PushUnique(array, item)
{
 if(!array.includes(item)) 
 {
  array.push(item);
  return true;
 }
 
 return false;
}




function Array_To_Object(array)
{
 var obj  = {};
 var keys = Object.keys(array);
 
 for(var key of keys)
 {
  obj[key] = array[key];
 }
 
 return obj;
}



function Array_From_String(string, separator = ",")
{
 var arr = [];
  
 var tokens = string.split(separator);
 for(token of tokens)
 {
  var value = token.trim();
  arr.push(value);
 }
 
 return arr;
}



function Array_From_Fields(array, field)
{
 var list = [];
 
 for(var item of array) list.push(item[field]);
	 
 return list;
}





function Array_Element_DeleteAt(array, index)
{
 array.splice(index, 1);
 return index;
}




function Array_Element_Delete(array, element)
{
 var index = array.indexOf(element);
 if(index == -1) return;
 
 array.splice(index, 1);
 return index;
}



function Array_Element_Insert(array, index, element)
{
 array.splice(index, 0, element);
}




function Array_Element_DeleteAll(array, element)
{
 var indices = [];
 
 while(array.includes(element)) 
 {
  var index = Array_Element_Delete(array, element);
  indices.push(index);
 }
 
 return indices;
}





function Array_Elements_Random(array)
{
 return array[Numbers_Random(0, array.length - 1)];
}




function Array_Items_Sort(array, field)
{
 array.sort(
 function(a, b)
 {
  if(a[field] > b[field]) return 1;
  else
  if(a[field] < b[field]) return -1;
  else
  return 0;
 });
}




function Array_Organize_ByField(array, field)
{
 var catalog = {};
 
 for(var item of array)
 {
  var key = item[field];
  
  catalog[key] = item;
 }
 
 return catalog;
}



function Array_Catalog_ByField(array, field)
{
 var catalog = {};
 
 for(var item of array)
 {
  var key = item[field];
  
  if(!catalog[key]) catalog[key] = [];
  catalog[key].push(item);
 }
 
 return catalog;
}




function Array_Catalog_Counts(array)
{
 var catalog = {};
 
 for(var item of array)
 {
  if(typeof catalog[item] == "undefined") 
  {
   catalog[item] = 1;
  }
  else
  {
   catalog[item]++;
  }
 }
 
 return catalog;
}




function Array_Integrate_AddFromObject(array, object, id_field)
{
 for(var item of array)
 {
  var id   = item[id_field];
  var data = object[id];
  
  if(typeof data != "undefined")
  {
   item.assign(data);
  }
 }
}





function Array_Empty(array)
{
 return Object_Is_Array(array) && (array.length == 0);
}




function Array_Valid(array)
{
 return Object_Is_Array(array) && (array.length > 0);
}







// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      S T R I N G S                                             //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function String_Unicode_Length(string)
{
 var segmenter = new Intl.Segmenter(); 
 var segments  = segmenter.segment(string);
 
 return [...segments].length;
}





function String_Filter_AllowDigits(string, allowspaces)
{
 if(allowspaces) 
 {
  return string.replace(/[^0-9 ]/gi,'');
 }
 else 
 {	 
  return string.replace(/[^0-9]/gi,'');
 }
}






function String_Filter_AllowAlphanum(string, allowspaces)
{
 if(allowspaces) 
 {
  return string.replace(/[^a-z0-9 ]/gi,'');
 }
 else 
 {	 
  return string.replace(/[^a-z0-9]/gi,'');
 }
}




function String_Filter_AllowAlpha(string, allowspaces)
{
 if(allowspaces)
 {
  return string.replace(/[^a-zA-Z ]/g,"");
 }
 else
 {
  return string.replace(/[^a-zA-Z]/g,"");
 }
}




function String_Split(string, separators)
{
 // ESCAPE SEPARATORS
 var escaped = [];
 for(var separator of separators) escaped.push("\\" + separator); 
  
 // BUILD REGEX
 var regex = new RegExp("(?:" + escaped.join("|") + ")+"); 
 
 // SPLIT
 return string.split(regex)
}




function String_Capitalize_Initial(string) 
{
 return string.charAt(0).toUpperCase() + string.slice(1);
}





function String_Capitalize_Camel(string, separator = "-", joiner = "")
{
 var parts = string.split(separator);
 
 for(var i in parts) parts[i] = String_Capitalize_Initial(parts[i]);
 
 return parts.join(joiner);
}



function String_Lowercase_Initial(string) 
{
 return string.charAt(0).toLowerCase() + string.slice(1);
}







function String_Variables_Set(string, variables = {}, delimiter = "$")
{	
 var varnames = Object.keys(variables);
 
 for(var i in varnames)
 {
  var name  = varnames[i];
  var value = variables[name];
  
  string = string.replaceAll(delimiter + name + delimiter, value);
 }
 
 return string;
}






function String_Extract_TagContent(string, delimiter_a = "{", delimiter_b = "}")
{
 var regex   = new RegExp(delimiter_a + "(.*?)" + delimiter_b, "g");
 var matches = string.matchAll(regex);
 var content = Array.from(matches, x => x[1]);
 
 return content;
}




function String_Extract_TagBlocks(string, delimiter_a = "{", delimiter_b = "}")
{
 var blocks = [];

 var tags = String_Extract_TagContent(string, delimiter_a, delimiter_b);

 var c = 0;
 for(var tag of tags)
 {  
  // FIND TAG AND EMPTY IT
  var search = delimiter_a + tag + delimiter_b;
  var i      = string.indexOf(search); 
  string     = string.replace(search, " ".repeat(search.length));
  
  // PRE-TAG CONTENT
  var text = string.substring(c, i);
  if(text.length > 0)
  {
   var block        = {};
   block["type"]    = "text";
   block["content"] = text;
   blocks.push(block);
  }

  // TAG CONTENT
  var block        = {};
  block["type"]    = "tag";
  block["content"] = tag;
  blocks.push(block);
  
  // MOVE ON
  c = i + search.length;
 }

 // REMAINDER
 var text = string.substring(c, string.length);
 if(text.length > 0)
 { 
  var block        = {};
  block["type"]    = "text";
  block["content"] = text;
  blocks.push(block);
 }

 return blocks;
}




function String_HTML_SegmentTag(html, delimiter_a = "<", delimiter_b = ">")
{
 var parts = {};
 
 var a = html.search(delimiter_a);
 if(a == -1) return parts;
 
 var b = html.substr(a).search(" ");
 if(b == -1) return parts;
 
 parts["head"] = html.substr(0, a + b);  
 html = html.replace(parts["head"], "");
 
 var a = html.search(delimiter_b);
 if(a == -1) return parts;
 parts["tail"] = html.substr(a);
 
 html = html.replace(parts["tail"], "");
 
 parts["content"] = html;
 
 return parts;
}




function String_Parse_Ini(data)
{
 var regex = 
 {
  section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
  param:   /^\s*([^=]+?)\s*=\s*(.*?)\s*$/,
  comment: /^\s*;.*$/
 };
     
 var value   = {};
 var lines   = data.split(/[\r\n]+/);
 var section = null;
 
 lines.forEach(
 function(line)
 {
  if(regex.comment.test(line))
  {
   return;
  }
  else 
  if(regex.param.test(line))
  {
   var match = line.match(regex.param);
   if(section)
   {
    value[section][match[1]] = match[2].replaceAll('"', '');
   }
   else
   {
    value[match[1]] = match[2].replaceAll('"', '');;
   }
  }
  else 
  if(regex.section.test(line))
  {
   var match       = line.match(regex.section);
   value[match[1]] = {};
   section         = match[1].replaceAll('"', '');;
  }
  else if(line.length == 0 && section)
  {
   section = null;
  };
 });
 
 return value;
}
	




function String_Simplify(string)
{
 if(!string) return "";
 
 return String(string).trim().toLowerCase();
}




function String_Is_Number(string)
{
 return !isNaN(string);
}





function String_Copycount_Get(string, delimiter_a = "(", delimiter_b = ")")
{
 var a = string.lastIndexOf(delimiter_a);
 var b = string.lastIndexOf(delimiter_b);
 
 if(b > a)
 {
  var count = string.substr(a + 1, b - a - 1);
  
  if(String_Is_Number(count)) return parseInt(count);
 }
}




function String_Copycount_Set(string, count, delimiter_a = "(", delimiter_b = ")")
{
 var current = String_Copycount_Get(string, delimiter_a, delimiter_b);
 if(current)
 { 
  var a    = string.lastIndexOf(delimiter_a);
  var b    = string.lastIndexOf(delimiter_b); 
  
  var head = string.substr(0, a);
  var tail = string.substr(b + 1, string.length - b);
  
  return head + delimiter_a + count + delimiter_b + tail;
 }
 else
 {
  return string + " " + delimiter_a + count + delimiter_b; 
 }
}



function String_Copycount_Next(string, delimiter_a = "(", delimiter_b = ")")
{
 var current = String_Copycount_Get(string, delimiter_a, delimiter_b);
 if(!current) current = 1; else current = current + 1;
 
 return String_Copycount_Set(string, current, delimiter_a, delimiter_b);
}





function String_Numtemplate_Info(string, digit_symbol = "N")
{
 var info   = string.split(" ");
 var digits = info[info.length - 1] || "";
 
 if(digits.includes(digit_symbol))
 {
  var header = info[0];
  digits     = digits.trim().length;
 }
 else
 {
  var header = string.trim();
  digits     = 0;
 }
 
 return {header:header, digits:digits};
}




function String_Numtemplate_Next(template, list)
{
 var max = 0;
 
 for(var item of list)
 {
  if(item.startsWith(template["header"]))
  {
   var parts = item.split(" ");
   var count = parseInt(parts[parts.length - 1]);
   
   if(count > max) max = count;
  }	  
 }
 
 max = max + 1;
 
 return template["header"] + " " + String(max).padStart(template["digits"], "0");
}




function String_Numtemplate_Comply(string, template)
{
 if(!string) return false;
 
 if(!string.startsWith(template["header"])) return false;

 var parts  = string.split(" ");
 var digits = String_Filter_AllowDigits(parts[parts.length -1]).trim();
 if(digits.length != template["digits"]) return false;
 
 return true;
}



function String_Numtemplate_Derive(string, digit_symbol = "N")
{
 if(!string) return "";
 
 var parts  = string.split(" ");
 var digits = String_Filter_AllowDigits(parts[parts.length -1]).trim();
 if(digits.length == 0) return "";
 
 return parts[0] + " " + digit_symbol.repeat(digits.length);
}






function String_Speak_Time(string, letter = 150, pause = 250)
{
 var time  = 0;
 var words = string.split(" ");
 
 for(var word of words)
 {
  var l     = word.trim().length;
  if(l<2) l = 2; 
   
  time = time + l * letter;
  time = time + pause;
 }
}





function String_Analysis_Categorize(sentence, terms = [])
{
 var analyzed = [sentence];
 
 var validate = 
 function(text, from, to)
 {  
  var invalid =  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
 
  // VALIDATE LEFT BOUNDARY
  if(from != 0)
  {
   if(invalid.includes(text[from - 1])) return false;
  }
  
  // VALIDATE RIGHT BOUNDARY
  if(to != text.length - 1)
  {
   if(invalid.includes(text[to + 1])) return false;
  }
  
  return true;
 }
 
 do
 {
  var found = false;

  for(var i in analyzed) if(typeof analyzed[i] == "string")
  {
   var text  = analyzed[i] || "";
   
   // CHECK BLOCK AGAINST ALL TERMS
   for(var term of terms)
   {
	var index = text.toLowerCase().indexOf(term);
	
    if(index != -1 && validate(text, index, index + term.length - 1))
    {     
     var head = text.substring(0, index);
	 var core = text.substring(index, index + term.length); 
	 var tail = text.substring(index + term.length);
	 
	 Array_Element_DeleteAt(analyzed, i);
	 
	 if(tail.trim()) Array_Element_Insert(analyzed, i, tail);
	 Array_Element_Insert(analyzed, i, {type:"term", text:core});
	 if(head.trim()) Array_Element_Insert(analyzed, i, head);
	 
	 found = true;
	 break;
    }
   }
   
  }
  
 } while(found);
 
 
 // NOW CONVERT THE LEFTOVER STRINGS INTO OBJECTS
 do
 {  
  var found = false;
  
  for(var i in analyzed) if(typeof analyzed[i] == "string")
  {
   var text   = analyzed[i];
   Array_Element_DeleteAt(analyzed, i); 

   var tokens = String_Split(text, [" "]);
   tokens.reverse(); 
   for(var token of tokens)
   {
    var block = {type:"text", text:token}
	Array_Element_Insert(analyzed, i, block);
   }
   
   found = true;
   break;
  }
 
 } while(found);
 
 
 return analyzed;
}




function String_Analysis_StructuredMatch(target, guess, threshold = 1)
{
 if(typeof target == "string") var target = String_Analysis_Categorize(target);
 if(typeof guess  == "string") var guess  = String_Analysis_Categorize(guess);
 
 // RESET BLOCKS
 for(var block of guess)  block["used"]  = false;
 for(var block of target) block["match"] = false;
	 
 // SCAN
 for(var target_block of target)
 {
  var target_text = String_Filter_AllowAlphanum(target_block["text"]).trim().toLowerCase();

  for(var guess_block of guess)
  if(!guess_block["used"])
  {
   var guess_text = String_Filter_AllowAlphanum(guess_block["text"]).trim().toLowerCase();
  
   var similarity = 1 - String_Analysis_Distance(guess_text, target_text);
   
   // FOUND MATCH
   if(similarity >= threshold)
   {
	target_block["match"] = similarity;
	guess_block["used"]   = true;
	
	break;
   }
  }
  
 }

 return target; 
}





function String_Analysis_Distance(a, b, options = {})
{
 if(options["alphanum"])
 {
  a = String_Filter_AllowAlphanum(a, true);
  b = String_Filter_AllowAlphanum(b, true);
 }
	
	
 function _min(d0, d1, d2, bx, ay)
 {
  return d0 < d1 || d2 < d1 ? d0 > d2 ? d2 + 1 : d0 + 1 : bx === ay ? d1 : d1 + 1;
 }

 
 if(a === b) 
 {
  return 0;
 }

 if(a.length > b.length) 
 {
  var tmp = a;
  a = b;
  b = tmp;
 }

 var la  = a.length;
 var lb  = b.length;
 var max = Math.max(la, lb);  


 while(la > 0 && (a.charCodeAt(la - 1) === b.charCodeAt(lb - 1))) 
 {
  la--;
  lb--;
 }

 var offset = 0;

 while(offset < la && (a.charCodeAt(offset) === b.charCodeAt(offset))) 
 {
  offset++;
 }

 la -= offset;
 lb -= offset;

 if(la === 0 || lb < 3) 
 {
  return lb / max;
 }

 var x = 0, y, d0, d1, d2, d3, dd, dy, ay, bx0, bx1, bx2, bx3
 var vector = [];

 for(y = 0; y < la; y++) 
 {
  vector.push(y + 1);
  vector.push(a.charCodeAt(offset + y));
 }

 var len = vector.length - 1;

 for(; x < lb - 3;) 
 {
  bx0 = b.charCodeAt(offset + (d0 = x));
  bx1 = b.charCodeAt(offset + (d1 = x + 1));
  bx2 = b.charCodeAt(offset + (d2 = x + 2));
  bx3 = b.charCodeAt(offset + (d3 = x + 3));
  dd = (x += 4);
   
  for(y = 0; y < len; y += 2) 
  {
   dy = vector[y];
   ay = vector[y + 1];
   d0 = _min(dy, d0, d1, bx0, ay);
   d1 = _min(d0, d1, d2, bx1, ay);
   d2 = _min(d1, d2, d3, bx2, ay);
   dd = _min(d2, d3, dd, bx3, ay);
   vector[y] = dd;
   d3 = d2;
   d2 = d1;
   d1 = d0;
   d0 = dy;
  }
 }

 for(; x < lb;) 
 {
  bx0 = b.charCodeAt(offset + (d0 = x));
  dd  = ++x;
  for(y = 0; y < len; y += 2) 
  {
   dy = vector[y];
   vector[y] = dd = _min(dy, d0, dd, bx0, vector[y + 1]);
   d0 = dy;
  }
 }


 return dd / max;
}







// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         B L O B S                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Blob_ToBase64(blob)
{
 var promise = new Promise((resolve, reject) =>
 {
  var reader = new FileReader();
  
  reader.onloadend = 
  function() 
  {		  
   var data = reader.result.split("base64,")[1];						  
   
   resolve(data);
  }			  
 
  reader.readAsDataURL(blob);
 });

 return promise;
}












// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                    F U N C T I O N S                                           //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Function_Debounce(func, wait)
{
 let timeout;

 return function executedFunction(...args) 
 {
  const later = 
  function()
  {
   clearTimeout(timeout);

   func(...args);
  }

  clearTimeout(timeout);

  timeout = setTimeout(later, wait);
 }
}





function Function_Throttle(func, interval)
{
 func["throttle-time"] = interval;
 
 if(!func["throttle-next"] || Date.now() > func["throttle-next"])
 {
  func["throttle-next"] = Date.now() + func["throttle-time"];
  func();
 }
} 




function Function_ThrottleEvent(callback, delay)
{
 let throttleTimeout = null;
 let storedEvent     = null;

 function throttledEventHandler(event)
 {
  storedEvent = event;

  const shouldHandleEvent = !throttleTimeout;

  if(shouldHandleEvent) 
  {
   callback(storedEvent);

   storedEvent = null;

   throttleTimeout = setTimeout(
   function()
   {
    throttleTimeout = null;

    if(storedEvent) 
	{
     throttledEventHandler(storedEvent);
    }
   }, delay);
  }
 }

 return throttledEventHandler;
}






async function Function_Worker(f)
{ 
 var params = []; 
 for(var i = 1; i < arguments.length; i++) params.push(arguments[i]);

 var promise = new Promise((resolve, reject) =>
 {
  // GET FUNCTION CODE AS STRING
  var text = f.toString(); 

  // EXTRACT ARGUMENTS
  var args = text.slice(text.indexOf("(") + 1, text.indexOf(")")); 
  args     = args.split(",");
  for(arg of args) arg = arg.trim();

  // ALTER FUNCTION CODE:
  
  // DECLARE ARGUMENTS AS VARIABLES
  var body  = "onmessage = function(){";
  body      = body +  text.slice(text.indexOf("{") + 1, text.lastIndexOf("}")); 
  for(var i = 0, c = params.length; i<c; i++) body = "var " + args[i] + " = " + JSON.stringify(params[i]) + ";" + body;
  
  // REPLACE RETURN STATEMENTS WITH THREAD POSTMESSAGE AND TERMINATION
  body      = body.replace(/return\s+([^;]*);/g, 'postMessage($1)');
  body      = body + "}";
  
  // CREATE WORKER FROM CONSTRUCTED CODE
  var code   = URL.createObjectURL(new Blob([body], {type:"text/javascript"}));
  var thread = new Worker(code);

  thread.onmessage =
  function(result)
  {
   resolve(result.data);
 
   thread.terminate();
  }
  
  // CALL WORKER
  thread.postMessage("");
  
 });

 return promise;
}





function Functions_List(filter, categorize, separator = "_")
{
 var functions = {};
 
 for(var id in window)
 {
  var f = window[id];
  
  if(typeof f == "function")
  {
   if(!f.toString().includes("native code"))
   {
	if(!filter || id.startsWith(filter))
	{
	 functions[id] = f;
	}
   }
  }
 }
 
 return functions;
}






// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       C L I E N T                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Client_Language_Get()
{
 var language = navigator.language.split("-");
 
 return language[0] || "en";
}





function Client_Location_Parameter(parameter)
{
 var url   = window.location.href;
 var value = URL_Parameter_Get(parameter, url);
 
 return value;
}



function Client_Location_Current()
{
 return document.location.origin + document.location.pathname;
}



function Client_Location_Clear()
{
 history.replaceState({}, "", Client_Location_Current());
}




async function Client_Wait(seconds)
{
 var time    = Math.floor(seconds  * 1000);

 var promise = new Promise((resolve, reject) =>
 {
  var wait = 
  setTimeout(
  function()
  {
   clearTimeout(wait);
   
   resolve();	  
  }, 
  time);
  
 });
 
 return promise;
}





function Client_Variables_Get()
{
 var variables =
 {
  host : location.origin
 }
 
 return variables;
}





function Client_Variables_Apply(string)
{ 
 var variables = Client_Variables_Get();
 var parsed    = String_Variables_Set(string, variables);
 
 return parsed;
}




async function Client_Screen_Info()
{
 var info          = {};
 info["secondary"] = [];
 
 var details = await getScreenDetails();
 
 for(var screen of details["screens"])
 {
  if(!screen.isPrimary) info["secondary"].push(screen); 
 }
 
 info["primary"] = details.currentScreen;
 
 return info;
}



function Client_Reload()
{
 document.location.reload();
}




async function Client_Picker(type, options = {})
{
 var promise = new Promise((resolve, reject) => 
 {
  var input = document.createElement("input");
  input.type             = type;
  input.style.position   = "absolute";
  input.style.zIndex     = 100;
  input.style.left       = options["left"] || (window.innerWidth  / 2) + "px";
  input.style.top        = options["top"]  || (window.innerHeight / 2) + "px";
  input.style.width      = "0px";
  input.style.height     = "0px";
  input.style.opacity    = 0;
 
  document.body.appendChild(input);

  input.onchange = 
  function(event)
  {
   resolve(input.value);
  } 

  input.onblur = 
  function(event)
  {
   resolve(false);
  }
 
  input.focus(); 
  setTimeout(function(){input.showPicker()}, 125); 
 });
 
 return promise;
}





// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                           S A F E                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

function Safe_Set(object, field, value, setonly)
{
  // NOT AN OBJECT OR ARRAY? RETURN SAFEVALUE
 if(typeof object != "array" && typeof object != "object") return false;
 
 // LIST OF NESTED FIELDS IS A STRING? FIX IT TO ARRAY CONTAINING A SINGLE STRING
 if(typeof field == "string") field = [field];
 	
	
 var pointer = object;
 var level   = "";
 
 for(var i=0, c=field.length; i<c; i++) 
 {
  level = field[i];
 
  if(i == (c-1))
  {
   //if(!setonly || pointer[level] === undefined) 
   //{
	pointer[level] = value;
	return pointer;
   //}
  }
  else
  {
   if(typeof pointer[level] == "undefined") pointer[level] = {};
   pointer = pointer[level]
  }
 }
 
 return true;
}





function Safe_Get(object, field, safevalue)
{
 // NOT AN OBJECT OR ARRAY? RETURN SAFEVALUE
 if(typeof object != "array" && typeof object != "object") return safevalue;


 // LIST OF NESTED FIELDS IS A STRING? FIX IT TO ARRAY CONTAINING A SINGLE STRING
 if(typeof field == "string") field = [field];


 // DEFAULT TO SAFE VALUE
 var value = safevalue;
 
 // RUN
 var check = object;
 var i     = 0;
 var l     = field.length;
 
 while(typeof check[field[i]] != "undefined" && check[field[i]] != null)
 {
  check = check[field[i]];
  
  if(i == (l-1)) value = check; else i = i + 1;
 }
 
 return value;
}




function Safe_Add(object, field, inc)
{
 var value = Safe_Get(object, field);
 
 if(typeof value == "undefined") var value = 0;
 value = parseInt(value) + inc;
 
 Safe_Set(object, field, value);
}




function Safe_Switch(object, field, safedefault = true)
{
 var value = Safe_Get(object, field);
 if(typeof value == "undefined") var value = safedefault; else value = !value;
 
 Safe_Set(object, field, value);
}




function Safe_Delete(object, field)
{ 
 // NOT AN OBJECT OR ARRAY? RETURN SAFEVALUE
 if(typeof object != "array" && typeof object != "object") return false;
 
 // LIST OF NESTED FIELDS IS A STRING? FIX IT TO ARRAY CONTAINING A SINGLE STRING
 if(typeof field == "string") field = [field];

	
 var pointer = object;
 var level   = "";
 
 for(var i=0, c=field.length; i<c; i++) 
 {
  level = field[i];
 
  if(i == (c-1))
  {
   delete pointer[level];
   return true;
  }
  else
  {
   if(typeof pointer[level] == "undefined") pointer[level] = {};
   pointer = pointer[level]
  }
 }
 
 return false;
}





function Safe_Push(object, field, item)
{
 // NOT AN OBJECT OR ARRAY? RETURN SAFEVALUE
 if(typeof object != "array" && typeof object != "object") return false;
 	
 if(!object[field]) object[field] = [];
 object[field].push(item);
 
 return item;
}




/*function Safe_Push(object, field, item)
{
 if(typeof object != "array" && typeof object != "object") return false;
 	
 var pointer = object;
 var level   = "";
 
 for(var i=0, c=field.length; i<c; i++) 
 {
  level = field[i];
 
  if(i == (c-1))
  {
   pointer[level].push(item);
  }
  else
  {
   if(typeof pointer[level] == "undefined") pointer[level] = [];
   pointer = pointer[level]
  }
 }
 
 return true;
}*/






function Safe_JSON(string, saferesult)
{ 
 try
 {
  var result = JSON.parse(string);
 }
 catch
 {
  var result = saferesult;
 }
 
 return result;
}




function Safe_JSON_Field(object, field, safevalue)
{
 var json  = Safe_Get(object, field, "");

 var value = Safe_JSON(json, safevalue);
 
 Safe_Set(object, field, value);
 
 return value;
}
 





function Safe_Function(funcname, safefunc)
{
 if(window[funcname]) return window[funcname]; else return safefunc;
}




function Safe_Length(item)
{
 if(Array.isArray(item))  return item.length;
 
 if(typeof item == "object") return Object.keys(item).length;
 
 return 0; 
}




function Safe_Validate(item)
{
 switch(typeof item)
 {
  case "object":
	if(Array.isArray(item)) return (item.length != 0); else return (Object.keys(item) != 0);
  break;
  
  default:
	return (item != false) && (item != null);
  break;
 }
}







// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                        P A T H S                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Path_Filename(path)
{
 return path.replace(/^.*[\\\/]/, '');
}




function Path_Extension(filename)
{
 var extension = filename.split('.').pop();
 
 if(extension == filename) return ""; else return extension;
}




function Path_Folder(path)
{
 return path.match(/(.*)[\/\\]/)[1]||'';
}




function Path_RemoveExtension(filename)
{
 return filename.substr(0, filename.lastIndexOf('.')) || filename;
}








// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         C O L O R S                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



function Color_Hex_ToRGBA(hex, alpha = 1)
{
 hex   = hex.trim().toLowerCase(); 
 var c = hex.substring(1).split('');
 
 if(c.length== 3)
 {
  c = [c[0], c[0], c[1], c[1], c[2], c[2]];
 }
 
 c= '0x'+c.join('');
 
 var rgba = [(c>>16)&255, (c>>8)&255, c&255];
 
 
 return 'rgba(' + rgba.join(',')+', ' + alpha + ')';
}



function Color_Shade(color, percent) 
{
 if(percent == 0) return color;
	 
 color = color.trim();

 var R = parseInt(color.substring(1,3),16);
 var G = parseInt(color.substring(3,5),16);
 var B = parseInt(color.substring(5,7),16);

 R = parseInt(R * (100 + percent) / 100);
 G = parseInt(G * (100 + percent) / 100);
 B = parseInt(B * (100 + percent) / 100);

 R = (R<255) ? R: 255;  
 G = (G<255) ? G: 255;  
 B = (B<255) ? B: 255;  
 
 var RR = ((R.toString(16).length==1) ? "0" + R.toString(16): R.toString(16));
 var GG = ((G.toString(16).length==1) ? "0" + G.toString(16): G.toString(16));
 var BB = ((B.toString(16).length==1) ? "0" + B.toString(16): B.toString(16));

 return "#" + RR + GG + BB;
}









// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       R E Q U E S T S                                          //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Request_Response(response, type, options = {})
{
 switch(type)
 {
  case "text":
	var  data = await response.text();
  break;
  
  case "json":
	var text = await response.text();
	var data = Safe_JSON(text);
  break;
  
  case "blob":
	var data = await response.blob();
  break;
  
  case "csv":
	
	var text = await response.text();
	
	// SPLIT IN LINES
	var delimiter = options["delimiter"] || ";";	
	var lines     = text.split("\r\n");
	for(var i in lines)
	{
     lines[i] = lines[i].split(delimiter);
	}
	
	// FIRST LINE = FIELDS?
	var fields = options["fields"];
	if(fields && lines.length > 1)
	{
     var data   = [];
	 var fields = lines[0]; console.log(fields);
	 
	 for(var i = 1; i<lines.length; i++)
	 {
	  var obj  = {};
	  var line = lines[i];
	  
      for(var n in fields)
	  {
	   var field = fields[n];
	   var value = line[n];
	   
	   obj[field] = value;
	  }
	  
	  data.push(obj);
	 }	
	}
	
	else
    
	{
	 var data = lines;
	}
	
  break;
 }
 
 return data;
}





async function Request_Load(url, type, options)
{
 var response = await fetch(url);
 var data     = await Request_Response(response, type, options);
 
 return data;
}






async function Request_Post(url, data, type, header)
{
 var config = 
 {
  method: "POST",
  headers: {
		    'Content-Type': 'application/json'
           },
  body:   JSON.stringify(data),
  keepalive:true		   
 }
 
 var response = await fetch(url, config);
 var data     = await Request_Response(response, type);
 
 return data;
}







async function Request_Upload(uploader, onuploadstart, options) 
{ 
 var promise = new Promise((resolve, reject) =>
 {
  if(uploader.indexOf("?") == -1) uploader = uploader + "?";
  
  var input           = document.createElement("input");
  input.type          = "file";
  input.style.display = "none";
  document.body.appendChild(input);
 
  // 1b - WHEN THE USER HAS PICKED A FILE...
  input.addEventListener("change",
  function()
  { 
   console.log("input change");
   
   input.changed = true;
   document.body.removeChild(input);
  
   var file = input.files[0];
  
   if(onuploadstart) onuploadstart();
  
   var reader = new FileReader();
  
   // 2b - WHEN THE FILE HAS BEEN READ FROM LOCAL DEVICE...
   reader.onloadend = 
   function() 
   {
    var data = reader.result;
    if (data.indexOf("base64,") > 0)
    {
     data = data.split("base64,")[1];
    }
   
    // CHECK FILESIZE LIMIT, IF SPECIFIED
    if(options && options["maxsize"] && (data.length > options["maxsize"]))  	  
    {
	 resolve({status:"error", reason:"too big"});
    }
    else
    // FILESIZE IS OK, MOVE ON	    
    {
     var request = new XMLHttpRequest();
    
     request.open("POST", uploader + "&srcfilename=" + Path_Filename(reader.source.name), true);
     request.setRequestHeader("Content-Type", `${file.type}`);
  
     // 3b - WHEN DATA HAS BEEN RECEIVED BY THE SERVER...
     request.onreadystatechange =
     function()
     { 
	  if(request.readyState==4 && request.status==200)
      {
	   var response = request.responseText;	
    
	   resolve({status:"ok", path:response});
      }		 
     }

     // 3a - SEND DATA TO THE SERVER
     request.send(data); 
    }
   
   }
   
   // 2a - READ FILE FROM LOCAL DEVICE 
   reader.source = file;
   reader.readAsDataURL(file);
  },
  false);
 
  // 1a - FIRE UP FILE SELECTION DIALOG
  window.addEventListener("focus",
  function()
  {
   setTimeout(
   function()
   {
    if(!input.changed) resolve({status:"cancelled"});  
   }, 250);
  }, 
  {once:true});

  input.click();
 });
 
 return promise;
}




async function Request_Download(url)
{
 var name = Path_Filename(url);
 var blob = await Request_Load(url, "blob");

 await Storage_Blob_Download(blob, name); 
}








// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      S T O R A G E                                             //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



async function Storage_File_Read(source, options = {})
{
 var promise = new Promise((resolve, reject) =>
 {
  var reader = new FileReader();
  
  reader.onloadend = 
  function() 
  {
   var data = reader.result;
   
   if(!options["whole"])
   {
    if(data.indexOf("base64,") > 0)
    {
     data = data.split("base64,")[1];
    }
   }
   
   resolve(data);  
  }
 
  reader.source = source;
  reader.readAsDataURL(source);
 });
 
 return promise;
}




async function Storage_File_ReadBlob(source, options)
{
 var promise = new Promise((resolve, reject) =>
 {
  var reader = new FileReader();
  
  reader.onloadend = 
  function() 
  {
   var data = reader.result;
   
   resolve(data);  
  }
 
  reader.source = source;
  reader.readAsBlob(source);
 });
 
 return promise;
}



async function Storage_File_Select(options = {})
{
 var promise = new Promise((resolve, reject) =>
 {
  // SETUP FILE SELECT DIALOG
  var selector           = document.createElement("input");
  selector.type          = "file";
  selector.style.display = "none";
  
  selector.accept        = options["accept"];
  
  
  if(options["multiple"]) selector.multiple = "multiple";
  
 
  // DETECT FILES SELECTED
  selector.addEventListener("change",
  function()
  {  
   selector.changed = true;
   document.body.removeChild(selector);
  
   var selected = selector.files;
  
   resolve(selected);
  }, 
  false);
  
  
  // DETECT IF NO FILES SELECTED
  window.addEventListener("focus",
  function()
  {
   setTimeout(
   function()
   {
    if(!selector.changed) resolve([]);  
   }, 250);
  }, 
  {once:true});
  
 
  // TRIGGER SELECTOR
  document.body.appendChild(selector);
  selector.click();
 });
 
 return promise;
}





async function Storage_File_Upload(filename, data, type, uploader, options)
{
 var promise = new Promise((resolve, reject) =>
 {
  // SETUP REQUEST
  var request = new XMLHttpRequest();
    
  request.open("POST", uploader + "&srcfilename=" + Path_Filename(filename), true);
  request.setRequestHeader("Content-Type", type);
  
  // ON SERVER RESPONSE
  request.onreadystatechange =
  function()
  { 
   if(request.readyState == 4 && request.status == 200)
   {
	var response = request.responseText;	
    
	resolve({status:"ok", path:response});
   } 		 
  }

  // SEND DATA TO THE UPLOADER
  request.send(data); 
 });
 
 return promise;
}






async function Storage_Files_Upload(files, uploader, options = {}, onfileuploaded)
{
 for(var file of files)
 {
  console.log(file);
  
  var filename = Safe_Get(options, ["filename"]) || file["override-name"] || file["name"];
  
  var data     = await Storage_File_Read(file);
  var response = await Storage_File_Upload(filename, data, file["type"], uploader, options);

  if(onfileuploaded) onfileuploaded(filename, data, response);
 }
}





function Storage_Blob_Download(blob, filename)
{
 url = URL.createObjectURL(blob);
 
 var a           = document.createElement("a");
 a.style.display = "none";
 a.href          = url;
 a.download      = filename;
 a.click();
 
 URL.revokeObjectURL(url)
}





function Storage_Data_Download(data, filename, mimetype)
{
 if(typeof(data) == "object") var data = JSON.stringify(data, null, 2);
 
 var blob = new Blob([data], {type:mimetype});
 
 Storage_Blob_Download(blob, filename);
}








// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                           U R L S                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



function URL_Parameter_Get(parameter, url)
{
 if(!url) var url = window.location.href;
 
 var urlobject = new URL(url);
 var value     = urlobject.searchParams.get(parameter);
 
 return value;
}





function URL_Encode(str) 
{
  str = (str + '').toString();

  // Tilde should be allowed unescaped in future versions of PHP (as reflected below), but if you want to reflect current
  // PHP behavior, you would need to add ".replace(/~/g, '%7E');" to the following.
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .
  replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
    .replace(/%20/g, '+');
}





function URL_Decode(str) 
{
 return decodeURIComponent((str + '').replace(/%(?![\da-f]{2})/gi, function () {
        // PHP tolerates poorly formed escape sequences
        return '%25';
    }).replace(/\+/g, '%20'));
}











// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                     G E O M E T R Y                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

function Geometry_Point_InRect(x, y, r) 
{
 return x >= r.left && x < r.right && y >= r.top && y < r.bottom;
}



function Geometry_Rect_Intersect(rect1, rect2)
{
 return !( rect1.top > rect2.bottom || rect1.right < rect2.left || rect1.bottom < rect2.top || rect1.left > rect2.right);
}




function Geometry_Rect_Displacement(rect, corner)
{
 switch(corner)
 {
  case "top":
	var x = rect.width / 2;
    var y = 0;
  break;	
  
  case "center":
	var x = rect.width  / 2;
    var y = rect.height / 2;
  break;	
  
  case "bottom":
	var x = rect.width / 2;
    var y = rect.height;
  break;	
	 
	 
	 
  case "right top":
	var x = rect.width;
    var y = 0;
  break;

  case "right":
	var x = rect.width;
    var y = rect.height / 2;
  break;
  
  case "right bottom":
	var x = rect.width;
    var y = rect.height;
  break;
  
 
  
  case "left top":
	var x = 0;
    var y = 0;
  break;
  
  case "left":
	var x = 0;
    var y = rect.height / 2;
  break
  
  case "left bottom":
	var x = 0;
    var y = rect.height;
  break;
 }
 
 return {left:x, top:y};
}





function Geometry_Rect_Corner(rect, corner)
{
 var displacement = Geometry_Rect_Displacement(rect, corner);
 var x = rect.left + displacement["left"]; 
 var y = rect.top  + displacement["top"];
 
 return {left:x, top:y};
}




function Geometry_Rect_Inside(rect1, rect2)
{
 return ( ((rect2.top <= rect1.top) && (rect1.top <= rect2.bottom)) && ((rect2.top <= rect1.bottom) && (rect1.bottom <= rect2.bottom)) && ((rect2.left <= rect1.left) && (rect1.left <= rect2.right)) && ((rect2.left <= rect1.right) && (rect1.right <= rect2.right)) );
}



function Geometry_Rect_Translate(rect, x, y)
{
 var result = {};
 
 result.left   = rect.left   + x;
 result.right  = rect.right  + x;
 result.width  = rect.width  + x;
 result.top    = rect.top    + y;
 result.bottom = rect.bottom + y;
 result.height = rect.height + y;
 
 return result;
}



function Geometry_Line_Points(x0, y0, x1, y1)
{
 var points = [];
	
 var dx = Math.abs(x1-x0);
 var dy = Math.abs(y1-y0);
 var sx = (x0 < x1) ? 1 : -1;
 var sy = (y0 < y1) ? 1 : -1;
 var err = dx-dy;

 while(true)
 {
  points.push({x:x0, y:y0}); 

  if ((x0==x1) && (y0==y1)) break;
  var e2 = 2*err;
  if (e2 >-dy){ err -= dy; x0  += sx; }
  if (e2 < dx){ err += dx; y0  += sy; }
 }
 
 return points;
}












// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      N U M B E R S                                             //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



function Numbers_Interpolate(x, y, a)
{
 return x * (1 - a) + y * a;
}




function Numbers_PercentageDifference(a, b)
{
 return  100 * Math.abs( ( a - b ) / ( (a + b)/2 ) );
}




function Numbers_PercentageDistance(a, b)
{
 return (b - a) * 100;
}




function Numbers_Random(min, max)
{
 return Math.floor(Math.random() * (max - min)) + min;
}



function Numbers_Between(x, a, b)
{
 return x >= a && x <= b;
}



function Numbers_Within(x, a, b)
{
 return x > a && x < b;
}



function Numbers_Range_Intersect(ra, rb)
{
 return Numbers_Within(ra["from"], rb["from"], rb["to"]) || Numbers_Within(ra["to"],   rb["from"], rb["to"]) || Numbers_Within(rb["from"], ra["from"], ra["to"]) || Numbers_Within(rb["to"], ra["from"], ra["to"]);
}




function Numbers_Is_Even(n)
{
 return (n % 2 == 0);
}



function Numbers_Is_Odd(n)
{
 return (n % 2 != 0);
}




// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                I N T E R P O L A T I O N                                       //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



async function Interpolation_Thread(target, values, time, options = {fps:60}, events)
{
 var promise = new Promise((resolve, reject) =>
 { 
  var interpolator               = {};
  
  interpolator["target"]         = target;
  interpolator["keys"]           = Object.keys(values);
  
  interpolator["start-time"]     = Date.now();
  interpolator["start-values"]   = Object_Subset(target, interpolator["keys"], "collect");
  interpolator["end-values"]     = values;
  
  interpolator["execution-time"] = time;
  interpolator["execution-freq"] = options["fps"];
  
  
  interpolator["thread"]         = setInterval(
  function()
  {
   interpolator["elapsed-time"]  = Date.now() - interpolator["start-time"];
   interpolator["interpolation"] = interpolator["elapsed-time"] / (interpolator["execution-time"] * 1000);
   
   for(var key of interpolator["keys"])
   {
	var a = parseFloat(interpolator["start-values"][key]);
	var b = parseFloat(interpolator["end-values"][key]);
	
    interpolator["target"][key] = Numbers_Interpolate(a, b, interpolator["interpolation"]);
	
	if(events && events["onchange"]) events["onchange"](interpolator);
   }
   
   if(interpolator["interpolation"] >= 1)
   {
	clearInterval(interpolator["thread"]);
	
	resolve();
   }	   
  },
  
  Math.floor(1000/ interpolator["execution-freq"]));
  
  this["interpolator"] = interpolator;
 });
 
 return promise;
}






// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       D A T A S E T S                                          //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Dataset_Compute_CumulativeAverages(dataset, field, scale)
{ 
 var output = [];
 
 var max    = dataset.length * scale;
 var total  = 0;
 for(var item of dataset)
 {
  total     = total + Safe_Get(item, field, 0);
  var score = (total / max) * scale;
  
  output.push(score);
 }
 
 return output;
}