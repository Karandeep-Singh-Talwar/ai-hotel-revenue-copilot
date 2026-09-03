import sys
import os

# Add the parent directory to sys.path if needed
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.main import run_job

if __name__ == "__main__":
    run_job()
