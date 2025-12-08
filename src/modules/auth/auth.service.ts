import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { UserModelActions } from '../users/actions/user.actions';
import { GoogleApiService } from './services/google-api.service';

@Injectable()
export class AuthService {
  private userActions: UserModelActions;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private googleApiService: GoogleApiService,
  ) {
    this.userActions = new UserModelActions(userRepository);
  }

  async validateGoogleUser(googleUser: any) {
    const user = await this.userActions.findOrCreateGoogleUser(googleUser);

    // Increment token version to invalidate all previous tokens
    user.token_version += 1;
    await this.userRepository.save(user);

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      tokenVersion: user.token_version,
    };
    const access_token = this.jwtService.sign(payload);

    return {
      user_id: user.id,
      email: user.email,
      name: user.name,
      access_token,
    };
  }

  async verifyGoogleToken(googleToken: string) {
    // Verify token and get user info from Google
    const googleUserInfo = await this.googleApiService.verifyToken(googleToken);

    // Find or create user in our database
    const user = await this.userActions.findOrCreateGoogleUser({
      email: googleUserInfo.email,
      id: googleUserInfo.googleId,
      displayName: googleUserInfo.name,
      photos: googleUserInfo.picture ? [{ value: googleUserInfo.picture }] : [],
    });

    // Increment token version to invalidate all previous tokens
    user.token_version += 1;
    await this.userRepository.save(user);

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      tokenVersion: user.token_version,
    };
    const access_token = this.jwtService.sign(payload);

    return {
      user_id: user.id,
      email: user.email,
      name: user.name,
      access_token,
    };
  }
}
