import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  Chip,
  Divider,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import { MapPin, Target, Grid3X3, Copy, Check } from "lucide-react";
import { toast } from "sonner";

import { CityPlanData, Coordinate } from "@/types/CityPlanTypes";

interface CoordinatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onCoordinateSelect: (coordinate: Coordinate, locationName: string) => void;
  cityPlanData: CityPlanData;
}

interface LocationPreset {
  name: string;
  description: string;
  category: string;
}

const LOCATION_PRESETS: LocationPreset[] = [
  // Cardinal directions
  { name: "center", description: "Central area of the blueprint", category: "Cardinal" },
  { name: "north", description: "Northern region (top area)", category: "Cardinal" },
  { name: "south", description: "Southern region (bottom area)", category: "Cardinal" },
  { name: "east", description: "Eastern region (right side)", category: "Cardinal" },
  { name: "west", description: "Western region (left side)", category: "Cardinal" },
  
  // Corner combinations
  { name: "northeast", description: "Top-right quadrant", category: "Corners" },
  { name: "northwest", description: "Top-left quadrant", category: "Corners" },
  { name: "southeast", description: "Bottom-right quadrant", category: "Corners" },
  { name: "southwest", description: "Bottom-left quadrant", category: "Corners" },
  
  // Specific corners
  { name: "top_left", description: "Top-left corner", category: "Corners" },
  { name: "top_right", description: "Top-right corner", category: "Corners" },
  { name: "bottom_left", description: "Bottom-left corner", category: "Corners" },
  { name: "bottom_right", description: "Bottom-right corner", category: "Corners" },
  
  // Special areas
  { name: "optimal", description: "Best placement area (avoiding edges)", category: "Special" },
  { name: "random", description: "Anywhere within blueprint bounds", category: "Special" },
];

export default function CoordinatePicker({
  isOpen,
  onClose,
  onCoordinateSelect,
  cityPlanData,
}: CoordinatePickerProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [customX, setCustomX] = useState<string>("");
  const [customY, setCustomY] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"presets" | "custom" | "click">("presets");
  const [copiedCoordinate, setCopiedCoordinate] = useState<string | null>(null);

  // Get blueprint dimensions for coordinate bounds
  const blueprintDimensions = cityPlanData.blueprint || { width: 100, height: 100, unit: "meters" };

  // Calculate coordinate for preset location
  const getPresetCoordinate = (presetName: string): Coordinate => {
    const { width, height } = blueprintDimensions;
    const margin = 5;

    const locationMappings: { [key: string]: Coordinate } = {
      // Cardinal directions
      center: { x: width / 2, y: height / 2 },
      north: { x: width / 2, y: height * 0.8 },
      south: { x: width / 2, y: height * 0.2 },
      east: { x: width * 0.8, y: height / 2 },
      west: { x: width * 0.2, y: height / 2 },

      // Corner combinations
      northeast: { x: width * 0.8, y: height * 0.8 },
      northwest: { x: width * 0.2, y: height * 0.8 },
      southeast: { x: width * 0.8, y: height * 0.2 },
      southwest: { x: width * 0.2, y: height * 0.2 },

      // Specific corners
      top_left: { x: margin, y: height - margin },
      top_right: { x: width - margin, y: height - margin },
      bottom_left: { x: margin, y: margin },
      bottom_right: { x: width - margin, y: margin },

      // Special areas
      optimal: { x: width / 2, y: height / 2 },
      random: { x: width / 2, y: height / 2 },
    };

    return locationMappings[presetName] || { x: width / 2, y: height / 2 };
  };

  // Copy coordinate to clipboard
  const copyCoordinate = (coord: Coordinate, name: string) => {
    const coordText = `(${coord.x.toFixed(1)}, ${coord.y.toFixed(1)})`;
    navigator.clipboard.writeText(coordText).then(() => {
      setCopiedCoordinate(name);
      toast.success(`Copied ${coordText} to clipboard`);
      setTimeout(() => setCopiedCoordinate(null), 2000);
    });
  };

  // Handle preset selection
  const handlePresetSelect = (presetName: string) => {
    const coordinate = getPresetCoordinate(presetName);
    onCoordinateSelect(coordinate, presetName);
    onClose();
  };

  // Validate custom coordinates
  const validateCustomCoordinates = (x: number, y: number) => {
    const errors = [];
    
    if (isNaN(x) || isNaN(y)) {
      errors.push("Please enter valid numeric coordinates");
    }
    
    if (x < 0) {
      errors.push("X coordinate cannot be negative");
    }
    
    if (y < 0) {
      errors.push("Y coordinate cannot be negative");
    }
    
    if (x > blueprintDimensions.width) {
      errors.push(`X coordinate cannot exceed ${blueprintDimensions.width} ${blueprintDimensions.unit}`);
    }
    
    if (y > blueprintDimensions.height) {
      errors.push(`Y coordinate cannot exceed ${blueprintDimensions.height} ${blueprintDimensions.unit}`);
    }
    
    return errors;
  };

  // Handle custom coordinate input
  const handleCustomCoordinate = () => {
    const x = parseFloat(customX);
    const y = parseFloat(customY);

    const validationErrors = validateCustomCoordinates(x, y);
    
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }

    const coordinate = { x, y };
    onCoordinateSelect(coordinate, `custom (${x}, ${y})`);
    toast.success(`Custom coordinates selected: (${x.toFixed(1)}, ${y.toFixed(1)})`);
    onClose();
  };

  // Group presets by category
  const groupedPresets = LOCATION_PRESETS.reduce((acc, preset) => {
    if (!acc[preset.category]) acc[preset.category] = [];
    acc[preset.category].push(preset);
    return acc;
  }, {} as { [category: string]: LocationPreset[] });

  const renderPresetTab = () => (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        Choose from predefined locations relative to your blueprint dimensions.
      </div>

      {Object.entries(groupedPresets).map(([category, presets]) => (
        <div key={category} className="space-y-2">
          <h4 className="font-medium text-sm text-gray-700">{category} Locations</h4>
          <div className="grid grid-cols-1 gap-2">
            {presets.map((preset) => {
              const coordinate = getPresetCoordinate(preset.name);
              return (
                <Card key={preset.name} className="p-3 cursor-pointer hover:bg-gray-50" isPressable>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-blue-500" />
                        <span className="font-medium capitalize">{preset.name.replace('_', ' ')}</span>
                        <Chip size="sm" variant="flat" color="primary">
                          ({coordinate.x.toFixed(1)}, {coordinate.y.toFixed(1)})
                        </Chip>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{preset.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => copyCoordinate(coordinate, preset.name)}
                      >
                        {copiedCoordinate === preset.name ? (
                          <Check size={14} className="text-green-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        onPress={() => handlePresetSelect(preset.name)}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  const renderCustomTab = () => (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        Enter precise coordinates within your blueprint bounds.
      </div>

      <div className="p-3 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-sm text-blue-900 mb-1">Blueprint Bounds</h4>
        <div className="text-xs text-blue-800">
          <p>Width: 0 to {blueprintDimensions.width} {blueprintDimensions.unit}</p>
          <p>Height: 0 to {blueprintDimensions.height} {blueprintDimensions.unit}</p>
          <p>Origin: Bottom-left (0,0) • Y increases towards top</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="X Coordinate"
          placeholder="0"
          value={customX}
          onChange={(e) => setCustomX(e.target.value)}
          type="number"
          min={0}
          max={blueprintDimensions.width}
          endContent={<span className="text-xs text-gray-500">{blueprintDimensions.unit}</span>}
          isInvalid={customX !== "" && (parseFloat(customX) < 0 || parseFloat(customX) > blueprintDimensions.width || isNaN(parseFloat(customX)))}
          errorMessage={
            customX !== "" && (parseFloat(customX) < 0 || parseFloat(customX) > blueprintDimensions.width || isNaN(parseFloat(customX)))
              ? `X must be between 0 and ${blueprintDimensions.width}`
              : undefined
          }
        />
        <Input
          label="Y Coordinate"
          placeholder="0"
          value={customY}
          onChange={(e) => setCustomY(e.target.value)}
          type="number"
          min={0}
          max={blueprintDimensions.height}
          endContent={<span className="text-xs text-gray-500">{blueprintDimensions.unit}</span>}
          isInvalid={customY !== "" && (parseFloat(customY) < 0 || parseFloat(customY) > blueprintDimensions.height || isNaN(parseFloat(customY)))}
          errorMessage={
            customY !== "" && (parseFloat(customY) < 0 || parseFloat(customY) > blueprintDimensions.height || isNaN(parseFloat(customY)))
              ? `Y must be between 0 and ${blueprintDimensions.height}`
              : undefined
          }
        />
      </div>

      {customX && customY && (
        <div className={`p-3 rounded-lg ${
          validateCustomCoordinates(parseFloat(customX), parseFloat(customY)).length === 0 
            ? "bg-green-50" 
            : "bg-red-50"
        }`}>
          <div className="flex items-center gap-2">
            <Target size={14} className={
              validateCustomCoordinates(parseFloat(customX), parseFloat(customY)).length === 0 
                ? "text-green-500" 
                : "text-red-500"
            } />
            <span className="text-sm font-medium">Selected Coordinate:</span>
            <Chip size="sm" variant="flat" color={
              validateCustomCoordinates(parseFloat(customX), parseFloat(customY)).length === 0 
                ? "success" 
                : "danger"
            }>
              ({parseFloat(customX).toFixed(1)}, {parseFloat(customY).toFixed(1)})
            </Chip>
          </div>
          {validateCustomCoordinates(parseFloat(customX), parseFloat(customY)).length > 0 && (
            <div className="mt-2 text-xs text-red-600">
              {validateCustomCoordinates(parseFloat(customX), parseFloat(customY))[0]}
            </div>
          )}
        </div>
      )}

      <Button
        color="primary"
        className="w-full"
        onPress={handleCustomCoordinate}
        isDisabled={
          !customX || 
          !customY || 
          validateCustomCoordinates(parseFloat(customX), parseFloat(customY)).length > 0
        }
      >
        Use Custom Coordinate
      </Button>
    </div>
  );

  const renderClickTab = () => (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        Click directly on the blueprint to select coordinates interactively.
      </div>

      <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
        <Grid3X3 size={32} className="mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-2">Interactive Coordinate Selection</p>
        <p className="text-xs text-gray-500">
          This feature will be available when you close this dialog and click on the blueprint.
        </p>
      </div>

      <div className="p-3 bg-yellow-50 rounded-lg">
        <h4 className="font-medium text-sm text-yellow-900 mb-1">How to Use:</h4>
        <ol className="text-xs text-yellow-800 space-y-1">
          <li>1. Close this dialog</li>
          <li>2. Click on any point in the blueprint canvas</li>
          <li>3. The coordinates will be automatically captured</li>
          <li>4. Use those coordinates in your AI requests</li>
        </ol>
      </div>

      <Button
        color="warning"
        variant="flat"
        className="w-full"
        onPress={onClose}
      >
        Close & Enable Click Selection
      </Button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <MapPin size={20} className="text-blue-500" />
          <span>Coordinate Picker</span>
        </ModalHeader>
        <ModalBody>
          {/* Tab Navigation */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setActiveTab("presets")}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === "presets"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <MapPin size={14} />
                Presets
              </div>
            </button>
            <button
              onClick={() => setActiveTab("custom")}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === "custom"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Target size={14} />
                Custom
              </div>
            </button>
            <button
              onClick={() => setActiveTab("click")}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === "click"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Grid3X3 size={14} />
                Click
              </div>
            </button>
          </div>

          <Divider />

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === "presets" && renderPresetTab()}
            {activeTab === "custom" && renderCustomTab()}
            {activeTab === "click" && renderClickTab()}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}