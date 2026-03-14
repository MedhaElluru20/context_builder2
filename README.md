## Research Paper Context Builder

A small web app that helps you quickly understand research papers by turning a PDF into a concise, structured context summary.

The app extracts text from a PDF and asks an LLM to summarise it into clear sections like **Key Findings**, **Evidence & Methodology**, **Limitations & Improvements**, **Future Work**, and **Practical Implications**.

### Features

- **PDF upload**: Drop in any research paper in PDF format.
- **Automatic text extraction**: Uses `PyPDF2` to read the text from each page.
- **Structured summary**: Short bullet-point sections designed to be skimmable.
- **User‑friendly UI**: Built with Streamlit; runs locally in your browser.

### 1. Prerequisites

- Python 3.9+ installed
- An OpenAI API key (or compatible API) with access to the specified model

### 2. Installation

From the project folder (`Context_builder`):

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Environment variables

Create a `.env` file in the project root with:

```bash
OPENAI_API_KEY=your_api_key_here
# Optional – override the default model:
OPENAI_MODEL=gpt-4.1-mini
```

> You can also set these as normal environment variables instead of using a `.env` file.

### 4. Run the app

From the project root:

```bash
streamlit run app.py
```

Then open the URL shown in the terminal (usually `http://localhost:8501`) in your browser.

### 5. Usage

1. Upload a research paper PDF from the left sidebar.
2. (Optional) Toggle **Show extracted text preview** to inspect what was read from the PDF.
3. Click **Generate Context Summary**.
4. Read the structured summary on the right side of the page.

Each segment is intentionally short and concise, making it easy to build context quickly and compare multiple papers.

