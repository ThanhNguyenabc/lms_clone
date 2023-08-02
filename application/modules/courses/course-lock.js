async function Create_Course_Lock(course){
    var user_id = User_Id();
    var data = {
        "user_id": user_id,
        "course_id": course.id,
        "last_update": Date_Portion(Date_Now(), "no-seconds")
    }
    
    // CREATE
    var id     = await Core_Api("Courses_Lock_New", {data});
}