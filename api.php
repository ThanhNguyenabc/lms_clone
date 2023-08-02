<?PHP

error_reporting(E_ERROR | E_PARSE);

session_start();

switch($_SESSION["mode"])
{
 case "dev":
	include_once "application/lib/utils.php";
	
	Client_IncludeScripts("./application/modules", ["php"], ["recurse"]);
 break;
 
 default:
	include_once "application/data/backend.php";
 break;
}

Server_Api();

?>