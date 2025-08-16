import React, { useRef, useEffect, useCallback } from "react";
import { Chip } from "@heroui/react";

import {
  CityPlanData,
  CityFeature,
  Coordinate,
  CityPlanUtils,
} from "@/types/CityPlanTypes";
import CityPlanLegend from "./CityPlanLegend";

interface CityPlanRendererProps {
  cityPlanData: CityPlanData;
  onDataUpdate: (data: CityPlanData) => void;
  onFeatureSelect?: (featureId: string | null) => void;
}

export default function CityPlanRenderer({
  cityPlanData,
  onDataUpdate,
  onFeatureSelect,
}: CityPlanRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate automatic scale and offset to fit blueprint or features
  const calculateFitToCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { scale: 1, offsetX: 0, offsetY: 0 };
    }

    // Use blueprint dimensions if available, otherwise feature bounds
    let bounds;
    if (cityPlanData.blueprint) {
      const { width, height } = cityPlanData.blueprint;
      bounds = {
        minX: 0,
        maxX: width,
        minY: 0,
        maxY: height,
      };
    } else {
      bounds = cityPlanData.bounds;
    }

    const worldWidth = bounds.maxX - bounds.minX;
    const worldHeight = bounds.maxY - bounds.minY;

    // Add padding
    const padding = 40;
    const availableWidth = canvas.width - padding * 2;
    const availableHeight = canvas.height - padding * 2;

    // Calculate scale to fit blueprint/features
    const scaleX = worldWidth > 0 ? availableWidth / worldWidth : 1;
    const scaleY = worldHeight > 0 ? availableHeight / worldHeight : 1;
    const scale = Math.min(scaleX, scaleY, 3); // Max scale of 3x

    // Calculate offset to center the blueprint/features
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const offsetX = canvas.width / 2 - centerX * scale;
    const offsetY = canvas.height / 2 + centerY * scale; // Flip Y axis for screen coordinates

    return { scale, offsetX, offsetY };
  }, [cityPlanData]);

  // Simple coordinate transformation (world to screen)
  const transformCoordinate = useCallback(
    (
      worldCoord: Coordinate,
      scale: number,
      offsetX: number,
      offsetY: number
    ): Coordinate => {
      return {
        x: worldCoord.x * scale + offsetX,
        y: offsetY - worldCoord.y * scale, // Flip Y axis
      };
    },
    []
  );

  // Draw feature geometry (simplified)
  const drawFeature = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      feature: CityFeature,
      scale: number,
      offsetX: number,
      offsetY: number
    ) => {
      const layer = cityPlanData.layers[feature.type];
      if (layer && !layer.visible) return;

      // Check if this is a preview feature
      const isPreview = feature.metadata?.preview === true;
      
      let style = CityPlanUtils.getFeatureStyle(feature);
      
      // Apply preview styling if this is a preview feature
      if (isPreview) {
        style = {
          ...style,
          fillColor: style.fillColor ? `${style.fillColor}80` : "#FFA50080", // Add transparency
          strokeColor: "#FF8C00", // Orange border for preview
          strokeWidth: (style.strokeWidth || 1) + 1, // Slightly thicker
        };
      }
      
      const opacity = layer ? layer.opacity : 1;

      ctx.save();
      ctx.globalAlpha = opacity * (style.opacity || 1);
      ctx.lineWidth = style.strokeWidth || 1;

      // Add dashed line for preview features
      if (isPreview) {
        ctx.setLineDash([8, 4]);
      }

      switch (feature.geometry.type) {
        case "point":
          const screenPoint = transformCoordinate(
            feature.geometry.coordinates,
            scale,
            offsetX,
            offsetY
          );

          ctx.fillStyle = style.fillColor || "#666";
          ctx.strokeStyle = style.strokeColor || "#333";

          ctx.beginPath();
          ctx.arc(screenPoint.x, screenPoint.y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Draw feature name with preview indication
          ctx.setLineDash([]); // Reset dash for text
          ctx.fillStyle = isPreview ? "#FF8C00" : "#000";
          ctx.font = isPreview ? "bold 12px sans-serif" : "12px sans-serif";
          const label = isPreview ? `${feature.name} (Preview)` : feature.name;
          ctx.fillText(label, screenPoint.x + 10, screenPoint.y - 10);
          break;

        case "linestring":
          const screenCoords = feature.geometry.coordinates.map((coord) =>
            transformCoordinate(coord, scale, offsetX, offsetY)
          );

          ctx.strokeStyle = style.strokeColor || "#333";
          if (style.dashArray) {
            ctx.setLineDash(style.dashArray);
          }

          ctx.beginPath();
          screenCoords.forEach((coord, index) => {
            if (index === 0) {
              ctx.moveTo(coord.x, coord.y);
            } else {
              ctx.lineTo(coord.x, coord.y);
            }
          });
          ctx.stroke();
          ctx.setLineDash([]);
          break;

        case "polygon":
          const rings = feature.geometry.coordinates;

          ctx.fillStyle = style.fillColor || "#ccc";
          ctx.strokeStyle = style.strokeColor || "#333";

          rings.forEach((ring, ringIndex) => {
            const screenRing = ring.map((coord) =>
              transformCoordinate(coord, scale, offsetX, offsetY)
            );

            ctx.beginPath();
            screenRing.forEach((coord, index) => {
              if (index === 0) {
                ctx.moveTo(coord.x, coord.y);
              } else {
                ctx.lineTo(coord.x, coord.y);
              }
            });
            ctx.closePath();

            if (ringIndex === 0) {
              ctx.fill();
            } else {
              // This is a hole, use composite operation to cut out
              ctx.save();
              ctx.globalCompositeOperation = "destination-out";
              ctx.fill();
              ctx.restore();
            }
          });

          // Draw outline
          rings.forEach((ring) => {
            const screenRing = ring.map((coord) =>
              transformCoordinate(coord, scale, offsetX, offsetY)
            );
            ctx.beginPath();
            screenRing.forEach((coord, index) => {
              if (index === 0) {
                ctx.moveTo(coord.x, coord.y);
              } else {
                ctx.lineTo(coord.x, coord.y);
              }
            });
            ctx.closePath();
            ctx.stroke();
          });

          // Draw centroid label for polygons
          if (rings[0].length > 0) {
            const centroid = rings[0].reduce(
              (acc, coord) => ({ x: acc.x + coord.x, y: acc.y + coord.y }),
              { x: 0, y: 0 }
            );
            centroid.x /= rings[0].length;
            centroid.y /= rings[0].length;

            const screenCentroid = transformCoordinate(
              centroid,
              scale,
              offsetX,
              offsetY
            );
            ctx.setLineDash([]); // Reset dash for text
            ctx.fillStyle = isPreview ? "#FF8C00" : "#000";
            ctx.font = isPreview ? "bold 11px sans-serif" : "11px sans-serif";
            ctx.textAlign = "center";
            const label = isPreview ? `${feature.name} (Preview)` : feature.name;
            ctx.fillText(label, screenCentroid.x, screenCentroid.y);
          }
          break;
      }

      ctx.restore();
    },
    [cityPlanData.layers, transformCoordinate]
  );


  // Draw blueprint borders
  const drawBlueprintBorders = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      scale: number,
      offsetX: number,
      offsetY: number
    ) => {
      if (!cityPlanData.blueprint) return;

      const { width, height, unit } = cityPlanData.blueprint;

      // Define blueprint corners (bottom-left origin)
      const corners = [
        { x: 0, y: 0 }, // Bottom-left
        { x: width, y: 0 }, // Bottom-right
        { x: width, y: height }, // Top-right
        { x: 0, y: height }, // Top-left
      ];

      const screenCorners = corners.map((corner) =>
        transformCoordinate(corner, scale, offsetX, offsetY)
      );

      ctx.save();

      // Draw blueprint boundary
      ctx.strokeStyle = "#2563eb"; // Blue border
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);

      ctx.beginPath();
      screenCorners.forEach((corner, index) => {
        if (index === 0) {
          ctx.moveTo(corner.x, corner.y);
        } else {
          ctx.lineTo(corner.x, corner.y);
        }
      });
      ctx.closePath();
      ctx.stroke();

      // Draw corner markers
      ctx.setLineDash([]);
      ctx.fillStyle = "#2563eb";
      screenCorners.forEach((corner) => {
        ctx.beginPath();
        ctx.arc(corner.x, corner.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw dimension labels
      ctx.fillStyle = "#1e40af";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";

      // Width label (bottom)
      const bottomMidX = (screenCorners[0].x + screenCorners[1].x) / 2;
      const bottomY = Math.max(screenCorners[0].y, screenCorners[1].y) + 20;
      ctx.fillText(`${width} ${unit}`, bottomMidX, bottomY);

      // Height label (right)
      ctx.save();
      ctx.translate(
        screenCorners[1].x + 20,
        (screenCorners[1].y + screenCorners[2].y) / 2
      );
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(`${height} ${unit}`, 0, 0);
      ctx.restore();

      ctx.restore();
    },
    [cityPlanData.blueprint, transformCoordinate]
  );

  // Simplified render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Get automatic fit parameters
    const { scale, offsetX, offsetY } = calculateFitToCanvas();

    // Draw blueprint borders first
    drawBlueprintBorders(ctx, scale, offsetX, offsetY);

    // Draw features sorted by layer z-index
    const visibleFeatures = cityPlanData.features.filter((feature) => {
      const layer = cityPlanData.layers[feature.type];
      return !layer || layer.visible;
    });

    // Sort by layer z-index and feature type
    visibleFeatures.sort((a, b) => {
      const aLayer = cityPlanData.layers[a.type];
      const bLayer = cityPlanData.layers[b.type];
      const aIndex = aLayer ? aLayer.zIndex : 0;
      const bIndex = bLayer ? bLayer.zIndex : 0;
      return aIndex - bIndex;
    });

    visibleFeatures.forEach((feature) => {
      drawFeature(ctx, feature, scale, offsetX, offsetY);
    });
  }, [cityPlanData, calculateFitToCanvas, drawFeature, drawBlueprintBorders]);

  // Handle canvas resize
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    render();
  }, [render]);

  // Effects
  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  useEffect(() => {
    render();
  }, [render]);

  return (
    <div ref={containerRef} className="relative h-full w-full bg-gray-100">
      {/* Canvas - No interaction, static display */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Simple Status */}
      <div className="absolute bottom-4 left-4 space-y-2">
        <Chip size="sm" variant="flat">
          Features: {cityPlanData.features.length}
        </Chip>
        {cityPlanData.blueprint && (
          <Chip size="sm" variant="flat" color="primary">
            Blueprint: {cityPlanData.blueprint.width}×
            {cityPlanData.blueprint.height} {cityPlanData.blueprint.unit}
          </Chip>
        )}
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-50">
        <CityPlanLegend />
      </div>

      {/* Empty state */}
      {cityPlanData.features.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium mb-2">
              {cityPlanData.blueprint
                ? "Blueprint area defined"
                : "No city features to display"}
            </p>
            <p className="text-sm">
              {cityPlanData.blueprint
                ? `Use the AI planner to add features within the ${cityPlanData.blueprint.width}×${cityPlanData.blueprint.height} ${cityPlanData.blueprint.unit} area`
                : "Use the AI planner to add features to your city"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
