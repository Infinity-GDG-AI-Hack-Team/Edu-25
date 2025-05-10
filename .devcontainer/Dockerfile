FROM fedora:latest

RUN sudo dnf install -y \
    util-linux-user \
    git zsh xdg-desktop-portal \
    poetry awk python3.12 nodejs

WORKDIR /app

COPY pyproject.toml poetry.lock* ./

RUN poetry config virtualenvs.in-project true

RUN poetry env use python3.12

# Install dependencies
RUN poetry install

# Add virtualenv bin to PATH
ENV PATH="/app/.venv/bin:$PATH"

# Now copy the rest of your app
COPY . .

# Copy .env file if it exists (will be ignored if not present in build context)
COPY .env* ./

# Expose the port
EXPOSE 8000

# Set up the entrypoint directly instead of creating a separate script
WORKDIR /app
ENV PYTHONPATH=/app:$PYTHONPATH

# Use ENTRYPOINT to set up the environment
ENTRYPOINT ["bash", "-c", "poetry run uvicorn main:app --reload --host 0.0.0.0 --port 8000"]
