# Entity-Relationship (ER) Diagram - Basic LMS

This document details the database schema and entity relationships for the 7 core Mongoose models in the Basic Learning Management System: **User**, **Course**, **Lesson**, **Enrollment**, **Quiz**, **Question**, and **Result**.

```mermaid
erDiagram
    USER ||--o{ COURSE : "instructs / authors"
    USER ||--o{ ENROLLMENT : "enrolls in"
    USER ||--o{ RESULT : "submits"
    
    COURSE ||--o{ LESSON : "contains"
    COURSE ||--o{ ENROLLMENT : "has students"
    COURSE ||--o{ QUIZ : "contains"
    
    QUIZ ||--o{ QUESTION : "consists of"
    QUIZ ||--o{ RESULT : "evaluates"

    USER {
        ObjectId _id PK
        string name "User full name"
        string email "Unique user email"
        string password "Hashed bcrypt password"
        string role "admin | instructor | student"
        date createdAt
        date updatedAt
    }

    COURSE {
        ObjectId _id PK
        string title "Course title (Indexed)"
        string description "Course overview text"
        string category "Course category (Indexed)"
        ObjectId instructor FK "References User"
        boolean isPublished "Visibility status"
        date createdAt
        date updatedAt
    }

    LESSON {
        ObjectId _id PK
        ObjectId courseId FK "References Course (Indexed)"
        string title "Lesson title"
        string content "Learning material / notes"
        number order "Sequential order index"
        string videoUrl "Optional video link"
        date createdAt
        date updatedAt
    }

    ENROLLMENT {
        ObjectId _id PK
        ObjectId studentId FK "References User (Indexed)"
        ObjectId courseId FK "References Course (Indexed)"
        number progress "Completion % (0 - 100)"
        boolean completed "Completion status"
        date enrolledAt
        date updatedAt
    }

    QUIZ {
        ObjectId _id PK
        ObjectId courseId FK "References Course (Indexed)"
        string title "Quiz assessment title"
        number passingPercentage "Passing threshold % (default: 50)"
        date createdAt
        date updatedAt
    }

    QUESTION {
        ObjectId _id PK
        ObjectId quizId FK "References Quiz (Indexed)"
        string questionText "Question prompt"
        array options "2 to 4 answer options"
        number correctOptionIndex "0-based index of correct option"
        date createdAt
        date updatedAt
    }

    RESULT {
        ObjectId _id PK
        ObjectId studentId FK "References User (Indexed)"
        ObjectId quizId FK "References Quiz (Indexed)"
        number score "Number of correct answers"
        number totalQuestions "Total questions in test"
        boolean passed "Score >= passingPercentage"
        date submittedAt
    }
```

---

## Entity Relationship Cardinalities

1. **User to Course (1:N)**:
   - One user with role `instructor` or `admin` can create and manage multiple `Courses`.
   - Each `Course` is authored by exactly one instructor (`instructor` FK).

2. **Course to Lesson (1:N)**:
   - A `Course` consists of zero or more sequential `Lessons`.
   - Each `Lesson` belongs to exactly one `Course`.

3. **User to Enrollment (1:N) & Course to Enrollment (1:N)**:
   - Composite relation: A student can enroll in multiple courses, and a course can have multiple enrolled students.
   - Compound index on `{ studentId: 1, courseId: 1 }` prevents duplicate enrollments.

4. **Course to Quiz (1:N)**:
   - A `Course` can offer multiple `Quizzes` (e.g., Weekly Quizzes, Midterms, Final Assessments).
   - Each `Quiz` belongs to one `Course`.

5. **Quiz to Question (1:N)**:
   - A `Quiz` has multiple multiple-choice `Questions`.
   - Each `Question` belongs to one `Quiz`.

6. **Quiz to Result (1:N) & User to Result (1:N)**:
   - When a student attempts a `Quiz`, a `Result` record is generated with their raw score, percentage, and pass/fail outcome.

