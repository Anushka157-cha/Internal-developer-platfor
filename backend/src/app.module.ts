import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ServicesModule } from './modules/services/services.module';
import { DeploymentsModule } from './modules/deployments/deployments.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { LogsModule } from './modules/logs/logs.module';
import { AuditModule } from './modules/audit/audit.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database - Using SQLite (no installation required!)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        type: 'sqlite',
        database: 'database.sqlite',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: false,
      }),
      inject: [ConfigService],
    }),

    // BullMQ for background jobs
    // TEMPORARILY DISABLED - Install Redis or Docker to enable
    // BullModule.forRootAsync({
    //   imports: [ConfigModule],
    //   useFactory: (configService: ConfigService) => ({
    //     connection: {
    //       host: configService.get('REDIS_HOST') || 'localhost',
    //       port: configService.get('REDIS_PORT') || 6379,
    //     },
    //   }),
    //   inject: [ConfigService],
    // }),

    // Feature modules
    AuthModule,
    UsersModule,
    ServicesModule,
    DeploymentsModule,
    FeatureFlagsModule,
    LogsModule,
    AuditModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
