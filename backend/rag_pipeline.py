import os
import logging
from typing import List, Dict, Any

from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Directory where ChromaDB will persist the vectors
PERSIST_DIRECTORY = "./chroma_db"

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")

def _validate_api_key():
    """Validates that the Google API key is present."""
    if not GOOGLE_API_KEY or GOOGLE_API_KEY == "your_google_api_key_here":
        raise ValueError(
            "GOOGLE_API_KEY environment variable is missing or not configured. "
            "Please set it in the backend/.env file."
        )

def get_embeddings():
    """Initializes and returns Google Generative AI Embeddings."""
    _validate_api_key()
    return GoogleGenerativeAIEmbeddings(
        model="models/embedding-001",
        google_api_key=GOOGLE_API_KEY
    )

def get_llm():
    """Initializes and returns the Gemini Pro Chat model."""
    _validate_api_key()
    return ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=GOOGLE_API_KEY,
        temperature=0.2,
        convert_system_message_to_human=True
    )

def get_vector_store():
    """Initializes ChromaDB with Google Generative AI embeddings."""
    return Chroma(
        persist_directory=PERSIST_DIRECTORY,
        embedding_function=get_embeddings()
    )

def ingest_documents(chunks: List[str], source_name: str) -> bool:
    """
    Takes a list of text chunks, embeds them using Google embeddings,
    and stores them in ChromaDB.
    """
    vectorstore = get_vector_store()

    metadatas = [{"source": source_name, "chunk_index": i} for i in range(len(chunks))]

    # Add texts to vector store; Chroma handles persistence automatically.
    vectorstore.add_texts(texts=chunks, metadatas=metadatas)
    logger.info(f"Ingested {len(chunks)} chunks from '{source_name}' into ChromaDB.")

    return True

def query_rag_pipeline(query: str) -> Dict[str, Any]:
    """
    Retrieves context from the vector DB and uses Gemini to answer the user's query.
    Returns the answer and the source documents used.
    """
    vectorstore = get_vector_store()
    llm = get_llm()

    # Setup Retriever: Fetch top 5 most semantically similar chunks
    retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 5}
    )

    # Professional RAG system prompt
    template = """You are a highly intelligent and professional document analysis assistant powered by Google Gemini.

Your task is to answer the user's question based STRICTLY on the provided document context below. Follow these rules:
1. Only use information from the provided context. Do NOT use prior knowledge.
2. If the answer cannot be found in the context, clearly state: "I could not find relevant information in the uploaded document to answer this question."
3. Be precise, concise, and professional in your tone.
4. If citing specific facts or figures, be accurate.
5. Format your response using Markdown when relevant (e.g., bullet points for lists, bold for key terms).

--- DOCUMENT CONTEXT ---
{context}
--- END CONTEXT ---

User Question: {question}

Answer:"""

    prompt = ChatPromptTemplate.from_template(template)

    def format_docs(docs):
        return "\n\n---\n\n".join(
            f"[Source: {doc.metadata.get('source', 'Unknown')} | Chunk {doc.metadata.get('chunk_index', '?')}]\n{doc.page_content}"
            for doc in docs
        )

    # Build LCEL RAG chain
    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    try:
        # Generate the answer
        logger.info(f"Running RAG pipeline for query: '{query}'")
        response = rag_chain.invoke(query)

        # Retrieve sources to send back to the user
        docs = retriever.invoke(query)
        sources = list(set([doc.metadata.get("source", "Unknown") for doc in docs]))

        return {
            "answer": response,
            "sources": sources
        }
    except Exception as e:
        logger.error(f"Error querying RAG pipeline: {e}", exc_info=True)
        raise ValueError(f"RAG pipeline error: {str(e)}")


def summarize_document(source_name: str) -> Dict[str, Any]:
    """
    Retrieves all chunks for a given document and generates an executive summary.
    """
    vectorstore = get_vector_store()
    llm = get_llm()

    # Retrieve all chunks belonging to this document
    collection = vectorstore.get(where={"source": source_name})
    all_docs_text = "\n\n".join(collection.get("documents", []))

    if not all_docs_text.strip():
        raise ValueError(f"No document content found in the store for '{source_name}'.")

    # Truncate to a safe limit for the LLM context window
    max_chars = 30000
    if len(all_docs_text) > max_chars:
        all_docs_text = all_docs_text[:max_chars] + "\n\n[... document truncated for summary ...]"

    summary_prompt = ChatPromptTemplate.from_template(
        """You are an expert document analyst. Analyze the following document content and provide a comprehensive executive summary.

Structure your summary with these sections:
## 📋 Executive Summary
A 2-3 sentence high-level overview.

## 🔑 Key Points
A bulleted list of the most important facts, findings, or clauses.

## 📊 Main Topics
The primary subjects or themes covered in this document.

## ⚠️ Notable Details
Any critical dates, figures, names, or requirements mentioned.

--- DOCUMENT CONTENT ---
{document}
--- END DOCUMENT ---

Summary:"""
    )

    chain = summary_prompt | llm | StrOutputParser()
    summary = chain.invoke({"document": all_docs_text})

    return {"summary": summary, "source": source_name}
