#!/bin/bash

# Union Clips AI Worker - Run Script

cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "🔧 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "📦 Installing dependencies..."
pip install -q -r requirements.txt

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "   Copy .env.example to .env and configure your API keys"
    exit 1
fi

# Run the server
echo "🚀 Starting Union Clips AI Worker on http://localhost:8000"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
