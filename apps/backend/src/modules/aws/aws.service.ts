import { getSignedUrl } from "@aws-sdk/cloudfront-signer";
import { ConfigService } from "@nestjs/config";
import { Injectable } from "@nestjs/common";
import { DEFAULT_VIEW_SIGNED_URL_EXPIRATION } from "../../common/constants";

@Injectable()
export class AwsService {
  constructor(private readonly configService: ConfigService) {}

  generateSignedUrl(url: string): string {
    return getSignedUrl({
      url,
      keyPairId: this.configService.getOrThrow<string>('CLOUDFRONT_KEY_PAIR_ID'),
      privateKey: this.configService.getOrThrow<string>('CLOUDFRONT_PRIVATE_KEY'),
      dateLessThan: new Date(Date.now() + DEFAULT_VIEW_SIGNED_URL_EXPIRATION),
    });
  }
}
