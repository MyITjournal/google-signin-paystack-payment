import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';

// ============================================================================
// SKIP WRAP DECORATOR
// ============================================================================
export const SKIP_WRAP = 'skipWrap';

/**
 * Decorator to skip response wrapping for specific endpoints
 * Use this when you need to return raw responses without the standard envelope
 * 
 * @example
 * @Get('raw')
 * @SkipWrap()
 * getRawData() {
 *   return { message: 'This will not be wrapped' };
 * }
 */
export const SkipWrap = () => SetMetadata(SKIP_WRAP, true);

// ============================================================================
// PERMISSIONS DECORATOR
// ============================================================================
export const REQUIRED_PERMISSION_KEY = 'requiredPermission';

/**
 * Decorator to specify required permission for API key authentication
 * Used with EnhancedApiKeyGuard to check if API key has the required permission
 * 
 * @param permission - The permission string required (e.g., 'deposit', 'transfer', 'read')
 * 
 * @example
 * @Post('deposit')
 * @UseGuards(JwtOrApiKeyGuard)
 * @RequirePermission('deposit')
 * async deposit() {
 *   // Only API keys with 'deposit' permission can access this
 * }
 */
export const RequirePermission = (permission: string) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, permission);

// ============================================================================
// CURRENT USER DECORATOR
// ============================================================================

/**
 * Parameter decorator to extract the current authenticated user from request
 * Works with both JWT authentication and API key authentication
 * 
 * @returns The user object attached to request by authentication guards
 * 
 * @example
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@CurrentUser() user: any) {
 *   return { userId: user.userId, email: user.email };
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
