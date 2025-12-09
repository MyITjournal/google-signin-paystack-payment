import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiKeyGuard } from './api-key.guard';

@Injectable()
export class JwtOrApiKeyGuard implements CanActivate {
  constructor(
    private readonly jwtAuthGuard: JwtAuthGuard,
    private readonly apiKeyGuard: ApiKeyGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check if API key is present
    const apiKey = request.headers['x-api-key'];

    if (apiKey) {
      // Try API key authentication with permission checking
      try {
        return (await this.apiKeyGuard.canActivate(context)) as boolean;
      } catch (error) {
        // If API key fails, throw the error
        throw error;
      }
    }

    // Try JWT authentication
    try {
      return (await this.jwtAuthGuard.canActivate(context)) as boolean;
    } catch (error) {
      throw new UnauthorizedException(
        'Authentication required: Provide valid JWT token or API key',
      );
    }
  }
}
