from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging

from document_processor import process_document
from rag_pipeline import ingest_documents, query_rag_pipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Antigravity Document Insights API",
    description="Backend API for document ingestion and RAG-based natural language querying.",
    version="1.0.0"
)

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, lock this down to the frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Antigravity Pipeline is Running."}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Endpoint to process an uploaded document, text will be extracted, 
    chunked, and embedded into the local Vector DB.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No valid file matched upload signature.")
        
    try:
        logger.info(f"Receiving file for processing: {file.filename}")
        contents = await file.read()
        
        # 1. Process Document and Chunk it
        chunks = process_document(file.filename, contents)
        
        # 2. Ingest into Vector DB
        ingest_documents(chunks, source_name=file.filename)
        
        return {
            "message": f"Successfully ingested {file.filename}",
            "chunks_embedded": len(chunks)
        }
    except ValueError as ve:
        logger.error(f"ValueError during document processing: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Unexpected error during upload: {e}")
        raise HTTPException(status_code=500, detail="An error occurred processing the document.")

@app.post("/query")
async def query_documents(request: QueryRequest):
    """
    Endpoint to receive a natural language query, retrieve relevant context 
    from ChromaDB, and generate an answer using the LLM.
    """
    if not request.query or not request.query.strip():
        raise HTTPException(status_code=400, detail="Query string cannot be empty.")
        
    try:
        logger.info(f"Received query: {request.query}")
        result = query_rag_pipeline(request.query)
        return result
    except ValueError as ve:
        # Handle cases where API keys are missing or invalid
        logger.error(f"Pipeline error: {ve}")
        raise HTTPException(status_code=500, detail=str(ve))
    except Exception as e:
        logger.error(f"Unexpected error during query: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve an answer due to an internal error.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
