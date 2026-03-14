#!/usr/bin/env python
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "streamlit>=1.40.0",
#     "PyPDF2>=3.0.0",
#     "python-dotenv>=1.0.0",
#     "google-generativeai>=0.8.0",
#     "graphviz>=0.20.0",
#     "requests>=2.32.0",
# ]
# ///
"""
Run the Streamlit application.
This script launches the Research Paper Context Builder app.
"""

import subprocess
import sys

# Run streamlit with the app.py from the parent directory
result = subprocess.run(
    [sys.executable, "-m", "streamlit", "run", "../app.py", "--server.port=3000", "--server.address=0.0.0.0"]
)

sys.exit(result.returncode)
