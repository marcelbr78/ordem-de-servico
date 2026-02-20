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
            console.log('[USERS DEBUG] Usuário admin criado com sucesso.');
        } else {
            // Garante que a senha seja 'admin1234'
            console.log('🔄 Sincronizando senha do administrador...');
            const salt = await bcrypt.genSalt();
            const hashedPassword = await bcrypt.hash('admin1234', salt);

            // Usar update() para evitar side effects do save() com entidade completa
            await this.usersRepository.update(adminUser.id, {
                password: hashedPassword,
                mustChangePassword: true,
            });

            // Verificar que o hash gravado no banco bate
            const check = await this.findByEmail('admin');
            const isValid = await bcrypt.compare('admin1234', check.password);
            console.log(`[USERS DEBUG] Senha sincronizada. Verificação: ${isValid ? '✅ OK' : '❌ FALHOU'}`);
            console.log(`[USERS DEBUG] Hash armazenado: ${check.password.substring(0, 20)}...`);
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

    async findAll(): Promise<User[]> {
        return this.usersRepository.find();
    }

    async findOne(id: string): Promise<User> {
        return this.usersRepository.findOne({ where: { id } });
    }

    async update(id: string, updateUserDto: any): Promise<User> {
        if (updateUserDto.password) {
            const salt = await bcrypt.genSalt();
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
        }
        await this.usersRepository.update(id, updateUserDto);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        await this.usersRepository.delete(id);
    }
}
