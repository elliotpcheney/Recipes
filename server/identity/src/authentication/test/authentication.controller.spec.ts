import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationController } from '../authentication.controller';
import { AuthenticationService } from '../authentication.service';
import { AuthRequestDto } from '../models/loginRequestDto';
import { MagicUserMetadata } from '@magic-sdk/admin';
import { LoggerService, UnauthorizedException } from '@nestjs/common';
import { User } from '../../user/entities/user.entity';
import { Role } from '../../models/roles';
import { UserRepository } from '../../user/user.repository';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

const mockUserRepository = () => ({});

const mockUser: User = {
  _id: '1',
  username: 'username',
  roles: [Role.Member],
  email: 'test@test.com',
  isActive: true,
};

const didToken: AuthRequestDto = { didToken: 'test' };

describe('IdentityController', () => {
  let controller: AuthenticationController;
  let service: AuthenticationService;
  let logger: LoggerService;

  beforeEach(async (done) => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.registerAsync({
          useFactory: async () => ({
            secretOrPrivateKey: 'test',
            signOptions: {
              expiresIn: '60s',
              issuer: 'issuer',
            },
          }),
        }),
      ],
      controllers: [AuthenticationController],
      providers: [
        AuthenticationService,
        { provide: UserRepository, useFactory: mockUserRepository },
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useFactory: () => require('winston'),
        },
      ],
    }).compile();

    controller = module.get<AuthenticationController>(AuthenticationController);
    service = await module.get<AuthenticationService>(AuthenticationService);
    logger = await module.get<LoggerService>(WINSTON_MODULE_NEST_PROVIDER);
    jest.resetAllMocks();
    done();
  });

  test('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('authenticate', () => {
    let authenticateSpy: jest.SpyInstance;
    let logoutSpy: jest.SpyInstance;
    let getUserSpy: jest.SpyInstance;
    let createTokenSpy: jest.SpyInstance;
    let logSpy: jest.SpyInstance;

    const expectedMetadata: MagicUserMetadata = {
      email: mockUser.email,
      publicAddress: 'publicAddress',
      issuer: 'issuer',
    };

    beforeEach((done) => {
      authenticateSpy = jest.spyOn(service, 'authenticateDidToken');
      getUserSpy = jest.spyOn(service, 'getUser');
      logoutSpy = jest.spyOn(service, 'logout');
      createTokenSpy = jest.spyOn(service, 'createJwtFromUser');
      logSpy = jest.spyOn(logger, 'log');
      done();
    });

    test('should throw UnauthorizedException if metadata invalid', async () => {
      authenticateSpy.mockImplementation(() => Promise.resolve(undefined));
      logoutSpy.mockImplementation();

      try {
        await controller.authenticate(didToken);
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
      }

      expect(service.authenticateDidToken).toHaveBeenCalledWith(
        didToken.didToken,
      );

      expect(logger.log).toHaveBeenCalledWith(
        'didToken invalid.',
        AuthenticationController.name,
      );

      expect(service.logout).toHaveBeenCalledWith(didToken.didToken);

      expect(service.logout).toHaveBeenCalledWith(didToken.didToken);
      expect(authenticateSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logoutSpy).toHaveBeenCalledTimes(1);
      expect(createTokenSpy).not.toHaveBeenCalled();
    });

    test('should throw UnauthorizedException if user not active', async () => {
      authenticateSpy.mockImplementation(() =>
        Promise.resolve(expectedMetadata),
      );
      getUserSpy.mockImplementation(() =>
        Promise.resolve({ ...mockUser, isActive: false }),
      );

      try {
        await controller.authenticate(didToken);
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
      }

      expect(service.authenticateDidToken).toHaveBeenCalledWith(
        didToken.didToken,
      );

      expect(logger.log).toHaveBeenCalledWith(
        `User with email ${mockUser.email} is inactive.`,
        AuthenticationController.name,
      );

      expect(service.logout).toHaveBeenCalledWith(didToken.didToken);

      expect(service.getUser).toHaveBeenCalledWith(expectedMetadata.email);
      expect(service.logout).toHaveBeenCalledWith(didToken.didToken);
      expect(authenticateSpy).toHaveBeenCalledTimes(1);
      expect(getUserSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logoutSpy).toHaveBeenCalledTimes(1);
      expect(createTokenSpy).not.toHaveBeenCalled();
    });

    test('should call authenticateDidToken and createJwtFromMagicMetadata', async () => {
      const expectedResult = 'jwt';

      authenticateSpy.mockImplementation(() =>
        Promise.resolve(expectedMetadata),
      );
      getUserSpy.mockImplementation(() => Promise.resolve(mockUser));
      createTokenSpy.mockImplementation(() => Promise.resolve(expectedResult));

      const actual = await controller.authenticate(didToken);

      expect(service.authenticateDidToken).toHaveBeenCalledWith(
        didToken.didToken,
      );
      expect(service.getUser).toHaveBeenCalledWith(expectedMetadata.email);
      expect(service.createJwtFromUser).toHaveBeenCalledWith(mockUser);
      expect(actual).toEqual(expectedResult);
      expect(authenticateSpy).toHaveBeenCalledTimes(1);
      expect(createTokenSpy).toHaveBeenCalledTimes(1);
      expect(logoutSpy).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    test('should call logout', async () => {
      const logoutSpy = jest
        .spyOn(service, 'logout')
        .mockImplementation(() => Promise.resolve());

      await controller.logout(didToken);

      expect(service.logout).toHaveBeenCalledWith(didToken.didToken);
      expect(logoutSpy).toHaveBeenCalledTimes(1);
    });
  });
});
