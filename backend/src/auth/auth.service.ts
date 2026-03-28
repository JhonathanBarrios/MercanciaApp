import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });
    if (!usuario || !usuario.activo) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(dto.password, usuario.passwordHash ?? '');
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    const payload = { sub: usuario.id, email: usuario.email, rol: usuario.rol };
    return {
      access_token: this.jwt.sign(payload),
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    };
  }

  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, 10);
  }

  perfil(usuario: any) {
    return usuario;
  }
}
