import { IsIn, MaxLength, MinLength, IsString } from 'class-validator';

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_IMAGES_PER_BATCH = 20;
// Client resizes images before sending, but the backend enforces its own
// ceiling too — 4MB per image post-encoding covers a compressed photo with
// margin without letting one request balloon the vision token bill.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
// Second guard on top of the per-image cap: 20 images at the individual max
// would still be 80MB of images in one request, so cap the batch total too.
export const MAX_TOTAL_BATCH_BYTES = 30 * 1024 * 1024;
const MAX_BASE64_LENGTH = Math.ceil((MAX_IMAGE_BYTES * 4) / 3);

export class ExtractImageDto {
  @IsString()
  @MinLength(1)
  fileName: string;

  @IsString()
  @IsIn(ALLOWED_IMAGE_MIME_TYPES)
  mimeType: string;

  @IsString()
  @MaxLength(MAX_BASE64_LENGTH)
  base64: string;
}
