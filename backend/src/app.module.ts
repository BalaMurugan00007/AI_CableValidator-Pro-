import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DesignValidationModule } from './design-validation/design-validation.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IecStandardsModule } from './iec-standards/iec-standards.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'cablevalidator',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Auto-create tables (dev only)
    }),
    DesignValidationModule,
    IecStandardsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
