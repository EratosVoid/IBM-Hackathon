"""
Document Processor Service
Handles document upload, storage, and RAG queries using LlamaIndex and WatsonX
"""

import os
import uuid
import logging
import time
from typing import List, Dict, Any, Optional
from datetime import datetime
import aiofiles
from fastapi import UploadFile

# Import LlamaIndex components with error handling
try:
    from llama_index.core import (
        VectorStoreIndex, Document, StorageContext
    )
    from llama_index.core.settings import Settings
    from llama_index.embeddings.ibm import WatsonxEmbeddings
    from llama_index.llms.ibm import WatsonxLLM
    from llama_index.vector_stores.chroma import ChromaVectorStore
    from llama_index.readers.file import PDFReader, DocxReader, MarkdownReader
except ImportError as e:
    # Fallback for older versions
    try:
        from llama_index import (
            VectorStoreIndex, Document, StorageContext
        )
        from llama_index.core.settings import Settings
        from llama_index.embeddings.ibm import WatsonxEmbeddings
        from llama_index.llms.ibm import WatsonxLLM
        from llama_index.vector_stores.chroma import ChromaVectorStore
        from llama_index.readers.file import PDFReader, DocxReader, MarkdownReader
    except ImportError:
        raise ImportError(f"Could not import LlamaIndex components: {e}")

# Import ChromaDB with error handling
try:
    import chromadb
except ImportError as e:
    raise ImportError(f"ChromaDB is required but could not be imported: {e}")

from .models import DocumentInfo, QueryResponse, QueryHistory

logger = logging.getLogger(__name__)

# Now we can use logger
try:
    logger.info(f"ChromaDB version: {chromadb.__version__}")
except Exception:
    pass  # Logger might not be fully initialized yet

def create_settings(embed_model=None, llm=None):
    """Create Settings object compatible with different LlamaIndex versions"""
    try:
        logger.info("Creating Settings with WatsonX models...")
        
        # For LlamaIndex 0.10.x - Settings is a singleton instance
        if embed_model:
            logger.info(f"Setting WatsonX embed_model on global Settings: {type(embed_model)}")
            try:
                # Settings is a singleton, so we modify it directly
                Settings.embed_model = embed_model
                logger.info(f"Settings updated successfully with embed_model: {type(Settings.embed_model)}")
            except Exception as embed_error:
                logger.error(f"Failed to set embed_model on Settings: {embed_error}")
                raise embed_error
        
        if llm:
            logger.info(f"Setting WatsonX LLM on global Settings: {type(llm)}")
            try:
                # Settings is a singleton, so we modify it directly
                Settings.llm = llm
                logger.info(f"Settings updated successfully with LLM: {type(Settings.llm)}")
            except Exception as llm_error:
                logger.error(f"Failed to set LLM on Settings: {llm_error}")
                raise llm_error
        
        # Verify the settings were applied
        logger.info(f"Final Settings.embed_model: {getattr(Settings, 'embed_model', 'NOT SET')}")
        logger.info(f"Final Settings.llm: {getattr(Settings, 'llm', 'NOT SET')}")
        
        return Settings
    except Exception as e:
        logger.error(f"Could not set custom models on Settings: {e}")
        logger.error(f"Settings error type: {type(e)}")
        import traceback
        logger.error(f"Settings traceback: {traceback.format_exc()}")
        # Return the default Settings but log the error
        return Settings

class DocumentProcessor:
    """Handles document processing, storage, and RAG queries"""
    
    def __init__(self):
        """Initialize the document processor with WatsonX and ChromaDB"""
        # Debug: Check environment variables at initialization
        logger.info("=== DocumentProcessor Initialization ===")
        logger.info(f"WATSONX_APIKEY: {'SET' if os.getenv('WATSONX_APIKEY') else 'NOT SET'}")
        logger.info(f"WATSONX_URL: {os.getenv('WATSONX_URL', 'NOT SET')}")
        logger.info(f"WATSONX_PROJECT_ID: {os.getenv('WATSONX_PROJECT_ID', 'NOT SET')}")
        logger.info(f"EMBEDDING_MODEL_ID: {os.getenv('EMBEDDING_MODEL_ID', 'NOT SET')}")
        logger.info("========================================")
        
        # Get the directory where this script is located
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)
        
        self.documents_dir = os.path.join(project_root, "documents")
        self.chroma_persist_dir = os.getenv("CHROMA_PERSIST_DIR", os.path.join(project_root, "chroma_db"))
        self.documents_db = {}  # In-memory document metadata store
        self.query_history = []
        
        logger.info(f"Script directory: {script_dir}")
        logger.info(f"Project root: {project_root}")
        logger.info(f"Documents directory: {self.documents_dir}")
        logger.info(f"ChromaDB directory: {self.chroma_persist_dir}")
        
        # Create necessary directories
        os.makedirs(self.documents_dir, exist_ok=True)
        os.makedirs(self.chroma_persist_dir, exist_ok=True)
        
        # Initialize WatsonX components
        self._init_watsonx()
        
        # Verify WatsonX LLM is working
        if not hasattr(self, 'llm') or not self.llm:
            logger.error("WatsonX LLM initialization failed. Cannot proceed without a working LLM.")
            raise ValueError("WatsonX LLM is required but not available. Please check your WatsonX configuration.")
        
        # Initialize ChromaDB and vector store
        self._init_vector_store()
        
        # Load existing documents if any
        self._load_existing_documents()
    
    def _init_watsonx(self):
        """Initialize WatsonX embedding model as per official LlamaIndex docs"""
        try:
            # WatsonX configuration as per official docs
            watsonx_api_key = os.getenv("WATSONX_APIKEY")
            watsonx_url = os.getenv("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")
            watsonx_project_id = os.getenv("WATSONX_PROJECT_ID")
            
            logger.info(f"WatsonX initialization - API Key: {'SET' if watsonx_api_key else 'NOT SET'}")
            logger.info(f"WatsonX initialization - URL: {watsonx_url}")
            logger.info(f"WatsonX initialization - Project ID: {'SET' if watsonx_project_id else 'NOT SET'}")
            
            if not watsonx_api_key or not watsonx_project_id:
                logger.error("WatsonX credentials not found!")
                logger.error(f"Missing: API Key: {not watsonx_api_key}, Project ID: {not watsonx_project_id}")
                logger.error("Please set the following environment variables:")
                logger.error("  WATSONX_APIKEY=your_api_key_here")
                logger.error("  WATSONX_PROJECT_ID=your_project_guid_here")
                logger.error("Example project GUID format: 12ac4cf1-252f-424b-b52d-5cdd9814987f")
                logger.error("You can find your project GUID in the IBM WatsonX console under Projects")
                # Fallback to local models if WatsonX not configured
                self.embedding_model = None
                return
            
            # Get model ID from environment
            embedding_model_id = os.getenv("EMBEDDING_MODEL_ID", "ibm/slate-125m-english-rtrvr")
            logger.info(f"Using embedding model ID: {embedding_model_id}")
            
            # Validate project ID format (should be a UUID)
            import re
            uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
            if not uuid_pattern.match(watsonx_project_id):
                logger.error(f"Invalid project ID format: {watsonx_project_id}")
                logger.error("Project ID must be a valid UUID format (e.g., 12ac4cf1-252f-424b-b52d-5cdd9814987f)")
                logger.error("You can find your project GUID in the IBM WatsonX console under Projects")
                raise ValueError(f"Invalid project ID format: {watsonx_project_id}. Expected UUID format.")
            
            # Initialize WatsonX embedding model as per official documentation
            logger.info("Creating WatsonxEmbeddings instance...")
            try:
                self.embedding_model = WatsonxEmbeddings(
                    model_id=embedding_model_id,
                    url=watsonx_url,
                    project_id=watsonx_project_id,
                    truncate_input_tokens=3  # As shown in official docs
                )
                logger.info(f"WatsonX embedding model created successfully")
                
                # Test the embedding model with a simple call
                logger.info("Testing WatsonX embedding model with a simple text...")
                test_embedding = self.embedding_model.get_text_embedding("test")
                logger.info(f"Test embedding successful, length: {len(test_embedding)}")
                
            except Exception as embed_error:
                logger.error(f"Error creating or testing WatsonX embedding model: {str(embed_error)}")
                logger.error(f"Embedding error type: {type(embed_error)}")
                import traceback
                logger.error(f"Embedding traceback: {traceback.format_exc()}")
                raise embed_error
            
            logger.info(f"WatsonX embedding model initialized successfully with {embedding_model_id}")
            
            # Initialize WatsonX LLM for text generation
            try:
                logger.info("Initializing WatsonX LLM...")
                model_name = os.getenv("MODEL_NAME", "ibm/granite-3-2-8b-instruct")
                logger.info(f"Using LLM model: {model_name}")
                
                # Test the LLM with a simple call to ensure it's working
                logger.info("Creating WatsonX LLM instance...")
                self.llm = WatsonxLLM(
                    model_id=model_name,
                    url=watsonx_url,
                    project_id=watsonx_project_id,
                    api_key=watsonx_api_key
                )
                logger.info(f"WatsonX LLM instance created successfully with {model_name}")
                
                # Test the LLM with a simple completion to ensure it's working
                logger.info("Testing WatsonX LLM with a simple completion...")
                try:
                    test_response = self.llm.complete("Hello, this is a test.")
                    logger.info(f"LLM test successful: {str(test_response)}")
                except Exception as test_error:
                    logger.error(f"LLM test failed: {str(test_error)}")
                    logger.error(f"Test error type: {type(test_error)}")
                    import traceback
                    logger.error(f"Test traceback: {traceback.format_exc()}")
                    raise test_error
                
                logger.info(f"WatsonX LLM initialized and tested successfully with {model_name}")
                
            except Exception as llm_error:
                logger.error(f"Error initializing WatsonX LLM: {str(llm_error)}")
                logger.error(f"LLM error type: {type(llm_error)}")
                import traceback
                logger.error(f"LLM traceback: {traceback.format_exc()}")
                self.llm = None
                logger.error("LLM initialization failed - queries will not work without a working LLM")
                raise ValueError(f"WatsonX LLM initialization failed: {str(llm_error)}")
            
        except Exception as e:
            logger.error(f"Error initializing WatsonX: {str(e)}")
            logger.error(f"Error type: {type(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            self.embedding_model = None
            self.llm = None
    
    def _init_vector_store(self):
        """Initialize ChromaDB vector store"""
        try:
            logger.info(f"Initializing ChromaDB with path: {self.chroma_persist_dir}")
            logger.info(f"ChromaDB version: {chromadb.__version__}")
            
            # Check ChromaDB version compatibility
            if chromadb.__version__.startswith('0.4'):
                logger.warning("ChromaDB 0.4.x detected - this may have compatibility issues with LlamaIndex")
            
            # Initialize ChromaDB client with explicit settings
            try:
                self.chroma_client = chromadb.PersistentClient(
                    path=self.chroma_persist_dir,
                    settings=chromadb.config.Settings(
                        anonymized_telemetry=False,
                        allow_reset=True
                    )
                )
            except Exception as e:
                logger.warning(f"Failed to create ChromaDB client with custom settings: {e}")
                # Fallback to basic client
                self.chroma_client = chromadb.PersistentClient(path=self.chroma_persist_dir)
            
            logger.info("ChromaDB client initialized successfully")
            
            # Create or get collection
            try:
                self.collection = self.chroma_client.get_or_create_collection(
                    name="policy_documents",
                    metadata={"description": "Policy documents for RAG queries"}
                )
                logger.info("ChromaDB collection created/retrieved successfully")
            except Exception as e:
                logger.warning(f"Failed to get/create collection with metadata: {e}")
                # Try without metadata
                try:
                    self.collection = self.chroma_client.get_or_create_collection(
                        name="policy_documents"
                    )
                    logger.info("ChromaDB collection created/retrieved successfully (without metadata)")
                except Exception as e2:
                    logger.error(f"Failed to create collection: {e2}")
                    raise
            
            # Initialize LlamaIndex vector store
            try:
                self.vector_store = ChromaVectorStore(chroma_collection=self.collection)
                logger.info("ChromaVectorStore initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize ChromaVectorStore: {e}")
                raise
            
            # Create storage context
            try:
                self.storage_context = StorageContext.from_defaults(
                    vector_store=self.vector_store
                )
                logger.info("StorageContext created successfully")
            except Exception as e:
                logger.error(f"Failed to create StorageContext: {e}")
                raise
            
            logger.info("Vector store initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing vector store: {str(e)}")
            logger.error(f"Error type: {type(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise
    
    def _load_existing_documents(self):
        """Load existing documents from storage"""
        try:
            # This would load existing documents from persistent storage
            # For now, we'll start with an empty state
            logger.info("No existing documents to load")
        except Exception as e:
            logger.error(f"Error loading existing documents: {str(e)}")
    
    async def upload_document(self, file: UploadFile) -> str:
        """Upload and process a document"""
        try:
            # Generate unique document ID
            doc_id = str(uuid.uuid4())
            
            # Save file to documents directory
            file_path = os.path.join(self.documents_dir, f"{doc_id}_{file.filename}")
            
            async with aiofiles.open(file_path, 'wb') as f:
                content = await file.read()
                await f.write(content)
            
            # Process document based on file type
            file_extension = os.path.splitext(file.filename)[1].lower()
            logger.info(f"Processing file with extension: {file_extension}")
            
            try:
                if file_extension == '.pdf':
                    logger.info("Using PDFReader for PDF file")
                    documents = PDFReader().load_data(file_path)
                elif file_extension == '.docx':
                    logger.info("Using DocxReader for DOCX file")
                    documents = DocxReader().load_data(file_path)
                elif file_extension == '.txt' or file_extension == '.md':
                    logger.info("Using MarkdownReader for text file")
                    documents = MarkdownReader().load_data(file_path)
                else:
                    raise ValueError(f"Unsupported file type: {file_extension}")
                
                logger.info(f"Document loaded successfully with {len(documents)} pages/sections")
                
            except Exception as e:
                logger.error(f"Error reading document file: {str(e)}")
                logger.error(f"File path: {file_path}")
                logger.error(f"File size: {len(content)} bytes")
                raise ValueError(f"Failed to read document file: {str(e)}")
            
            # Create document metadata
            doc_info = DocumentInfo(
                id=doc_id,
                filename=file.filename,
                upload_date=datetime.now(),
                file_size=len(content),
                file_type=file_extension,
                status="processing"
            )
            
            # Store document metadata
            self.documents_db[doc_id] = doc_info
            
            # Process and index document
            logger.info(f"Starting document processing for {doc_id}")
            try:
                await self._process_document(doc_id, documents, file_path)
                logger.info(f"Document processing completed successfully for {doc_id}")
            except Exception as e:
                logger.error(f"Error during document processing for {doc_id}: {str(e)}")
                # Update status to failed
                doc_info.status = "failed"
                self.documents_db[doc_id] = doc_info
                raise
            
            # Update status
            doc_info.status = "processed"
            self.documents_db[doc_id] = doc_info
            
            logger.info(f"Document {doc_id} uploaded and processed successfully")
            return doc_id
            
        except Exception as e:
            logger.error(f"Error uploading document: {str(e)}")
            # Clean up on error
            if 'file_path' in locals() and os.path.exists(file_path):
                os.remove(file_path)
            raise
    
    async def _process_document(self, doc_id: str, documents: List[Document], file_path: str):
        """Process and index a document"""
        try:
            logger.info(f"Starting to process document {doc_id}")
            logger.info(f"Document has {len(documents)} pages/sections")
            
            # Check if we have WatsonX embedding model
            if not self.embedding_model:
                logger.error("No WatsonX embedding model available. Cannot process document.")
                raise ValueError("WatsonX embedding model not initialized. Please check your environment variables.")
            
            # Create settings with WatsonX embedding model and LLM
            logger.info("Creating Settings object with WatsonX embeddings and LLM...")
            settings = create_settings(self.embedding_model, self.llm)
            
            if not settings:
                logger.warning("Could not create custom settings, using default settings")
                settings = Settings  # Use default settings
            
            logger.info(f"Settings object created successfully: {type(settings)}")
            
            # Create vector store index with WatsonX embeddings
            logger.info("Creating VectorStoreIndex with WatsonX embeddings...")
            index = VectorStoreIndex.from_documents(
                documents,
                storage_context=self.storage_context,
                settings=settings
            )
            
            logger.info("VectorStoreIndex created successfully with WatsonX embeddings")
            
            # Store index reference
            if not hasattr(self, 'index'):
                self.index = index
                logger.info("Created new index with WatsonX embeddings")
            else:
                # Merge with existing index
                logger.info("Merging with existing index")
                self.index = self.index.refresh_ref_docs(documents)
            
            logger.info(f"Document {doc_id} indexed successfully with WatsonX embeddings")
            
        except Exception as e:
            logger.error(f"Error processing document {doc_id}: {str(e)}")
            logger.error(f"Error type: {type(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise
    
    async def query_documents(self, query: str, max_results: int = 5, include_metadata: bool = True) -> QueryResponse:
        """Query documents using RAG"""
        try:
            start_time = time.time()
            
            if not hasattr(self, 'index'):
                raise ValueError("No documents have been indexed yet")
            
            # Debug: Check current Settings configuration
            logger.info(f"Current Settings.llm: {getattr(Settings, 'llm', 'NOT SET')}")
            logger.info(f"Current Settings.embed_model: {getattr(Settings, 'embed_model', 'NOT SET')}")
            logger.info(f"Instance llm: {getattr(self, 'llm', 'NOT SET')}")
            logger.info(f"Instance embedding_model: {getattr(self, 'embedding_model', 'NOT SET')}")
            
            # Ensure WatsonX LLM is available
            if not hasattr(self, 'llm') or not self.llm:
                logger.error("WatsonX LLM is not available. Cannot process queries without an LLM.")
                raise ValueError("WatsonX LLM not initialized. Please check your WatsonX configuration.")
            
            # Perform RAG query with WatsonX LLM
            logger.info(f"Using WatsonX LLM for query processing: {type(self.llm)}")
            
            try:
                # Create query engine with WatsonX LLM and set response mode
                query_engine = self.index.as_query_engine(
                    llm=self.llm,
                    response_mode="compact",  # Use compact mode for better responses
                    similarity_top_k=max_results * 2  # Get more nodes for better selection
                )
                logger.info(f"Query engine created with WatsonX LLM: {type(query_engine)}")
            except Exception as engine_error:
                logger.error(f"Error creating query engine with WatsonX LLM: {str(engine_error)}")
                logger.error(f"Engine error type: {type(engine_error)}")
                import traceback
                logger.error(f"Engine traceback: {traceback.format_exc()}")
                
                # Try to create a basic query engine as fallback
                logger.warning("Trying to create basic query engine as fallback...")
                try:
                    query_engine = self.index.as_query_engine(
                        response_mode="compact",
                        similarity_top_k=max_results * 2
                    )
                    logger.info("Basic query engine created successfully as fallback")
                except Exception as fallback_error:
                    logger.error(f"Failed to create fallback query engine: {str(fallback_error)}")
                    raise ValueError(f"Could not create query engine: {str(engine_error)}")
            
            logger.info("Executing query with configured LLM...")
            try:
                response = query_engine.query(query)
                logger.info("Query executed successfully")
            except Exception as query_error:
                logger.error(f"Error executing query: {str(query_error)}")
                logger.error(f"Query error type: {type(query_error)}")
                import traceback
                logger.error(f"Query traceback: {traceback.format_exc()}")
                
                # Check if this is an OpenAI-related error
                if "OpenAI" in str(query_error) or "openai" in str(query_error).lower():
                    logger.error("OpenAI error detected. This suggests LlamaIndex is trying to use OpenAI as fallback.")
                    logger.error("Please ensure WatsonX LLM is properly configured and working.")
                    raise ValueError(f"WatsonX LLM query failed and LlamaIndex attempted OpenAI fallback: {str(query_error)}")
                else:
                    raise query_error
            
            # Extract sources with metadata if requested
            sources = []
            if hasattr(response, 'source_nodes'):
                for node in response.source_nodes[:max_results]:
                    source_info = {
                        "content": node.text,
                        "document_id": getattr(node, 'doc_id', 'unknown'),
                        "score": getattr(node, 'score', 0.0)
                    }
                    
                    # Add metadata if requested and available
                    if include_metadata:
                        if hasattr(node, 'metadata') and node.metadata:
                            source_info["metadata"] = node.metadata
                        if hasattr(node, 'node_id'):
                            source_info["node_id"] = node.node_id
                    
                    sources.append(source_info)
            
            # Calculate confidence score (simplified)
            confidence_score = 0.8  # This would be more sophisticated in production
            
            processing_time = time.time() - start_time
            
            # Create response
            query_response = QueryResponse(
                query=query,
                answer=str(response),
                sources=sources,
                confidence_score=confidence_score,
                processing_time=processing_time
            )
            
            # Store in history
            history_item = QueryHistory(
                query=query,
                timestamp=datetime.now(),
                response_time=processing_time,
                results_count=len(sources)
            )
            self.query_history.append(history_item)
            
            logger.info(f"Query processed successfully in {processing_time:.2f}s")
            return query_response
            
        except Exception as e:
            logger.error(f"Error querying documents: {str(e)}")
            raise
    
    async def list_documents(self) -> List[DocumentInfo]:
        """List all uploaded documents"""
        return list(self.documents_db.values())
    
    async def delete_document(self, doc_id: str) -> bool:
        """Delete a document by ID"""
        try:
            if doc_id not in self.documents_db:
                return False
            
            # Remove from metadata store
            del self.documents_db[doc_id]
            
            # Remove file
            doc_info = self.documents_db.get(doc_id)
            if doc_info:
                file_path = os.path.join(self.documents_dir, f"{doc_id}_{doc_info.filename}")
                if os.path.exists(file_path):
                    os.remove(file_path)
            
            # Note: In a production system, you'd also remove from the vector store
            # This is a simplified implementation
            
            logger.info(f"Document {doc_id} deleted successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting document {doc_id}: {str(e)}")
            return False
    
    async def get_query_history(self, limit: int = 10) -> List[QueryHistory]:
        """Get recent query history"""
        return self.query_history[-limit:] if self.query_history else []
