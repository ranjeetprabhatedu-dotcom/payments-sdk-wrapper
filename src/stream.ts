import { EventEmitter } from 'events';
import { Horizon } from '@stellar/stellar-sdk';
import { PaymentStreamOptions, PaymentEvent } from './types';

export class PaymentStream extends EventEmitter {
  private closeFn?: () => void;

  constructor(
    private server: Horizon.Server,
    private options: PaymentStreamOptions,
    private logger?: any
  ) {
    super();
  }

  /**
   * Establishes a connection to Stellar's SSE stream for the given account's payments.
   */
  public connect(): void {
    if (this.closeFn) {
      if (this.logger && typeof this.logger.warn === 'function') {
        this.logger.warn('PaymentStream is already connected.');
      }
      return;
    }

    if (this.logger && typeof this.logger.info === 'function') {
      this.logger.info(`PaymentStream: Connecting to payments stream for account: ${this.options.account}`);
    }

    try {
      this.closeFn = this.server.payments()
        .forAccount(this.options.account)
        .cursor(this.options.cursor || 'now')
        .stream({
          onmessage: (operation: any) => {
            if (operation.type === 'payment' || operation.type === 'path_payment_strict_receive' || operation.type === 'path_payment_strict_send') {
              const event: PaymentEvent = {
                id: operation.id,
                from: operation.from || operation.source_account,
                to: operation.to || operation.destination,
                amount: operation.amount,
                asset_code: operation.asset_code || 'XLM',
                asset_issuer: operation.asset_issuer,
                asset_type: operation.type,
                created_at: operation.created_at,
              };

              this.emit('payment.completed', event);
            }
          },
          onerror: (error: any) => {
            if (this.logger && typeof this.logger.error === 'function') {
              this.logger.error(`PaymentStream Error: ${error.message || JSON.stringify(error)}`);
            }
            this.emit('payment.failed', error);
          }
        });
    } catch (err: any) {
      this.emit('payment.failed', err);
    }
  }

  /**
   * Disconnects the SSE stream.
   */
  public disconnect(): void {
    if (this.closeFn) {
      this.closeFn();
      this.closeFn = undefined;
      if (this.logger && typeof this.logger.info === 'function') {
        this.logger.info('PaymentStream: Disconnected');
      }
    }
  }
}
