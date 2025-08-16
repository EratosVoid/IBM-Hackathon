import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { ChevronDown, ChevronUp, Eye } from "lucide-react";
import { DEFAULT_FEATURE_STYLES, SUBTYPE_STYLES, FeatureType } from "@/types/CityPlanTypes";

interface LegendItemProps {
  label: string;
  style: {
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    dashArray?: number[];
  };
  isSubtype?: boolean;
}

function LegendItem({ label, style, isSubtype = false }: LegendItemProps) {
  const hasStroke = style.strokeColor;
  const hasFill = style.fillColor;
  
  return (
    <div className={`flex items-center gap-2 ${isSubtype ? 'ml-4 text-sm' : 'text-sm font-medium'}`}>
      <div 
        className="w-4 h-4 rounded-sm border flex-shrink-0"
        style={{
          backgroundColor: hasFill ? style.fillColor : 'transparent',
          borderColor: hasStroke ? style.strokeColor : '#e5e7eb',
          borderWidth: Math.max(1, style.strokeWidth || 1),
          borderStyle: style.dashArray ? 'dashed' : 'solid'
        }}
      />
      <span className={isSubtype ? 'text-gray-600' : 'text-gray-800'}>{label}</span>
    </div>
  );
}

interface CityPlanLegendProps {
  className?: string;
}

export default function CityPlanLegend({ className = "" }: CityPlanLegendProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<FeatureType>>(new Set());

  const toggleSection = (featureType: FeatureType) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(featureType)) {
      newExpanded.delete(featureType);
    } else {
      newExpanded.add(featureType);
    }
    setExpandedSections(newExpanded);
  };

  const featureData = {
    zone: {
      name: "Zones",
      subtypes: [
        { key: "zone:residential", label: "Residential" },
        { key: "zone:commercial", label: "Commercial" },
        { key: "zone:industrial", label: "Industrial" },
        { key: "zone:mixed_use", label: "Mixed Use" },
        { key: "zone:agricultural", label: "Agricultural" },
        { key: "zone:recreational", label: "Recreational" }
      ]
    },
    road: {
      name: "Roads",
      subtypes: [
        { key: "road:highway", label: "Highway" },
        { key: "road:primary", label: "Primary Road" },
        { key: "road:secondary", label: "Secondary Road" },
        { key: "road:local", label: "Local Road" },
        { key: "road:pedestrian", label: "Pedestrian Path" },
        { key: "road:cycle", label: "Cycle Path" },
        { key: "road:rail", label: "Rail Line" }
      ]
    },
    building: {
      name: "Buildings",
      subtypes: [
        { key: "building:residential", label: "Residential" },
        { key: "building:commercial", label: "Commercial" },
        { key: "building:industrial", label: "Industrial" },
        { key: "building:institutional", label: "Institutional" },
        { key: "building:mixed_use", label: "Mixed Use" },
        { key: "building:infrastructure", label: "Infrastructure" }
      ]
    },
    park: {
      name: "Parks & Recreation",
      subtypes: [
        { key: "park:public", label: "Public Parks" },
        { key: "park:private", label: "Private Parks" },
        { key: "park:playground", label: "Playgrounds" },
        { key: "park:sports", label: "Sports Facilities" },
        { key: "park:garden", label: "Gardens" },
        { key: "park:forest", label: "Forest Areas" },
        { key: "park:wetland", label: "Wetlands" }
      ]
    },
    water_body: {
      name: "Water Bodies",
      subtypes: [
        { key: "water_body:lake", label: "Lakes" },
        { key: "water_body:river", label: "Rivers" },
        { key: "water_body:stream", label: "Streams" },
        { key: "water_body:pond", label: "Ponds" },
        { key: "water_body:reservoir", label: "Reservoirs" },
        { key: "water_body:canal", label: "Canals" },
        { key: "water_body:fountain", label: "Fountains" }
      ]
    },
    service: {
      name: "Services",
      subtypes: [
        { key: "service:utility", label: "Utilities" },
        { key: "service:emergency", label: "Emergency Services" },
        { key: "service:education", label: "Education" },
        { key: "service:healthcare", label: "Healthcare" },
        { key: "service:transport", label: "Transportation" },
        { key: "service:waste", label: "Waste Management" },
        { key: "service:communication", label: "Communication" }
      ]
    },
    architecture: {
      name: "Architecture",
      subtypes: [
        { key: "architecture:monument", label: "Monuments" },
        { key: "architecture:landmark", label: "Landmarks" },
        { key: "architecture:bridge", label: "Bridges" },
        { key: "architecture:tower", label: "Towers" },
        { key: "architecture:historic", label: "Historic Buildings" },
        { key: "architecture:cultural", label: "Cultural Buildings" },
        { key: "architecture:religious", label: "Religious Buildings" }
      ]
    }
  };

  if (!isOpen) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
        <Button
          isIconOnly
          variant="light"
          size="sm"
          onPress={() => setIsOpen(true)}
          className="w-full h-10 hover:bg-gray-100"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Card className={`w-80 max-h-96 overflow-hidden ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between py-2 px-3">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-sm">City Planning Legend</span>
        </div>
        <Button
          isIconOnly
          variant="light"
          size="sm"
          onPress={() => setIsOpen(false)}
          className="h-8 w-8"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardBody className="py-2 px-3 overflow-y-auto">
        <div className="space-y-3">
          {(Object.keys(featureData) as FeatureType[]).map((featureType) => {
            const data = featureData[featureType];
            const isExpanded = expandedSections.has(featureType);
            const defaultStyle = DEFAULT_FEATURE_STYLES[featureType];
            
            return (
              <div key={featureType}>
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                  onClick={() => toggleSection(featureType)}
                >
                  <LegendItem 
                    label={data.name}
                    style={defaultStyle}
                  />
                  <div className="flex-shrink-0 ml-2">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="mt-2 space-y-1">
                    {data.subtypes.map((subtype) => {
                      const subtypeStyle = SUBTYPE_STYLES[subtype.key];
                      const combinedStyle = {
                        ...defaultStyle,
                        ...subtypeStyle
                      };
                      
                      return (
                        <LegendItem
                          key={subtype.key}
                          label={subtype.label}
                          style={combinedStyle}
                          isSubtype
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-2 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <Chip size="sm" variant="flat" color="default">
              Total: {Object.keys(featureData).length} categories
            </Chip>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}