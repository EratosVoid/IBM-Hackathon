import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Progress,
  Chip,
} from "@heroui/react";
import { toast } from "sonner";

import DefaultLayout from "@/layouts/default";
import { api, ApiError } from "@/utils/api";
import { useProjectStore } from "@/stores/projectStore";

// Form validation schema
const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  cityType: z.enum(["new", "existing", "expansion"]),
  budget: z.number().min(100000, "Budget must be at least $100,000").optional(),
  area: z.number().min(100, "Area must be at least 100 sq km").optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

enum ProjectCreationType {
  SCRATCH = "scratch",
  BLUEPRINT = "blueprint",
}

enum Step {
  TYPE_SELECTION = 1,
  PROJECT_DETAILS = 2,
  BLUEPRINT_UPLOAD = 3,
  REVIEW = 4,
}

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const { addProject } = useProjectStore();
  const [currentStep, setCurrentStep] = useState<Step>(Step.TYPE_SELECTION);
  const [creationType, setCreationType] = useState<ProjectCreationType | null>(
    null
  );
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      cityType: "new",
      budget: 5000000,
      area: 1000,
    },
  });

  const watchedValues = watch();

  const handleTypeSelection = (type: ProjectCreationType) => {
    setCreationType(type);
    setCurrentStep(Step.PROJECT_DETAILS);
  };

  const handleNext = () => {
    if (currentStep === Step.PROJECT_DETAILS) {
      if (creationType === ProjectCreationType.BLUEPRINT) {
        setCurrentStep(Step.BLUEPRINT_UPLOAD);
      } else {
        setCurrentStep(Step.REVIEW);
      }
    } else if (currentStep === Step.BLUEPRINT_UPLOAD) {
      setCurrentStep(Step.REVIEW);
    }
  };

  const handleBack = () => {
    if (currentStep === Step.PROJECT_DETAILS) {
      setCurrentStep(Step.TYPE_SELECTION);
      setCreationType(null);
    } else if (currentStep === Step.BLUEPRINT_UPLOAD) {
      setCurrentStep(Step.PROJECT_DETAILS);
    } else if (currentStep === Step.REVIEW) {
      if (creationType === ProjectCreationType.BLUEPRINT) {
        setCurrentStep(Step.BLUEPRINT_UPLOAD);
      } else {
        setCurrentStep(Step.PROJECT_DETAILS);
      }
    }
  };

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    try {
      // Create the project
      const projectPayload = {
        name: data.name,
        description: data.description || "",
        cityType: data.cityType,
        constraints: {
          budget: data.budget,
          area: data.area,
        },
      };

      const response = await api.projects.create(projectPayload);

      if (response.success) {
        addProject(response.project);

        // If blueprint was uploaded, handle file upload
        if (uploadedFile && creationType === ProjectCreationType.BLUEPRINT) {
          try {
            toast.info("Uploading and parsing blueprint...");

            const uploadResponse = await api.projects.uploadBlueprint({
              projectId: response.project.id,
              file: uploadedFile,
            });

            if (uploadResponse.success) {
              if (uploadResponse.parsing_status === "completed") {
                toast.success("Blueprint uploaded and parsed successfully!");
              } else if (uploadResponse.parsing_status === "failed") {
                toast.warning(
                  `Blueprint uploaded but parsing failed: ${uploadResponse.parsing_error || "Unknown error"}`
                );
              } else {
                toast.info("Blueprint uploaded, parsing in progress...");
              }
            }
          } catch (uploadError) {
            console.error("Blueprint upload failed:", uploadError);
            if (uploadError instanceof ApiError) {
              toast.error(`Blueprint upload failed: ${uploadError.message}`);
            } else {
              toast.error("Blueprint upload failed");
            }
          }
        }

        toast.success("Project created successfully!");
        navigate("/projects");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(`Failed to create project: ${error.message}`);
      } else {
        toast.error("Failed to create project");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      toast.success("Blueprint uploaded successfully");
    }
  };

  const onDropRejected = (rejectedFiles: any[]) => {
    const rejection = rejectedFiles[0];
    if (rejection.errors.some((e: any) => e.code === "file-too-large")) {
      toast.error("File size must be less than 10MB");
    } else if (
      rejection.errors.some((e: any) => e.code === "file-invalid-type")
    ) {
      toast.error("Please upload PNG, JPEG, PDF, GeoJSON, or DXF files only");
    } else {
      toast.error("Invalid file. Please try again.");
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      onDropRejected,
      accept: {
        "image/png": [".png"],
        "image/jpeg": [".jpg", ".jpeg"],
        "application/pdf": [".pdf"],
        "application/json": [".json", ".geojson"],
        "application/octet-stream": [".dxf"],
        "text/plain": [".json"],
      },
      maxSize: 10 * 1024 * 1024, // 10MB
      multiple: false,
    });

  const renderStepContent = () => {
    switch (currentStep) {
      case Step.TYPE_SELECTION:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Choose Project Type</h2>
              <p className="text-default-500">
                How would you like to start your city planning project?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                isPressable
                className={`cursor-pointer transition-all ${
                  creationType === ProjectCreationType.SCRATCH
                    ? "border-primary bg-primary/5"
                    : "border-default-200 hover:border-default-300"
                }`}
                onPress={() => handleTypeSelection(ProjectCreationType.SCRATCH)}
              >
                <CardBody className="p-6 text-center">
                  <div className="text-4xl mb-4">🏗️</div>
                  <h3 className="text-xl font-semibold mb-2">
                    Start from Scratch
                  </h3>
                  <p className="text-default-500">
                    Create a new city project with our AI-powered planning tools
                  </p>
                </CardBody>
              </Card>

              <Card
                isPressable
                className={`cursor-pointer transition-all ${
                  creationType === ProjectCreationType.BLUEPRINT
                    ? "border-primary bg-primary/5"
                    : "border-default-200 hover:border-default-300"
                }`}
                onPress={() =>
                  handleTypeSelection(ProjectCreationType.BLUEPRINT)
                }
              >
                <CardBody className="p-6 text-center">
                  <div className="text-4xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold mb-2">
                    Upload Blueprint
                  </h3>
                  <p className="text-default-500">
                    Import an existing city blueprint or zoning map to enhance
                  </p>
                </CardBody>
              </Card>
            </div>
          </div>
        );

      case Step.PROJECT_DETAILS:
        return (
          <form onSubmit={handleSubmit(handleNext)} className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Project Details</h2>
              <p className="text-default-500">
                Provide basic information about your city planning project
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                {...register("name")}
                label="Project Name"
                placeholder="Downtown Revitalization"
                isRequired
                errorMessage={errors.name?.message}
                isInvalid={!!errors.name}
              />

              <Select
                {...register("cityType")}
                label="City Type"
                placeholder="Select city type"
                isRequired
                errorMessage={errors.cityType?.message}
                isInvalid={!!errors.cityType}
                defaultSelectedKeys={["new"]}
              >
                <SelectItem key="new" textValue="new">
                  New City
                </SelectItem>
                <SelectItem key="existing" textValue="existing">
                  Existing City
                </SelectItem>
                <SelectItem key="expansion" textValue="expansion">
                  City Expansion
                </SelectItem>
              </Select>
            </div>

            <Textarea
              {...register("description")}
              label="Description"
              placeholder="Describe your city planning goals and vision..."
              maxRows={4}
              errorMessage={errors.description?.message}
              isInvalid={!!errors.description}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                {...register("budget", { valueAsNumber: true })}
                label="Budget (USD)"
                placeholder="5000000"
                type="number"
                startContent="$"
                errorMessage={errors.budget?.message}
                isInvalid={!!errors.budget}
              />

              <Input
                {...register("area", { valueAsNumber: true })}
                label="Area (sq km)"
                placeholder="1000"
                type="number"
                errorMessage={errors.area?.message}
                isInvalid={!!errors.area}
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="bordered" onPress={handleBack}>
                Back
              </Button>
              <Button type="submit" color="primary">
                {creationType === ProjectCreationType.BLUEPRINT
                  ? "Next: Upload Blueprint"
                  : "Review"}
              </Button>
            </div>
          </form>
        );

      case Step.BLUEPRINT_UPLOAD:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Upload Blueprint</h2>
              <p className="text-default-500">
                Upload your city blueprint, zoning map, or planning document
              </p>
            </div>

            <Card>
              <CardBody className="p-8">
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200
                    ${
                      isDragActive
                        ? "border-primary bg-primary/5 border-solid"
                        : isDragReject
                          ? "border-danger bg-danger/5"
                          : uploadedFile
                            ? "border-success bg-success/5"
                            : "border-default-300 hover:border-default-400 hover:bg-default-50"
                    }
                  `}
                >
                  <input {...getInputProps()} />

                  <div className="text-6xl mb-4">
                    {uploadedFile
                      ? "✅"
                      : isDragActive
                        ? "📥"
                        : isDragReject
                          ? "❌"
                          : "📎"}
                  </div>

                  <h3 className="text-lg font-semibold mb-2">
                    {uploadedFile
                      ? uploadedFile.name
                      : isDragActive
                        ? "Drop your blueprint here"
                        : isDragReject
                          ? "Invalid file type or size"
                          : "Drop your blueprint here or click to browse"}
                  </h3>

                  <p className="text-default-500 mb-4">
                    {uploadedFile
                      ? `File size: ${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB`
                      : isDragActive
                        ? "Release to upload your file"
                        : isDragReject
                          ? "Please upload PNG, JPEG, PDF, GeoJSON, or DXF files under 10MB"
                          : "Supports PNG, JPEG, PDF, GeoJSON, and DXF files up to 10MB"}
                  </p>

                  {!isDragActive && (
                    <Button
                      color={uploadedFile ? "success" : "primary"}
                      variant="bordered"
                      className="pointer-events-none"
                    >
                      {uploadedFile ? "File Selected" : "Choose File"}
                    </Button>
                  )}

                  {uploadedFile && (
                    <div className="mt-4 pt-4 border-t border-default-200">
                      <Button
                        size="sm"
                        color="danger"
                        variant="light"
                        onPress={(e: any) => {
                          e.stopPropagation();
                          setUploadedFile(null);
                          toast.info("File removed");
                        }}
                      >
                        Remove File
                      </Button>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            <div className="flex justify-between pt-4">
              <Button variant="bordered" onPress={handleBack}>
                Back
              </Button>
              <Button color="primary" onPress={handleNext}>
                Review Project
              </Button>
            </div>
          </div>
        );

      case Step.REVIEW:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Review & Create</h2>
              <p className="text-default-500">
                Review your project details before creating
              </p>
            </div>

            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold">Project Summary</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-small text-default-500">Project Name</p>
                    <p className="font-medium">{watchedValues.name}</p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">City Type</p>
                    <Chip size="sm" variant="flat" color="primary">
                      {watchedValues.cityType}
                    </Chip>
                  </div>
                </div>

                {watchedValues.description && (
                  <div>
                    <p className="text-small text-default-500">Description</p>
                    <p className="font-medium">{watchedValues.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-small text-default-500">Budget</p>
                    <p className="font-medium">
                      ${watchedValues.budget?.toLocaleString() || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">Area</p>
                    <p className="font-medium">
                      {watchedValues.area || "N/A"} sq km
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-small text-default-500">Project Type</p>
                  <p className="font-medium capitalize">
                    {creationType?.replace("_", " ")}
                  </p>
                </div>

                {uploadedFile && (
                  <div>
                    <p className="text-small text-default-500">
                      Blueprint File
                    </p>
                    <p className="font-medium">{uploadedFile.name}</p>
                  </div>
                )}
              </CardBody>
            </Card>

            <div className="flex justify-between pt-4">
              <Button variant="bordered" onPress={handleBack}>
                Back
              </Button>
              <Button
                color="success"
                onPress={() => handleSubmit(onSubmit)()}
                isLoading={isSubmitting}
              >
                Create Project
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case Step.TYPE_SELECTION:
        return "Choose Type";
      case Step.PROJECT_DETAILS:
        return "Project Details";
      case Step.BLUEPRINT_UPLOAD:
        return "Upload Blueprint";
      case Step.REVIEW:
        return "Review";
      default:
        return "";
    }
  };

  const progress = (currentStep / 4) * 100;

  return (
    <DefaultLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Create New Project</h1>
              <p className="text-large text-default-500 mt-1">
                Step {currentStep} of 4: {getStepTitle()}
              </p>
            </div>
            <Button variant="bordered" onPress={() => navigate("/projects")}>
              Cancel
            </Button>
          </div>

          {/* Progress */}
          <Progress value={progress} className="max-w-md" />

          {/* Step Content */}
          <Card>
            <CardBody className="p-8">{renderStepContent()}</CardBody>
          </Card>
        </div>
      </div>
    </DefaultLayout>
  );
}
