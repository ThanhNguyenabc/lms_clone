// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          D A T E S                                             //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Date_Now()
{
 var forcetime = Client_Location_Parameter("forcetime");
 if(forcetime) return forcetime;
 
 var now = new Date();

 return Date_From_JS(now); 
}




function Date_To_JS(date)
{
 var year    = date.substr(0,  4);
 var month   = date.substr(4,  2) - 1;
 var day     = date.substr(6,  2);
 var hour    = date.substr(8,  2);
 var minutes = date.substr(10, 2);
 var seconds = date.substr(12, 2);
 
 return new Date(year, month, day, hour, minutes, seconds);
}



function Date_From_Input(date, separator = "-")
{
 if(!date) var date = "";
 
 var date = date.split(separator);
 date     = date.join("");
 
 return date;
}



function Date_To_Input(date, separator = "-")
{
 if(!date) var date = "";
	 
 var year    = String(date.substr(0,  4)).padStart(4, "0");
 var month   = String(date.substr(4,  2)).padStart(2, "0");
 var day     = String(date.substr(6,  2)).padStart(2, "0");
 
 var date    =  [year, month, day].join(separator);
 
 return date;
}




function Date_From_JS(date)
{
 var year    = date.getFullYear(); 
 var month   = date.getMonth() + 1;
 var day     = date.getDate(); 
 var hour    = date.getHours();
 var minutes = date.getMinutes();
 var seconds = date.getSeconds();
 
 return String(year) + String(month).padStart(2, "0") + String(day).padStart(2, "0") + String(hour).padStart(2, "0") + String(minutes).padStart(2, "0") + String(seconds).padStart(2, "0");
}




function Date_Complete(date)
{ 
 // MISSING TIME?
 if(date.length >= 8 && date.length < 14) return date.padEnd(14, 0);
}




function Date_Portion(date, mode, complete)
{
 switch(mode)
 {  
  case "no-seconds":
	var portion = date.substr(0, 12);  
  break;
  
  case "date-only":
	var portion = date.substr(0, 8);
  break;
  
  case "time-only":
	var portion = date.substr(8, 4);  
  break;
  
  case "time-timecode":
	var portion = date.substr(8, 2) + ":" + date.substr(10, 2);
  break;
  
  case "time-seconds":
	var portion = date.substr(8);  
  break;
 }
 
 if(complete) portion = Date_Complete(portion);
 
 return portion;
}





function Date_Get(date, components, separator = "/")
{
 if(typeof components == "string") var components = [components];
 
 var parts = [];
 for(var component of components)
 {
  switch(component)
  {
   case "year":
 	var part = date.substr(0, 4);
   break;
  
   case "month":
	var part = date.substr(4, 2);
   break;
   
   case "day":
	var part = date.substr(6, 2);
   break;
   
   case "hour":
	var part = date.substr(8, 2);
   break;
   
   case "minutes":
	var part = date.substr(10, 2);
   break;
  }
  
  parts.push(part);
 }

 return parts.join(separator); 
}



function Date_Weekday_Name(day, format = "long", locale = "en-US")
{ 
 day = parseInt(day);
 day = day.toString().padStart(2, "0");
 
 return Date_Format("000601" + day, locale, {weekday:format});
}




function Date_Weekday_Get(date)
{
 var jsdate  = Date_To_JS(date);
 var weekday = jsdate.getDay();
 
 if(weekday == 0) weekday = 7;
 
 return weekday;
}




function Date_Format(date, locale = "en-US", format = "full", options = {})
{
 if(typeof format == "object") 
 {
  var config = format;
 }
 else
 {
  
  switch(format)
  {
   case "full":
	 var config = 
	 { 
	  dateStyle: "full", 
	  timeStyle: "short", 
	  hourCycle: "h24"
	 }
   break;
  
   case "date-long-weekday":
     var config =
	 {
	  weekday: "long", 
	  day:     "numeric", 
	  month:   "long", 
	  year:    "numeric"
	 }  
   break;
   
   case "date-long-weekday-noyear":
     var config =
	 {
	  weekday: "long", 
	  day:     "numeric", 
	  month:   "long", 
	 }  
   break;
   
   case "date-shortmonth-weekday-noyear":
     var config =
	 {
	  weekday: "long", 
	  day:     "numeric", 
	  month:   "short"
	 }  
   break;
   
   case "date-short-weekday":
     var config =
	 {
	  weekday: "short", 
	  day:     "numeric", 
	  month:   "short", 
	  year:    "numeric"
	 }  
   break;
   
   case "date-short-weekday-noyear":
     var config =
	 {
	  weekday: "short", 
	  day:     "numeric", 
	  month:   "short", 
	 }  
   break;
   
   case "date-short-noyear":
     var config =
	 {
	  day:     "numeric", 
	  month:   "short", 
	 }  
   break;
  
   case "day-weekday":
	var config =
	 {
	  day:     "numeric",
      weekday: "long" 	  
	 }  
   break;
   
   case "date-time-compact":
     var config =
	 {
	  weekday:   "long", 
	  day:       "numeric", 
	  month:     "short",
	  hour:      "2-digit", 
	  minute:    "2-digit", 
	  hourCycle: "h24"	  
	 }  
   break;
   
   case "date-compact":
     var config =
	 {
	  weekday:   "long", 
	  day:       "2-digit", 
	  month:     "short"
	 }  
   break;
   
   case "monthdayyear-compact":
     var config =
	 {
	  day:       "2-digit", 
	  month:     "short",
	  year:      "numeric"
	 }  
   break;
  
   case "time-only":
	 var config = 
	 {
	  hour:      "2-digit", 
	  minute:    "2-digit", 
	  hourCycle: "h24"
	 }
   break;
  }
  
 }
 
 
 Object.assign(config, options);
 
 
 var jsdate    = Date_To_JS(date);
 var formatted = new Intl.DateTimeFormat(locale, config).format(jsdate);
 
 return formatted;
}





function Date_Format_Period(date_from, date_to, options = {})
{
 var config = {};
 
 // SPECIFIC LOCALE?
 var locale = options["locale"];
 
 // USE "TOMORROW", "YESTERDAY", "LAST WEEK" ETC.?
 if(options["conversational"]) config["numeric"] = "auto"; else config["numeric"] = "always";
 
 const formatter = new Intl.RelativeTimeFormat(locale, config);
 const DIVISIONS = 
 [
  { amount: 60, name: 'seconds' },
  { amount: 60, name: 'minutes' },
  { amount: 24, name: 'hours' },
  { amount: 7, name: 'days' },
  { amount: 4.34524, name: 'weeks' },
  { amount: 12, name: 'months' },
  { amount: Number.POSITIVE_INFINITY, name: 'years' }
 ]

 if(!date_from) var date_from = Date_Now(); 
 
 var duration = (Date_To_JS(date_to) - Date_To_JS(date_from)) / 1000;
 for (let i = 0; i <= DIVISIONS.length; i++) 
 {
  const division = DIVISIONS[i]
   
  if (Math.abs(duration) < division.amount) 
  {
   return formatter.format(Math.round(duration), division.name);
  }
   
  duration /= division.amount
 }
}





function Date_Distance(date_from, date_to, unit = "seconds")
{
 date_from   = Date_To_JS(date_from);
 date_to     = Date_To_JS(date_to);
 var seconds = (date_to - date_from) / 1000;
 
 switch(unit)
 {
  case "seconds":
	var distance = seconds;
  break;
  
  case "minutes":
	var distance = Math.floor(seconds / 60);
  break;
  
  case "hours":
	var distance = Math.floor(seconds / 3600);
  break;
  
  case "days":
	var distance = Math.floor(seconds / 86400);
  break;
  
  case "months":
	var distance = date_to.getMonth() - date_from.getMonth() + 12 * (date_to.getFullYear() - date_from.getFullYear());
  break;
  
  case "years":
	var distance = date_to.getFullYear() - date_from.getFullYear();
  break;
 }
 
 return distance;
}




function Date_Timezone()
{
 return Intl.DateTimeFormat().resolvedOptions().timeZone;
}



function Date_Month_Name(month, format = "long", locale = "en-US")
{  
 month = parseInt(month);
 month = month + 1;
 month = month.toString().padStart(2, "0");
 
 return Date_Format("0000" + month, locale, {month:format});
}



function Date_Month_FirstDay(date)
{
 if(!date) var date = Date_Now(); 
 
 var jsdate = Date_To_JS(date);
 var first  = new Date(jsdate.getFullYear(), jsdate.getMonth(), 1); 
 first      = Date_From_JS(first);
 
 return first;
}



function Date_Month_LastDay(date)
{
 if(!date) var date = Date_Now(); 
 
 var jsdate = Date_To_JS(date);
 var last   = new Date(jsdate.getFullYear(), jsdate.getMonth() + 1, 0); 
 last       = Date_From_JS(last);
 
 return last;
}




function Date_Month_ListDays(month, year) 
{
 var month = month - 1; // FIX, JS DATE MONTHS START WITH 0 (!!)
 var date  = new Date(year, month, 1);
 var days  = [];
 
 while (date.getMonth() === month) 
 {
  var day = Date_From_JS(new Date(date));
  
  days.push(day);
  date.setDate(date.getDate() + 1);
 }

 return days;
}




function Date_Week_FirstDay(date)
{
 if(!date) var date = Date_Now();
 var jsdate = Date_To_JS(date);
 
 while (jsdate.getDay() != 1) 
 {
  jsdate.setDate(jsdate.getDate() - 1);
 }

 return Date_From_JS(jsdate);
}




function Date_Week_LastDay(date)
{
 var date = Date_Week_FirstDay(date);
 date     = Date_Add_Days(date, 6);
 
 return date;
}




function Date_Add_Months(date, months)
{
 var jsdate = Date_To_JS(date);
 var month  = jsdate.getMonth();
 
 jsdate.setMonth(month + months);
 
 // FIX: IF MONTHS DO NOT HAVE SAME NUMBER OF DAYS THERE MIGHT BE A PROBLEM, AND MONTH WON'T CHANGE
 while(jsdate.getMonth() == month)
 {
  if(months < 0)
  {
   jsdate.setDate(jsdate.getDate() - 1);
  }
  else
  {
   jsdate.setDate(jsdate.getDate() + 1);
  }
 }
 
 return Date_From_JS(jsdate);
}





function Date_Add_Days(date, days)
{
 var jsdate = Date_To_JS(date);
 
 jsdate.setDate(jsdate.getDate() + days);
 
 return Date_From_JS(jsdate);
}





function Date_Add_Minutes(date, minutes)
{
 var jsdate = Date_To_JS(date);
 
 jsdate.setMinutes(jsdate.getMinutes() + minutes);
 
 return Date_From_JS(jsdate);
}





function Date_Add_Hours(date, hours)
{
 var jsdate = Date_To_JS(date);
 
 jsdate.setHours(jsdate.getHours() + hours);
 
 return Date_From_JS(jsdate);
}



function Date_Period_Detail(token, defaultedge = "start")
{
 var detail = {};
 
 var parts = token.split(" of ");
 
 if(parts.length < 2)
 {
  detail["time"] = token;
  detail["edge"] = defaultedge;
 }
 else
 {  
  detail["time"] = parts[1].trim().toLowerCase();
  detail["edge"] = parts[0].trim().toLowerCase();
 }
 
 return detail;
}



function Date_Range(period)
{ 
 var parts = period.split(" to ");
 for(var i in parts) parts[i] = parts[i].toLowerCase().trim();
 
 if(parts.length == 1) parts[1] = parts[0];

 var range     = {};
 
 var detail = Date_Period_Detail(parts[0], "start"); 
 range["from"] = Date_Period_Time(detail["time"], detail["edge"]);
 
 var detail = Date_Period_Detail(parts[1], "end"); 
 range["to"] = Date_Period_Time(detail["time"], detail["edge"]);
 
 return range;
}



function Date_Period_Time(period, edge)
{
 switch(period)
 {
  // PRESENT
  case "today":
	var today = Date_Now();
	
	if(edge == "start")
	{
	 var day   = Date_Portion(today, "date-only") + "0000";
	}
	else
	{
	 var day   = Date_Portion(today, "date-only") + "2359";
	}	
  break;
 
  case "this week":
	if(edge == "start")
	{
     var day = Date_Portion(Date_Week_FirstDay(Date_Now()), "date-only") + "0000"; 
	}
	else
	{
	 var day = Date_Portion(Date_Week_LastDay(Date_Now()), "date-only") + "2359";
	}
  break;
 
  case "this month":
    var thismonth = Date_Month_FirstDay(Date_Now()); 
	
	if(edge == "start")
	{
	 var day = Date_Portion(Date_Month_FirstDay(Date_Now()), "date-only") + "0000"; 
	}
	else
    {
     var day = Date_Portion(Date_Month_LastDay(Date_Now()), "date-only") + "2359"; 
	}
  break;
  
  // FUTURE
  case "future":
	day = "290001010000";
  break;
  
  case "tomorrow":
	var tomorrow = Date_Add_Days(Date_Now(), 1);
	
	if(edge == "start")
	{
	 var day = Date_Portion(tomorrow, "date-only") + "0000";
	}
	else
	{
	 var day = Date_Portion(tomorrow, "date-only") + "2359";
	}	
  break;
  
  case "next week":
	var nextweek = Date_Add_Days(Date_Week_FirstDay(Date_Now()), 7);
	
	if(edge == "start")
	{
     var day = Date_Portion(Date_Week_FirstDay(nextweek), "date-only") + "0000"; 
	}
	else
	{
	 var day = Date_Portion(Date_Week_LastDay(nextweek), "date-only") + "2359";
	}
  break;
  
  case "next month":
	var nextmonth = Date_Add_Days(Date_Month_LastDay(Date_Now()), 1);
	
	if(edge == "start")
	{
	 var day = Date_Portion(Date_Month_FirstDay(nextmonth), "date-only") + "0000"; 
	}
	else
    {
     var day = Date_Portion(Date_Month_LastDay(nextmonth), "date-only") + "2359"; 
	}
  break;
  
  // PAST
  case "past":
	day = "197001010000";
  break;
  
  case "yesterday":
	var yesterday = Date_Add_Days(Date_Now(), -1);
	
	if(edge == "start")
	{
	 var day = Date_Portion(yesterday, "date-only") + "0000";
	}
	else
	{
	 var day = Date_Portion(yesterday, "date-only") + "2359";
	}	
  break;
  
  case "last week":
	var lastweek = Date_Add_Days(Date_Week_FirstDay(Date_Now()), -7);
	
	if(edge == "start")
	{
     var day = Date_Portion(Date_Week_FirstDay(lastweek), "date-only") + "0000"; 
	}
	else
	{
	 var day = Date_Portion(Date_Week_LastDay(lastweek), "date-only") + "2359";
	}
  break;
  
  case "last month":
    var lastmonth = Date_Month_FirstDay(Date_Add_Days(Date_Month_FirstDay(Date_Now()), -1));

	if(edge == "start")
	{
	 var day = Date_Portion(Date_Month_FirstDay(lastmonth), "date-only") + "0000"; 
	}
	else
    {
     var day = Date_Portion(Date_Month_LastDay(lastmonth), "date-only") + "2359"; 
	}
  break;
 }
 
 return day;
}



function Time_Now()
{
 return new Date().getTime(); 
}



function Time_From_Minutes(minutes, separator = ":")
{
 var hours   = Math.floor(minutes / 60);
 var minutes = minutes % 60;
 
 return hours.toString().padStart(2, "0") + separator + minutes.toString().padStart(2, "0");
}


function Time_To_Minutes(time)
{
 time        = String_Filter_AllowDigits(String(time));
 
 var hours   = parseInt(time.substr(0, 2));
 var minutes = parseInt(time.substr(2, 2));
 
 return (hours * 60) + minutes;
}




function Time_Seconds_ToTimecode(seconds, separator = ":")
{
 var hours   = Math.floor(seconds / 3600);
 seconds     = seconds - (hours * 3600);
 
 var minutes = Math.floor(seconds / 60);
 seconds     = seconds - (minutes * 60);
 
 return hours.toString().padStart(2, "0") + separator + minutes.toString().padStart(2, "0") + separator + seconds.toString().padStart(2, "0");
}



function Time_Timecode_ToSeconds(timecode, separator = ":")
{
 var parts   = timecode.split(separator);
 var seconds = 0;
 
 if(parts.length > 0)	
 {
  seconds = seconds + parts[0] * 60 * 60;
 }	 
 
 if(parts.length > 1)	
 {
  seconds = seconds + parts[1] * 60;
 }	

 if(parts.length > 2)	
 {
  seconds = seconds + parts[2];
 }	 
  
 return seconds;
}





function Time_Format_Period(minutes, locale = "en", separator = ", ")
{
 var hours   = Math.floor(minutes / 60);
 var minutes = minutes % 60;
 
 var time    = [];
 
 if(hours > 0)
 {
  var component = new Intl.NumberFormat(locale, {style:"unit", unit:"hour", unitDisplay:"long"}).format(hours);
  time.push(component);
 }
 
 if(minutes > 0)
 {
  var component = new Intl.NumberFormat(locale, {style:"unit", unit:"minute", unitDisplay:"long"}).format(minutes);
  time.push(component);
 }
 
 return time.join(separator);
}