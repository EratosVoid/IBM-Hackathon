const express = require("express");
const path = require("path");
const { authenticateToken } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { callParserService, supabase } = require("../services/parserService");

const router = express.Router();

// Upload city blueprint with Supabase storage and parser integration
router.post("/blueprint", upload.single("blueprint"), async (req, res) => {
  try {
    const { projectId } = req.body;
    const uploadedFile = req.file;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: "Project ID is required",
      });
    }

    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        error: "Blueprint file is required",
      });
    }

    console.log(
      `Blueprint upload started for project ${projectId} by ${req.user.email}: ${uploadedFile.originalname}`
    );

    // Generate unique filename for Supabase storage
    const timestamp = Date.now();
    const fileExt = path.extname(uploadedFile.originalname);
    const fileName = path.basename(uploadedFile.originalname, fileExt);
    const supabaseFilePath = `project_${projectId}/${fileName}_${timestamp}${fileExt}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("temporary-storage")
      .upload(supabaseFilePath, uploadedFile.buffer, {
        contentType: uploadedFile.mimetype,
        duplex: "half",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase upload error details:", uploadError);
      throw new Error(`Supabase upload failed: ${uploadError.message}`);
    }

    console.log(`File uploaded to Supabase: ${supabaseFilePath}`);

    // Call parser service to normalize the uploaded file
    let normalizedData = null;
    let parsingStatus = "pending";
    let parsingError = null;

    try {
      console.log("Calling parser service for file:", supabaseFilePath);
      const parserResult = await callParserService(supabaseFilePath);

      if (parserResult.success) {
        normalizedData = parserResult.parsed_data;
        parsingStatus = "completed";
        console.log("Parsing completed successfully");
      } else {
        throw new Error("Parser service returned unsuccessful result");
      }
    } catch (error) {
      console.error("Parsing failed:", error.message);
      parsingStatus = "failed";
      parsingError = error.message;
      // Continue without failing the upload - store file even if parsing fails
    }

    // Create blueprint record
    const processedBlueprint = {
      id: Date.now(),
      project_id: parseInt(projectId),
      original_filename: uploadedFile.originalname,
      file_path: supabaseFilePath,
      supabase_path: uploadData.path,
      file_size: uploadedFile.size,
      file_type: path.extname(uploadedFile.originalname).toLowerCase(),
      mime_type: uploadedFile.mimetype,
      parsing_status: parsingStatus,
      parsing_error: parsingError,
      normalized_data: normalizedData,
      uploaded_by: req.user.id,
      uploaded_at: new Date().toISOString(),
    };

    // TODO: Store blueprint record in database when schema is ready
    // await pool.query("INSERT INTO blueprints (...) VALUES (...)", [...]);
    console.log(processedBlueprint);

    res.json({
      success: true,
      message: "Blueprint uploaded and processed successfully",
      blueprint: processedBlueprint,
      parsing_status: parsingStatus,
      ...(parsingError && { parsing_error: parsingError }),
    });
  } catch (error) {
    console.error("Blueprint upload error:", error);

    res.status(500).json({
      success: false,
      error: `Upload failed: ${error.message}`,
    });
  }
});

module.exports = router;