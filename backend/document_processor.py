import os
import io
from pypdf import PdfReader
import docx
from langchain_text_splitters import RecursiveCharacterTextSplitter

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts text from a PDF file."""
    reader = PdfReader(io.BytesIO(file_bytes))
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"
    return text

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extracts text from a DOCX file."""
    doc = docx.Document(io.BytesIO(file_bytes))
    text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
    return text

def process_document(filename: str, file_bytes: bytes) -> list[str]:
    """
    Determines the file type, extracts text, and chunks it into smaller pieces
    for vector embedding and storage.
    """
    ext = os.path.splitext(filename)[1].lower()
    text = ""
    if ext == ".pdf":
        text = extract_text_from_pdf(file_bytes)
    elif ext in [".doc", ".docx"]:
        text = extract_text_from_docx(file_bytes)
    else:
        raise ValueError(f"Unsupported file format: {ext}. Only PDF and DOCX are supported.")
    
    if not text.strip():
        raise ValueError("Could not extract any meaningful text from the document.")

    # Split text into chunks using LangChain
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    chunks = text_splitter.split_text(text)
    
    return chunks
