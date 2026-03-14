#!/usr/bin/env python
"""
Run the Streamlit application.
This script launches the Research Paper Context Builder app.
"""

import subprocess
import sys
import os

# Change to the project root directory
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(project_root)

# Run streamlit
result = subprocess.run(
    [sys.executable, "-m", "streamlit", "run", "app.py", "--server.port=3000", "--server.address=0.0.0.0"],
    cwd=project_root
)

sys.exit(result.returncode)
