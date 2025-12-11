import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ApiKeysService } from '../../api-keys/api-keys.service';
import { UserModelActions } from '../../users/model-actions/user.model-actions';
import { REQUIRED_PERMISSION_KEY } from '../../../common/decorators';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtOrApiKeyGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly apiKeysService: ApiKeysService,
    private readonly userActions: UserModelActions,
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const requiredPermission = this.reflector.get<string>(
      REQUIRED_PERMISSION_KEY,
      context.getHandler(),
    );

    let jwtError: string | null = null;
    let apiKeyError: string | null = null;

    // Try JWT authentication first
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const payload = this.jwtService.verify(token, {
          secret: this.configService.get<string>('JWT_SECRET'),
        });

        // Verify user exists and token version matches
        const user = await this.userActions.findById(payload.sub);
        if (user && payload.tokenVersion === user.token_version) {
          request.user = {
            userId: payload.sub,
            email: payload.email,
            name: payload.name,
            tokenVersion: payload.tokenVersion,
          };
          return true;
        }
        jwtError = 'Token version mismatch or user not found';
      } catch (error) {
        jwtError = error instanceof Error ? error.message : 'JWT validation failed';
      }
    }

    // Try API key authentication
    const apiKey = request.headers['x-api-key'];
    console.log('API Key check:', {
      exists: !!apiKey,
      type: typeof apiKey,
      value: apiKey ? `${String(apiKey).substring(0, 10)}...` : 'null',
      allHeaders: Object.keys(request.headers),
    });

    if (apiKey && typeof apiKey === 'string') {
      try {
        const ipAddress = request.ip || request.connection?.remoteAddress;
        console.log('Validating API key with permission:', requiredPermission || 'read');
        
        const validatedApiKey = await this.apiKeysService.validateApiKey(
          apiKey,
          requiredPermission || 'read',
          ipAddress,
        );

        console.log('API Key validated successfully for user:', validatedApiKey.created_by.id);

        request.apiKey = validatedApiKey;
        request.apiKeyUser = validatedApiKey.created_by;
        request.user = {
          userId: validatedApiKey.created_by.id,
          email: validatedApiKey.created_by.email,
          name: validatedApiKey.created_by.name,
        };
        return true;
      } catch (error) {
        apiKeyError = error instanceof Error ? error.message : 'API key validation failed';
        console.error('API Key validation error:', apiKeyError);
      }
    } else {
      console.log('API Key block skipped - header not present or not a string');
    }

    // Both authentication methods failed
    const errorDetails: string[] = [];
    if (jwtError) errorDetails.push(`JWT: ${jwtError}`);
    if (apiKeyError) errorDetails.push(`API Key: ${apiKeyError}`);
    
    console.error('Authentication failed:', errorDetails.join(', '));
    throw new UnauthorizedException(
      'Authentication required. Provide either a valid JWT token or API key.',
    );
  }
}
