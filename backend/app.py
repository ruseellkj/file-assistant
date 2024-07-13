import os
from dotenv import load_dotenv
from transformers import pipeline
from flask import Flask, request, jsonify
from flask_cors import CORS
from docx import Document
import fitz

app = Flask(__name__)
CORS(app)

# Load environment variables from .env file
load_dotenv()

# Initialize the BERT QA model from environment variable
qa_model_name = os.getenv('MODEL_NAME')
qa_pipeline = pipeline("question-answering", model=qa_model_name)

uploaded_document_text = None  # Global variable to store document text

ALLOWED_EXTENSIONS = {'pdf', 'txt', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(pdf_file):
    app.logger.debug("Starting PDF extraction")
    doc = fitz.open(stream=pdf_file.read(), filetype="pdf")
    text = ""
    for page_num in range(len(doc)):
        text += doc[page_num].get_text()
    app.logger.debug("Finished PDF extraction")
    return text

def extract_text_from_docx(docx_file):
    app.logger.debug("Starting DOCX extraction")
    doc = Document(docx_file)
    text = '\n'.join([paragraph.text for paragraph in doc.paragraphs])
    app.logger.debug("Finished DOCX extraction")
    return text

def extract_text_from_txt(txt_file):
    app.logger.debug("Starting TXT file reading")
    text = txt_file.read().decode('utf-8')
    app.logger.debug("Finished TXT file reading")
    return text

@app.route('/upload', methods=['POST'])
def upload_file():
    global uploaded_document_text
    app.logger.debug("Upload endpoint called")

    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})

    uploaded_file = request.files['file']

    if uploaded_file.filename == '':
        return jsonify({'error': 'No selected file'})

    if not allowed_file(uploaded_file.filename):
        return jsonify({'error': 'Unsupported file type. Please upload a PDF, DOCX, or TXT file.'})

    try:
        if uploaded_file.filename.lower().endswith('.pdf'):
            uploaded_document_text = extract_text_from_pdf(uploaded_file)
        elif uploaded_file.filename.lower().endswith('.docx'):
            uploaded_document_text = extract_text_from_docx(uploaded_file)
        elif uploaded_file.filename.lower().endswith('.txt'):
            uploaded_document_text = extract_text_from_txt(uploaded_file)
        else:
            raise ValueError("Unsupported file type. Please upload a PDF, DOCX, or TXT file.")

        app.logger.debug("Document text extracted")
        return jsonify({'text': uploaded_document_text})
    except Exception as e:
        app.logger.error(f"Error during document extraction: {str(e)}")
        return jsonify({'error': str(e)})

@app.route('/answer', methods=['POST'])
def answer_question():
    app.logger.debug("Answer endpoint called")
    data = request.get_json()
    app.logger.debug(f"Received data: {data}")
    query = data.get('query', '')  # Use 'query' instead of 'question'

    if not query:
        return jsonify({'error': 'Missing query'})

    global uploaded_document_text

    if not uploaded_document_text:
        return jsonify({'error': 'No document text available. Upload a PDF, DOCX, or TXT file first.'})

    try:
        app.logger.debug("Calling QA model")
        answer = qa_pipeline({'question': query, 'context': uploaded_document_text})
        app.logger.debug(f"Answer: {answer}")
        return jsonify(answer)
    except Exception as e:
        app.logger.error(f"Error during QA processing: {str(e)}")
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True, threaded=True)
