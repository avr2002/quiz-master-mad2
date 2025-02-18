# Untitled

# Modern Application Development II

## **Project Statement**

## **Quiz Master - V2**

It is a multi-user app (one requires an administrator and other users) that acts as an exam preparation site for multiple courses.

### **Frameworks to be used**

These are the mandatory frameworks on which the project has to be built.

- SQLite for data storage
- Flask for API
- VueJS for UI
- VueJS Advanced with CLI (only if required, not necessary)
- Jinja2 templates if using CDN **only for entry point** (Not to be used for UI)
- Bootstrap for HTML generation and styling (No other CSS framework is allowed)
- SQLite for database (No other database is permitted)
- Redis for caching
- Redis and Celery for batch jobs

**Note:** All demos should be possible on your local machine.

The platform will have **two** roles:

1. **Admin - root access** It is the superuser of the app and requires no registration
    - Admin is also known as the **quiz master**
    - There is only one admin to this application
    - The administrator login redirects to the quiz master/admin dashboard
    - The administrator will manage all the other users
    - The administrator will create a new subject
    - The administrator will add various chapters under a subject
    - The administrator will add quiz questions under a chapter
2. **User - Can attempt any quiz of its choice**
    - User Register and Login
    - Each user **may** have:
        1. id - primary key
        2. Username (email)
        3. Password
        4. Full Name
        5. Qualification
        6. DOB
    - Choose the subject/chapter name
    - Start the quiz
    - View the quiz scores

### **Terminologies**

**User:** The user will register and login and attempt any quiz of his/her interest.

**Admin:** The superuser with full control over other users and data. Registration is not allowed for the admin: The admin account must pre-exist in the database when the application is initialized.

**Subject:** The field of study in which the user wishes to give the quiz. The admin will be creating one or many subjects in the application. Every subject can possible have the following fields:

1. id - primary key
2. Name
3. Description
4. etc: Additional fields (if any)

**Chapter:** Each subject can be subdivided into multiple modules called chapters. The possible fields of a chapter can be the following:

1. id - primary key
2. Name
3. Description
4. etc: Additional fields (if any)

**Quiz**: A quiz is a test that is used to evaluate the user’s understanding of any particular chapter of any particular subject. A test may contain the following attributes:

1. id - primary key
2. chapter_id (foreign key-chapter)
3. date_of_quiz
4. time_duration(hh:mm)
5. remarks (if any)
6. etc: Additional fields (if any)

**Questions**: Every quiz will have a set of questions created by the admin. Possible fields for a question include:

1. id - primary key
2. quiz_id (foreign key-quiz)
3. question_statement
4. option1
5. option2
6. etc: Additional fields (if any)

**Scores:** Stores the scores and details of a user's quiz attempt. Possible fields for scores include:

1. id - primary key
2. quiz_id (foreign key-quiz)
3. user_id (foreign key-user)
4. time_stamp_of_attempt
5. total_scored
6. etc: Additional fields (if any)

**Note:** The above fields are not exhaustive. Students can add more fields as per their specific requirements.

### **Application Wireframe**

[Quiz Master](https://www.google.com/url?q=https://drive.google.com/file/d/1_aEVCqAT6iidqbYnk92kNiPgc1tg2cCM/view?usp%3Ddrive_link&sa=D&source=editors&ust=1736614450278242&usg=AOvVaw3EeBJ0BkuWaxqTb6iEwPq7)

**Note:**The provided wireframe is intended **only to illustrate the application's flow** and demonstrate what should appear when a user navigates between pages.

- **Replication of the exact views is NOT mandatory.**
- Students are encouraged to work on their own front-end ideas and designs, while maintaining the application's intended functionality and flow.

### **Core Functionalities**

1. Admin login and User login
    - A login/register form with fields like username, password etc. for user and admin login
    - The application should have only one admin identified by its role
    - You can either use **Flask security (session or token)** or **JWT based Token** based authentication to implement role-based access control
    - The app must have a suitable model to store and differentiate all types of users
2. Admin Dashboard - for the Admin
    - The admin should be added, whenever a new database is created
    - The admin creates/edits/deletes a subject
    - The admin creates/edits/deletes a chapter under the subject
    - The admin will create a new quiz under a chapter
    - Each quiz contains a set of questions (MCQ - **only one option correct**)
    - The admin can search the users/subjects/quizzes
    - Shows the summary charts
3. Quiz management - for the Admin
    - Edit/delete a quiz
    - The admin specifies the date and duration(HH: MM) of the quiz
    - The admin creates/edits/deletes the SOC questions inside the specific quiz
4. User dashboard - for the User
    - The user can attempt any quiz of his/her interest
    - Every quiz has a timer
    - Each quiz score is recorded
    - The earlier quiz attempts are shown
    - To be able to see the summary charts

**Note:** The database must be created programmatically (via table creation or model code). Manual database creation, such as using DB Browser for SQLite, is **NOT allowed.**

5. Backend Jobs

**a. Scheduled Job - Daily reminders** - The application should send daily reminders to users on g-chat using Google Chat Webhooks or SMS or mail

1. Check if a user has not visited or a new quiz is created by the admin
2. If yes, then send the alert asking them to visit and attempt the quiz if it is relevant to them
3. The reminder can be sent in the evening, every day (students can choose the time)

**b. Scheduled Job - Monthly Activity Report** - Devise a monthly report for the user created using HTML and sent via mail.

1. The activity report can include quiz details, how many quizzes taken in a month, their score, average score, ranking in the quiz etc.
2. For the monthly report to be sent, start a job on the first day of every month → create a report using the above parameters → send it as an email

**c.1 User Triggered Async Job - Export as CSV** - Devise a CSV format details for the quizzes completed by the user

1. This export is meant to download the quiz details (quiz_id, chapter_id, date_of_quiz, score, remarks etc.)
2. Have a dashboard from where the user can trigger the export
3. This should trigger a batch job, and send an alert once done

**OR**

**c.2 User Triggered Async Job - Export as CSV** - Devise a CSV format details for the all quizzes to be seen by the admin

1. This export is meant to download the user details (user_id, quizzes_taken, average score (performance), etc.)
2. Have a dashboard from where the admin can trigger the export
3. This should trigger a batch job, and send an alert once done

8. Performance and Caching

- Add caching where required to increase the performance
- Add cache expiry
- API Performance

### **Recommended Functionalities**

- Well-designed PDF reports for Monthly activity reports (Students can choose between HTML and PDF reports)
- External APIs/libraries for creating charts, e.g. ChartJS
- Single Responsive UI for both Mobile and Desktop
- Unified UI that works across devices
- Add to desktop feature
- Implementing frontend validation on all the form fields using HTML5 form validation or JavaScript
- Implementing backend validation within your APIs

### **Optional Functionalities**

- Provide styling and aesthetics to your application by creating a beautiful and responsive front end using simple CSS or Bootstrap
- Incorporate a proper login system to prevent unauthorized access to the app using Flask extensions like flask_login, flask_security etc.
- Implement a dummy payment portal (just a view taking payment details from user for paid quizzes
- Any additional feature you feel is appropriate for the application
