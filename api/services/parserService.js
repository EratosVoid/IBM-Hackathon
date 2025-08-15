const { createClient } = require("@supabase/supabase-js");
const path = require("path");

const PARSER_SERVICE_URL = process.env.PARSER_SERVICE_URL || "http://localhost:8003";

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// Helper function to call parser service via HTTP using Supabase URL
async function callParserService(supabaseFilePath) {
  try {
    // Get public URL from Supabase
    const { data: urlData } = supabase.storage
      .from("temporary-storage")
      .getPublicUrl(supabaseFilePath);

    if (!urlData.publicUrl) {
      throw new Error("Failed to get public URL from Supabase");
    }

    // Extract original filename from supabase path
    const originalFilename = path.basename(supabaseFilePath);
    
    // Prepare request payload
    const requestPayload = {
      file_url: urlData.publicUrl,
      filename: originalFilename
    };

    // Make HTTP request to parser service
    const fetch = require('node-fetch');
    const response = await fetch(`${PARSER_SERVICE_URL}/parse/url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Parser service error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    
    // Return in the expected format
    return {
      success: result.success,
      parsed_data: result.parsed_data,
      filename: result.filename,
      file_size: result.file_size,
      file_type: result.file_type
    };

  } catch (error) {
    console.error("Error calling parser service:", error);
    throw error;
  }
}

module.exports = {
  callParserService,
  supabase,
};