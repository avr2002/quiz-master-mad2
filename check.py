# uv run check.py

from pathlib import Path

import checksumdir

THIS_DIR = Path(__file__).parent


hash = checksumdir.dirhash(THIS_DIR)
print("Directory Checksum:", hash)
