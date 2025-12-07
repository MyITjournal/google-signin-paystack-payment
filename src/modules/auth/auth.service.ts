import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { User } from '../users/entities/user.entity';
import { UserModelActions } from '../users/actions/user.actions';

@Injectable()
export class AuthService {
  private userActions: UserModelActions;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.userActions = new UserModelActions(userRepository);
  }

  async validateGoogleUser(googleUser: any) {
    const user = await this.userActions.findOrCreateGoogleUser(googleUser);

    const payload = { sub: user.id, email: user.email, name: user.name };
    const access_token = this.jwtService.sign(payload);

    return {
      user_id: user.id,
      email: user.email,
      name: user.name,
      access_token,
    };
  }

  async verifyGoogleToken(googleToken: string) {
    try {
      // Try different Google API endpoints for token verification
      let userInfo;

      // First, try the userinfo endpoint (works with access tokens)
      try {
        const response = await axios.get(
          'https://www.googleapis.com/oauth2/v2/userinfo',
          {
            headers: {
              Authorization: `Bearer ${googleToken}`,
            },
          },
        );
        userInfo = response.data;
        console.log('Google userinfo response:', userInfo);
      } catch (error) {
        console.log('Userinfo failed, trying tokeninfo...');
        // If that fails, try tokeninfo endpoint
        const response = await axios.get(
          `https://oauth2.googleapis.com/tokeninfo?access_token=${googleToken}`,
        );
        userInfo = response.data;
        console.log('Google tokeninfo response:', userInfo);
      }

      // Extract user data - Google returns different field names
      let email = userInfo.email;
      const googleId = userInfo.sub || userInfo.id || userInfo.user_id;
      const name = userInfo.name || userInfo.given_name;
      const picture = userInfo.picture;

      console.log('Extracted data:', { email, googleId, name, picture });

      if (!googleId) {
        throw new UnauthorizedException(
          `Invalid Google token - missing user ID. Received data: ${JSON.stringify(userInfo)}`,
        );
      }

      // If email is missing, try tokeninfo endpoint for more complete data
      if (!email) {
        try {
          console.log('Email missing, trying tokeninfo endpoint...');
          const tokenInfoResponse = await axios.get(
            `https://oauth2.googleapis.com/tokeninfo?access_token=${googleToken}`,
          );
          console.log('Tokeninfo response:', tokenInfoResponse.data);
          email = tokenInfoResponse.data.email;
        } catch (err) {
          console.log('Tokeninfo also failed');
        }
      }

      // If still no email, generate one from Google ID
      if (!email) {
        email = `user_${googleId}@google-oauth.local`;
        console.log('Generated fallback email:', email);
      }

      // Find or create user
      const user = await this.userActions.findOrCreateGoogleUser({
        email,
        id: googleId,
        displayName: name || `User ${googleId.substring(0, 8)}`,
        photos: picture ? [{ value: picture }] : [],
      });

      // Generate our JWT token
      const payload = { sub: user.id, email: user.email, name: user.name };
      const access_token = this.jwtService.sign(payload);

      return {
        user_id: user.id,
        email: user.email,
        name: user.name,
        access_token,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.error_description ||
        error.message ||
        'Unknown error';
      console.error(
        'Token verification error:',
        error.response?.data || error.message,
      );
      throw new UnauthorizedException(
        `Invalid or expired Google token: ${errorMessage}`,
      );
    }
  }
}
