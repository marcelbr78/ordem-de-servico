import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService implements OnModuleInit {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async onModuleInit() {
        console.log('[USERS DEBUG] Verificando usuário admin...');
        // Regra profissional: admin/admin só em desenvolvimento
        if (process.env.NODE_ENV === 'production') {
            console.log('[USERS DEBUG] Ambiente de produção detectado. Log desativado.');
            return;
        }

        const adminUser = await this.findByEmail('admin');
        if (!adminUser) {
            console.log('🌱 Semeando usuário administrador padrão (admin/admin1234)...');
            await this.create({
                email: 'admin',
                name: 'Administrador',
                password: 'admin1234',
                role: UserRole.ADMIN,
                mustChangePassword: true,
            });
        } else {
            // Garante que a senha seja 'admin1234' mesmo que já exista no banco
            console.log('🔄 Sincronizando senha do administrador para "admin1234"...');
            const salt = await bcrypt.genSalt();
            adminUser.password = await bcrypt.hash('admin1234', salt);
            adminUser.mustChangePassword = true; // Força troca de senha para segurança
            await this.usersRepository.save(adminUser);
            console.log('[USERS DEBUG] Senha sincronizada com sucesso.');
        }
    }

    async findByEmail(email: string): Promise<User | undefined> {
        return this.usersRepository.findOne({ where: { email } });
    }

    async findById(id: string): Promise<User | undefined> {
        return this.usersRepository.findOne({ where: { id } });
    }

    async create(userData: Partial<User>): Promise<User> {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        const user = this.usersRepository.create({
            ...userData,
            password: hashedPassword,
        });

        return this.usersRepository.save(user);
    }

    async updateRefreshToken(userId: string, refreshTokenHash: string | null) {
        await this.usersRepository.update(userId, { refreshTokenHash });
    }

    async updateLastLogin(userId: string) {
        await this.usersRepository.update(userId, { lastLogin: new Date() });
    }

    async changePassword(userId: string, newPassword: string): Promise<void> {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await this.usersRepository.update(userId, {
            password: hashedPassword,
            mustChangePassword: false,
            refreshTokenHash: null // Força novo login
        });
    }
}
