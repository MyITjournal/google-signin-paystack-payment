export const SYS_MESSAGES = {
  // Authentication messages
  AUTHENTICATION_SUCCESS: 'Google authentication successful',
  AUTHENTICATION_FAILED: 'Google authentication failed',
  MISSING_AUTH_CODE: 'Authorization code is missing',
  INVALID_OAUTH_CODE: 'Invalid authorization code',
  OAUTH_PROVIDER_ERROR: 'OAuth provider error occurred',
  USER_NOT_FOUND: 'User not found',
  INVALID_CREDENTIALS: 'Invalid credentials',
  UNAUTHORIZED: 'Unauthorized access',

  // Payment messages
  PAYMENT_INITIATED: 'Payment initiated successfully',
  PAYMENT_INITIATION_FAILED: 'Payment initiation failed',
  PAYMENT_CONFIG_ERROR: 'Payment configuration error',
  TRANSACTION_NOT_FOUND: 'Transaction not found',
  INVALID_AMOUNT: 'Invalid payment amount',
  WEBHOOK_SECRET_NOT_CONFIGURED: 'Webhook secret not configured',
  INVALID_SIGNATURE: 'Invalid webhook signature',
  PAYMENT_VERIFICATION_FAILED: 'Transaction verification failed',
  TRANSACTION_STATUS_RETRIEVED: 'Transaction status retrieved successfully',
  WEBHOOK_PROCESSED: 'Webhook processed successfully',

  // General messages
  SERVER_ERROR: 'An internal server error occurred',
  VALIDATION_ERROR: 'Validation failed',
  NOT_FOUND: 'Resource not found',
  SUCCESS: 'Operation completed successfully',
  FAILED: 'Operation failed',
  INVALID_INPUT: 'Invalid input provided',

  // Database messages
  CREATE_SUCCESS: 'Record created successfully',
  UPDATE_SUCCESS: 'Record updated successfully',
  DELETE_SUCCESS: 'Record deleted successfully',
  QUERY_FAILED: 'Database query failed',
} as const;
