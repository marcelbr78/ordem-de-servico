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
        // Regra profissional: admin/admin só em desenvolvimento
        if (process.env.NODE_ENV === 'production') {
            return;
        }

        const adminUser = await this.findByEmail('admin');
        if (!adminUser) {
            console.log('🌱 Semeando usuário administrador padrão (admin/admin)...');
            await this.create({
                email: 'admin',
                name: 'Administrador',
                password: 'admin',
                role: UserRole.ADMIN,
            });
        } else {
            // Garante que a senha seja 'admin' mesmo que já exista no banco (importante para o redeploy no Render)
            console.log('🔄 Sincronizando senha do administrador para "admin"...');
            const salt = await bcrypt.genSalt();
            adminUser.password = await bcrypt.hash('admin', salt);
            await this.usersRepository.save(adminUser);
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
}
