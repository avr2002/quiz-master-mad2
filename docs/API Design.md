### **API Implementation for Quiz Master**


## **1. Authentication & Authorization**
**Endpoints**
- `POST /auth/login` → Login with username & password (JWT-based)
  - Returns JWT token on successful login
  - Token includes user role and ID
- `POST /auth/register` → Register a new user (only for non-admin users)
  - Validates username uniqueness
  - Validates email format and uniqueness
  - Password is hashed before storage
- `GET /auth/logout` → Logout the user (Blacklists JWT token)
- `GET /auth/me` → Get details of the logged-in user
  - Returns full user profile including:
    - username, email, full_name
    - role, dob, joined_at
  - Requires valid JWT token
  - Returns 404 if user no longer exists
- `PATCH /auth/me` → Update current user's profile
  - Can update username, full_name, email, and password
  - Requires valid JWT token
  - Returns updated user profile

**Logic**
- Admin account is pre-created (no registration)
- Users register and log in using email/password
- JWT tokens are used for authentication
- Role-based access control (admin vs user)
- User profile access through authentication endpoints

---

## **2. Admin Management**
**Endpoints**
- `GET /admin/users` → Get all users
  - Supports pagination
  - Optional search by username/email
  - Returns user list with roles
- `GET /admin/users/{user_id}` → Get user details
  - Returns full user profile
- `DELETE /admin/users/{user_id}` → Remove a user
  - Cascades deletion to scores
- `PATCH /admin/users/{user_id}` → Update user details
  - Can update username, full_name, email
  - Cannot modify role or password

**Logic**
- Admin-only access to all endpoints
- Full user management capabilities
- Data validation for updates
- Proper error handling

---

## **3. Subject Management**
**Endpoints**
- `POST /subjects` → Create a new subject (Admin only)
  - Requires name (3-100 chars) and description
  - Returns created subject with timestamps
- `GET /subjects` → List all subjects
  - Public access
  - Returns list with basic details
- `GET /subjects/{subject_id}` → Get subject details
  - Returns full subject details with chapters count
- `PATCH /subjects/{subject_id}` → Update subject (Admin only)
  - Can update name and description
  - Validates field lengths
- `DELETE /subjects/{subject_id}` → Delete subject (Admin only)
  - Cascades deletion to chapters and quizzes
- `GET /subjects/search` → Search subjects
  - Supports query parameter `q` for search term
  - Supports pagination with `limit` and `offset`
  - Returns subjects matching the search term in name or description
  - Uses SQLite FTS5 for efficient full-text search

**Logic**
- Public read access
- Admin-only modifications
- Proper validation of inputs
- Timestamps for creation/updates
- Full-text search capabilities

---

## **4. Chapter Management**
**Endpoints**
- `POST /subjects/{subject_id}/chapters` → Add a chapter (Admin only)
  - Validates subject existence
  - Requires name (3-100 chars) and description (10-500 chars)
  - Returns created chapter with timestamps
- `GET /subjects/{subject_id}/chapters` → Get all chapters under a subject
  - Returns list of chapters with timestamps
  - Public access
- `GET /subjects/{subject_id}/chapters/{chapter_id}` → Get details of a chapter
  - Validates both subject and chapter existence
  - Returns full chapter details
- `PATCH /subjects/{subject_id}/chapters/{chapter_id}` → Edit chapter details (Admin only)
  - Can update name and/or description
  - Validates field lengths
- `DELETE /subjects/{subject_id}/chapters/{chapter_id}` → Delete a chapter (Admin only)
  - Cascades deletion to related quizzes
- `GET /subjects/{subject_id}/chapters/search` → Search chapters within a subject
  - Supports query parameter `q` for search term
  - Supports pagination with `limit` and `offset`
  - Returns chapters matching the search term in name or description
  - Scoped to the specified subject

**Logic**
- Each subject has multiple chapters
- All chapter operations are scoped under their subject
- Users can view but cannot modify
- Admin required for create, update, delete operations
- Proper validation of subject_id and chapter_id in all operations
- Timestamps tracked for creation and updates
- Full-text search capabilities

---

## **5. Quiz Management**
**Endpoints**
- `POST /chapters/{chapter_id}/quizzes` → Create a quiz (Admin only)
  - Requires chapter_id, date_of_quiz, time_duration
  - Optional remarks field
  - Returns created quiz with timestamps
- `GET /chapters/{chapter_id}/quizzes` → Get all quizzes under a chapter
  - Returns list of quizzes with timestamps
  - Public access
- `GET /quizzes/{quiz_id}` → Get details of a specific quiz
  - Returns full quiz details
  - Public access
- `PATCH /quizzes/{quiz_id}` → Update quiz details (Admin only)
  - Can update date_of_quiz, time_duration, remarks
  - Validates time format (HH:MM)
- `DELETE /quizzes/{quiz_id}` → Delete a quiz (Admin only)
  - Cascades deletion to related questions and attempts
- `GET /quizzes/search` → Search quizzes
  - Supports query parameter `q` for search term
  - Optional `chapter_id` parameter to filter by chapter
  - Supports pagination with `limit` and `offset`
  - Searches quiz remarks for matching terms

**Logic**
- Each chapter can have multiple quizzes
- All quiz operations validate chapter existence
- Public read access to quizzes
- Admin required for create, update, delete operations
- Timestamps tracked for creation and updates
- Full-text search capabilities

---

## **6. Question Management**
**Endpoints**
- `POST /quizzes/{quiz_id}/questions` → Add a question (Admin only)
  - Requires quiz_id, question_statement, options (1-4), correct_option
  - Validates quiz existence
  - Returns created question with details
- `GET /quizzes/{quiz_id}/questions` → Get all questions under a quiz
  - Returns list of questions with all details
  - Requires authentication
  - Validates quiz existence
- `GET /questions/{question_id}` → Get a specific question
  - Returns full question details
  - Requires authentication
- `PATCH /questions/{question_id}` → Edit a question (Admin only)
  - Can update statement, options, correct answer
  - Validates question existence
- `DELETE /questions/{question_id}` → Remove a question (Admin only)
  - Cascades deletion to related attempts

**Logic**
- Each quiz can have multiple MCQs (single correct answer)
- All question operations require authentication
- Admin-only for create, update, delete operations
- Timestamps tracked for creation and updates

---

## **7. Quiz Attempts & Scoring**

**Endpoints**
- `GET /quizzes/{quiz_id}/attempt` → Start a quiz attempt
  - Returns questions without correct answers
  - Returns total questions count and points per question
  - Requires authentication
  - Validates quiz existence
- `POST /quizzes/{quiz_id}/submit` → Submit quiz answers
  - Requires quiz_id and list of answers
  - Each answer needs question_id and selected_option
  - Returns score details and statistics
- `GET /users/{user_id}/scores` → Get user's quiz history
  - Returns list of all attempts by user
  - Users can only view their own scores
  - Admin can view all scores
- `GET /scores/{score_id}` → Get specific score details
  - Returns full details of a quiz attempt
  - Users can only view their own scores
  - Admin can view all scores

**Scoring Logic**
- Each question can have different point values (default: 1)
- Total score is sum of points from correctly answered questions
- System tracks both:
  - Number of correct answers
  - Total points earned
- Points per question shown upfront to help users prioritize

**Data Security**
- Correct answers hidden until quiz submission
- Score records are user-specific
- Historical attempts preserved

---

## **8. User Search**
**Endpoints**
- `GET /users/search` → Search users
  - Admin-only access
  - Supports query parameter `q` for search term
  - Searches username, full name, and email
  - Supports pagination with `limit` and `offset`
  - Returns matching user profiles

**Logic**
- Full-text search on user profiles
- Admin-only access for privacy
- Efficient search using SQLite FTS5

---

## **9. Reports & Analytics**
**Endpoints**
- `GET /admin/reports/daily` → Send daily quiz reminders to inactive users
- `GET /admin/reports/monthly` → Generate monthly performance report (sent via email)
- `GET /admin/reports/export` → Export user or quiz data as CSV

**Logic**
- Admin gets **summary statistics & user activity reports**.
- Users receive **performance reports via email**.
- **Redis & Celery** handle scheduled jobs (reminders & reports).

---

## **10. Miscellaneous**
**Endpoints**
- `GET /healthcheck` → API health check endpoint
- `GET /stats` → Get overall platform statistics (subjects, users, quizzes, etc.)

---

## **API Flow & Permissions**
| Endpoint                         | Method | Access     |
| -------------------------------- | ------ | ---------- |
| `/auth/login`                    | POST   | All        |
| `/auth/register`                 | POST   | Public     |
| `/auth/me`                       | GET    | Logged-in  |
| `/auth/me`                       | PATCH  | Logged-in  |
| `/subjects`                      | GET    | All        |
| `/subjects`                      | POST   | Admin      |
| `/subjects/search`               | GET    | All        |
| `/chapters/{chapter_id}/quizzes` | GET    | All        |
| `/subjects/{id}/chapters/search` | GET    | All        |
| `/quizzes/search`                | GET    | All        |
| `/users/search`                  | GET    | Admin      |
| `/quizzes/{quiz_id}/questions`   | GET    | Restricted |
| `/quizzes/{quiz_id}/attempt`     | POST   | User       |
| `/admin/reports/daily`           | GET    | Admin      |

---

### **Search Implementation**
The application implements full-text search using SQLite's FTS5 extension:

1. **Virtual Tables**: Each searchable entity (subjects, chapters, users, quizzes) has a corresponding FTS5 virtual table
2. **Triggers**: Database triggers keep the FTS tables in sync with the main tables
3. **Porter Stemming**: Used for better matching of word variations (e.g., "mathematics" matches "math")
4. **Wildcard Queries**: Support for partial matching with `term*` syntax
5. **Performance**: Optimized for fast text search even with large datasets

---

<!-- ### **Caching Strategy**
1. **Subjects & Chapters** → Cached with Redis (expires in **6 hours**)
2. **Quizzes & Questions** → Cached per user session
3. **User Profiles & Scores** → Cached **per request**, refreshed every 1 hour
4. **Admin Dashboard Stats** → Cached with **Celery periodic jobs** to precompute data
5. **Search Results** → Cached for 15 minutes with query-specific keys -->

---

## **Plan for API Implementation**
1. **Authentication & Authorization**
   - Implement JWT-based authentication (`login`, `register`, `logout`, `me`).
   - Ensure `admin` role initialization.

2. **User Management (Admin only)**
   - CRUD operations for users (`get`, `delete`, `update`).

3. **Subject Management**
   - Admin: Create, Update, Delete subjects.
   - Users: View subjects.

4. **Chapter Management**
   - Admin: Create, Update, Delete chapters.
   - Users: View chapters.

5. **Quiz Management**
   - Admin: Create, Update, Delete quizzes.
   - Users: View quizzes, attempt quizzes.

6. **Question Management**
   - Admin: Create, Update, Delete questions.
   - Restrict users from accessing questions before quiz attempts.

7. **Quiz Attempt & Scoring**
   - Users: Start a quiz, submit answers, get scores.
   - Track timestamps and scoring.

8. **Reports & Analytics**
   - Generate reports for admin and users.
   - Scheduled job for daily reminders and monthly reports (Redis & Celery).

---
