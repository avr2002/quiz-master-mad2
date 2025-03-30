# Quiz API

## Setup

1. `cd quiz-api`
2. Create a `.env` file based on `.env.example`
3. Create a virtual environment and install the dependencies

    ```bash
    uv sync

    # OR
    python -m venv .venv
    source .venv/bin/activate
    make install
    ```
4. Run the app

    ```bash
    make run
    ```

## DB Schema Design

```mermaid
erDiagram
    User {
        int id PK
        string username
        string password
        string full_name
        date dob
        string email
        string role
        datetime joined_at
    }
    
    Subject {
        int id PK
        string name
        string description
        datetime created_at
        datetime updated_at
    }
    
    Chapter {
        int id PK
        string name
        string description
        int subject_id FK
        datetime created_at
        datetime updated_at
    }
    
    Quiz {
        int id PK
        int chapter_id FK
        string name
        datetime date_of_quiz
        string time_duration
        string remarks
        datetime created_at
        datetime updated_at
    }
    
    Question {
        int id PK
        int quiz_id FK
        string question_statement
        string option1
        string option2
        string option3
        string option4
        int correct_option
        int points
    }
    
    Score {
        int id PK
        int quiz_id FK
        int user_id FK
        datetime timestamp
        int user_score
        int number_of_correct_answers
    }
    
    QuizSignup {
        int user_id PK,FK
        int quiz_id PK,FK
        datetime signup_time
    }
    
    QuestionAttempt {
        int id PK
        int score_id FK
        int question_id FK
        int selected_option
        bool is_correct
    }
    
    Subject ||--o{ Chapter : "has"
    Chapter ||--o{ Quiz : "has"
    Quiz ||--o{ Question : "contains"
    Quiz ||--o{ Score : "has"
    User ||--o{ Score : "has"
    User ||--o{ QuizSignup : "makes"
    Quiz ||--o{ QuizSignup : "receives"
    Score ||--o{ QuestionAttempt : "contains"
    Question ||--o{ QuestionAttempt : "referenced in"
```

## TODO

- [ ] **TESTs** are out of sync with the code. Update the tests and add tests for new endpoints
- [ ] Update Pydantic Schemas
- [ ] Update OpenAPI schema and docs
- [ ] Dockerize the app
- [ ] Find a better way to handle configs, `config.py` and environment variables in `.env` file
- [ ] Better error handling and logging


## Other Tools Used

### Convert Mermaid to Image

```bash
# Install mermaid.cli
npm install -g @mermaid-js/mermaid-cli

# Convert to PNG
mmdc -i README.md -o db-schema.png --scale 3 # Use scale for higher DPI

# OR Use npx without installing globally
npx mmdc -i db-schema.mmd -o db-schema.svg  # Use SVG
```


### Convert README to PDF

```bash
# Install pandoc
brew install pandoc

# For macOS
brew install basictex

# Convert to PDF
pandoc README.md -o README.pdf
pandoc README.md -o README.pdf -V pagestyle=empty # Remove page numbers
pandoc README.md -o README.pdf -V pagestyle=empty -V geometry:margin=1in # Set margin
```