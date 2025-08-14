import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Chip,
  Skeleton,
  Link,
} from '@heroui/react';
import { toast } from 'sonner';

import DefaultLayout from '@/layouts/default';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { api, ApiError } from '@/utils/api';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { projects, setProjects, setLoading, isLoading } = useProjectStore();
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedSimulations: 0,
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await api.projects.list();
      if (response.success) {
        setProjects(response.projects);
        setStats({
          totalProjects: response.projects.length,
          activeProjects: response.projects.filter(p => p.status !== 'completed').length,
          completedSimulations: response.projects.filter(p => p.city_data?.simulations?.length > 0).length,
        });
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(`Failed to load projects: ${error.message}`);
      } else {
        toast.error('Failed to load projects');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <div className="flex flex-col gap-6">
        {/* Welcome Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-large text-default-500">
            Manage your city planning projects and collaborate with AI
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardBody className="flex flex-row items-center gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-small text-default-500">Total Projects</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 rounded" />
                ) : (
                  <p className="text-2xl font-bold">{stats.totalProjects}</p>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-row items-center gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-small text-default-500">Active Projects</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 rounded" />
                ) : (
                  <p className="text-2xl font-bold text-success">
                    {stats.activeProjects}
                  </p>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-row items-center gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-small text-default-500">Simulations Run</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 rounded" />
                ) : (
                  <p className="text-2xl font-bold text-primary">
                    {stats.completedSimulations}
                  </p>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold">Quick Actions</h3>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-3">
              <Button
                as={RouterLink}
                to="/projects/new"
                color="primary"
                variant="solid"
              >
                Create New Project
              </Button>
              <Button
                as={RouterLink}
                to="/projects"
                color="default"
                variant="bordered"
              >
                View All Projects
              </Button>
              <Button
                onClick={() => toast.info('Document management coming soon!')}
                color="default"
                variant="light"
              >
                Manage Documents
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Recent Projects */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Recent Projects</h3>
            <Link as={RouterLink} to="/projects" color="primary">
              View All
            </Link>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48 rounded" />
                      <Skeleton className="h-3 w-32 rounded" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            ) : projects.length > 0 ? (
              <div className="space-y-4">
                {projects.slice(0, 3).map((project) => (
                  <div
                    key={project.id}
                    className="flex justify-between items-center p-3 rounded-lg border border-default-200 hover:bg-default-50"
                  >
                    <div className="flex flex-col gap-1">
                      <Link
                        as={RouterLink}
                        to="/projects"
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {project.name}
                      </Link>
                      <p className="text-small text-default-500">
                        {project.description || 'No description'}
                      </p>
                      <p className="text-tiny text-default-400">
                        Created {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Chip
                        color={project.city_type === 'new' ? 'primary' : 'secondary'}
                        size="sm"
                        variant="flat"
                      >
                        {project.city_type}
                      </Chip>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-default-500 mb-4">No projects yet</p>
                <Button
                  as={RouterLink}
                  to="/projects/new"
                  color="primary"
                  variant="flat"
                >
                  Create Your First Project
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </DefaultLayout>
  );
}