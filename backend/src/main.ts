import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: '*', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes();

  const config = new DocumentBuilder()
    .setTitle('EHR System API - HelixCare')
    .setDescription('API do Prontuário Eletrônico do Paciente com controle de acesso RBAC e auditoria.')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Insira o token JWT para acessar rotas protegidas',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
    
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀 Sistema EHR inicializado com sucesso.`);
  logger.log(`📚 Documentação Swagger disponível em: http://localhost:${port}/api/docs`);
}

bootstrap();
