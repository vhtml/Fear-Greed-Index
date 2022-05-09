import * as vscode from 'vscode';
import BitcoinFearGreedIndex from './BitcoinFearGreedIndex';

export function activate(context: vscode.ExtensionContext) {
  const bfgi = new BitcoinFearGreedIndex();
  context.subscriptions.push(bfgi);
}
