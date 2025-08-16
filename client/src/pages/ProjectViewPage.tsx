import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spinner } from '@heroui/react';
import { toast } from 'sonner';

import DefaultLayout from '@/layouts/default';
import { useProjectStore } from '@/stores/projectStore';
import { api, ApiError } from '@/utils/api';
import ProjectSidebar from '@/components/project/ProjectSidebar';
import CityPlanRenderer from '@/components/project/CityPlanRenderer';
import { CityPlanData, CityPlanUtils } from '@/types/CityPlanTypes';

export default function ProjectViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, setCurrentProject, setLoading, isLoading } = useProjectStore();
  const [cityPlanData, setCityPlanData] = useState<CityPlanData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/projects');
      return;
    }
    loadProject(parseInt(id));
  }, [id]);

  const loadProject = async (projectId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.projects.getById(projectId);
      if (response.success) {
        setCurrentProject(response.project);
        
        // Transform city_data to CityPlanData format
        if (response.project.city_data) {
          const transformedData = CityPlanUtils.transformParsedData(response.project.city_data);
          transformedData.name = response.project.name;
          transformedData.description = response.project.description;
          
          // Add blueprint dimensions from project
          transformedData.blueprint = {
            width: response.project.blueprint_width || 100,
            height: response.project.blueprint_height || 100,
            unit: response.project.blueprint_unit || 'meters'
          };
          
          setCityPlanData(transformedData);
        } else {
          // Create empty city plan
          setCityPlanData({
            id: `project_${projectId}`,
            name: response.project.name,
            description: response.project.description,
            coordinateSystem: {
              type: 'cartesian',
              unit: 'meters'
            },
            bounds: {
              minX: -(response.project.blueprint_width || 100) / 2,
              maxX: (response.project.blueprint_width || 100) / 2,
              minY: -(response.project.blueprint_height || 100) / 2,
              maxY: (response.project.blueprint_height || 100) / 2
            },
            blueprint: {
              width: response.project.blueprint_width || 100,
              height: response.project.blueprint_height || 100,
              unit: response.project.blueprint_unit || 'meters'
            },
            features: [],
            layers: {},
            metadata: {
              lastModified: new Date().toISOString(),
              version: '1.0.0'
            }
          });
        }
      } else {
        setError('Failed to load project');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message);
        toast.error(`Failed to load project: ${error.message}`);
        if (error.status === 404) {
          navigate('/projects');
        }
      } else {
        setError('An unexpected error occurred');
        toast.error('Failed to load project');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCityPlanUpdate = (updatedCityPlan: CityPlanData) => {
    setCityPlanData(updatedCityPlan);
    
    // Optionally sync back to project data
    if (currentProject) {
      const updatedProject = {
        ...currentProject,
        city_data: {
          ...currentProject.city_data,
          features: updatedCityPlan.features,
          layers: updatedCityPlan.layers
        }
      };
      setCurrentProject(updatedProject);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (error && !currentProject) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-danger mb-4">{error}</p>
            <button
              onClick={() => navigate('/projects')}
              className="text-primary hover:underline"
            >
              ← Back to Projects
            </button>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  if (!currentProject || !cityPlanData) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-default-500 mb-4">Project not found</p>
            <button
              onClick={() => navigate('/projects')}
              className="text-primary hover:underline"
            >
              ← Back to Projects
            </button>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-80 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
        <ProjectSidebar
          project={currentProject}
          cityPlanData={cityPlanData}
          onCityPlanUpdate={handleCityPlanUpdate}
          onNavigateBack={() => navigate('/projects')}
        />
      </div>

      {/* Right Canvas */}
      <div className="flex-1 relative">
        <CityPlanRenderer
          cityPlanData={cityPlanData}
          onDataUpdate={handleCityPlanUpdate}
        />
      </div>
    </div>
  );
}