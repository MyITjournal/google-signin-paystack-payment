import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { GoogleAuthException } from '../../../common/exceptions/custom-exceptions';

export interface GoogleUserInfo {
  email: string;
  googleId: string;
  name: string;
  picture?: string;
}

interface GoogleApiResponse {
  sub?: string;
  id?: string;
  user_id?: string;
  email?: string;
  name?: string;
  given_name?: string;
  picture?: string;
  access_token?: string;
  error_description?: string;
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
  private async fetchUserInfo(token: string): Promise<GoogleApiResponse> {
    // Try userinfo endpoint first (works with access tokens)
    try {
      const response = await axios.get(this.GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      return response.data as GoogleApiResponse;
    } catch {
      // Fallback to tokeninfo endpoint
      const response = await axios.get(
        `${this.GOOGLE_TOKENINFO_URL}?access_token=${token}`,
        { timeout: 5000 },
      );
      return response.data as GoogleApiResponse;
    }
  }

  /**
   * Extract and normalize user data from Google API response
   */
  private async extractUserData(
    userInfo: GoogleApiResponse,
  ): Promise<GoogleUserInfo> {
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
  ): Promise<string | undefined> {
    if (!accessToken) return undefined;

    try {
      const response = await axios.get(
        `${this.GOOGLE_TOKENINFO_URL}?access_token=${accessToken}`,
        { timeout: 5000 },
      );
      const data = response.data as GoogleApiResponse;
      return data.email || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Handle verification errors with appropriate messages
   */
  private handleVerificationError(error: unknown): GoogleAuthException {
    const axiosError = error as {
      response?: { data?: GoogleApiResponse };
      message?: string;
    };
    const errorMessage =
      axiosError.response?.data?.error_description ||
      axiosError.message ||
      'Token verification failed';

    return new GoogleAuthException(errorMessage, error as Error);
  }
}
