import { useState } from "react";
import {
  Card,
  Button,
  Chip,
  Divider,
  Switch,
  Slider,
  Input,
} from "@heroui/react";
import {
  ArrowLeft,
  Map,
  Layers,
  Settings,
  Info,
  Upload,
  Bot,
  BarChart3,
  Eye,
  EyeOff,
  Palette,
  MapPin,
  Building,
  Route,
  TreePine,
  Droplets,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import {
  CityPlanData,
  FeatureType,
  CityPlanUtils,
} from "@/types/CityPlanTypes";
import { api } from "@/utils/api";

interface ProjectSidebarProps {
  project: any;
  cityPlanData: CityPlanData;
  onCityPlanUpdate: (data: CityPlanData) => void;
  onNavigateBack: () => void;
}

type SidebarSection =
  | "overview"
  | "layers"
  | "inspector"
  | "tools"
  | "ai"
  | "simulation";

const SECTION_ICONS = {
  overview: Info,
  layers: Layers,
  inspector: MapPin,
  tools: Settings,
  ai: Bot,
  simulation: BarChart3,
};

const FEATURE_ICONS = {
  zone: MapPin,
  road: Route,
  building: Building,
  park: TreePine,
  water_body: Droplets,
  service: Zap,
  architecture: Building,
};

export default function ProjectSidebar({
  project,
  cityPlanData,
  onCityPlanUpdate,
  onNavigateBack,
}: ProjectSidebarProps) {
  const [activeSection, setActiveSection] =
    useState<SidebarSection>("overview");
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(
    null
  );

  // AI Chat state - moved to component level to follow Rules of Hooks
  const [aiInput, setAiInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<any[]>([
    {
      role: "assistant" as const,
      content:
        'Hi! I can help you add features to your city. Try saying "Add a large park in the center" or "Create some residential areas".',
      timestamp: new Date(),
    },
  ]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // AI Chat functionality - moved to component level
  const sendAiMessage = async (message: string) => {
    if (!message.trim() || isAiLoading) return;

    const userMessage = {
      role: "user" as const,
      content: message.trim(),
      timestamp: new Date(),
    };

    setAiMessages((prev) => [...prev, userMessage]);
    setAiInput("");
    setIsAiLoading(true);

    try {
      const response: any = await api.planner.sendPrompt(
        message.trim(),
        project.id,
        { existing_features: cityPlanData.features }
      );

      if (response.success) {
        const assistantMessage = {
          role: "assistant" as const,
          content: response.response.agent_response,
          features_added: response.response.features_added || 0,
          generated_features: response.response.generated_features || [],
          timestamp: new Date(),
        };

        setAiMessages((prev) => [...prev, assistantMessage]);

        // If features were generated, update the city plan data
        if (
          response.response.generated_features &&
          response.response.generated_features.length > 0
        ) {
          const updatedCityPlan = {
            ...cityPlanData,
            features: [
              ...cityPlanData.features,
              ...response.response.generated_features,
            ],
          };

          // Update bounds to include new features
          const newBounds = CityPlanUtils.calculateBounds(
            updatedCityPlan.features
          );
          updatedCityPlan.bounds = newBounds;

          // Create/update layers
          updatedCityPlan.layers = CityPlanUtils.createDefaultLayers(
            updatedCityPlan.features
          );

          onCityPlanUpdate(updatedCityPlan);

          toast.success(
            `Added ${response.response.features_added} new features to your city!`
          );
        }
      } else {
        toast.error("Failed to get response from AI assistant");
      }
    } catch (error) {
      console.error("AI Assistant error:", error);
      toast.error("Failed to communicate with AI assistant");

      const errorMessage = {
        role: "assistant" as const,
        content:
          "Sorry, I'm having trouble right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setAiMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const toggleLayerVisibility = (layerId: string) => {
    const updatedLayers = {
      ...cityPlanData.layers,
      [layerId]: {
        ...cityPlanData.layers[layerId],
        visible: !cityPlanData.layers[layerId].visible,
      },
    };

    onCityPlanUpdate({
      ...cityPlanData,
      layers: updatedLayers,
    });
  };

  const updateLayerOpacity = (layerId: string, opacity: number) => {
    const updatedLayers = {
      ...cityPlanData.layers,
      [layerId]: {
        ...cityPlanData.layers[layerId],
        opacity: opacity / 100,
      },
    };

    onCityPlanUpdate({
      ...cityPlanData,
      layers: updatedLayers,
    });
  };

  const getFeatureStats = () => {
    const stats = cityPlanData.features.reduce(
      (acc, feature) => {
        acc[feature.type] = (acc[feature.type] || 0) + 1;
        return acc;
      },
      {} as Record<FeatureType, number>
    );

    return stats;
  };

  const selectedFeature = selectedFeatureId
    ? cityPlanData.features.find((f) => f.id === selectedFeatureId)
    : null;

  const renderOverviewSection = () => (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg">{project.name}</h3>
        <p className="text-sm text-gray-600">
          {project.description || "No description"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Type</p>
          <p className="font-medium capitalize">{project.city_type}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Created</p>
          <p className="font-medium">{formatDate(project.created_at)}</p>
        </div>
        {project.constraints?.budget && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Budget</p>
            <p className="font-medium">
              ${(project.constraints.budget / 1000000).toFixed(1)}M
            </p>
          </div>
        )}
        {project.constraints?.area && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Area</p>
            <p className="font-medium">{project.constraints.area} km²</p>
          </div>
        )}
      </div>

      <div>
        <h4 className="font-medium mb-2">Feature Summary</h4>
        <div className="space-y-2">
          {Object.entries(getFeatureStats()).map(([type, count]) => {
            const Icon = FEATURE_ICONS[type as FeatureType];
            return (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon size={16} className="text-gray-500" />
                  <span className="text-sm capitalize">
                    {type.replace("_", " ")}
                  </span>
                </div>
                <Chip size="sm" variant="flat">
                  {count}
                </Chip>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Coordinate System</h4>
        <div className="text-sm space-y-1">
          <p>
            <span className="text-gray-500">Type:</span>{" "}
            {cityPlanData.coordinateSystem.type}
          </p>
          <p>
            <span className="text-gray-500">Unit:</span>{" "}
            {cityPlanData.coordinateSystem.unit}
          </p>
          <p>
            <span className="text-gray-500">Bounds:</span> (
            {cityPlanData.bounds.minX}, {cityPlanData.bounds.minY}) to (
            {cityPlanData.bounds.maxX}, {cityPlanData.bounds.maxY})
          </p>
        </div>
      </div>
    </div>
  );

  const renderLayersSection = () => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Map Layers</h4>
        <Button size="sm" variant="flat">
          <Palette size={14} />
          Styles
        </Button>
      </div>

      {Object.values(cityPlanData.layers).length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No layers available
        </p>
      ) : (
        <div className="space-y-3">
          {Object.values(cityPlanData.layers)
            .sort((a, b) => b.zIndex - a.zIndex)
            .map((layer) => {
              const Icon = FEATURE_ICONS[layer.id as FeatureType] || Layers;
              return (
                <Card key={layer.id} className="p-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon size={16} className="text-gray-600" />
                        <span className="font-medium text-sm">
                          {layer.name}
                        </span>
                        <Chip size="sm" variant="flat">
                          {layer.featureIds.length}
                        </Chip>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => toggleLayerVisibility(layer.id)}
                        >
                          {layer.visible ? (
                            <Eye size={14} />
                          ) : (
                            <EyeOff size={14} />
                          )}
                        </Button>
                      </div>
                    </div>

                    {layer.visible && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Opacity</p>
                        <Slider
                          size="sm"
                          value={layer.opacity * 100}
                          onChange={(value) =>
                            updateLayerOpacity(layer.id, value as number)
                          }
                          className="max-w-full"
                        />
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );

  const renderInspectorSection = () => (
    <div className="space-y-4">
      <h4 className="font-medium">Feature Inspector</h4>

      {selectedFeature ? (
        <Card className="p-3">
          <div className="space-y-3">
            <div>
              <h5 className="font-medium">{selectedFeature.name}</h5>
              <p className="text-sm text-gray-600 capitalize">
                {selectedFeature.type.replace("_", " ")}
                {selectedFeature.subtype && ` • ${selectedFeature.subtype}`}
              </p>
            </div>

            {selectedFeature.description && (
              <p className="text-sm">{selectedFeature.description}</p>
            )}

            <div className="space-y-2">
              <h6 className="text-sm font-medium">Geometry</h6>
              <div className="text-xs space-y-1">
                <p>
                  <span className="text-gray-500">Type:</span>{" "}
                  {selectedFeature.geometry.type}
                </p>
                {selectedFeature.geometry.type === "point" && (
                  <p>
                    <span className="text-gray-500">Position:</span> (
                    {selectedFeature.geometry.coordinates.x},{" "}
                    {selectedFeature.geometry.coordinates.y})
                  </p>
                )}
                {selectedFeature.geometry.type === "linestring" && (
                  <p>
                    <span className="text-gray-500">Points:</span>{" "}
                    {selectedFeature.geometry.coordinates.length}
                  </p>
                )}
                {selectedFeature.geometry.type === "polygon" && (
                  <p>
                    <span className="text-gray-500">Vertices:</span>{" "}
                    {selectedFeature.geometry.coordinates[0].length - 1}
                  </p>
                )}
              </div>
            </div>

            {Object.keys(selectedFeature.metadata).length > 0 && (
              <div className="space-y-2">
                <h6 className="text-sm font-medium">Metadata</h6>
                <div className="text-xs space-y-1">
                  {Object.entries(selectedFeature.metadata).map(
                    ([key, value]) => (
                      <p key={key}>
                        <span className="text-gray-500 capitalize">
                          {key.replace("_", " ")}:
                        </span>{" "}
                        {String(value)}
                      </p>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <p className="text-sm text-gray-500 text-center py-8">
          Click on a feature in the map to inspect its details
        </p>
      )}

      <div>
        <h5 className="font-medium mb-2">All Features</h5>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {cityPlanData.features.map((feature) => {
            const Icon = FEATURE_ICONS[feature.type];
            return (
              <button
                key={feature.id}
                onClick={() => setSelectedFeatureId(feature.id)}
                className={`w-full flex items-center gap-2 p-2 rounded text-left hover:bg-gray-100 ${
                  selectedFeatureId === feature.id
                    ? "bg-blue-50 text-blue-700"
                    : ""
                }`}
              >
                <Icon size={14} />
                <span className="text-sm truncate">{feature.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderToolsSection = () => (
    <div className="space-y-4">
      <h4 className="font-medium">Tools & Actions</h4>

      <div className="space-y-2">
        <Button
          className="w-full justify-start"
          variant="flat"
          startContent={<Upload size={16} />}
        >
          Upload Blueprint
        </Button>
        <Button
          className="w-full justify-start"
          variant="flat"
          startContent={<Map size={16} />}
        >
          Export Map
        </Button>
        <Button
          className="w-full justify-start"
          variant="flat"
          startContent={<BarChart3 size={16} />}
        >
          Run Simulation
        </Button>
      </div>

      <Divider />

      <div>
        <h5 className="font-medium mb-2">View Settings</h5>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Grid Lines</span>
            <Switch size="sm" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Feature Labels</span>
            <Switch size="sm" defaultSelected />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Coordinates</span>
            <Switch size="sm" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAISection = () => {
    const quickActions = [
      "Add a large park in the center",
      "Create some residential areas",
      "Add a commercial district",
      "Build roads connecting areas",
    ];

    return (
      <div className="space-y-4 h-full flex flex-col">
        <div className="flex items-center gap-2">
          <Bot size={20} className="text-blue-600" />
          <h4 className="font-medium">AI Urban Planner</h4>
        </div>

        {/* Chat Messages */}
        <div className="h-full overflow-y-auto space-y-3 bg-gray-50 p-3 rounded-lg">
          {aiMessages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-2 ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-300"
                }`}
              >
                {message.role === "user" ? "👤" : "🤖"}
              </div>
              <div
                className={`flex-1 ${message.role === "user" ? "text-right" : ""}`}
              >
                <div
                  className={`text-xs p-2 rounded-lg ${
                    message.role === "user"
                      ? "bg-blue-500 text-white ml-auto max-w-[80%]"
                      : "bg-white border max-w-[80%]"
                  }`}
                >
                  <p>{message.content}</p>
                  {"features_added" in message &&
                    message.features_added > 0 && (
                      <div className="mt-1 text-xs opacity-75">
                        ✨ Added {message.features_added} features
                      </div>
                    )}
                </div>
              </div>
            </div>
          ))}
          {isAiLoading && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                🤖
              </div>
              <div className="bg-white border p-2 rounded-lg max-w-[80%]">
                <div className="flex items-center gap-1">
                  <div className="animate-pulse">AI is thinking...</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            size="sm"
            placeholder="Tell me what to add to your city..."
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendAiMessage(aiInput);
              }
            }}
            disabled={isAiLoading}
          />
          <Button
            size="sm"
            color="primary"
            isIconOnly
            onPress={() => sendAiMessage(aiInput)}
            isDisabled={!aiInput.trim() || isAiLoading}
          >
            <Bot size={14} />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <h5 className="font-medium text-sm">Quick Actions</h5>
          <div className="space-y-1">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                size="sm"
                variant="flat"
                className="w-full justify-start text-xs"
                onPress={() => sendAiMessage(action)}
                isDisabled={isAiLoading}
              >
                {action}
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSimulationSection = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 size={20} className="text-green-600" />
        <h4 className="font-medium">Simulation</h4>
      </div>

      <div className="text-sm text-gray-600">
        <p>
          Run simulations to analyze traffic, costs, and environmental impact.
        </p>
      </div>

      <Button color="success" className="w-full">
        Run Full Simulation
      </Button>

      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" variant="flat">
          Traffic
        </Button>
        <Button size="sm" variant="flat">
          Cost
        </Button>
        <Button size="sm" variant="flat">
          Environment
        </Button>
        <Button size="sm" variant="flat">
          Walkability
        </Button>
      </div>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case "overview":
        return renderOverviewSection();
      case "layers":
        return renderLayersSection();
      case "inspector":
        return renderInspectorSection();
      case "tools":
        return renderToolsSection();
      case "ai":
        return renderAISection();
      case "simulation":
        return renderSimulationSection();
      default:
        return renderOverviewSection();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Button isIconOnly size="sm" variant="light" onClick={onNavigateBack}>
            <ArrowLeft size={16} />
          </Button>
          <h2 className="font-semibold text-lg truncate">{project.name}</h2>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1">
          {Object.entries(SECTION_ICONS).map(([section, Icon]) => (
            <button
              key={section}
              onClick={() => setActiveSection(section as SidebarSection)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-colors ${
                activeSection === section
                  ? "bg-blue-100 text-blue-700"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              <Icon size={16} />
              <span className="capitalize">{section}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">{renderSectionContent()}</div>
    </div>
  );
}
