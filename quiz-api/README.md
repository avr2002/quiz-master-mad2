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


## TODO

- [ ] **TESTs** are out of sync with the code. Update the tests and add tests for new endpoints
- [ ] Update Pydantic Schemas
- [ ] Update OpenAPI schema and docs
- [ ] Dockerize the app
- [ ] Find a better way to handle configs, `config.py` and environment variables in `.env` file
- [ ] Better error handling and logging
