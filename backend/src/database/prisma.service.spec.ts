import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;
  let connectMock: jest.Mock;
  let disconnectMock: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    service = new PrismaService();
    connectMock = jest.fn();
    disconnectMock = jest.fn().mockResolvedValue(undefined);
    // Override the inherited PrismaClient methods so we never hit a real DB.
    (service as unknown as { $connect: jest.Mock }).$connect = connectMock;
    (service as unknown as { $disconnect: jest.Mock }).$disconnect =
      disconnectMock;
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('sets dbAvailable when the DB is reachable at boot', async () => {
    connectMock.mockResolvedValue(undefined);

    await service.onModuleInit();

    expect(service.dbAvailable).toBe(true);
    expect(connectMock).toHaveBeenCalledTimes(1);
  });

  it('boots without throwing when the DB is unavailable', async () => {
    connectMock.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(service.onModuleInit()).resolves.toBeUndefined();

    expect(service.dbAvailable).toBe(false);
  });

  it('recovers automatically once the DB becomes reachable', async () => {
    connectMock
      .mockRejectedValueOnce(new Error('ECONNREFUSED')) // boot
      .mockRejectedValueOnce(new Error('ECONNREFUSED')) // first retry
      .mockResolvedValue(undefined); // second retry succeeds

    await service.onModuleInit();
    expect(service.dbAvailable).toBe(false);

    // First retry tick — still down.
    await jest.advanceTimersByTimeAsync(5000);
    expect(service.dbAvailable).toBe(false);

    // Second retry tick — DB is up.
    await jest.advanceTimersByTimeAsync(5000);
    expect(service.dbAvailable).toBe(true);

    // Retry loop should have stopped; no further connect attempts.
    const callsAfterRecovery = connectMock.mock.calls.length;
    await jest.advanceTimersByTimeAsync(15000);
    expect(connectMock.mock.calls.length).toBe(callsAfterRecovery);
  });

  it('does not start a retry loop when connected at boot', async () => {
    connectMock.mockResolvedValue(undefined);

    await service.onModuleInit();

    await jest.advanceTimersByTimeAsync(15000);
    expect(connectMock).toHaveBeenCalledTimes(1);
  });

  it('stops retrying and disconnects on module destroy', async () => {
    connectMock.mockRejectedValue(new Error('ECONNREFUSED'));

    await service.onModuleInit();
    await service.onModuleDestroy();

    const callsAfterDestroy = connectMock.mock.calls.length;
    await jest.advanceTimersByTimeAsync(15000);
    expect(connectMock.mock.calls.length).toBe(callsAfterDestroy);
    expect(disconnectMock).toHaveBeenCalledTimes(1);
  });
});
