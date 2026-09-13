import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ServicesModule } from './modules/services/services.module';
import { DeploymentsModule } from './modules/deployments/deployments.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { LogsModule } from './modules/logs/logs.module';
import { AuditModule } from './modules/audit/audit.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database - Production PostgreSQL with strict fail-fast, SQLite allowed only for dev/test
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const isProduction = configService.get<string>('NODE_ENV') === 'production';
        const dbUrl = configService.get<string>('DATABASE_URL');
        const dbHost = configService.get<string>('DATABASE_HOST');

        if (isProduction) {
          if (!dbUrl && !dbHost) {
            throw new Error(
              'FATAL: Production PostgreSQL configuration is missing (neither DATABASE_URL nor DATABASE_HOST is set). ' +
              'Refusing to start in production without a valid PostgreSQL database.'
            );
          }

          if (dbUrl) {
            return {
              type: 'postgres' as const,
              url: dbUrl,
              entities: [__dirname + '/**/*.entity{.ts,.js}'],
              synchronize: false,
              logging: false,
              ssl: configService.get('DATABASE_SSL') === 'true' ? { rejectUnauthorized: false } : false,
            };
          }

          return {
            type: 'postgres' as const,
            host: dbHost,
            port: Number(configService.get('DATABASE_PORT')) || 5432,
            username: configService.get('DATABASE_USERNAME') || 'postgres',
            password: configService.get<string>('DATABASE_PASSWORD'),
            database: String(configService.get('DATABASE_NAME') || 'idp_db'),
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: false,
            logging: false,
            ssl: configService.get('DATABASE_SSL') === 'true' ? { rejectUnauthorized: false } : false,
          };
        }

        // Development / Test mode
        if (dbUrl) {
          return {
            type: 'postgres' as const,
            url: dbUrl,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true,
            logging: false,
          };
        }

        if (dbHost) {
          return {
            type: 'postgres' as const,
            host: dbHost,
            port: Number(configService.get('DATABASE_PORT')) || 5432,
            username: configService.get('DATABASE_USERNAME') || 'postgres',
            password: configService.get<string>('DATABASE_PASSWORD'),
            database: String(configService.get('DATABASE_NAME') || 'idp_db'),
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true,
            logging: false,
          };
        }

        return {
          type: 'better-sqlite3' as const,
          database: 'database.sqlite',
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
          logging: false,
        };
      },
      inject: [ConfigService],
    }),

    // Rate limiting: enable global throttling via @nestjs/throttler
    ThrottlerModule.forRoot({
      ttl: Number(process.env.RATE_LIMIT_TTL) || 60,
      limit: Number(process.env.RATE_LIMIT_MAX) || 10,
    }),

    // BullMQ for background jobs with fail-fast in production
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get<string>('NODE_ENV') === 'production';
        const isTest = configService.get<string>('NODE_ENV') === 'test' || process.env.NODE_ENV === 'test';
        const redisUrl = configService.get<string>('REDIS_URL');
        const redisHost = configService.get<string>('REDIS_HOST');
        const redisPort = Number(configService.get('REDIS_PORT')) || (isTest ? 6380 : 6379);
        const redisPassword = configService.get<string>('REDIS_PASSWORD');

        if (isProduction && !redisUrl && !redisHost) {
          throw new Error(
            'FATAL: Production Redis configuration is missing (neither REDIS_URL nor REDIS_HOST is set). ' +
            'Refusing to start in production without Redis for BullMQ queue processing.'
          );
        }

        if (redisUrl) {
          return {
            connection: {
              url: redisUrl,
              maxRetriesPerRequest: null,
            },
          };
        }

        return {
          connection: {
            host: redisHost || 'localhost',
            port: redisPort,
            password: redisPassword || undefined,
            maxRetriesPerRequest: null,
            lazyConnect: isTest,
            enableOfflineQueue: false,
            retryStrategy: (times: number) => {
              // In test or non-production, don't spam reconnects if redis isn't running locally
              if (isTest || (!isProduction && times > 2)) return null;
              return Math.min(times * 100, 3000);
            },
          },
        };
      },
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    ServicesModule,
    DeploymentsModule,
    FeatureFlagsModule,
    LogsModule,
    AuditModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
