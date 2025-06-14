import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

/**
 * Middleware to verify requests are coming from CloudFront
 * This can be used to add additional security if needed
 */
@Injectable()
export class CloudFrontVerificationMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Check for CloudFront specific headers
    const cfForwardedFor = req.headers['x-forwarded-for'];
    const cfProto = req.headers['x-forwarded-proto'];

    // Log CloudFront headers for debugging
    if (this.configService.get('NODE_ENV') !== 'production') {
      console.log('CloudFront Headers:', {
        'x-forwarded-for': cfForwardedFor,
        'x-forwarded-proto': cfProto,
        'cloudfront-viewer-country': req.headers['cloudfront-viewer-country'],
        'cloudfront-viewer-city': req.headers['cloudfront-viewer-city'],
      });
    }

    // Optional: You can implement additional verification here if needed
    // For example:
    // - Verify that a specific header set by CloudFront is present
    // - Check for a token or signature if you're using signed URLs

    next();
  }
}
