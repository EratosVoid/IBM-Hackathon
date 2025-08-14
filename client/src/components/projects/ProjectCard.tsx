import { 
  Card, 
  CardHeader, 
  CardBody, 
  CardFooter,
  Button,
  Chip,
  Link
} from "@heroui/react";
import { Link as RouterLink } from "react-router-dom";

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
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCityTypeColor = (cityType: string) => {
    switch (cityType) {
      case 'new':
        return 'primary';
      case 'existing':
        return 'secondary';
      case 'expansion':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Card 
      className="h-full hover:shadow-lg transition-shadow duration-200"
      isPressable
      as={RouterLink}
      to={`/projects/${project.id}`}
    >
      <CardHeader className="flex gap-3">
        <div className="flex flex-col flex-1">
          <h4 className="text-large font-semibold line-clamp-1">
            {project.name}
          </h4>
          <p className="text-small text-default-500">
            Created {formatDate(project.created_at)}
          </p>
        </div>
        <Chip
          color={getCityTypeColor(project.city_type)}
          size="sm"
          variant="flat"
          className="capitalize"
        >
          {project.city_type}
        </Chip>
      </CardHeader>
      
      <CardBody className="pt-0">
        <p className="text-small text-default-600 line-clamp-3">
          {project.description || 'No description provided'}
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