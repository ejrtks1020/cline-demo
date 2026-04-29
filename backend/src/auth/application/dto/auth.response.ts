import { ApiProperty } from '@nestjs/swagger';

export class UserPublicResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  loginId: string;

  @ApiProperty({ required: false })
  name?: string;
}

export class AuthResponse {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ type: UserPublicResponse })
  user: UserPublicResponse;
}
