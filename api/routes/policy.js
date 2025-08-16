const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads/policies");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${timestamp}_${sanitizedName}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Only allow PDF files
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// In-memory storage for documents and their content (in production, use a database)
let documents = [];
let documentContent = new Map(); // docId -> content

// Upload policy document
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const document = {
      id: docId,
      filename: req.file.originalname,
      file_size: req.file.size,
      file_path: req.file.path,
      created_at: new Date().toISOString(),
      processed: false
    };

    try {
      // Parse PDF content
      const dataBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdf(dataBuffer);
      
      // Extract and clean the text
      const extractedText = pdfData.text;
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error("No text content found in PDF");
      }

      // Store the actual extracted content
      documentContent.set(docId, extractedText);
      document.processed = true;

      documents.push(document);

      console.log(`PDF processed successfully: ${req.file.originalname}, extracted ${extractedText.length} characters`);

      res.json({
        success: true,
        message: "Document uploaded and processed successfully",
        doc_id: docId,
        document: document,
        text_length: extractedText.length
      });

    } catch (pdfError) {
      console.error("PDF parsing error:", pdfError);
      
      // Fallback: store basic document info but mark as not processed
      documents.push(document);
      documentContent.set(docId, `
Policy Document: ${req.file.originalname}

Note: This document could not be automatically processed for text extraction. 
This may be due to the PDF being image-based, password-protected, or having complex formatting.

For specific policy information, please refer to the original document or contact the planning department.
      `);

      res.json({
        success: true,
        message: "Document uploaded but text extraction failed. Manual review may be required.",
        doc_id: docId,
        document: document,
        warning: "Text extraction failed - document may require manual processing"
      });
    }

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload document"
    });
  }
});

// Query documents with full context analysis
router.post("/query", (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query is required"
      });
    }

    if (documents.length === 0) {
      return res.json({
        success: true,
        answer: "No policy documents have been uploaded yet. Please upload policy documents first to get answers about city planning policies.",
        sources: []
      });
    }

    // Get complete document context
    let fullDocumentContext = "";
    let documentSources = [];
    
    documents.forEach(doc => {
      const content = documentContent.get(doc.id) || "";
      if (content.trim().length > 0) {
        fullDocumentContext += `\n\n=== ${doc.filename} ===\n${content}`;
        documentSources.push({
          document_id: doc.id,
          filename: doc.filename,
          relevance_score: 1.0
        });
      }
    });

    if (fullDocumentContext.length === 0) {
      return res.json({
        success: true,
        answer: "The uploaded documents could not be processed for text content. Please ensure you've uploaded valid PDF documents with readable text.",
        sources: []
      });
    }

    // Simple and direct AI response
    const answer = generateSimpleAnswer(query, fullDocumentContext);

    console.log(`Query: "${query}" -> Answer: "${answer.substring(0, 100)}..."`);

    res.json({
      success: true,
      answer: answer,
      confidence: 0.9,
      sources: documentSources,
      context_used: true,
      total_context_length: fullDocumentContext.length
    });

  } catch (error) {
    console.error("Query error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process query"
    });
  }
});

// Simple AI response generator
function generateSimpleAnswer(query, documentContent) {
  const queryLower = query.toLowerCase();
  
  // Split document into sentences
  const sentences = documentContent
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 500);
  
  // Find sentences that contain query words
  const queryWords = queryLower.split(' ').filter(word => word.length > 2);
  
  // Score sentences based on relevance
  const scoredSentences = sentences.map(sentence => {
    const sentenceLower = sentence.toLowerCase();
    let score = 0;
    
    queryWords.forEach(word => {
      if (sentenceLower.includes(word)) {
        score += 1;
      }
    });
    
    return { sentence, score };
  });
  
  // Get the best matching sentence
  const bestMatch = scoredSentences
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)[0];
  
  if (bestMatch && bestMatch.sentence) {
    // Clean up the sentence
    let answer = bestMatch.sentence.trim();
    
    // Remove document markers and clean formatting
    answer = answer.replace(/=== .+ ===/g, '').trim();
    answer = answer.replace(/\s+/g, ' ');
    
    // Add context
    return `According to the policy document: ${answer}`;
  }
  
  // Fallback: Look for topic-specific information
  if (queryLower.includes('zoning')) {
    const zoningInfo = sentences.find(s => s.toLowerCase().includes('zoning') || s.toLowerCase().includes('zone'));
    if (zoningInfo) {
      return `Regarding zoning: ${zoningInfo.trim()}`;
    }
  }
  
  if (queryLower.includes('building') || queryLower.includes('height')) {
    const buildingInfo = sentences.find(s => 
      s.toLowerCase().includes('building') || 
      s.toLowerCase().includes('height') || 
      s.toLowerCase().includes('construction')
    );
    if (buildingInfo) {
      return `Building requirements: ${buildingInfo.trim()}`;
    }
  }
  
  if (queryLower.includes('parking')) {
    const parkingInfo = sentences.find(s => s.toLowerCase().includes('parking'));
    if (parkingInfo) {
      return `Parking policy: ${parkingInfo.trim()}`;
    }
  }
  
  // Final fallback
  return `I found information in the policy documents but couldn't find a specific answer to "${query}". The documents contain various planning and zoning regulations. Try asking about specific topics like "zoning requirements" or "building height limits".`;
}

// List documents
router.get("/list", (req, res) => {
  try {
    res.json({
      success: true,
      documents: documents
    });
  } catch (error) {
    console.error("List error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list documents"
    });
  }
});

// Delete document
router.delete("/:docId", (req, res) => {
  try {
    const { docId } = req.params;
    
    const docIndex = documents.findIndex(doc => doc.id === docId);
    if (docIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    const document = documents[docIndex];
    
    // Delete file from disk
    try {
      if (fs.existsSync(document.file_path)) {
        fs.unlinkSync(document.file_path);
      }
    } catch (fileError) {
      console.error("Error deleting file:", fileError);
    }

    // Remove from memory
    documents.splice(docIndex, 1);
    documentContent.delete(docId);

    res.json({
      success: true,
      message: "Document deleted successfully"
    });

  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete document"
    });
  }
});

// Clear all documents (for testing)
router.delete("/", (req, res) => {
  try {
    // Clear all documents from memory
    documents.length = 0;
    documentContent.clear();
    
    res.json({
      success: true,
      message: "All documents cleared successfully"
    });
    
  } catch (error) {
    console.error("Clear error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear documents"
    });
  }
});

module.exports = router;
