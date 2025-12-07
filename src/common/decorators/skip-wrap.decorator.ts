import { SetMetadata } from '@nestjs/common';

export const SKIP_WRAP = 'skipWrap';

/**
 * Decorator to skip response wrapping for specific endpoints
 * Use this when you need to return raw responses without the standard envelope
 */
export const SkipWrap = () => SetMetadata(SKIP_WRAP, true);
