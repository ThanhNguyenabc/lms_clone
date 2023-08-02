<?PHP

function Resources_Lessons($options = [])
{
 // LOAD LESSONS
 $lessons = Storage_Folders_Collect("content/lessons", ["uproot"]);
 
 return $lessons;
}





function Resources_Vocabulary($options = [])
{
 // LOAD LESSONS
 $lessons = Storage_Folders_Collect("content/vocabulary", ["uproot"]);
 
 return $lessons;
}




function Resources_Skills($options = [])
{
 // LOAD SKILLS
 $skills = Storage_Folders_Collect("content/skills", ["uproot"]);
 
 return $skills;
}





function Resources_Outcomes($options = [])
{
 // LOAD LESSONS
 $lessons = Storage_Folders_Collect("content/outcomes", ["uproot"]);
 
 return $lessons;
}




function Resources_Projects($options = [])
{
 // LOAD LESSONS
 $lessons = Storage_Folders_Collect("content/projects", ["uproot"]);
 
 return $lessons;
}



function Resources_Index($index, $options = [])
{
 // LOAD LESSONS
 $index = file_get_contents("content/index/$index.dat");
 $index = json_decode($index, true);
 
 return $index;
}



?>