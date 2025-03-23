# Quiz API

## Setup

1. `cd quiz-api`
2. Create a `.env` file based on `.env.example`
3. Create a virtual environment and install the dependencies

    ```bash
    uv venv
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

- [ ] Add Pydantic Validation Tests
- [ ] Update OpenAPI schema and docs, if required
- [ ] Dockerize the app
- [ ] Update README.md with latest information
- [ ] Centralize the run.sh & Makefile commands to the root directory
- [ ] Find a better way to handle configs, `config.py` and environment variables in `.env` file
- [ ] Better error handling and logging
