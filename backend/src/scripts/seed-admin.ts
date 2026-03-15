import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module'; // Adjust path if needed
import { UsersService } from '../modules/users/users.service';
import { UserRole } from '../modules/users/entities/user.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);

    const email = 'Marcel78'; // Using username as email
    const password = '19777883';

    console.log(`Checking if user ${email} exists...`);
    const existingUser = await usersService.findByEmail(email);

    if (existingUser) {
        console.log(`User ${email} already exists. Updating password...`);
        await usersService.changePassword(existingUser.id, password);
        console.log('Password updated successfully.');
    } else {
        console.log(`Creating user ${email}...`);
        await usersService.create({
            email,
            name: 'Marcelo Admin',
            password,
            role: UserRole.ADMIN,
            isActive: true,
            mustChangePassword: false,
        });
        console.log('User created successfully.');
    }

    await app.close();
}

bootstrap();
