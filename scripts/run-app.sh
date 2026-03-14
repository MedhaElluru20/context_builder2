#!/bin/bash
cd /vercel/share/v0-project
pip install -r requirements.txt
streamlit run app.py --server.port 8501 --server.headless true
