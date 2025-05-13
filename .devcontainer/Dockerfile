FROM fedora:latest AS build


ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app:$PYTHONPATH
WORKDIR /app

RUN sudo dnf install -y \
    util-linux-user git poetry awk python3.12 nodejs

COPY pyproject.toml poetry.lock* ./
RUN poetry config virtualenvs.in-project true
RUN poetry env use python3.12

# By creatign the environment with .venv we can set its PATH 
# and avoid moving it to the workspace folder
RUN python3.12 -m venv /app/.venv/
ENV PATH="/app/.venv/bin:$PATH" VIRTUAL_ENV=/app/.venv/
RUN poetry install

# Expose the port
EXPOSE 8000

FROM build AS prod

# Now copy the rest of your app
COPY . .

# Use ENTRYPOINT to set up the environment
ENTRYPOINT ["bash", "-c", "uvicorn main:app --reload --host 0.0.0.0 --port 8000"]
