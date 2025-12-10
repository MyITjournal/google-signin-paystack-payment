import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserModelActions } from '../../users/model-actions/user.model-actions';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly userActions: UserModelActions,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret',
    });
  }

  async validate(payload: any) {
    // Check if token version matches current user's token version
    const user = await this.userActions.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // If token version doesn't match, token is invalidated
    if (payload.tokenVersion !== user.token_version) {
      throw new UnauthorizedException('Token has been revoked');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
      tokenVersion: payload.tokenVersion,
    };
  }
}
