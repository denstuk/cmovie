import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class LogMiddleware implements NestMiddleware {
	private readonly logger = new Logger(LogMiddleware.name);

	constructor(private configService: ConfigService) {}

	use(req: Request, _: Response, next: NextFunction) {
		const cfViewerCountry = req.headers["cloudfront-viewer-country"];
		const cfViewerCity = req.headers["cloudfront-viewer-city"];

		// Log CloudFront headers for debugging in non-production environments
		if (this.configService.get("NODE_ENV") !== "production") {
			this.logger.debug("CloudFront Headers:", {
				"cloudfront-viewer-country": cfViewerCountry,
				"cloudfront-viewer-city": cfViewerCity,
			});
		}

    this.logger.log(`Request Method: ${req.method}, URL: ${req.url}, Country: ${cfViewerCountry}, City: ${cfViewerCity}`);
		next();
	}
}
