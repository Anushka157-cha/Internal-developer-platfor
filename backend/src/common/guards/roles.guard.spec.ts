import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new RolesGuard(reflector);
  });

  it('allows when no roles are required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

    const ctx: any = { getHandler: () => {}, getClass: () => {}, switchToHttp: () => ({ getRequest: () => ({}) }) };

    expect(guard.canActivate(ctx as any)).toBe(true);
  });

  it('allows when user has required role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([UserRole.ADMIN]);
    const ctx: any = { getHandler: () => {}, getClass: () => {}, switchToHttp: () => ({ getRequest: () => ({ user: { role: UserRole.ADMIN } }) }) };

    expect(guard.canActivate(ctx as any)).toBe(true);
  });

  it('denies when user lacks required role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([UserRole.ADMIN]);
    const ctx: any = { getHandler: () => {}, getClass: () => {}, switchToHttp: () => ({ getRequest: () => ({ user: { role: UserRole.DEVELOPER } }) }) };

    expect(guard.canActivate(ctx as any)).toBe(false);
  });
});
