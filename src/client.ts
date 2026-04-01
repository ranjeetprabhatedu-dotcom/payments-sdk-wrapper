import { Horizon, Transaction } from '@stellar/stellar-sdk';
import { PaymentClientOptions, PaymentStreamOptions } from './types';
import { FeeGuardEngine } from './feeguard';
import { Sep38Client } from './sep38';
import { PaymentStream } from './stream';

export class PaymentClient {
  public server: Horizon.Server;
  public feeGuard: FeeGuardEngine;
  public sep38: Sep38Client;
  private options: PaymentClientOptions;

  constructor(options: PaymentClientOptions & { anchorUrl?: string }) {
    this.options = options;
    this.server = new Horizon.Server(options.horizonUrl);
    this.feeGuard = new FeeGuardEngine(options.maxFeeStroops, options.logger);
    this.sep38 = new Sep38Client(options.anchorUrl || 'https://anchor.stellar.org', options.logger);
  }

  /**
   * Creates a new PaymentStream for real-time SSE payment events.
   */
  public createStream(options: PaymentStreamOptions): PaymentStream {
    return new PaymentStream(this.server, options, this.options.logger);
  }

  /**
   * Submits a transaction to the Stellar network after checking fee limits.
   */
  public async submitTransaction(transaction: Transaction): Promise<any> {
    // 1. Guard against high fees
    this.feeGuard.checkFee(transaction);

    // 2. Submit transaction
    try {
      const response = await this.server.submitTransaction(transaction);
      if (this.options.logger && typeof this.options.logger.info === 'function') {
        this.options.logger.info(`PaymentClient: Transaction submitted successfully. Hash: ${response.hash}`);
      }
      return response;
    } catch (error: any) {
      if (this.options.logger && typeof this.options.logger.error === 'function') {
        this.options.logger.error(`PaymentClient: Transaction submission failed: ${error.message}`);
      }
      throw error;
    }
  }
}
