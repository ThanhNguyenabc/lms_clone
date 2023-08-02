// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                    C L A S S E S                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

function Courses_Classes_Display() {
  var course = Core_State_Get("courses", "selected-course", {});
  var display = Core_State_Get("courses", "course-display");
  var locale = UI_Language_Current(true);

  var classes = course["classes"] || [];

  var box = UI_Element_Find(display, "course-classes");
  box.innerHTML = "";

  var today = Date_Now();
  var day = 0;
  var last = today;
  for (let i = 0; i < classes.length; ++i) {
    var data = {};
    Object.assign(data, classes[i]);

    data["date"] = Date_Format(
      data["date_start"],
      locale,
      "date-short-weekday"
    );
    data["time"] =
      Date_Portion(data["date_start"], "time-timecode") +
      " - " +
      Date_Portion(data["date_end"], "time-timecode");

    if (data["date"] != last) {
      day++;
      last = data["date"];

      data["day"] = day;
    } else {
      data["day"] = "";
    }

    if (!data["class"]) data["class"] = "";

    if (data["date_start"] < today) var template = "past";
    else var template = "scheduled";
    var element = UI_Element_Create("courses/course-classes-" + template, data);

    if (data["id"]) {
      var icon = UI_Element_Find(element, "view");
      icon.style.display = "flex";
      Document_Element_SetData(icon, "class", data["id"]);
      icon.onclick = Courses_Classes_View;

      if (template == "scheduled" && data["day"]) {
        var cancelIcon = UI_Element_Find(element, "remove");
        cancelIcon.style.visibility = "visible";
        Document_Element_SetData(cancelIcon, "class", data["id"]);
        cancelIcon.onclick = (event) => Courses_Classes_Remove(i);
      }
    }

    if (Numbers_Is_Odd(day)) {
      element.style.backgroundColor = "var(--color-alt-1)";
    } else {
      element.style.backgroundColor = "var(--color-alt-2)";
    }

    box.appendChild(element);
  }
}

async function Courses_Classes_Remove(selectedIndex) {
  const course = Core_State_Get("courses", "selected-course", {});
  const currentClasses = course["classes"];

  const { agree, createMakeupClass } = await Popup_Cancel_Class();

  if (agree) {
    if (createMakeupClass) {
      const scheduleX = course["schedule"].reduce((result, item) => {
        result[item["day"]] = item;
        return result;
      }, {});
      const updatedClasses = [];
      let j = selectedIndex + 1;
      let lastEndDate;

      // CALCULATE NEW CLASS TIME
      const lastClass = currentClasses[currentClasses.length - 1]["date_start"];
      let newClassDate = Date_Add_Days(lastClass, 1);
      while (!scheduleX[Date_Weekday_Get(newClassDate)]) {
        newClassDate = Date_Add_Days(newClassDate, 1);
      }

      for (let i = selectedIndex; i < currentClasses.length; i++) {
        const current = currentClasses[i];
        const date_start = current["date_start"];
        const duration = current["duration"];

        while (
          j < currentClasses.length &&
          Date_Portion(currentClasses[j]["date_start"], "date-only") ===
            Date_Portion(date_start, "date-only")
        ) {
          j++;
        }

        let startDate =
          j < currentClasses.length
            ? Date_Portion(currentClasses[j]["date_start"], "date-only")
            : Date_Portion(newClassDate, "date-only");

        if (
          j < currentClasses.length &&
          lastEndDate &&
          Date_Portion(lastEndDate, "date-only") === startDate
        ) {
          // CASE: ROW ITEM HAS SAME DAY
          startDate = lastEndDate;
        } else {
          const dayofWeek = Date_Weekday_Get(startDate);
          startDate = Date_Add_Minutes(startDate, scheduleX[dayofWeek]["time"]);
        }

        const endDate = Date_Portion(
          Date_Add_Minutes(startDate, duration),
          "no-seconds"
        );
        lastEndDate = endDate;

        // UPDATE TIME FOR CURRENT ROW
        currentClasses[i]["date_start"] = Date_Portion(startDate, "no-seconds");
        currentClasses[i]["date_end"] = endDate;
        updatedClasses.push(currentClasses[i]);
      }

      await Promise.all([
        Core_Api("Class_Update", {
          classes: updatedClasses,
        }),
        Core_Api("Courses_Update_Classes", {
          id: course["id"],
          classes: currentClasses,
        }),
      ]);
    } else {
      // CANCEL CLASS WITHOUT CREATING MAKEUP CLASS
      const seletedClass = currentClasses[selectedIndex];
      const cancelFuncs = [
        Core_Api("Class_Cancel", {
          class_id: seletedClass["id"],
        }),
      ];
      if (
        currentClasses[selectedIndex + 1] &&
        Date_Portion(
          currentClasses[selectedIndex + 1]["date_start"],
          "date-only"
        ) === Date_Portion(seletedClass["date_start"], "date-only")
      ) {
        cancelFuncs.push(
          Core_Api("Class_Cancel", {
            class_id: currentClasses[selectedIndex + 1]["id"],
          })
        );
      }
      currentClasses.splice(selectedIndex, cancelFuncs.length);

      await Promise.all([
        Core_Api("Courses_Update_Classes", {
          id: course["id"],
          classes: currentClasses,
        }),
        ...cancelFuncs,
      ]);
    }

    // UPDATE LOCAL DATA
    course["date_start"] = currentClasses[0]["date_start"];
    course["date_end"] = currentClasses[currentClasses.length - 1]["date_end"];
    course["classes"] = currentClasses;
    Core_State_Set("courses", "selected-course", course);

    // UPDATE UI
    Courses_Classes_Display();
    const courseDisplay = Core_State_Get("courses", "course-display");
    const inputEndDate = UI_Element_Find(courseDisplay, "course-date_end");
    inputEndDate.value = Date_To_Input(course["date_end"] || "");
    const inputStartDate = UI_Element_Find(courseDisplay, "course-date_start");
    inputStartDate.value = Date_To_Input(course["date_start"] || "");
  }
}

async function Popup_Cancel_Class() {
  var promise = new Promise((resolve, reject) => {
    let createMakeupClass = true;
    const content = UI_Element_Create("courses/popup-cancel-class", {
      text: UI_Language_String("courses/popups", "cancel class description"),
    });
    const checkBox = UI_Element_Find(content, "check");
    checkBox.checked = createMakeupClass;
    checkBox.onchange = (event) => {
      createMakeupClass = event.target.checked;
    };
    var button_yes = {
      text: UI_Language_String("core/popups", "button yes"),
      onclick: function (popup) {
        UI_Popup_Close(popup);

        resolve({
          agree: true,
          createMakeupClass,
        });
      },
    };

    var button_no = {
      text: UI_Language_String("core/popups", "button no"),
      onclick: function (popup) {
        UI_Popup_Close(popup);

        resolve(false);
      },
    };

    UI_Popup_Create(
      {
        title: UI_Language_String("courses/popups", "cancel class title"),
        content,
        subtitle: UI_Language_String("courses/popups", "cancel class message"),
        onescape: function (popup) {
          resolve({});
        },
      },

      [button_yes, button_no]
    );
  });

  return promise;
}

async function Courses_Classes_View(event) {
  var element = event.currentTarget;
  var id = Document_Element_GetData(element, "class");

  await Class_Display(id);
}

async function Courses_Classes_Rollout() {
  var course = Core_State_Get("courses", "selected-course", {});

  // 1. COMPLETENESS CHECK :
  // PROGRAM, LEVEL, DURATION AND SCHEDULED DAYS MUST BE ALL SET BEFORE CREATING LESSONS
  for (var field of ["program", "level", "lesson_duration", "schedule"]) {
    if (
      !course[field] ||
      (Array.isArray(course[field]) && course[field].length == 0)
    ) {
      var picture = Resources_URL("images/cover-deny.png");
      var title = UI_Language_String("courses/popups", "allocate cant title");
      var content = UI_Language_String(
        "courses/popups",
        "allocate missing " + field
      );

      await UI_Popup_Alert(title, content, picture);

      Courses_Course_HighlightMissing("allocate", field);

      return;
    }
  }

  // 2. PROCEED TO CREATION
  var classes = [];
  var skipped = [];
  var count = 0;

  // 3. GET LESSON TOPICS SEQUENCE FROM PROGRAM/LEVEL COMBO
  var program = course["program"] || "";
  var level = course["level"] || "";
  var lessons = Core_Config(["programs", program, level], "").split(",");

  // 2. GET GLOBAL TIME-OFF AND COURSE'S CENTER TIME-OFF, COMBINED TO SEE WHICH DATES WE MUST SKIP
  var center = course["center_id"];
  var timeoff_center = await Timeoff_Read(center, "timeoff");
  var timeoff_global = await Timeoff_Read("global", "timeoff");
  var timeoff = timeoff_center.concat(timeoff_global);

  // 3. DETERMINE TEACHER PATTERN
  var teacher_pattern = Core_Config(
    ["course-teacher-configs", course["teacher_config"], "pattern"],
    "native"
  );
  teacher_pattern = teacher_pattern.split(",");

  // 4. CREATE CALENDAR
  var lesson_duration = course["lesson_duration"] / 60;
  var date_start = course["date_start"];
  var schedule = course["schedule"];

  var calendar = Courses_Classes_Calendar(
    date_start,
    schedule,
    lessons,
    lesson_duration,
    timeoff
  );
  console.log(calendar);

  // 5. TURN CALENDAR INTO LESSONS SEQUENCE
  var classes = [];
  var item_index = 0;
  for (var item of calendar) {
    var date = item["date"];

    for (var slot of item["session"]) {
      var lesson_id = slot["lesson"];
      var duration = slot["duration"] * 60;
      var date_start = Date_Portion(date, "no-seconds");
      var date_end = Date_Portion(
        Date_Add_Minutes(date_start, duration),
        "no-seconds"
      );
      var teacher_type = teacher_pattern[item_index % teacher_pattern.length];

      classes.push({ date_start, date_end, duration, lesson_id, teacher_type });

      date = date_end;
    }

    item_index++;
  }

  // 6. CALL SERVICE TO ROLL OUT CALENDAR TO CLASSES AND UPDATE COURSE ACCORDINGLY
  // THE SERVICE RETURN CALENDAR MAKEUP FOR THE COURSE (SAME AS Courses_Calendar")

  var section = UI_Element_Find("section-schedule");
  Document_Element_Disable(section, "style-disabled");

  await Core_Api("Courses_Rollout", { id: course["id"], center, classes });

  // 7. DONE. RELOAD
  Courses_Course_Display(course["id"]);
}

async function Courses_Classes_Rollback() {
  var course = Core_State_Get("courses", "selected-course", {});

  // 1. CONFIRM
  var code = course["id"].padStart(6, "0");

  var picture = Resources_URL("images/cover-alert.jpg");
  var title = UI_Language_String("courses/popups", "rollback confirm title");
  var content = UI_Language_String("courses/popups", "rollback confirm text", {
    code,
  });

  var confirm = await UI_Popup_Code(title, content, picture, code);
  if (!confirm) return;

  // 2. CALL ROLLBACK SERVICE
  await Core_Api("Courses_Rollback", { id: course["id"] });

  // 3. RELOAD
  Courses_Course_Display(course["id"]);
}

function Courses_Classes_Calendar(
  date_start,
  schedule,
  lessons,
  lesson_duration,
  timeoff = [],
  content_duration = 2
) {
  // CALCULATE CALENDAR USING SCHEDULE AND TIME OFF
  var calendar = [];

  var date = Date_Portion(date_start, "date-only") + "0000";
  //Doan Nhat Nam 03/07/2023  Fix days error : Round to Ceil
  var days = Math.ceil((content_duration / lesson_duration) * lessons.length);
  var schedule_index = 0;

  while (calendar.length < days) {
    // SCHEDULE ITEM
    var day = schedule[schedule_index % schedule.length];

    // FIND NEXT DATE WITH WEEKDAY SPECIFIED BY CURRENT SCHEDULE ITEM
    //Doan Nhat Nam 30/07/2021 set date when schedule.length = 1
    if(schedule.length == 1 && schedule_index > 0) date = Date_Add_Days(date, 1);
    //Doan Nhat Nam 30/07/2021 set date when schedule.length = 1
    while (Date_Weekday_Get(date) != day["day"]) date = Date_Add_Days(date, 1);

    // CHECK THAT THE LESSON WOULDN'T BE AFFECTED BY TIMEOFF
    var date_from =
      Date_Portion(date, "date-only") + Time_From_Minutes(day["time"], "");
    var date_to = Date_Portion(
      Date_Add_Minutes(date_from, Math.floor(lesson_duration * 60)),
      "no-seconds"
    );

    if (Timeoff_Check(date_from, date_to, timeoff)) {
      // NOT AVAILABLE DUE TO TIME OFF
      schedule_index++;
    }
    // DATE AVAILABLE
    else {
      calendar.push(date_from);
      schedule_index++;
    }
  }

  var date = date_start;
  var date_index = 0;
  var lesson_index = 0;
  var lesson_remainder = content_duration;
  var session_remainder = lesson_duration;

  var dates = [];
  var session = [];

  while (lesson_index < lessons.length) {
    // MORE TIME IS LEFT IN THE SESSION THAN IS LEFT IN THE CONTENT BLOCK
    if (session_remainder > lesson_remainder) {
      session.push({
        lesson: lessons[lesson_index],
        duration: lesson_remainder,
      });

      session_remainder = session_remainder - lesson_remainder;

      lesson_index++;
      lesson_remainder = content_duration;
    }
    // MORE TIME IS LEFT IN THE CONTENT BLOCK THAN IS LEFT IN THE SESSION
    else if (lesson_remainder > session_remainder) {
      // ADD A LESSON THAT TAKES ALL THE SESSION REMINDER
      session.push({
        lesson: lessons[lesson_index],
        duration: session_remainder,
      });

      dates.push({
        date: calendar[date_index],
        session,
      });

      date_index++;

      // CARRY OVER LESSON REMAINDER AND START NEW SESSION
      lesson_remainder = lesson_remainder - session_remainder;

      session = [];
      session_remainder = lesson_duration;
    }
    // TIME IN THE CONTENT BLOCK AND SESSION ARE EXACTLY THE SAME
    else {
      session.push({
        lesson: lessons[lesson_index],
        duration: lesson_remainder,
      });

      dates.push({
        date: calendar[date_index],
        session,
      });
      date_index++;

      // START NEW SESSION AND A NEW CONTENT BLOCK TOO
      lesson_remainder = content_duration;
      lesson_index++;

      session = [];
      session_remainder = lesson_duration;
    }
  }
  // Doan Nhat Nam 03/07/2023 : Fix dont add last lesson when lesson duration > content duration
  if(session.length > 0) dates.push({
      date: calendar[date_index],
      session,
    });
  // Doan Nhat Nam 03/07/2023 : Fix dont add last lesson when lesson duration > content duration

  return dates;
}
