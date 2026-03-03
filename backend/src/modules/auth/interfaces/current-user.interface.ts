import { RoleEnum } from '../../roles/enums/roles.enum';

export interface ICurrentUser {
  id: string;
  role: RoleEnum;
}