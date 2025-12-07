import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserModelActions } from '../users/actions/user.actions';

@Injectable()
export class AuthService {
  private userActions: UserModelActions;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    this.userActions = new UserModelActions(userRepository);
  }

  async validateGoogleUser(googleUser: any) {
    const user = await this.userActions.findOrCreateGoogleUser(googleUser);

    return {
      user_id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}
