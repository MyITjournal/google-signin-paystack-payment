import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SYS_MESSAGES } from '../../../common/constants/sys-messages';
import {
  PassportGoogleProfile,
  GoogleUserData,
} from '../../../common/interfaces/jwt.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || '',
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: PassportGoogleProfile,
    done: VerifyCallback,
  ): void {
    try {
      if (!profile || !profile.id) {
        return done(
          new UnauthorizedException(SYS_MESSAGES.INVALID_OAUTH_CODE),
          false,
        );
      }

      const { id, name, emails, photos } = profile;

      if (!emails || !emails[0] || !emails[0].value) {
        return done(
          new UnauthorizedException(SYS_MESSAGES.INVALID_OAUTH_CODE),
          false,
        );
      }

      const user: GoogleUserData = {
        google_id: id,
        email: emails[0].value,
        name:
          `${name?.givenName || ''} ${name?.familyName || ''}`.trim() ||
          'Unknown User',
        picture: photos?.[0]?.value || null,
      };
      done(null, user);
    } catch {
      done(new UnauthorizedException(SYS_MESSAGES.OAUTH_PROVIDER_ERROR), false);
    }
  }
}
