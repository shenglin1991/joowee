import { AuthService } from '@/modules/auth/services/auth.service';
import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';

@Controller('api/auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('login')
    async login(@Body(ValidationPipe) loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }
}
