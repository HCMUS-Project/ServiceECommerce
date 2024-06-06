import { CACHE_MANAGER, CacheStore } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { GrpcUnauthenticatedException } from 'nestjs-grpc-exceptions';
import { Role } from 'src/proto_build/auth/user_token_pb';

@Injectable()
export class Jwt {
    private accessTokenSecret: string;
    private refreshTokenSecret: string;

    constructor(
        private readonly jwtService: JwtService,
        configService: ConfigService,
        @Inject(CACHE_MANAGER) private cacheManager: CacheStore,
    ) {
        this.accessTokenSecret = configService.get<string>('JWT_ACCESS_SECRET');
        this.refreshTokenSecret = configService.get<string>('JWT_REFRESH_SECRET');
    }

    async createAccessToken(email: string, domain: String, role: Role): Promise<string> {
        const accessToken = await this.jwtService.signAsync(
            {
                domain,
                email,
                role,
            },
            {
                secret: this.accessTokenSecret,
                expiresIn: '15m',
            },
        );
        return accessToken;
    }

    async createRefreshToken(email: string, domain: string, role: Role): Promise<string> {
        const refreshToken = await this.jwtService.signAsync(
            {
                domain,
                email,
                role,
            },
            {
                secret: this.refreshTokenSecret,
                expiresIn: '1d',
            },
        );
        return refreshToken;
    }

    async saveToken(email: string, domain: string, accessToken: string, refreshToken: string) {
        // Save token to redis
        try {
            this.cacheManager.set(`access_token:${email}/${domain}/${accessToken}`, refreshToken, {
                ttl: 900,
            });

            this.cacheManager.set(`refresh_token:${email}/${domain}/${refreshToken}`, accessToken, {
                ttl: 86400,
            });
        } catch (error) {
            throw error;
        }
    }

    async verifyToken(token: string, isAccessToken: boolean = true): Promise<any> {
        try {
            const decoded = await this.jwtService.verify(token, {
                secret: isAccessToken ? this.accessTokenSecret : this.refreshTokenSecret,
            });
            return decoded;
        } catch (error) {
            throw new GrpcUnauthenticatedException('TOKEN_VALIDATION_FAILED');
        }
    }
}
