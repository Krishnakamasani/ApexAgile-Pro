FROM python:3.13-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend and precompiled static assets
COPY backend/ ./backend/

ENV PYTHONPATH=/app/backend
EXPOSE 8001

CMD ["python", "backend/run.py"]
