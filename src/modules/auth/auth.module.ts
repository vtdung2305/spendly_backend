import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthRepository } from './repositories/auth.repository';
import { TokenService } from './services/token.service';
import { OAuthVerifierService } from './services/oauth-verifier.service';
import { EmailOtpService } from './services/email-otp.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RegisterUseCase } from './usecases/register.usecase';
import { LoginUseCase } from './usecases/login.usecase';
import { OAuthLoginUseCase } from './usecases/oauth-login.usecase';
import { RefreshTokensUseCase } from './usecases/refresh-tokens.usecase';
import { LogoutUseCase } from './usecases/logout.usecase';
import { ForgotPasswordUseCase } from './usecases/forgot-password.usecase';
import { ResetPasswordUseCase } from './usecases/reset-password.usecase';
import { VerifyOtpUseCase } from './usecases/verify-otp.usecase';
import { ResendOtpUseCase } from './usecases/resend-otp.usecase';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({}), MailModule],
  controllers: [AuthController],
  providers: [
    AuthRepository,
    TokenService,
    OAuthVerifierService,
    EmailOtpService,
    JwtStrategy,
    RegisterUseCase,
    LoginUseCase,
    OAuthLoginUseCase,
    RefreshTokensUseCase,
    LogoutUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    VerifyOtpUseCase,
    ResendOtpUseCase,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AuthModule {}
