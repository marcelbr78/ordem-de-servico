import {
    Controller, Get, Post, UseInterceptors, UploadedFile,
    UseGuards, HttpException, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import * as forge from 'node-forge';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SettingsService } from '../settings/settings.service';
import axios from 'axios';

@Controller('fiscal')
@UseGuards(JwtAuthGuard)
export class FiscalConfigController {
    constructor(private readonly settings: SettingsService) { }

    // ══════════════════════════════════════════════════
    // Upload do certificado .pfx
    // ══════════════════════════════════════════════════
    @Post('certificado/upload')
    @UseInterceptors(
        FileInterceptor('certificado', {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    const dir = path.join(process.cwd(), 'certs');
                    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                    cb(null, dir);
                },
                filename: (req, file, cb) => {
                    cb(null, 'certificado.pfx');
                },
            }),
            limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
            fileFilter: (req, file, cb) => {
                const ext = path.extname(file.originalname).toLowerCase();
                if (['.pfx', '.p12'].includes(ext)) {
                    cb(null, true);
                } else {
                    cb(new HttpException('Tipo de arquivo inválido. Use .pfx ou .p12', HttpStatus.BAD_REQUEST), false);
                }
            },
        }),
    )
    async uploadCertificado(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new HttpException('Nenhum arquivo enviado', HttpStatus.BAD_REQUEST);
        }

        // Atualizar configuração de caminho
        await this.settings.set(
            'fiscal_cert_path',
            path.join(process.cwd(), 'certs', 'certificado.pfx'),
            'string' as any,
            'Caminho do certificado digital A1',
        );

        return {
            success: true,
            filename: file.originalname,
            path: path.join('certs', 'certificado.pfx'),
            size: file.size,
        };
    }

    // ══════════════════════════════════════════════════
    // Testar certificado (validade)
    // ══════════════════════════════════════════════════
    @Get('certificado/status')
    async statusCertificado() {
        const certPath = await this.settings.findByKey('fiscal_cert_path')
            || path.join(process.cwd(), 'certs', 'certificado.pfx');
        const certPassword = await this.settings.findByKey('fiscal_cert_password') || '';

        if (!fs.existsSync(certPath)) {
            return { ok: false, message: 'Certificado não encontrado no servidor' };
        }

        try {
            const pfxBuffer = fs.readFileSync(certPath);
            const pfxAsn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'));
            const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, false, certPassword);
            const certBags = pfx.getBags({ bagType: forge.pki.oids.certBag });
            const cert = certBags[forge.pki.oids.certBag]?.[0]?.cert;

            if (!cert) return { ok: false, message: 'Certificado inválido' };

            const now = new Date();
            const expiry = cert.validity.notAfter;
            const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const subject = cert.subject.getField('CN')?.value || 'Desconhecido';

            return {
                ok: daysLeft > 0,
                subject,
                notBefore: cert.validity.notBefore.toLocaleDateString('pt-BR'),
                notAfter: expiry.toLocaleDateString('pt-BR'),
                daysLeft,
                message: daysLeft > 0
                    ? `Válido até ${expiry.toLocaleDateString('pt-BR')} (${daysLeft} dias)`
                    : `EXPIRADO em ${expiry.toLocaleDateString('pt-BR')}`,
            };
        } catch (err: any) {
            return { ok: false, message: `Erro ao ler certificado: ${err.message}` };
        }
    }

    // ══════════════════════════════════════════════════
    // Testar e-mail
    // ══════════════════════════════════════════════════
    @Post('email/teste')
    async testarEmail() {
        const smtpHost = await this.settings.findByKey('smtp_host') || process.env.SMTP_HOST;
        const smtpUser = await this.settings.findByKey('smtp_user') || process.env.SMTP_USER;
        const smtpPass = await this.settings.findByKey('smtp_pass') || process.env.SMTP_PASS;
        const smtpPort = parseInt(await this.settings.findByKey('smtp_port') || process.env.SMTP_PORT || '587');
        const smtpFrom = await this.settings.findByKey('smtp_from') || smtpUser;

        if (!smtpHost || !smtpUser) {
            throw new HttpException('Configure o servidor SMTP antes de testar', HttpStatus.BAD_REQUEST);
        }

        try {
            const nodemailer = await import('nodemailer');
            const transporter = nodemailer.default.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpPort === 465,
                auth: { user: smtpUser, pass: smtpPass },
            });

            await transporter.sendMail({
                from: `"Sistema Fiscal" <${smtpFrom}>`,
                to: smtpUser,
                subject: '✅ Teste de E-mail — Sistema Fiscal',
                html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f9f9f9; border-radius: 10px;">
            <h2 style="color: #1a1a2e; margin: 0 0 12px;">✅ E-mail configurado com sucesso!</h2>
            <p style="color: #555; line-height: 1.6;">
              Seu sistema de e-mail está funcionando corretamente.<br/>
              Os DANFEs serão enviados automaticamente para os clientes após a emissão das NF-e.
            </p>
            <hr style="border: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999;">Sistema Fiscal — ${new Date().toLocaleString('pt-BR')}</p>
          </div>`,
            });

            return { success: true, message: `E-mail de teste enviado para ${smtpUser}` };
        } catch (err: any) {
            throw new HttpException(`Falha ao enviar: ${err.message}`, HttpStatus.BAD_GATEWAY);
        }
    }
}
