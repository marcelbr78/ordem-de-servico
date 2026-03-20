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
            // 1. Super Admin Global
            const superAdmin = await this.findByEmail('master@os4u.com.br');
            if (!superAdmin) {
                await this.create({
                    email: 'master@os4u.com.br',
                    name: 'CEO OS4U',
                    password: 'master123',
                    role: UserRole.SUPER_ADMIN,
                    mustChangePassword: false,
                });
                console.log('✅ Super Admin criado: master@os4u.com.br');
            }

            // 2. Admin padrão da loja
            const adminUser = await this.findByEmail('admin@admin.com');
            if (!adminUser) {
                await this.create({
                    email: 'admin@admin.com',
                    name: 'Administrador',
                    password: 'Admin@123',
                    role: UserRole.ADMIN,
                    mustChangePassword: false,
                });
                console.log('✅ Admin padrão criado: admin@admin.com / Admin@123');
            } else {
                // FORCE UPDATE FOR LOCAL TESTING
                const salt = await bcrypt.genSalt();
                const hashedPassword = await bcrypt.hash('Admin@123', salt);
                await this.usersRepository.update(adminUser.id, { password: hashedPassword });
                console.log('✅ Senha do admin forçada para: Admin@123');
            }
        } catch (e) {
            console.warn('⚠️ UsersService init:', e.message);
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
