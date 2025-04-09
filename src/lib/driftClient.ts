// src/lib/driftClient.ts

import { Connection,  } from '@solana/web3.js';
import { DriftClient } from '@drift-labs/sdk';
import { Wallet } from '@coral-xyz/anchor';

export async function createDriftClient({
  connection, wallet, env = 'devnet',
}: {
  connection: Connection;
  wallet: Wallet;
  env?: 'mainnet-beta' | 'devnet';
}) {
  try {
    const driftClient = new DriftClient({
      connection,
      wallet,
      env,
    });

    // Subscribe to keep the client updated with account changes
    await driftClient.subscribe();

    // Return the initialized DriftClient
    return driftClient;
  } catch (err) {
    console.error("Error initializing DriftClient:", err);
    throw new Error('Failed to initialize DriftClient');
  }
}
