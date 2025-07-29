/**
 * Environment variable validation utility
 * Ensures all required environment variables are properly configured
 */

interface EnvironmentConfig {
  DATABASE_URL: string;
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL: string;
  ENCRYPTION_KEY: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

/**
 * Validates that all required environment variables are present and valid
 * @throws Error if any required environment variable is missing or invalid
 */
export function validateEnvironment(): EnvironmentConfig {
  const errors: string[] = [];

  // Required environment variables
  const DATABASE_URL = process.env.DATABASE_URL;
  const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
  const NEXTAUTH_URL = process.env.NEXTAUTH_URL;
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
  const NODE_ENV = process.env.NODE_ENV as 'development' | 'production' | 'test';

  // Validate DATABASE_URL
  if (!DATABASE_URL) {
    errors.push('DATABASE_URL is required');
  } else if (!DATABASE_URL.startsWith('postgresql://')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  // Validate NEXTAUTH_SECRET
  if (!NEXTAUTH_SECRET) {
    errors.push('NEXTAUTH_SECRET is required');
  } else if (NEXTAUTH_SECRET.length < 32) {
    errors.push('NEXTAUTH_SECRET must be at least 32 characters long');
  }

  // Validate NEXTAUTH_URL
  if (!NEXTAUTH_URL) {
    errors.push('NEXTAUTH_URL is required');
  } else {
    try {
      new URL(NEXTAUTH_URL);
    } catch {
      errors.push('NEXTAUTH_URL must be a valid URL');
    }
  }

  // Validate ENCRYPTION_KEY
  if (!ENCRYPTION_KEY) {
    errors.push('ENCRYPTION_KEY is required');
  } else if (ENCRYPTION_KEY.length !== 32) {
    errors.push('ENCRYPTION_KEY must be exactly 32 characters long');
  }

  // Validate NODE_ENV
  if (!NODE_ENV) {
    errors.push('NODE_ENV is required');
  } else if (!['development', 'production', 'test'].includes(NODE_ENV)) {
    errors.push('NODE_ENV must be development, production, or test');
  }

  // Production-specific validations
  if (NODE_ENV === 'production') {
    if (NEXTAUTH_SECRET === 'your-32-character-secret-key-here') {
      errors.push('NEXTAUTH_SECRET must be changed from default value in production');
    }
    if (ENCRYPTION_KEY === 'your-32-character-encryption-key') {
      errors.push('ENCRYPTION_KEY must be changed from default value in production');
    }
    if (NEXTAUTH_URL?.includes('localhost')) {
      errors.push('NEXTAUTH_URL should not use localhost in production');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.map(err => `- ${err}`).join('\n')}`);
  }

  return {
    DATABASE_URL: DATABASE_URL!,
    NEXTAUTH_SECRET: NEXTAUTH_SECRET!,
    NEXTAUTH_URL: NEXTAUTH_URL!,
    ENCRYPTION_KEY: ENCRYPTION_KEY!,
    NODE_ENV: NODE_ENV!,
  };
}

/**
 * Get validated environment configuration
 * Only validates once per process
 */
let cachedConfig: EnvironmentConfig | null = null;

export function getEnvironmentConfig(): EnvironmentConfig {
  if (!cachedConfig) {
    cachedConfig = validateEnvironment();
  }
  return cachedConfig;
}