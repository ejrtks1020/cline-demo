import { EntitySchema } from 'typeorm';

export interface UserSchemaRecord {
  id: string;
  loginId: string;
  passwordHash: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = new EntitySchema<UserSchemaRecord>({
  name: 'User',
  tableName: 'users',
  columns: {
    id: { type: String, primary: true },
    loginId: { type: String, unique: true, length: 50 },
    passwordHash: { type: String },
    name: { type: String, nullable: true, length: 50 },
    createdAt: { type: Date, createDate: true },
    updatedAt: { type: Date, updateDate: true },
  },
  indices: [{ name: 'idx_users_login_id', columns: ['loginId'], unique: true }],
});
