import * as https from 'https';
import { window, StatusBarItem, StatusBarAlignment } from 'vscode';

interface FGIResDataItem {
  value: string
  value_classification: string
  timestamp: number
}

interface FGIResData {
  name: string,
  data: FGIResDataItem[],
  metadata: {
    error: string | null
  }
}

interface PriceResData {
  price: string
}

function get<T>(url: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (d) => {
        data += d;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch(e) {
          reject(e);
        }
      });

    }).on('error', (e) => {
      reject(e);
    });
  });
}

export default class BitcoinFearGreedIndex {
  private timerIdFGI!: NodeJS.Timeout;
  private timerIdPrice!: NodeJS.Timeout;
  private statusBar!: StatusBarItem;

  constructor() {
    this.initialize();
  }

  initialize() {
    if (!this.statusBar) {
      this.statusBar = window.createStatusBarItem(StatusBarAlignment.Left);
      this.statusBar.show();
    }

    let fgiText = '';
    let priceText = '';
    const makeText = () => `$(coin-btc)${priceText} ${fgiText}`;
    const pollFGI = () => {
      this.getFGIData().then(({ data }) => {
        const values = data.map(_ => _.value);
        fgiText = `T${values[0]}Y${values[1]}`;
        this.statusBar.text = makeText();
      }).catch(e => {
        console.log(e);
      });
      this.timerIdFGI = setTimeout(pollFGI, 120000);
    };
    const pollPrice = () => {
      this.getPriceData().then(({ price }) => {
        priceText = `$${price}`;
        this.statusBar.text = makeText();
      }).catch(e => {
        console.log(e);
      });
      this.timerIdPrice = setTimeout(pollPrice, 3000);
    };
    pollFGI();
    pollPrice();
  }

  getPriceData() {
    return get<PriceResData>('https://api.binance.com/api/v3/avgPrice?symbol=BTCUSDT').then(data => {
      const price = Number(data.price);
      data.price = price > 0 ? price.toFixed(0) : price.toFixed(5);
      return data;
    });
  }

  getFGIData() {
    return get<FGIResData>('https://api.alternative.me/fng/?limit=2').then(data => {
      if (data.metadata.error) {
        throw new Error('error request');
      }
      return data;
    });
  }

  dispose() {
    this.statusBar.dispose();
    clearTimeout(this.timerIdFGI);
    clearTimeout(this.timerIdPrice);
  }
}
