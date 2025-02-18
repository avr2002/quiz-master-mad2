"""Initialize the database."""

from flask_sqlalchemy import SQLAlchemy

# from sqlalchemy.orm import DeclarativeBase

# Custom base class for all models
# class Base(DeclarativeBase):
#     pass


# # Initialize SQLAlchemy with the custom base class
# db: "SQLAlchemy" = SQLAlchemy(model_class=Base)

# Initialize SQLAlchemy without a model class
db = SQLAlchemy()
