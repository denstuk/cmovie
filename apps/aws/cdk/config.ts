import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export class Config {
  static readonly awsRegion = process.env.AWS_REGION || 'us-east-1';
  static readonly project = 'cmovie';
  static readonly envName = process.env.ENVIRONMENT || 'dev';
  static readonly appName = `${Config.project}-${Config.envName}`;

  static readonly webBuildPath = '../web/dist';
  static readonly adminUiBuildPath = '../admin-ui/dist';
  static readonly backendPath = join(__dirname, '../../backend');

  static get cloudFrontPublicKey(): string {
    const cfPublicKeyPath = process.env.CF_PUBLIC_KEY_PATH;

    if (!cfPublicKeyPath) {
      throw new Error('CLOUDFRONT_PUBLIC_KEY_PATH is not set in environment variables');
    }

    const base64 = readFileSync(join(__dirname, cfPublicKeyPath), 'utf-8');
    return `
    -----BEGIN PUBLIC KEY-----
    ${base64}
    -----END PUBLIC KEY-----
    `.trim();
  }

  static get cloudFrontPrivateKey(): string {
    const cfPrivateKeyPath = process.env.CF_PRIVATE_KEY_PATH;

    if (!cfPrivateKeyPath) {
      throw new Error('CLOUDFRONT_PRIVATE_KEY_PATH is not set in environment variables');
    }

    return readFileSync(join(__dirname, cfPrivateKeyPath), 'utf-8');
  }

  static get cloudFrontAuthHeaderValue(): string {
    // Generate a consistent but unique value for the CloudFront auth header
    return `${Config.appName}-cf-auth-${Config.envName}-${Date.now().toString(36)}`;
  }
}
