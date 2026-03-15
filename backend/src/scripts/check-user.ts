import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../modules/users/users.service';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);

    const username = 'Marcel78';
    const password = '19777883'; // The password user is trying to use

    console.log(`Checking user: ${username}...`);

    // We might need to use findOne by username inside usersService or repository
    // Since I don't know the exact API of UsersService, I will try to find usage or inspect it first.
    // For now, let's assume valid scaffolding.

    // The system uses 'email' field for login, but does not enforce email format in LoginDto.
    // So we can use 'Marcel78' as the email.
    try {
        const user = await usersService.findByEmail(username);
        if (user) {
            console.log(`User ${username} found. ID: ${user.id}`);
            console.log('Updating password...');
            // UsersService.update handles hashing automatically!
            await usersService.update(user.id, { password: password, isActive: true });
            console.log('Password updated successfully.');
        } else {
            console.log(`User ${username} NOT found. Creating...`);
            await usersService.create({
                email: username, // Using username as email
                password,
                name: 'Marcelo',
                role: 'admin' as any // Force cast if needed, or import UserRole
            });
            console.log(`User ${username} created.`);
        }
    } catch (error) {
        console.error('Error:', error);
    }

    await app.close();
}
bootstrap();
