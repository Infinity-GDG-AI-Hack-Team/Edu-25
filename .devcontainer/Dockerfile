FROM fedora:latest

RUN sudo dnf install -y \
    util-linux-user \
    git zsh xdg-desktop-portal \
    poetry awk python3.12


COPY pyproject.toml poetry.lock* ./

RUN poetry config virtualenvs.in-project true

RUN poetry env use python3.12

# Install dependencies (this will create the .venv folder in /app)
# RUN poetry install

# Add virtualenv bin to PATH
# ENV PATH="/app/.venv/bin:$PATH"

# # Now copy the rest of your app
# COPY . .

# # Set the default entrypoint using poetry env
# CMD ["python"]