import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Chip,
  Link,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { Link as RouterLink } from "react-router-dom";
import { MoreVertical, Trash2 } from "lucide-react";

interface Project {
  id: number;
  name: string;
  description?: string;
  city_type: string;
  created_at: string;
  constraints?: any;
}

interface ProjectCardProps {
  project: Project;
  onDelete?: (projectId: number) => void;
}

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getCityTypeColor = (cityType: string) => {
    switch (cityType) {
      case "new":
        return "primary";
      case "existing":
        return "secondary";
      case "expansion":
        return "success";
      default:
        return "default";
    }
  };

  const handleDelete = () => {
    console.log("Deleting project", project.id, onDelete);
    if (onDelete) {
      onDelete(project.id);
    }
  };

  return (
    <Card className="h-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex gap-3">
        <div className="flex flex-col flex-1">
          <h4 className="text-large font-semibold line-clamp-1">
            {project.name}
          </h4>
          <p className="text-small text-default-500">
            Created {formatDate(project.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Chip
            color={getCityTypeColor(project.city_type)}
            size="sm"
            variant="flat"
            className="capitalize"
          >
            {project.city_type}
          </Chip>
          <Dropdown>
            <DropdownTrigger>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                aria-label="More options"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <MoreVertical size={16} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Project actions">
              <DropdownItem
                key="delete"
                className="text-danger"
                color="danger"
                startContent={<Trash2 size={16} />}
                onClick={handleDelete}
              >
                Delete Project
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </CardHeader>

      <CardBody
        className="pt-0 cursor-pointer"
        as={RouterLink}
        to={`/projects/${project.id}`}
      >
        <p className="text-small text-default-600 line-clamp-3">
          {project.description || "No description provided"}
        </p>

        {project.constraints && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {project.constraints.budget && (
              <Chip size="sm" variant="bordered">
                Budget: ${(project.constraints.budget / 1000000).toFixed(1)}M
              </Chip>
            )}
            {project.constraints.area && (
              <Chip size="sm" variant="bordered">
                Area: {project.constraints.area} km²
              </Chip>
            )}
          </div>
        )}
      </CardBody>

      <CardFooter className="pt-0">
        <Button
          as={RouterLink}
          to={`/projects/${project.id}`}
          color="primary"
          variant="flat"
          size="sm"
          className="w-full"
        >
          Open Project
        </Button>
      </CardFooter>
    </Card>
  );
}
