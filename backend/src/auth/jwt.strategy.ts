import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: 'SECRET_KEY_FOR_EDG_THESIS', // In production, use environment variables
        });
    }

    async validate(payload: any) {
        return { userId: payload.sub, username: payload.username, role: payload.role, campusId: payload.campusId };
    }
}
