import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button, Chip, Card } from '@heroui/react';
import { ZoomIn, ZoomOut, RotateCcw, Grid3X3, Maximize } from 'lucide-react';

import { CityPlanData, CityFeature, Coordinate, CityPlanUtils } from '@/types/CityPlanTypes';

interface CityPlanRendererProps {
  cityPlanData: CityPlanData;
  onDataUpdate: (data: CityPlanData) => void;
  onFeatureSelect?: (featureId: string | null) => void;
}

interface ViewState {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export default function CityPlanRenderer({ 
  cityPlanData, 
  onDataUpdate,
  onFeatureSelect 
}: CityPlanRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [viewState, setViewState] = useState<ViewState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1
  });
  
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState<{ x: number; y: number } | null>(null);
  const [showGrid, setShowGrid] = useState(false);

  // Convert world coordinates to screen coordinates
  const worldToScreen = useCallback((worldCoord: Coordinate): Coordinate => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    return {
      x: (worldCoord.x * viewState.scale) + viewState.offsetX + canvas.width / 2,
      y: canvas.height / 2 - (worldCoord.y * viewState.scale) - viewState.offsetY
    };
  }, [viewState]);

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback((screenCoord: Coordinate): Coordinate => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    return {
      x: (screenCoord.x - viewState.offsetX - canvas.width / 2) / viewState.scale,
      y: (canvas.height / 2 - screenCoord.y - viewState.offsetY) / viewState.scale
    };
  }, [viewState]);

  // Draw grid
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!showGrid) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    ctx.save();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    
    const gridSize = 50 * viewState.scale;
    const startX = (viewState.offsetX % gridSize);
    const startY = (viewState.offsetY % gridSize);
    
    // Vertical lines
    for (let x = startX; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = startY; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    ctx.restore();
  }, [showGrid, viewState]);

  // Draw feature geometry
  const drawFeature = useCallback((ctx: CanvasRenderingContext2D, feature: CityFeature) => {
    const layer = cityPlanData.layers[feature.type];
    if (layer && !layer.visible) return;
    
    const style = CityPlanUtils.getFeatureStyle(feature);
    const opacity = layer ? layer.opacity : 1;
    const isSelected = selectedFeatureId === feature.id;
    
    ctx.save();
    ctx.globalAlpha = opacity * (style.opacity || 1);
    
    // Apply selection styling
    if (isSelected) {
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 10;
      ctx.lineWidth = (style.strokeWidth || 1) + 2;
    } else {
      ctx.lineWidth = style.strokeWidth || 1;
    }
    
    switch (feature.geometry.type) {
      case 'point':
        const screenPoint = worldToScreen(feature.geometry.coordinates);
        
        ctx.fillStyle = style.fillColor || '#666';
        ctx.strokeStyle = style.strokeColor || '#333';
        
        ctx.beginPath();
        ctx.arc(screenPoint.x, screenPoint.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw feature name
        ctx.fillStyle = '#000';
        ctx.font = '12px sans-serif';
        ctx.fillText(feature.name, screenPoint.x + 10, screenPoint.y - 10);
        break;
        
      case 'linestring':
        const screenCoords = feature.geometry.coordinates.map(worldToScreen);
        
        ctx.strokeStyle = style.strokeColor || '#333';
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
        
      case 'polygon':
        const rings = feature.geometry.coordinates;
        
        ctx.fillStyle = style.fillColor || '#ccc';
        ctx.strokeStyle = style.strokeColor || '#333';
        
        rings.forEach((ring, ringIndex) => {
          const screenRing = ring.map(worldToScreen);
          
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
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fill();
            ctx.restore();
          }
        });
        
        // Draw outline
        rings.forEach(ring => {
          const screenRing = ring.map(worldToScreen);
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
          
          const screenCentroid = worldToScreen(centroid);
          ctx.fillStyle = '#000';
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(feature.name, screenCentroid.x, screenCentroid.y);
        }
        break;
    }
    
    ctx.restore();
  }, [cityPlanData.layers, selectedFeatureId, worldToScreen]);

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid(ctx);
    
    // Draw features sorted by layer z-index
    const visibleFeatures = cityPlanData.features.filter(feature => {
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
    
    visibleFeatures.forEach(feature => {
      drawFeature(ctx, feature);
    });
    
    // Draw coordinate system indicators
    if (showGrid) {
      ctx.save();
      ctx.fillStyle = '#666';
      ctx.font = '12px monospace';
      ctx.fillText(`Scale: ${viewState.scale.toFixed(2)}x`, 10, canvas.height - 40);
      ctx.fillText(`Offset: (${viewState.offsetX.toFixed(0)}, ${viewState.offsetY.toFixed(0)})`, 10, canvas.height - 20);
      ctx.restore();
    }
  }, [cityPlanData, viewState, showGrid, drawGrid, drawFeature]);

  // Handle canvas resize
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    render();
  }, [render]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    setLastMousePos(mousePos);
    setIsDragging(true);
    
    // Check for feature selection
    const worldPos = screenToWorld(mousePos);
    const clickedFeature = cityPlanData.features.find(feature => {
      // Simple hit testing - can be improved
      switch (feature.geometry.type) {
        case 'point':
          const distance = Math.sqrt(
            Math.pow(worldPos.x - feature.geometry.coordinates.x, 2) +
            Math.pow(worldPos.y - feature.geometry.coordinates.y, 2)
          );
          return distance <= 5 / viewState.scale;
        case 'polygon':
          // Simple bounds checking for now
          const bounds = feature.geometry.coordinates[0];
          if (bounds.length === 0) return false;
          
          let minX = bounds[0].x, maxX = bounds[0].x;
          let minY = bounds[0].y, maxY = bounds[0].y;
          
          bounds.forEach(coord => {
            minX = Math.min(minX, coord.x);
            maxX = Math.max(maxX, coord.x);
            minY = Math.min(minY, coord.y);
            maxY = Math.max(maxY, coord.y);
          });
          
          return worldPos.x >= minX && worldPos.x <= maxX && 
                 worldPos.y >= minY && worldPos.y <= maxY;
        default:
          return false;
      }
    });
    
    const newSelectedId = clickedFeature ? clickedFeature.id : null;
    setSelectedFeatureId(newSelectedId);
    onFeatureSelect?.(newSelectedId);
  }, [cityPlanData.features, screenToWorld, viewState.scale, onFeatureSelect]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !lastMousePos) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    const deltaX = mousePos.x - lastMousePos.x;
    const deltaY = mousePos.y - lastMousePos.y;
    
    setViewState(prev => ({
      ...prev,
      offsetX: prev.offsetX + deltaX,
      offsetY: prev.offsetY + deltaY
    }));
    
    setLastMousePos(mousePos);
  }, [isDragging, lastMousePos]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setLastMousePos(null);
  }, []);

  // Zoom handlers
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(10, viewState.scale * scaleFactor));
    
    setViewState(prev => ({
      ...prev,
      scale: newScale
    }));
  }, [viewState.scale]);

  const zoomIn = () => setViewState(prev => ({ ...prev, scale: Math.min(10, prev.scale * 1.2) }));
  const zoomOut = () => setViewState(prev => ({ ...prev, scale: Math.max(0.1, prev.scale / 1.2) }));
  const resetView = () => setViewState({ offsetX: 0, offsetY: 0, scale: 1 });
  const fitToView = () => {
    if (cityPlanData.features.length === 0) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const bounds = cityPlanData.bounds;
    const worldWidth = bounds.maxX - bounds.minX;
    const worldHeight = bounds.maxY - bounds.minY;
    
    const scaleX = (canvas.width * 0.8) / worldWidth;
    const scaleY = (canvas.height * 0.8) / worldHeight;
    const scale = Math.min(scaleX, scaleY, 2);
    
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    
    setViewState({
      scale,
      offsetX: -centerX * scale,
      offsetY: -centerY * scale
    });
  };

  // Effects
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    if (cityPlanData.features.length > 0 && viewState.scale === 1 && viewState.offsetX === 0 && viewState.offsetY === 0) {
      fitToView();
    }
  }, [cityPlanData.features]);

  return (
    <div ref={containerRef} className="relative h-full w-full bg-gray-100">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      
      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Card className="p-2">
          <div className="flex gap-1">
            <Button isIconOnly size="sm" variant="light" onClick={zoomIn}>
              <ZoomIn size={16} />
            </Button>
            <Button isIconOnly size="sm" variant="light" onClick={zoomOut}>
              <ZoomOut size={16} />
            </Button>
            <Button isIconOnly size="sm" variant="light" onClick={resetView}>
              <RotateCcw size={16} />
            </Button>
            <Button isIconOnly size="sm" variant="light" onClick={fitToView}>
              <Maximize size={16} />
            </Button>
            <Button 
              isIconOnly 
              size="sm" 
              variant={showGrid ? "flat" : "light"}
              onClick={() => setShowGrid(!showGrid)}
            >
              <Grid3X3 size={16} />
            </Button>
          </div>
        </Card>
      </div>
      
      {/* Status */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        <Chip size="sm" variant="flat">
          Features: {cityPlanData.features.length}
        </Chip>
        <Chip size="sm" variant="flat">
          Scale: {viewState.scale.toFixed(2)}x
        </Chip>
        {selectedFeatureId && (
          <Chip size="sm" color="primary" variant="flat">
            Selected: {cityPlanData.features.find(f => f.id === selectedFeatureId)?.name}
          </Chip>
        )}
      </div>
      
      {/* Empty state */}
      {cityPlanData.features.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium mb-2">No city features to display</p>
            <p className="text-sm">Upload a blueprint or add features to start planning</p>
          </div>
        </div>
      )}
    </div>
  );
}