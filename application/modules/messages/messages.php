<?PHP

function Messages_Load()
{
 Messages_Purge();
}



function Messages_Template($template, $data = [])
{
 $text = file_get_contents("./partners/" . $_SESSION["partner"] . "/templates/messages/" . $template . "/index.html");
 $text = String_Variables_Apply($text, $data);
 
 // RELATIVE URLS
 $path     = Server_URL() . "/partners/" . $_SESSION["partner"] . "/templates/messages/" . $template . "/";
 $text     = str_replace(' src = "', ' src = "' . $path, $text);
 
 return $text;
}




function Messages_Send_Single($sender_id, $user_id = -1, $subject = "", $text = "", $options = [])
{ 
 // RECEIVER
 if($user_id == -1) $user_id = $_SESSION["user"]["id"];
 

  
 // TYPE
 if($options["type"])
 {
  $type = $options["type"];
 }
 else 
 {
  $type = "message";
 }
 
 
 // SUBJECT
 
 
 
 // TEMPLATE / TEXT
 if($options["template"])
 {
  // ASSUME TEXT AS A SET OF KEY-VALUE PAIRS, AND POPULATE TEMPLATE
  $text =  Messages_Template($options["template"], $text);
 }
 else
 {
 }
 
 
 
 // EXPIRATION
 if($options["expiration"])
 {
  $date_expiration = $options["expiration"];
 }
 else 
 {
  $date_expiration = NULL;
 }
 
 
 // DATE
 $date_sent = Date_Now();
 
 
 $db = Core_Database_Open();
 
 $type            = SQL_Format($type,            $db);
 $user_id         = SQL_Format($user_id,         $db);
 $sender_id       = SQL_Format($sender_id,       $db);
 $date_sent       = SQL_Format($date_sent,       $db);
 $subject         = SQL_Format($subject,         $db);
 $text            = SQL_Format($text,            $db);
 $date_expiration = SQL_Format($date_expiration, $db);
 
 $id = SQL_Query("INSERT INTO users_messages (type, user_id, sender_id, date_sent, subject, text, date_expiration) VALUES($type, $user_id, $sender_id, $date_sent, $subject, $text, $date_expiration)", $db);
 
 SQL_Close($db);
 
 return $id;
}




function Messages_Send_Multiple($sender_id, $users, $subject = "", $text = "", $options = [])
{  
 if($options["fields"]) $fields = $options["fields"]; else $fields = "firstname,lastname,nickname,email,mobile";
 $users = Users_Read($users, $fields);


 // DATA 
 if(!$options["data"]) $options["data"] = [];
 
  
 // TYPE
 if($options["type"])
 {
  $type = $options["type"];
 }
 else 
 {
  $type = "message";
 }
 
 
 // SUBJECT
 
 
 
 // EXPIRATION
 if($options["expiration"])
 {
  $date_expiration = $options["expiration"];
 }
 else 
 {
  $date_expiration = NULL;
 }
 
 
 // DATE
 $date_sent = Date_Now();
 
 $db = Core_Database_Open();
 
 $type            = SQL_Format($type,            $db);
 $sender_id       = SQL_Format($sender_id,       $db);
 $date_sent       = SQL_Format($date_sent,       $db);
 $subject         = SQL_Format($subject,         $db);
 $date_expiration = SQL_Format($date_expiration, $db);
 
 $db->beginTransaction();
 
 foreach($users as $user)
 {
  // TEMPLATE / TEXT
  if($options["template"])
  {
   $data = array_merge($user, $options["data"]);
   $text = Messages_Template($options["template"], $data);
  }
  else
  { 
  }
  
  $text    = SQL_Format($text, $db);
  $user_id = $user["id"]; 
 
  SQL_Query("INSERT INTO users_messages (type, user_id, sender_id, date_sent, subject, text, date_expiration) VALUES($type, $user_id, $sender_id, $date_sent, $subject, $text, $date_expiration)", $db);
 }
 
 $db->commit();
 SQL_Close($db);
 
 return $id;
}




function Messages_Set_Read($id, $read)
{
 if($read) $date_read = Date_Now(); else $date_read = NULL;
 
 $db        = Core_Database_Open();
 
 $date_read = SQL_Format($date_read, $db);
 SQL_Query("UPDATE users_messages SET date_read = $date_read WHERE id = $id", $db);
 
 SQL_Close($db);
}






function Messages_List($user_id = -1, $date_from = "197001010000", $date_to = "297001010000", $options = [])
{
 if($user_id == -1) $user_id = $_SESSION["user"]["id"];

 // UNREAD ONLY?
 if($options["unread"]) $unread = "AND date_read IS NULL"; else $unread = "";
 
 // SPECIFIC TYPE ONLY?
 if($options["type"]) $type = "AND type = '" . $options["type"] . "'"; else $type = "";
 
 // FIELDS
 $fields = $options["fields"] ?? "id, sender_id, subject, date_sent, date_read";
 
 $db       = Core_Database_Open();
 $messages = SQL_Query("SELECT $fields FROM users_messages WHERE user_id = $user_id $unread $type AND (date_sent BETWEEN $date_from AND $date_to) ORDER BY date_sent DESC", $db);
 SQL_Close($db);

 // GET INFO ABOUT SENDERS?
 if($options["users"])
 {
  Users_Integrate($messages, "sender_id", "id,firstname,lastname", "sender");
 }
 

 return $messages;
}





function Messages_Read($id)
{
 $db       = Core_Database_Open();
 $messages = SQL_Query("SELECT * FROM users_messages WHERE id = $id", $db);
 SQL_Close($db);
 
 $message = $messages[0];
 return $message;
}





function Messages_Delete($id)
{
 $db       = Core_Database_Open();
 SQL_Query("DELETE FROM users_messages WHERE id = $id", $db);
 SQL_Close($db);
}





function Messages_Purge($user_id = -1, $age = 30)
{
 if($user_id == -1) $user_id = $_SESSION["user"]["id"];
 
 
 $today      = Date_Now();
 $expiration = Date_Add_Days($today, -$age);

 $db = Core_Database_Open();
 SQL_Query("DELETE FROM users_messages WHERE user_id = $user_id AND (date_read IS NOT NULL AND date_read < $expiration) OR (date_expiration IS NOT NULL AND date_expiration < $today)", $db);
 SQL_Close($db);
}




?>