import { Injectable } from '@nestjs/common';

@Injectable()
export class BoardviewParserService {
    public async parse(fileBuffer: Buffer) {
        // Future extraction of connections and board layouts
        return { success: true, message: 'File stored' };
    }
}
