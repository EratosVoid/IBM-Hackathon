const express = require("express");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Get simulation data (integrates with Dev B's simulation engine)
router.get("/:projectId", (req, res) => {
  const { projectId } = req.params;

  // Mock simulation data - Dev B will replace with actual simulation
  const simulationData = {
    project_id: parseInt(projectId),
    metrics: {
      traffic_flow_efficiency: Math.floor(Math.random() * 40) + 60, // 60-100%
      cost_estimate: Math.floor(Math.random() * 2000000) + 1000000, // 1M-3M
      pollution_index: Math.floor(Math.random() * 50) + 20, // 20-70
      green_space_ratio: (Math.random() * 0.3 + 0.1).toFixed(2), // 10-40%
      population_density: Math.floor(Math.random() * 2000) + 2000, // 2000-4000 per km²
      walkability_score: Math.floor(Math.random() * 30) + 60, // 60-90
    },
    last_updated: new Date().toISOString(),
    simulation_version: "1.0",
  };

  console.log(
    `Simulation data requested for project ${projectId} by ${req.user.email}`
  );

  res.json({
    success: true,
    simulation: simulationData,
  });
});

module.exports = router;