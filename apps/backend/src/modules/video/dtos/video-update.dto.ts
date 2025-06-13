
export class VideoUpdateDto {
  readonly title: string;
  readonly description: string;
  readonly fileKey: string;
  readonly tags: string[];
  readonly regionsBlocked: string[];
}
