FROM python:3.12-slim AS prepare

WORKDIR /deps

RUN --mount=type=bind,src=requirements.txt,dst=requirements.txt \
    --mount=type=cache,dst=/root/.cache/pip \
    pip wheel -r requirements.txt --wheel-dir ./wheels


FROM python:3.12-slim AS base

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        libpq5 \
    && rm -rf /var/lib/apt/lists/*

RUN --mount=type=bind,from=prepare,src=/deps/wheels,dst=./wheels \
    --mount=type=cache,dst=/root/.cache/pip \
    pip install ./wheels/*

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
