# Use Python 3.9 as the base image
FROM python:3.9

# Set working directory
WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose port 8003
EXPOSE 8003

# Command to run the application
CMD ["python", "-m", "ingestion.parser"]