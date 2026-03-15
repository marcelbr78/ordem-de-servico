import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { FiscalController } from './fiscal.controller';
import { FiscalService } from './fiscal.service';
import { FiscalConfigController } from './fiscal-config.controller';
import { PagBankController } from './pagbank.controller';
import { FiscalNota } from './entities/fiscal-nota.entity';
import { FiscalProduto } from './entities/fiscal-produto.entity';
import { FiscalServico } from './entities/fiscal-servico.entity';
import { FiscalCliente } from './entities/fiscal-cliente.entity';
import { AbrasfAdapter, BethaAdapter, NfseAdapterFactory } from './nfse/nfse-adapter.factory';
import { SettingsModule } from '../settings/settings.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([FiscalNota, FiscalProduto, FiscalServico, FiscalCliente]),
        MulterModule.register({ dest: './certs' }),
        SettingsModule,
    ],
    controllers: [FiscalController, FiscalConfigController, PagBankController],
    providers: [FiscalService, AbrasfAdapter, BethaAdapter, NfseAdapterFactory],
    exports: [FiscalService],
})
export class FiscalModule { }
