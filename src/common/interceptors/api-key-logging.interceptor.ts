import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiKeysService } from '../../modules/api-keys/api-keys.service';

@Injectable()
export class ApiKeyLoggingInterceptor implements NestInterceptor {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    // Only log if API key is used
    const apiKey = request.apiKey; // Set by the guard
    if (!apiKey) {
      return next.handle();
    }

    const endpoint = request.url;
    const method = request.method;
    const ipAddress = request.ip || request.connection.remoteAddress;
    const userAgent = request.headers['user-agent'];

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Log successful request
        this.apiKeysService
          .logUsage(
            apiKey,
            endpoint,
            method,
            statusCode,
            ipAddress,
            userAgent,
            responseTime,
          )
          .catch((err) => console.error('Failed to log API key usage:', err));
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;
        const statusCode = error.status || 500;
        const errorMessage = error.message || 'Unknown error';

        // Log failed request
        this.apiKeysService
          .logUsage(
            apiKey,
            endpoint,
            method,
            statusCode,
            ipAddress,
            userAgent,
            responseTime,
            errorMessage,
          )
          .catch((err) => console.error('Failed to log API key usage:', err));

        return throwError(() => error);
      }),
    );
  }
}
