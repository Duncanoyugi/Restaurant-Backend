import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || 'super-secret-access-key-change-in-production',
    });
  }

  async validate(payload: any) {
    // console.log('🔍 JWT Validation Payload:', payload);
    
    // Use payload.sub as the user ID (JWT standard)
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Return object that matches what JWT token contains
    // This ensures consistency between token payload and req.user
    return {
      sub: user.id,          // JWT standard field for user ID
      id: user.id,           // Also include id for backward compatibility
      email: user.email,
      role: user.role.name,   // Use role name as string for consistency
      emailVerified: user.emailVerified,
      name: user.name,
    };
  }
}