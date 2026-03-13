
export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}


export interface CreateProjectDto {
  name: string;
  description?: string;
}


export interface UpdateProjectDto {
  name?: string;
  description?: string;
}


export type GetAllProjectsResponse = Project[];
