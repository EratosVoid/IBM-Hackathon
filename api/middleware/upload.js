const multer = require("multer");
const path = require("path");

// Configure multer for file uploads (memory storage for Supabase)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "application/pdf",
      "application/json",
      "application/octet-stream", // For .geojson and .dxf files
      "text/plain", // For some .json files
    ];

    const allowedExtensions = [
      ".png",
      ".jpg",
      ".jpeg",
      ".pdf",
      ".json",
      ".geojson",
      ".dxf",
    ];
    const fileExt = path.extname(file.originalname).toLowerCase();

    if (
      allowedTypes.includes(file.mimetype) ||
      allowedExtensions.includes(fileExt)
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Unsupported file type: ${
            file.mimetype
          }. Supported: ${allowedExtensions.join(", ")}`
        ),
        false
      );
    }
  },
});

module.exports = upload;