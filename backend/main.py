from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging

from document_processor import process_document
from rag_pipeline import ingest_documents, query_rag_pipeline, summarize_document

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Smart Document Insights API",
    description="Backend API for intelligent document ingestion, RAG-based querying, and AI summarization powered by Google Gemini.",
    version="2.0.0"
)

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, lock this down to the frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    query: str


@app.get("/", tags=["Health"])
def read_root():
    return {"status": "ok", "message": "Smart Insights API v2.0 (Gemini-powered) is running."}


@app.post("/upload", tags=["Documents"])
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a PDF or DOCX document. The backend will:
    1. Extract text content from the file.
    2. Split it into semantic chunks.
    3. Generate Google embeddings for each chunk.
    4. Store embeddings in the local ChromaDB vector database.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No valid file matched upload signature.")

    allowed_types = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword"
    }
    if file.content_type and file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: '{file.content_type}'. Please upload a PDF or DOCX file."
        )

    try:
        logger.info(f"Receiving file for processing: '{file.filename}' ({file.content_type})")
        contents = await file.read()

        # 1. Extract text and chunk document
        chunks = process_document(file.filename, contents)

        # 2. Embed and ingest into ChromaDB
        ingest_documents(chunks, source_name=file.filename)

        logger.info(f"Successfully ingested '{file.filename}' with {len(chunks)} chunks.")
        return {
            "message": f"Successfully processed '{file.filename}'.",
            "chunks_embedded": len(chunks),
            "filename": file.filename
        }
    except ValueError as ve:
        logger.error(f"ValueError during document processing: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Unexpected error during upload: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred while processing the document.")


@app.post("/query", tags=["Analysis"])
async def query_documents(request: QueryRequest):
    """
    Ask a natural language question about the uploaded documents.
    The backend will:
    1. Retrieve the most relevant chunks from ChromaDB.
    2. Pass them as context to Gemini for a grounded answer.
    3. Return the answer along with the source document references.
    """
    if not request.query or not request.query.strip():
        raise HTTPException(status_code=400, detail="Query string cannot be empty.")

    try:
        logger.info(f"Received query: '{request.query}'")
        result = query_rag_pipeline(request.query)
        return result
    except ValueError as ve:
        logger.error(f"Pipeline error: {ve}")
        raise HTTPException(status_code=500, detail=str(ve))
    except Exception as e:
        logger.error(f"Unexpected error during query: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve an answer due to an internal error.")


@app.post("/summarize", tags=["Analysis"])
async def summarize_document_endpoint(source_name: str = Query(..., description="The filename of the document to summarize")):
    """
    Generate a structured executive summary of a previously uploaded document.
    The AI will analyze all stored document chunks and produce a comprehensive summary
    including key points, main topics, and notable details.
    """
    if not source_name or not source_name.strip():
        raise HTTPException(status_code=400, detail="source_name query parameter cannot be empty.")

    try:
        logger.info(f"Generating summary for document: '{source_name}'")
        result = summarize_document(source_name)
        return result
    except ValueError as ve:
        logger.error(f"Summary error: {ve}")
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Unexpected error during summarization: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate a document summary.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
