.PHONY: *

# Execute the "targets" in this file with `make <target>` e.g., `make test`.

# You can also run multiple in sequence, e.g. `make clean lint test serve-coverage-report`


clean:
	bash run.sh clean

help:
	bash run.sh help

