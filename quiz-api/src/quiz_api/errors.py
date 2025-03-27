"""Error handlers for the quiz API."""

from http import HTTPStatus
from typing import Any

from flask import Flask, current_app, jsonify
from pydantic import ValidationError

from quiz_api.models.database import db


def register_error_handlers(app: Flask):
    @app.errorhandler(ValidationError)
    def handle_pydantic_validation_error(exc: ValidationError):
        errors = exc.errors()
        content = {
            "details": [
                {
                    "msg": error["msg"],
                    "input": error["input"],
                }
                for error in errors
            ]
        }
        current_app.logger.error(f"Pydantic validation error: {content}")
        return jsonify(content), HTTPStatus.BAD_REQUEST

    @app.errorhandler(HTTPStatus.NOT_FOUND)
    def handle_not_found(exc: Exception):
        current_app.logger.error(f"Resource not found: {exc}")
        return jsonify({"message": "Resource not found"}), HTTPStatus.NOT_FOUND

    @app.errorhandler(HTTPStatus.INTERNAL_SERVER_ERROR)
    def handle_server_error(exc: Exception | Any):
        current_app.logger.error(f"Internal server error: {exc}")
        if db.session.is_active:
            current_app.logger.info("Rolling back session")
            db.session.rollback()
        return jsonify({"message": "Internal server error"}), HTTPStatus.INTERNAL_SERVER_ERROR
