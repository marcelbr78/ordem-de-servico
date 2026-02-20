import { Controller, Post, Body, BadRequestException, Logger, Get, Res, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client, ClientType, ClientStatus } from './entities/client.entity';
import { ClientContact, ContactType } from './entities/client-contact.entity';
import { Response } from 'express';
import * as path from 'path';

@Controller('clients/public')
export class PublicClientsController {
    private readonly logger = new Logger(PublicClientsController.name);

    constructor(
        @InjectRepository(Client)
        private clientsRepository: Repository<Client>,
        @InjectRepository(ClientContact)
        private contactsRepository: Repository<ClientContact>,
    ) { }

    @Post('register')
    async selfRegister(@Body() body: any) {
        this.logger.log(`Self-register request: ${JSON.stringify(body)}`);

        // Validate required fields
        if (!body.nome || !body.nome.trim()) {
            throw new BadRequestException('Nome é obrigatório');
        }
        if (!body.telefone || !body.telefone.trim()) {
            throw new BadRequestException('Telefone é obrigatório');
        }

        // Clean phone number
        var phone = body.telefone.replace(/\D/g, '');
        if (phone.length < 10 || phone.length > 11) {
            throw new BadRequestException('Telefone deve ter DDD + número (10 ou 11 dígitos)');
        }

        // Clean CPF if provided
        var cpfCnpj = null;
        if (body.cpf && body.cpf.trim()) {
            cpfCnpj = body.cpf.replace(/\D/g, '');
            if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
                throw new BadRequestException('CPF deve ter 11 dígitos');
            }

            // Check for duplicates
            var existing = await this.clientsRepository.findOne({
                where: { cpfCnpj: cpfCnpj },
                withDeleted: true,
            });
            if (existing) {
                throw new BadRequestException('CPF já cadastrado no sistema. Informe ao atendente.');
            }
        }

        // Create client
        var client = this.clientsRepository.create({
            tipo: ClientType.PF,
            nome: body.nome.trim(),
            cpfCnpj: cpfCnpj,
            email: body.email && body.email.trim() ? body.email.trim() : null,
            cep: body.cep && body.cep.trim() ? body.cep.replace(/\D/g, '') : null,
            rua: body.rua || null,
            numero: body.numero || null,
            complemento: body.complemento || null,
            bairro: body.bairro || null,
            cidade: body.cidade || null,
            estado: body.estado ? body.estado.toUpperCase() : null,
            observacoes: body.observacoes || null,
            status: ClientStatus.ATIVO,
        });

        try {
            var savedClient = await this.clientsRepository.save(client);

            // Add contact
            var contact = this.contactsRepository.create({
                clienteId: savedClient.id,
                tipo: ContactType.WHATSAPP,
                numero: phone,
                principal: true,
            });
            await this.contactsRepository.save(contact);

            this.logger.log(`Client self-registered: ${savedClient.id} - ${savedClient.nome} - ${phone}`);
            return { success: true, clientId: savedClient.id, nome: savedClient.nome };
        } catch (error) {
            this.logger.error(`Self-register failed: ${error.message}`);
            if (error.message && error.message.indexOf('UNIQUE') !== -1) {
                throw new BadRequestException('CPF já cadastrado no sistema');
            }
            throw new BadRequestException(error.message || 'Erro ao cadastrar');
        }
    }

    @Get('cep/:cep')
    async consultCep(@Param('cep') cep: string) {
        const cleanCep = cep.replace(/\D/g, '');
        if (cleanCep.length !== 8) {
            throw new BadRequestException('CEP inválido');
        }

        try {
            const axios = require('axios');
            const response = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`);

            if (response.data.erro) {
                throw new BadRequestException('CEP não encontrado');
            }

            return response.data;
        } catch (error) {
            this.logger.error(`CEP Error: ${error.message}`);
            throw new BadRequestException('Erro ao consultar CEP');
        }
    }

    @Get('kiosk')
    serveKiosk(@Res() res: Response) {
        const fs = require('fs');
        const path = require('path');

        // Find the project root by looking for 'package.json' or 'backend' folder
        // We start from current dir and go up
        let currentDir = __dirname;
        let kioskPath = null;

        // Safety break after 5 levels up
        for (let i = 0; i < 5; i++) {
            // Check: current/public/kiosk.html
            const p1 = path.join(currentDir, 'public', 'kiosk.html');
            if (fs.existsSync(p1)) { kioskPath = p1; break; }

            // Check: current/backend/public/kiosk.html
            const p2 = path.join(currentDir, 'backend', 'public', 'kiosk.html');
            if (fs.existsSync(p2)) { kioskPath = p2; break; }

            // Go up one level
            const parent = path.dirname(currentDir);
            if (parent === currentDir) break; // Root reached
            currentDir = parent;
        }

        // Final attempt relative to CWD if above failed
        if (!kioskPath) {
            const cwdConfig = path.join(process.cwd(), 'public', 'kiosk.html');
            if (fs.existsSync(cwdConfig)) kioskPath = cwdConfig;

            const cwdBackendConfig = path.join(process.cwd(), 'backend', 'public', 'kiosk.html');
            if (fs.existsSync(cwdBackendConfig)) kioskPath = cwdBackendConfig;
        }

        if (kioskPath && fs.existsSync(kioskPath)) {
            this.logger.log(`Serving kiosk from found path: ${kioskPath}`);
            res.sendFile(kioskPath);
        } else {
            this.logger.error(`Kiosk file not found. Searched in parents of ${__dirname} and CWD ${process.cwd()}`);
            res.status(404).send(`Erro: Arquivo do Kiosk não encontrado no servidor.`);
        }
    }
}
