from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from ingestion import parser
import tempfile
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Blueprint Parser Service",
    description="Parse city blueprint files (GeoJSON, DXF, images) into normalized format",
    version="1.0.0"
)

@app.get("/")
def root():
    return {
        "service": "Blueprint Parser Service",
        "version": "1.0.0",
        "status": "running",
        "supported_formats": [
            "GeoJSON (.geojson, .json)",
            "DXF (.dxf)",
            "Images (.png, .jpg, .jpeg, .bmp, .tiff, .pdf)"
        ]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "parser"}

@app.post("/parse")
async def parse_file_endpoint(file: UploadFile = File(...)):
    """
    Parse an uploaded blueprint file and return normalized city planning data.
    
    Returns structured data with zones, roads, services, buildings, etc.
    """
    logger.info(f"Received file: {file.filename} ({file.content_type})")
    
    # Validate file type
    allowed_extensions = {'.geojson', '.json', '.dxf', '.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.pdf'}
    file_ext = os.path.splitext(file.filename.lower())[1]
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type: {file_ext}. Supported: {', '.join(allowed_extensions)}"
        )
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        # Parse the file
        logger.info(f"Parsing file: {tmp_path}")
        result = parser.parse_file(tmp_path)
        
        # Add metadata
        response = {
            "success": True,
            "filename": file.filename,
            "file_size": len(content),
            "file_type": file_ext,
            "parsed_data": result
        }
        
        logger.info(f"Successfully parsed {file.filename}")
        return JSONResponse(content=response)
        
    except Exception as e:
        logger.error(f"Error parsing file {file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error parsing file: {str(e)}")
    
    finally:
        # Clean up temporary file
        try:
            os.unlink(tmp_path)
        except Exception as e:
            logger.warning(f"Could not delete temporary file {tmp_path}: {e}")

@app.post("/parse/url")
async def parse_file_from_url(file_url: str):
    """
    Parse a blueprint file from a URL.
    """
    # TODO: Implement URL file fetching and parsing
    raise HTTPException(status_code=501, detail="URL parsing not yet implemented")

@app.get("/formats")
def get_supported_formats():
    """
    Get detailed information about supported file formats.
    """
    return {
        "formats": {
            "geojson": {
                "extensions": [".geojson", ".json"],
                "description": "Geographic data with zones, roads, and features",
                "example_output": ["zones", "roads", "services", "buildings"]
            },
            "dxf": {
                "extensions": [".dxf"],
                "description": "AutoCAD drawing files with architectural layouts",
                "example_output": ["buildings", "roads", "zones"]
            },
            "images": {
                "extensions": [".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".pdf"],
                "description": "Blueprint images processed with computer vision",
                "note": "Currently returns placeholder data - AI model integration needed"
            },
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)