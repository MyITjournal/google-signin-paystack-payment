import { IsEmail, IsString, IsOptional, Length } from 'class-validator';

export class VerifyGoogleTokenDto {
  @IsString()
  @Length(10, 2048, { message: 'Invalid Google access token format' })
  access_token: string;
}

export class GoogleCallbackDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString()
  google_id: string;

  @IsOptional()
  @IsString()
  picture?: string;
}
