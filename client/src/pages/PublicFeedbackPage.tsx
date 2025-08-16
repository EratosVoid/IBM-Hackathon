import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Spinner,
  Chip,
} from "@heroui/react";
import {
  Star,
  MessageSquare,
  Send,
  MapPin,
  Bot,
  Building,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/utils/api";
import CityPlanRenderer from "@/components/project/CityPlanRenderer";
import { CityPlanData, CityPlanUtils } from "@/types/CityPlanTypes";

interface PublicProjectData {
  id: number;
  name: string;
  description: string;
  city_type: string;
  blueprint_width: number;
  blueprint_height: number;
  blueprint_unit: string;
  city_data: any;
}

export default function PublicFeedbackPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<PublicProjectData | null>(null);
  const [cityPlanData, setCityPlanData] = useState<CityPlanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState({
    name: "",
    category: "Planning",
    rating: 5,
    comment: "",
  });
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // AI Chat state
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      role: "assistant",
      content:
        "Hi! I can help you understand this city planning project. Ask me about any features, zoning, or design decisions you see in the blueprint.",
      timestamp: new Date(),
    },
  ]);

  useEffect(() => {
    if (projectId) {
      loadPublicProject(parseInt(projectId));
    }
  }, [projectId]);

  const loadPublicProject = async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      // Use structured API call following app pattern
      const data = await api.publicProjects.getById(id);
      if (data.success) {
        setProject(data.project);

        // Transform city_data to CityPlanData format
        if (data.project.city_data) {
          const transformedData = CityPlanUtils.transformParsedData(
            data.project.city_data
          );
          transformedData.name = data.project.name;
          transformedData.description = data.project.description;

          // Add blueprint dimensions from project
          transformedData.blueprint = {
            width: data.project.blueprint_width || 100,
            height: data.project.blueprint_height || 100,
            unit: data.project.blueprint_unit || "meters",
          };

          setCityPlanData(transformedData);
        } else {
          // Create empty city plan
          setCityPlanData({
            id: `project_${id}`,
            name: data.project.name,
            description: data.project.description,
            coordinateSystem: {
              type: "cartesian",
              unit: "meters",
            },
            bounds: {
              minX: 0,
              maxX: data.project.blueprint_width || 100,
              minY: 0,
              maxY: data.project.blueprint_height || 100,
            },
            blueprint: {
              width: data.project.blueprint_width || 100,
              height: data.project.blueprint_height || 100,
              unit: data.project.blueprint_unit || "meters",
            },
            features: [],
            layers: {},
            metadata: {
              lastModified: new Date().toISOString(),
              version: "1.0.0",
            },
          });
        }
      } else {
        setError("Project not found or not accessible");
      }
    } catch (err: any) {
      console.error("Error loading public project:", err);
      setError("Failed to load project. Please check the link and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const submitFeedback = async () => {
    if (!feedbackForm.comment.trim()) {
      toast.error("Please enter your feedback");
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      // Use structured API call following app pattern
      const data = await api.publicProjects.submitFeedback(parseInt(projectId!), feedbackForm);
      
      if (data.success) {
        toast.success("Thank you for your feedback!");
        setFeedbackForm({
          name: "",
          category: "Planning",
          rating: 5,
          comment: "",
        });
      } else {
        toast.error("Failed to submit feedback");
      }
    } catch (error) {
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const sendChatMessage = async (message: string) => {
    if (!message.trim() || isChatLoading) return;

    const userMessage = {
      role: "user",
      content: message.trim(),
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      // Simulate AI response for now
      setTimeout(() => {
        const assistantMessage = {
          role: "assistant",
          content: `Great question about "${message.trim()}"! Based on the city plan, I can see this relates to the urban design. The project focuses on sustainable development with mixed-use zoning. Would you like me to explain any specific features you see in the blueprint?`,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, assistantMessage]);
        setIsChatLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        role: "assistant",
        content: "Sorry, I'm having trouble right now. Please try again.",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
      setIsChatLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading city plan...</p>
        </div>
      </div>
    );
  }

  if (error || !project || !cityPlanData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-xl font-bold mb-4">Project Not Found</h2>
          <p className="text-gray-600 mb-4">
            {error || "The requested city planning project could not be found."}
          </p>
          <Button color="primary" onPress={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <p className="text-gray-600">{project.description}</p>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <Chip
                color="primary"
                variant="flat"
                startContent={<MapPin size={14} />}
              >
                {project.city_type}
              </Chip>
              <Chip
                color="secondary"
                variant="flat"
                startContent={<Users size={14} />}
              >
                Community Feedback
              </Chip>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: City Plan Visualization (2/3 width) */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <div className="h-full">
                <CityPlanRenderer
                  cityPlanData={cityPlanData}
                  onDataUpdate={() => {}} // Read-only for public view
                />
              </div>
            </Card>
          </div>

          {/* Right: Feedback Form and Chat (1/3 width) */}
          <div className="space-y-6">
            {/* Feedback Form */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare size={20} className="text-orange-600" />
                <h3 className="font-semibold">Share Your Feedback</h3>
              </div>

              <div className="space-y-4">
                <Input
                  label="Name (Optional)"
                  placeholder="Your name"
                  value={feedbackForm.name}
                  onChange={(e) =>
                    setFeedbackForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />

                <Select
                  label="Category"
                  selectedKeys={[feedbackForm.category]}
                  onSelectionChange={(keys) =>
                    setFeedbackForm((prev) => ({
                      ...prev,
                      category: Array.from(keys)[0] as string,
                    }))
                  }
                >
                  <SelectItem key="Planning">Planning & Design</SelectItem>
                  <SelectItem key="Infrastructure">Infrastructure</SelectItem>
                  <SelectItem key="Environment">Environment</SelectItem>
                  <SelectItem key="Community">Community Impact</SelectItem>
                </Select>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Rating
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Button
                        key={star}
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() =>
                          setFeedbackForm((prev) => ({ ...prev, rating: star }))
                        }
                      >
                        <Star
                          size={20}
                          className={`${
                            star <= feedbackForm.rating
                              ? "text-yellow-500 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      </Button>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {feedbackForm.rating}/5
                    </span>
                  </div>
                </div>

                <Textarea
                  label="Your Feedback"
                  placeholder="Share your thoughts about this city planning project..."
                  value={feedbackForm.comment}
                  onChange={(e) =>
                    setFeedbackForm((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                  rows={4}
                />

                <Button
                  color="primary"
                  className="w-full"
                  onPress={submitFeedback}
                  isLoading={isSubmittingFeedback}
                  startContent={!isSubmittingFeedback && <Send size={16} />}
                >
                  {isSubmittingFeedback ? "Submitting..." : "Submit Feedback"}
                </Button>
              </div>
            </Card>

            {/* AI Chat */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Bot size={20} className="text-blue-600" />
                <h3 className="font-semibold">Ask About This Plan</h3>
              </div>

              {/* Chat Messages */}
              <div className="h-64 overflow-y-auto space-y-3 bg-gray-50 p-3 rounded-lg mb-4">
                {chatMessages.map((message, index) => (
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
                        className={`text-sm p-2 rounded-lg ${
                          message.role === "user"
                            ? "bg-blue-500 text-white ml-auto max-w-[80%]"
                            : "bg-white border max-w-[80%]"
                        }`}
                      >
                        <p>{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                      🤖
                    </div>
                    <div className="bg-white border p-2 rounded-lg max-w-[80%]">
                      <div className="animate-pulse">AI is thinking...</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <Input
                  size="sm"
                  placeholder="Ask about the city plan..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendChatMessage(chatInput);
                    }
                  }}
                  disabled={isChatLoading}
                />
                <Button
                  size="sm"
                  color="primary"
                  isIconOnly
                  onPress={() => sendChatMessage(chatInput)}
                  isDisabled={!chatInput.trim() || isChatLoading}
                >
                  <Bot size={14} />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
