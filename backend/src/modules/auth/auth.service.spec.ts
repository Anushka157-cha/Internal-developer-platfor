import { AuthService } from './auth.service';

describe('AuthService (unit)', () => {
  let authService: AuthService;
  let usersServiceMock: any;
  let jwtServiceMock: any;
  let emailServiceMock: any;

  beforeEach(() => {
    usersServiceMock = {
      findByEmail: jest.fn(),
      validatePassword: jest.fn(),
      create: jest.fn(),
      setResetPasswordToken: jest.fn(),
      findByResetToken: jest.fn(),
      updatePassword: jest.fn(),
      clearResetToken: jest.fn(),
      updateRefreshTokenHash: jest.fn().mockResolvedValue(undefined),
      findOne: jest.fn(),
    };

    jwtServiceMock = { sign: jest.fn().mockReturnValue('signed-token') };
    emailServiceMock = { sendPasswordResetEmail: jest.fn() };
    const auditServiceMock: any = { log: jest.fn().mockResolvedValue({}) };

    authService = new AuthService(usersServiceMock, emailServiceMock, jwtServiceMock, auditServiceMock);
  });

  it('validateUser returns user data when credentials are valid', async () => {
    const user = { id: '1', email: 'a@b.com', password: 'hashed', isActive: true, role: 'DEVELOPER' };
    usersServiceMock.findByEmail.mockResolvedValue(user);
    usersServiceMock.validatePassword.mockResolvedValue(true);

    const result = await authService.validateUser('a@b.com', 'plain');

    expect(result).toMatchObject({ id: '1', email: 'a@b.com', role: 'DEVELOPER' });
  });

  it('validateUser throws for unknown user', async () => {
    usersServiceMock.findByEmail.mockResolvedValue(null);
    await expect(authService.validateUser('x@x.com', 'p')).rejects.toThrow();
  });

  it('validateUser throws for invalid password', async () => {
    const user = { id: '1', email: 'a@b.com', password: 'hashed', isActive: true };
    usersServiceMock.findByEmail.mockResolvedValue(user);
    usersServiceMock.validatePassword.mockResolvedValue(false);

    await expect(authService.validateUser('a@b.com', 'bad')).rejects.toThrow();
  });

  it('login returns token and user info', async () => {
    const user = { id: '1', email: 'a@b.com', password: 'hashed', isActive: true, firstName: 'A', lastName: 'B', role: 'DEVELOPER' };
    jest.spyOn(authService, 'validateUser' as any).mockResolvedValue(user);

    const res = await authService.login({ email: 'a@b.com', password: 'p' } as any);

    expect(res.access_token).toBe('signed-token');
    expect(res.user).toMatchObject({ id: '1', email: 'a@b.com', role: 'DEVELOPER' });
  });

  it('signup throws on existing user', async () => {
    usersServiceMock.findByEmail.mockResolvedValue({ id: '1' });
    await expect(authService.signup({ email: 'a@b.com' } as any)).rejects.toThrow();
  });

  it('signup returns token and user when new', async () => {
    usersServiceMock.findByEmail.mockResolvedValue(null);
    const created = { id: '2', email: 'new@a.com', firstName: 'F', lastName: 'L', role: 'DEVELOPER' };
    usersServiceMock.create.mockResolvedValue(created);

    const res = await authService.signup({ email: 'new@a.com' } as any);
    expect(res.access_token).toBe('signed-token');
    expect(res.user.email).toBe('new@a.com');
  });

  it('forgotPassword sends email when user exists', async () => {
    usersServiceMock.findByEmail.mockResolvedValue({ email: 'x@y.com' });
    usersServiceMock.setResetPasswordToken.mockResolvedValue(true);
    emailServiceMock.sendPasswordResetEmail.mockResolvedValue(true);

    const res = await authService.forgotPassword({ email: 'x@y.com' } as any);
    expect(res.message).toContain('password reset');
    expect(usersServiceMock.setResetPasswordToken).toHaveBeenCalled();
  });

  it('forgotPassword returns generic message when user not found', async () => {
    usersServiceMock.findByEmail.mockResolvedValue(null);
    const res = await authService.forgotPassword({ email: 'no@no.com' } as any);
    expect(res.message).toContain('password reset');
  });

  it('resetPassword updates password when token valid', async () => {
    const user = { id: 'u1', resetPasswordExpires: new Date(Date.now() + 10000) };
    usersServiceMock.findByResetToken.mockResolvedValue(user);
    usersServiceMock.updatePassword.mockResolvedValue(true);
    usersServiceMock.clearResetToken.mockResolvedValue(true);

    const res = await authService.resetPassword({ token: 't', password: 'new' } as any);
    expect(res.message).toContain('Password has been reset');
  });

  it('resetPassword throws when token expired', async () => {
    const user = { id: 'u1', resetPasswordExpires: new Date(Date.now() - 10000) };
    usersServiceMock.findByResetToken.mockResolvedValue(user);
    await expect(authService.resetPassword({ token: 't', password: 'new' } as any)).rejects.toThrow();
  });
});
