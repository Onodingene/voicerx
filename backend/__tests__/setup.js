// Jest test setup
// This file runs before each test file

// Set test environment variables
process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.jbyaqcywuoihhpwlnbxd:fumekslpc123@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true';

// Global test timeout
jest.setTimeout(30000);
