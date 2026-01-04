import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useAppStore } from '../store/useAppStore';
import { getTradeHistory } from '../services/dataFetcher';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function Trades() {
  const { isConnected } = useAccount();
  const { trades, setTrades } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const tradesPerPage = 20;

  useEffect(() => {
    if (isConnected) {
      fetchTrades();
      const interval = setInterval(fetchTrades, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const data = await getTradeHistory(100);
      setTrades(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch trades:', err);
      setError('Failed to load trade history. Backend may be offline.');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    const headers = ['Timestamp', 'Symbol', 'Side', 'PnL', 'Confidence', 'Gas Fee', 'Slippage'];
    const rows = trades.map(t => [
      t.timestamp,
      t.symbol,
      t.side,
      t.pnl,
      t.confidence,
      t.gasFee,
      t.slippage
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trades.csv';
    a.click();
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#F2EBDD' }}>Connect Your Wallet</h2>
          <p className="text-gray-400">Please connect your wallet to view trade history</p>
        </motion.div>
      </div>
    );
  }

  const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const winningTrades = trades.filter(t => t.pnl > 0).length;
  const losingTrades = trades.filter(t => t.pnl < 0).length;
  const winRate = trades.length > 0 ? ((winningTrades / trades.length) * 100).toFixed(1) : 0;

  const paginatedTrades = trades.slice((page - 1) * tradesPerPage, page * tradesPerPage);
  const totalPages = Math.ceil(trades.length / tradesPerPage);

  return (
    <div className="min-h-screen content-wrapper">
      <div className="px-4 md:px-6 lg:px-8 py-8 md:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <p className="label-gold mb-4">TRADING HISTORY</p>
              <h1 className="text-4xl md:text-5xl font-bold tracking-wide" style={{ color: '#FAFAFA' }}>Trades</h1>
            </div>
            <button
              onClick={downloadCSV}
              className="px-4 py-2 rounded-lg flex items-center space-x-2 transition-all"
              style={{ backgroundColor: '#202020', color: '#C9B27A', border: '1px solid #C9B27A' }}
              disabled={trades.length === 0}
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              <span>Export CSV</span>
            </button>
          </div>
        </motion.div>

        {error && (
          <div className="mb-8 p-4 rounded-lg bg-red-900/20 border border-red-500/30">
            <p style={{ color: '#ff6b6b' }}>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatBox label="Total Trades" value={trades.length.toString()} />
          <StatBox label="Total PnL" value={`$${totalPnL.toFixed(2)}`} isPositive={totalPnL >= 0} />
          <StatBox label="Win Rate" value={`${winRate}%`} />
          <StatBox label="W/L Ratio" value={`${winningTrades}/${losingTrades}`} />
        </div>

        <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#111111', border: '1px solid #202020' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #202020' }}>
                  <th className="px-6 py-4 text-left text-xs font-bold" style={{ color: '#C9B27A' }}>TIMESTAMP</th>
                  <th className="px-6 py-4 text-left text-xs font-bold" style={{ color: '#C9B27A' }}>SYMBOL</th>
                  <th className="px-6 py-4 text-left text-xs font-bold" style={{ color: '#C9B27A' }}>SIDE</th>
                  <th className="px-6 py-4 text-right text-xs font-bold" style={{ color: '#C9B27A' }}>PNL</th>
                  <th className="px-6 py-4 text-right text-xs font-bold" style={{ color: '#C9B27A' }}>CONFIDENCE</th>
                  <th className="px-6 py-4 text-right text-xs font-bold" style={{ color: '#C9B27A' }}>GAS</th>
                  <th className="px-6 py-4 text-right text-xs font-bold" style={{ color: '#C9B27A' }}>SLIPPAGE</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTrades.map((trade, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #202020' }}
                    className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm" style={{ color: '#999' }}>
                      {new Date(trade.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold" style={{ color: '#F2EBDD' }}>
                      {trade.symbol}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded text-xs font-bold ${
                        trade.side === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {trade.side}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm font-bold text-right ${
                      trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right" style={{ color: '#999' }}>
                      {(trade.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 text-sm text-right" style={{ color: '#999' }}>
                      ${trade.gasFee.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right" style={{ color: '#999' }}>
                      {(trade.slippage * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {trades.length === 0 && !loading && (
            <div className="text-center py-12">
              <p style={{ color: '#999' }}>No trades found</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 p-6">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg disabled:opacity-50"
                style={{ backgroundColor: '#202020', color: '#F2EBDD' }}
              >
                Previous
              </button>
              <span style={{ color: '#999' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg disabled:opacity-50"
                style={{ backgroundColor: '#202020', color: '#F2EBDD' }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, isPositive }) {
  return (
    <div className="p-6 rounded-lg" style={{ backgroundColor: '#111111', border: '1px solid #202020' }}>
      <p className="text-sm mb-2" style={{ color: '#666' }}>{label}</p>
      <p className={`text-2xl font-bold ${isPositive !== undefined ? (isPositive ? 'text-green-400' : 'text-red-400') : ''}`}
        style={{ color: isPositive === undefined ? '#FAFAFA' : undefined }}>{value}</p>
    </div>
  );
}
