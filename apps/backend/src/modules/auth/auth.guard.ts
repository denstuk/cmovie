import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserEntity } from '../../entities/user.entity';
import { USER_REPO } from '../../database/database.repos';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(USER_REPO)
    private userRepository: Repository<UserEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authorization token is missing');
    }

    try {
      // Find the user by ID (token is user ID as per the auth service)
      const user = await this.userRepository.findOne({
        where: { id: token }
      });

      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      // Attach the user to the request object
      request['user'] = user;

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
