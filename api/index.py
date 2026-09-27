import sys
import os

# Add the root directory to the sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import the FastAPI app instance from the backend
from backend.app.main import app

# This file is used by Vercel Serverless Functions to start the FastAPI application
