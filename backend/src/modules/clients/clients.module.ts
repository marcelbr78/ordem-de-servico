import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsService } from './clients.service';
import { ContactsService } from './contacts.service';
import { ClientOsHistoryService } from './client-os-history.service';
import { ClientsController } from './clients.controller';
import { PublicClientsController } from './public-clients.controller';
import { Client } from './entities/client.entity';
import { ClientContact } from './entities/client-contact.entity';
import { ClientOsHistory } from './entities/client-os-history.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Client, ClientContact, ClientOsHistory]),
    ],
    controllers: [ClientsController, PublicClientsController],
    providers: [ClientsService, ContactsService, ClientOsHistoryService],
    exports: [ClientsService, ContactsService, ClientOsHistoryService],
})
export class ClientsModule { }
