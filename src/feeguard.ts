import { Transaction } from '@stellar/stellar-sdk';

export class FeeGuardEngine {
  constructor(private maxFeeStroops: number, private logger?: any) {}

  /**
   * Validates if the transaction fee is within the allowed limits.
   * Throws an error if it exceeds the maximum fee.
   */
  public checkFee(tx: Transaction): void {
    const fee = parseInt(tx.fee, 10);
    if (isNaN(fee)) {
      throw new Error('Invalid transaction fee');
    }

    if (this.logger && typeof this.logger.info === 'function') {
      this.logger.info(`FeeGuard: Checking tx fee. Tx fee: ${fee} stroops. Max fee: ${this.maxFeeStroops} stroops.`);
    }

    if (fee > this.maxFeeStroops) {
      throw new Error(
        `Transaction fee of ${fee} stroops exceeds the configured guardrail limit of ${this.maxFeeStroops} stroops.`
      );
    }
  }
}
