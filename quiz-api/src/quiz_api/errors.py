"""Error handlers for the quiz API."""

from http import HTTPStatus

from flask import (
    Flask,
    jsonify,
)
from pydantic import ValidationError


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
        return jsonify(content), HTTPStatus.BAD_REQUEST

    @app.errorhandler(HTTPStatus.NOT_FOUND)
    def handle_not_found(exc: Exception):
        return jsonify({"message": "Resource not found"}), HTTPStatus.NOT_FOUND

    @app.errorhandler(HTTPStatus.INTERNAL_SERVER_ERROR)
    def handle_server_error(exc: Exception):
        return jsonify({"message": "Internal server error"}), HTTPStatus.INTERNAL_SERVER_ERROR
