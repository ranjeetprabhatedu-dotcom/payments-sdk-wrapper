import axios from 'axios';
import { Sep38QuoteRequest, Sep38QuoteResponse } from './types';

export class Sep38Client {
  constructor(private anchorUrl: string, private logger?: any) {}

  /**
   * Request a fiat on-ramp/off-ramp quote from the SEP-38 anchor server.
   */
  public async getQuote(params: Sep38QuoteRequest, authToken?: string): Promise<Sep38QuoteResponse> {
    const url = `${this.anchorUrl}/quote`;
    
    if (this.logger && typeof this.logger.info === 'function') {
      this.logger.info(`SEP-38: Requesting quote for ${params.sellAmount} ${params.sellAsset} -> ${params.buyAsset}`);
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await axios.post<Sep38QuoteResponse>(
        url,
        {
          sell_asset: params.sellAsset,
          buy_asset: params.buyAsset,
          sell_amount: params.sellAmount,
          context: params.context,
        },
        { headers }
      );

      return response.data;
    } catch (error: any) {
      if (this.logger && typeof this.logger.error === 'function') {
        this.logger.error(`SEP-38: Failed to get quote: ${error.message}`);
      }
      throw new Error(`SEP-38 Request Failed: ${error.response?.data?.error || error.message}`);
    }
  }
}
