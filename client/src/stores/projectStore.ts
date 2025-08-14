import { create } from 'zustand';

interface Project {
  id: number;
  name: string;
  description: string;
  city_type: string;
  constraints: any;
  city_data: any;
  created_at: string;
  created_by: number;
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: number, updates: Partial<Project>) => void;
  setLoading: (loading: boolean) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,

  setProjects: (projects: Project[]) => {
    set({ projects });
  },

  setCurrentProject: (project: Project | null) => {
    set({ currentProject: project });
  },

  addProject: (project: Project) => {
    set({ projects: [...get().projects, project] });
  },

  updateProject: (id: number, updates: Partial<Project>) => {
    set({
      projects: get().projects.map(p => 
        p.id === id ? { ...p, ...updates } : p
      ),
      currentProject: get().currentProject?.id === id 
        ? { ...get().currentProject!, ...updates } 
        : get().currentProject
    });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));