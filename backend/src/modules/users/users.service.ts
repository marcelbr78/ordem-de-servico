import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService implements OnModuleInit {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async onModuleInit() {
        try {
            console.log('[USERS DEBUG] Verificando usuários mestres...');

            // 1. Super Admin Global (Você)
            const superAdmin = await this.findByEmail('master@os4u.com.br');
            if (!superAdmin) {
                console.log('💎 Semeando Super Admin Global (master@os4u.com.br / master123)...');
                await this.create({
                    email: 'master@os4u.com.br',
                    name: 'CEO OS4U',
                    password: 'master123',
                    role: UserRole.SUPER_ADMIN,
                    mustChangePassword: false,
                });
            }

            // 2. Legado Admin (Compatibilidade)
            const adminUser = await this.findByEmail('admin');
            if (!adminUser) {
                console.log('🌱 Semeando usuário administrador legado...');
                await this.create({
                    email: 'admin',
                    name: 'Administrador Demo',
                    password: 'admin1234',
                    role: UserRole.ADMIN,
                    mustChangePassword: true,
                });
            }
        } catch (e) {
            console.warn('⚠️ Usuários seed ignorado (banco ainda não pronto):', e.message);
        }
    }

    async createAdminUserForTenant(data: any): Promise<User> {
        return this.create({
            ...data,
            role: UserRole.ADMIN,
            mustChangePassword: true,
        });
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

    async findAll(tenantId?: string, excludeSuperAdmin: boolean = false): Promise<User[]> {
        const where: any = {};
        if (tenantId) {
            where.tenantId = tenantId;
        }
        if (excludeSuperAdmin) {
            where.role = Not(UserRole.SUPER_ADMIN);
        }
        return this.usersRepository.find({ where });
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
