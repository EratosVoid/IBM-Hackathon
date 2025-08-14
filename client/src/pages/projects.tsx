import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Button,
  Spinner,
  Card,
  CardBody,
} from '@heroui/react';
import { toast } from 'sonner';

import DefaultLayout from '@/layouts/default';
import ProjectCard from '@/components/projects/ProjectCard';
import { useProjectStore } from '@/stores/projectStore';
import { api, ApiError } from '@/utils/api';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, setProjects, setLoading, isLoading } = useProjectStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.projects.list();
      if (response.success) {
        setProjects(response.projects);
      } else {
        setError('Failed to load projects');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message);
        toast.error(`Failed to load projects: ${error.message}`);
      } else {
        setError('An unexpected error occurred');
        toast.error('Failed to load projects');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    navigate('/projects/new');
  };

  return (
    <DefaultLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-large text-default-500">
              Manage your city planning projects
            </p>
          </div>
          <Button
            color="primary"
            size="lg"
            onClick={handleCreateProject}
            className="sm:w-auto w-full"
          >
            Create New Project
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" color="primary" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card>
            <CardBody className="text-center py-12">
              <p className="text-danger mb-4">{error}</p>
              <Button
                color="primary"
                variant="flat"
                onClick={loadProjects}
              >
                Try Again
              </Button>
            </CardBody>
          </Card>
        )}

        {/* Projects Grid */}
        {!isLoading && !error && (
          <>
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <Card>
                <CardBody className="text-center py-12">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
                    <p className="text-default-500">
                      Create your first city planning project to get started
                    </p>
                  </div>
                  <Button
                    color="primary"
                    size="lg"
                    onClick={handleCreateProject}
                  >
                    Create Your First Project
                  </Button>
                </CardBody>
              </Card>
            )}
          </>
        )}

        {/* Projects Count */}
        {!isLoading && !error && projects.length > 0 && (
          <div className="text-center text-small text-default-500">
            Showing {projects.length} project{projects.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}