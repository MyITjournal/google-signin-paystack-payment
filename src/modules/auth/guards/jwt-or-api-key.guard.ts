import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeysService } from '../../api-keys/api-keys.service';
import { REQUIRED_PERMISSION_KEY } from '../../../common/decorators';

@Injectable()
export class JwtOrApiKeyGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly apiKeysService: ApiKeysService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      ip?: string;
      connection?: { remoteAddress?: string };
      apiKey?: unknown;
      apiKeyUser?: unknown;
    }>();

    // Check if API key is present
    const apiKey = request.headers['x-api-key'];

    if (apiKey && typeof apiKey === 'string') {
      // Try API key authentication
      try {
        // Get required permission from decorator (if any)
        const requiredPermission =
          this.reflector.get<string>(
            REQUIRED_PERMISSION_KEY,
            context.getHandler(),
          ) || '*'; // Default: any permission

        // Get client IP
        const ipAddress = request.ip || request.connection?.remoteAddress;

        // Validate API key with all checks
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
        // API key validation failed, try JWT
      }
    }

    // Try JWT authentication
    try {
      return (await super.canActivate(context)) as boolean;
    } catch {
      throw new UnauthorizedException(
        'Authentication required: Provide valid JWT token or API key',
      );
    }
  }
}
