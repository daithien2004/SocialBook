import { isMongoTransactionCapableTopology } from '@/shared/infrastructure/mongo-transaction-capability';

describe('Mongo transaction topology validation', () => {
  it('accepts replica set members', () => {
    expect(isMongoTransactionCapableTopology({ setName: 'rs0' })).toBe(true);
  });

  it('accepts sharded clusters', () => {
    expect(isMongoTransactionCapableTopology({ msg: 'isdbgrid' })).toBe(true);
  });

  it('rejects standalone servers', () => {
    expect(isMongoTransactionCapableTopology({ isWritablePrimary: true })).toBe(
      false,
    );
  });
});
