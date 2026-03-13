
export interface Template {
  id: string;
  projectId: string;
  name: string;
  subject: string;
  body: string;
  variables: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}


export interface CreateTemplateDto {
  projectId: string;
  name: string;
  subject: string;
  body: string;
  variables?: string[];
}


export interface UpdateTemplateDto {
  name?: string;
  subject?: string;
  body?: string;
  variables?: string[];
}


export type GetAllTemplatesResponse = Template[];
