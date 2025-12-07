import { Injectable } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { GoogleAuthException } from '../../../common/exceptions/custom-exceptions';

export interface GoogleUserInfo {
  email: string;
  googleId: string;
  name: string;
  picture?: string;
}

@Injectable()
export class GoogleApiService {
  private readonly GOOGLE_USERINFO_URL =
    'https://www.googleapis.com/oauth2/v2/userinfo';
  private readonly GOOGLE_TOKENINFO_URL =
    'https://oauth2.googleapis.com/tokeninfo';

  /**
   * Verify Google access token and extract user information
   * @param googleToken - The Google access token to verify
   * @returns Verified user information
   */
  async verifyToken(googleToken: string): Promise<GoogleUserInfo> {
    try {
      const userInfo = await this.fetchUserInfo(googleToken);
      return this.extractUserData(userInfo);
    } catch (error) {
      throw this.handleVerificationError(error);
    }
  }

  /**
   * Fetch user info from Google API using multiple endpoints
   */
  private async fetchUserInfo(token: string): Promise<any> {
    // Try userinfo endpoint first (works with access tokens)
    try {
      const response = await axios.get(this.GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      return response.data;
    } catch (error) {
      // Fallback to tokeninfo endpoint
      const response = await axios.get(
        `${this.GOOGLE_TOKENINFO_URL}?access_token=${token}`,
        { timeout: 5000 },
      );
      return response.data;
    }
  }

  /**
   * Extract and normalize user data from Google API response
   */
  private async extractUserData(userInfo: any): Promise<GoogleUserInfo> {
    const googleId = userInfo.sub || userInfo.id || userInfo.user_id;

    if (!googleId) {
      throw new GoogleAuthException(
        `Missing user ID in token response: ${JSON.stringify(userInfo)}`,
      );
    }

    let email = userInfo.email;

    // Fallback: Try tokeninfo if email is missing
    if (!email) {
      email = await this.fetchEmailFromTokenInfo(userInfo.access_token);
    }

    // Last resort: Generate email from Google ID
    if (!email) {
      email = `user_${googleId}@google-oauth.local`;
    }

    return {
      email,
      googleId,
      name:
        userInfo.name ||
        userInfo.given_name ||
        `User ${googleId.substring(0, 8)}`,
      picture: userInfo.picture,
    };
  }

  /**
   * Attempt to fetch email from tokeninfo endpoint
   */
  private async fetchEmailFromTokenInfo(
    accessToken?: string,
  ): Promise<string | null> {
    if (!accessToken) return null;

    try {
      const response = await axios.get(
        `${this.GOOGLE_TOKENINFO_URL}?access_token=${accessToken}`,
        { timeout: 5000 },
      );
      return response.data.email || null;
    } catch {
      return null;
    }
  }

  /**
   * Handle verification errors with appropriate messages
   */
  private handleVerificationError(error: any): GoogleAuthException {
    const errorMessage =
      error.response?.data?.error_description ||
      error.message ||
      'Token verification failed';

    return new GoogleAuthException(errorMessage, error);
  }
}
