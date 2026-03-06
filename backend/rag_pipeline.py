import os
import logging
from typing import List, Dict, Any

from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Directory where ChromaDB will persist the vectors
PERSIST_DIRECTORY = "./chroma_db"

def get_embeddings():
    """Initializes and returns OpenAI embeddings."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key or api_key == "your_openai_api_key_here":
        raise ValueError("OPENAI_API_KEY environment variable is missing or invalid.")
    return OpenAIEmbeddings()

def get_llm():
    """Initializes and returns the ChatOpenAI model."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key or api_key == "your_openai_api_key_here":
        raise ValueError("OPENAI_API_KEY environment variable is missing or invalid.")
    return ChatOpenAI(model="gpt-3.5-turbo", temperature=0)

def get_vector_store():
    """Initializes ChromaDB with the OpenAI embeddings."""
    return Chroma(
        persist_directory=PERSIST_DIRECTORY, 
        embedding_function=get_embeddings()
    )

def ingest_documents(chunks: List[str], source_name: str) -> bool:
    """
    Takes a list of text chunks, embeds them, and stores them in ChromaDB.
    """
    vectorstore = get_vector_store()
    
    metadatas = [{"source": source_name, "chunk_index": i} for i in range(len(chunks))]
    
    # Add texts to vector store; Chroma handles persistence automatically.
    vectorstore.add_texts(texts=chunks, metadatas=metadatas)
    
    return True

def query_rag_pipeline(query: str) -> Dict[str, Any]:
    """
    Retrieves context from the vector DB and uses the LLM to answer the user's query.
    """
    vectorstore = get_vector_store()
    llm = get_llm()
    
    # Setup Retriever: Fetch top 5 most similar chunks
    retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
    
    # Define RAG Prompt
    template = """You are an intelligent document assistant. Answer the question based ONLY on the following context derived from uploaded documents. 
If you cannot answer the question based on the context, politely respond that you do not have enough information in the provided documents to answer that. Let your tone be professional and precise.

Context:
{context}

Question: {question}

Answer:"""
    prompt = ChatPromptTemplate.from_template(template)
    
    def format_docs(docs):
        return "\n\n".join(f"Document: {doc.metadata.get('source', 'Unknown')}\nContent: {doc.page_content}" for doc in docs)
        
    # Build Langchain Expression Language (LCEL) chain
    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )
    
    try:
        # Generate the answer
        response = rag_chain.invoke(query)
        
        # Retrieve sources to send back to the user
        docs = retriever.invoke(query)
        sources = list(set([doc.metadata.get("source", "Unknown") for doc in docs]))
        
        return {
            "answer": response,
            "sources": sources
        }
    except Exception as e:
        logger.error(f"Error querying RAG pipeline: {e}")
        raise ValueError(f"RAG pipeline error: {str(e)}")
