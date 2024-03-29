function initCalendar(currentDate) {
    renderCalendar(currentDate);
    fetchHolidaysForThreeYears();  
    showNoOfTodosOnCalendar();
}

let selectedDate = null;

/**
 * calendar 만들기
 * @param {Date} currentDate 
 */
function renderCalendar(currentDate) {
    currentDate.setDate(1); 
    const lastDayOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const lastDayOfPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
    let daysFromPrevMonth = 0; 
    if (currentDate.getDay() - 1 < 0) { 
        daysFromPrevMonth = (7 - currentDate.getDay()) - 1; 
    } else {
        daysFromPrevMonth = currentDate.getDay() - 1;
    };
   
    let daysFromNextMonth = 0; 
    const remainder = (daysFromPrevMonth + lastDayOfCurrentMonth) % 7; 
    if (remainder !== 0) {
        daysFromNextMonth = 7 - remainder;
    };
        
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",];

    document.querySelector(".date > h1").innerHTML = months[currentDate.getMonth()];
    document.querySelector('.date > p').innerHTML = currentDate.getFullYear();

    let days = "";
    const monthDays = document.querySelector('.days'); 

    for(let x = daysFromPrevMonth; x > 0; x--) {
        let date = new Date(); 
        date.setFullYear(currentDate.getFullYear()) 
        date.setMonth(currentDate.getMonth() - 1); 
        date.setDate(lastDayOfPrevMonth - x + 1); 
        let dateClass = formatDate(date.getFullYear(), (date.getMonth() + 1), (lastDayOfPrevMonth - x + 1));
        days += `<div class="${dateClass} prev-date day">${lastDayOfPrevMonth - x + 1}</div>` 
    }

    for ( let i = 1; i <= lastDayOfCurrentMonth; i++) {
        let dateClass = formatDate(currentDate.getFullYear(), (currentDate.getMonth() + 1), (currentDate.getDate() + i - 1));
        if (currentDate.getDate() + i - 1 == new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear()) {
            days += `<div class="${dateClass} today day">${i}</div>`
        } else {
            days += `<div class="${dateClass} day">${i}</div>`
        }
    }

    for(let j = 1; j <= daysFromNextMonth; j++) {
        let date = new Date();
        date.setFullYear(currentDate.getFullYear())
        date.setMonth(currentDate.getMonth() + 1);
        date.setDate(j);
        let dateClass = formatDate(date.getFullYear(), (date.getMonth() + 1), date.getDate());
        days += `<div class="${dateClass} next-date day">${j}</div>`;
    }
    
    monthDays.innerHTML = days; 
}

/**
 * API 데이터에서 날짜 지정
 * @param {Number} yy  year 
 * @param {Number} mm  month 
 * @param {Number} dd  day 
 * @returns {String}  yymmdd
 */
function formatDate(yy, mm, dd) { 
    if (yy < 10) yy = "0" + yy;
    if (mm < 10) mm = "0" + mm;
    if (dd < 10) dd = "0" + dd;
    return yy + "-" + mm + "-" + dd;
}

/** Fetchs API data to get an array of the Swedish public holidays */
async function fetchHolidaysForThreeYears() {
    const currentYear = new Date().getFullYear();
    let holidays = [];
    for (let year = currentYear - 1; year <= currentYear + 1; year++) {
        const response = await fetch (`https://api.allorigins.win/get?url=${encodeURIComponent(`https://sholiday.faboul.se/dagar/v2.1/${year}`)}`);
        const data = await response.json();
        const json = JSON.parse(data.contents);
        const filteredHolidaysFromAPI = json.dagar.filter((day) => day.helgdag);
        holidays = holidays.concat(filteredHolidaysFromAPI);
    }

    for (let i = 0; i < holidays.length; i++ ) {
        const holidayDates = new Date(holidays[i].datum);
        let searchClassName = formatDate(holidayDates.getFullYear(), (holidayDates.getMonth() + 1), holidayDates.getDate());
        let dayDiv = document.getElementsByClassName(searchClassName);
        if ( dayDiv.length > 0) {
            printHolidaysToCalendar(dayDiv[0], holidays[i].helgdag)
        }
    } 
}

/**
 * Prints the name of the holiday to a new created div 
 * @param {String} dayDiv 
 * @param {String} holidays 
 */
// function printHolidaysToCalendar(dayDiv, holidays) { 
//     const reminderDiv = document.createElement('div');
//     reminderDiv.className = 'holiday-reminder';
//     reminderDiv.innerHTML = holidays;
//     dayDiv.append(reminderDiv);
// }

/** Run function for retrieving the class name as a calendar day clicked */
function clickCalendarDay() {
    const dayBtns = document.querySelectorAll('.day');
    dayBtns.forEach(dayBtn => {
        dayBtn.addEventListener('click', getFirstClassNameOfDay);
        })
}

/** Prints background color on the seletced day div */
function createActiveDayClass() {
    let dayBtn = event.target;
    dayBtn.classList.add('active-color');
}

/** Removes background color if the day div is unselected / non-active */
function clearActiveDayClass() {
    const daysWithActiveColor = document.querySelectorAll('.active-color');
    daysWithActiveColor.forEach(dayWithActiveColor => {
        dayWithActiveColor.classList.remove('active-color');
    }) 
}

/** Retrieves one fo the class names and converts it to date string */
function getFirstClassNameOfDay() {
    let dayBtn = event.target;
    let classNameOfDay = dayBtn.className.split(" ")[0];
    let newDate = new Date(classNameOfDay);
    if ( selectedDate !== null && newDate.toDateString() === selectedDate.toDateString()) {
        unselectSelectedDate();
    } else {
        showTodosSelectedDate(newDate);
    }
    selectedDate = newDate;
    clearActiveDayClass();
    createActiveDayClass();
}

/** Updates the todo reminder for each calendar days in the current month 
 * first loop covers the case when user removes the last todo, the decond removes the duplicated when there is multiple todos on one date
*/
function showNoOfTodosOnCalendar() {
    let days = document.getElementsByClassName('day'); 
    let daysArr = [];
    for (let i = 0; i < days.length; i++) {
        daysArr = (days[i].className.split(" ")[0]);

        let dayDiv = document.getElementsByClassName(daysArr);
        for (let x = 0; x < dayDiv.length; x++ ) {
            removeTodoReminder(dayDiv[0]);
            }

        let todoArr = getTodoList();
        const filter = todoArr.filter(element => { return new Date(element.date).toDateString() == new Date(daysArr).toDateString() });
        filter.forEach((element, index) => {
            let todoNumber = index + 1;
            let dayDiv = document.getElementsByClassName(element.date);
            removeTodoReminder(dayDiv[0]);
            printTodoToCalendar(dayDiv[0], todoNumber);
        });
    } 
}

/**
 * Prints todo reminder (the number of todos) for calendar days
 * @param {Element} dayDiv 
 * @param {String} todoNumber 
 */
 function printTodoToCalendar(dayDiv, todoNumber) {
    const todoReminderDiv = document.createElement('div');
    todoReminderDiv.className = 'todo-reminder';
    todoReminderDiv.innerText = todoNumber;
    dayDiv.append(todoReminderDiv);
}

/**
 * Removes todo reminder for calendar days  
 * @param {Element} dayDiv 
 */
function removeTodoReminder(dayDiv) {
    const todoWithReminder = dayDiv.getElementsByClassName('todo-reminder');
    if (todoWithReminder.length > 0 ) {
        dayDiv.removeChild(todoWithReminder[0]);
    }
}