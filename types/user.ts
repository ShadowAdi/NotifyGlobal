
export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}


export interface CreateUserDto {
  email: string;
  name?: string;
  password: string;
}


export interface UpdateUserDto {
  email?: string;
  name?: string;
}


export type GetAllUsersResponse = User[];
