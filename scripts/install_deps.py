#!/usr/bin/env python
"""
Install dependencies for the Streamlit application.
"""

import subprocess
import sys

packages = [
    "streamlit>=1.40.0",
    "PyPDF2>=3.0.0", 
    "python-dotenv>=1.0.0",
    "google-generativeai>=0.8.0",
    "graphviz>=0.20.0",
    "requests>=2.32.0",
]

for package in packages:
    print(f"Installing {package}...")
    subprocess.run([sys.executable, "-m", "pip", "install", package], check=True)

print("All dependencies installed successfully!")
