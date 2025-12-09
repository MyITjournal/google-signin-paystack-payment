import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeysService } from '../../api-keys/api-keys.service';
import { REQUIRED_PERMISSION_KEY } from '../../../common/decorators';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract API key from header
    const apiKey = request.headers['x-api-key'];
    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    // Get required permission from decorator (if any)
    const requiredPermission =
      this.reflector.get<string>(
        REQUIRED_PERMISSION_KEY,
        context.getHandler(),
      ) || '*'; // Default: any permission

    // Get client IP
    const ipAddress = request.ip || request.connection.remoteAddress;

    try {
      // Validate API key with all checks (expiry, permissions, rate limits, IP)
      const validatedApiKey = await this.apiKeysService.validateApiKey(
        apiKey,
        requiredPermission,
        ipAddress,
      );

      // Attach API key to request for logging interceptor
      request.apiKey = validatedApiKey;
      request.apiKeyUser = validatedApiKey.created_by;

      return true;
    } catch (error) {
      throw new UnauthorizedException(error.message || 'Invalid API key');
    }
  }
}
