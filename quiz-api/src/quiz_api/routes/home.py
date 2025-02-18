# @TODO: REMOVE HTML RENDERING and all the html files

from flask import (
    Blueprint,
    render_template,
)

from quiz_api.config import TEMPLATE_DIR

home_bp = Blueprint("home", __name__, template_folder=TEMPLATE_DIR)


@home_bp.route("/")
def home():
    return render_template("home.html")
