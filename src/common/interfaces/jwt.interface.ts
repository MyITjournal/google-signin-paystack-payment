export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  tokenVersion: number;
}
