import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new Error('Refresh token authentication failed');
    }
    return user;
  }
}