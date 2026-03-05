import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UTApi } from 'uploadthing/server';

@Injectable()
export class CloudService {
  private utapi: UTApi;

  constructor(private configService: ConfigService) {
    this.utapi = new UTApi({
      token: this.configService.get<string>('UPLOADTHING_TOKEN'),
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    try {

      const fileBlob = new File([new Uint8Array(file.buffer)], file.originalname, { type: file.mimetype });
      
      const response = await this.utapi.uploadFiles(fileBlob);
      
      if (response.error) {
        throw new Error(response.error.message);
      }


      return response.data.ufsUrl || response.data.url;
    } catch (error) {
      console.error('Uploadthing Error:', error);
      throw new InternalServerErrorException('Falha ao fazer upload do arquivo para a nuvem.');
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const fileKey = fileUrl.split('/').pop();
    if (fileKey) {
      await this.utapi.deleteFiles(fileKey);
    }
  }
}