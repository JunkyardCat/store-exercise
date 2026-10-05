import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  isProduction: process.env.NODE_ENV === 'production',
  databaseUrl: required('DATABASE_URL'),
  databaseSsl: process.env.DATABASE_SSL === 'true',
  databaseCa: process.env.DATABASE_CA || undefined,
  jwtSecret: required('JWT_SECRET'),
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 10),
};
