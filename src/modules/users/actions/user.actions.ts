import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SYS_MESSAGES } from '../../../common/constants/sys-messages';

export class UserModelActions {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOrCreateGoogleUser(googleUser: any) {
    const existingUser = await this.userRepository.findOne({
      where: { google_id: googleUser.google_id },
    });

    if (existingUser) {
      return this.updateUserInfo(existingUser, googleUser);
    }

    return this.createUser(googleUser);
  }

  private async createUser(googleUser: any) {
    const newUser = this.userRepository.create({
      google_id: googleUser.google_id,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
    });

    const saved = await this.userRepository.save(newUser);
    const user = Array.isArray(saved) ? saved[0] : saved;

    if (!user) {
      throw new InternalServerErrorException(
        SYS_MESSAGES.AUTHENTICATION_FAILED,
      );
    }

    return user;
  }

  private async updateUserInfo(user: User, googleUser: any) {
    user.name = googleUser.name;
    user.picture = googleUser.picture;

    const saved = await this.userRepository.save(user);
    const updatedUser = Array.isArray(saved) ? saved[0] : saved;

    if (!updatedUser) {
      throw new InternalServerErrorException(
        SYS_MESSAGES.AUTHENTICATION_FAILED,
      );
    }

    return updatedUser;
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new BadRequestException(SYS_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }
}
