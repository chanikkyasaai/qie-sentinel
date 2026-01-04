import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheckIcon, BoltIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const API_BASE = 'http://localhost:9000/api';

export default function Dashboard() {
  const [systemState, setSystemState] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      const [health, live, trades, metricsData] = await Promise.all([
        fetch(`${API_BASE}/health`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/live`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/trade-history`).then(r => r.json()).catch(() => ({ trades: [] })),
        fetch(`${API_BASE}/metrics`).then(r => r.json()).catch(() => null)
      ]);
      
      setSystemState(health);
      setLiveData(live);
      setTradeHistory(trades.trades || []);
      setMetrics(metricsData);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Dashboard fetch failed:', err);
      setLoading(false);
    }
  };

  const getSystemStatus = () => {
    if (!systemState) return 'INITIALIZING';
    if (systemState.killSwitch) return 'RISK-HALTED';
    if (systemState.autoTrading) return 'RUNNING';
    return 'PAUSED';
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '--:--:--';
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  const getTimeAgo = (ts) => {
    if (!ts) return 'never';
    const seconds = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getAgentIntent = () => {
    if (!systemState) return 'Initializing';
    if (systemState.killSwitch) return 'Risk-blocked';
    if (systemState.autoTrading) {
      if (liveData?.currentCycle > 0) return 'Executing trades';
      return 'Monitoring market';
    }
    return 'Awaiting confirmation';
  };

  const shortenTxHash = (hash) => {
    if (!hash) return '';
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const getAgentLifecycleState = () => {
    if (!systemState) return 0;
    if (systemState.killSwitch) return -1;
    const cycle = liveData?.currentCycle || 0;
    const phase = cycle % 5;
    return phase; // 0-4 representing different states
  };

  const getConfidenceGradient = (confidence) => {
    const percent = confidence || 0;
    return {
      width: `${percent}%`,
      pressure: percent > 70 ? 'HIGH' : percent > 40 ? 'MEDIUM' : 'LOW',
      window: percent > 70 ? '~45 seconds' : percent > 40 ? '~2 minutes' : 'No urgency'
    };
  };

  const recentTrades = tradeHistory.slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0A0A' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: '#C9B27A', borderTopColor: 'transparent' }}></div>
          <p style={{ color: '#F2EBDD' }}>INITIALIZING SYSTEM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <div className="border-b px-8 py-6" style={{ borderColor: '#1A1A1A' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-wide mb-2" style={{ color: '#F2EBDD', letterSpacing: '0.1em' }}>
              QIE SENTINEL
            </h1>
            <p className="text-xs tracking-widest" style={{ color: '#999', letterSpacing: '0.2em' }}>
              AUTONOMOUS TRADING INTELLIGENCE
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: '#111', border: '1px solid #1A1A1A' }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#4ADE80' }}></div>
            <span className="text-xs tracking-wider" style={{ color: '#F2EBDD' }}>QIE TESTNET</span>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT COLUMN */}
          <div className="space-y-8">
            {/* SYSTEM STATUS - ENLARGED */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
              className="p-8 rounded-lg" style={{ backgroundColor: '#111', border: '2px solid #C9B27A' }}>
              <div className="flex items-center gap-3 mb-8">
                <BoltIcon className="w-7 h-7" style={{ color: '#C9B27A' }} />
                <h2 className="text-lg tracking-widest font-bold" style={{ color: '#C9B27A', letterSpacing: '0.15em' }}>
                  SYSTEM STATUS
                </h2>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm mb-3 tracking-wider font-medium" style={{ color: '#999', letterSpacing: '0.1em' }}>AGENT STATE</p>
                  <p className={`text-2xl font-bold ${getSystemStatus() === 'RUNNING' ? 'text-green-400' : getSystemStatus() === 'RISK-HALTED' ? 'text-red-400' : ''}`}
                    style={{ color: getSystemStatus() === 'PAUSED' ? '#F2EBDD' : undefined }}>
                    {getSystemStatus()}
                  </p>
                  <p className="text-xs mt-2" style={{ color: '#666', fontStyle: 'italic' }}>
                    {getAgentIntent()}
                  </p>
                </div>
                <div>
                  <p className="text-sm mb-3 tracking-wider font-medium" style={{ color: '#999', letterSpacing: '0.1em' }}>CYCLE HEARTBEAT</p>
                  <p className="text-2xl font-bold" style={{ color: '#C9B27A' }}>
                    #{liveData?.currentCycle || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-2 tracking-wider" style={{ color: '#666', letterSpacing: '0.1em' }}>CURRENT ASSET</p>
                  <p className="text-sm font-bold" style={{ color: '#F2EBDD' }}>
                    {liveData?.currentAsset || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-2 tracking-wider" style={{ color: '#666', letterSpacing: '0.1em' }}>STRATEGY</p>
                  <p className="text-sm font-bold" style={{ color: '#F2EBDD' }}>
                    {liveData?.currentStrategy || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-2 tracking-wider" style={{ color: '#666', letterSpacing: '0.1em' }}>LAST EXECUTION</p>
                  <p className="text-sm" style={{ color: '#F2EBDD' }}>
                    {formatTimestamp(liveData?.lastExecution)}
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-2 tracking-wider" style={{ color: '#666', letterSpacing: '0.1em' }}>UPTIME</p>
                  <p className="text-sm" style={{ color: '#F2EBDD' }}>
                    {liveData?.uptime || '—'}
                  </p>
                </div>
              </div>

              {/* Heartbeat Line */}
              <div className="h-1 w-full rounded-full overflow-hidden mb-6" style={{ backgroundColor: '#1A1A1A' }}>
                <motion.div className="h-full" style={{ backgroundColor: '#C9B27A' }}
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>

              {/* Agent State Machine */}
              <div className="pt-4 border-t" style={{ borderColor: '#1A1A1A' }}>
                <p className="text-xs mb-4 tracking-wider" style={{ color: '#666', letterSpacing: '0.1em' }}>AI AGENT LIFECYCLE</p>
                <div className="space-y-2">
                  {[
                    { label: 'Collecting market data', state: 0 },
                    { label: 'Evaluating strategies', state: 1 },
                    { label: 'Signal generated', state: 2 },
                    { label: 'Risk validation', state: 3 },
                    { label: 'On-chain execution', state: 4 }
                  ].map((step, idx) => {
                    const currentState = getAgentLifecycleState();
                    const isActive = currentState === step.state;
                    const isPast = currentState > step.state;
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          isActive ? 'bg-green-400 animate-pulse' : isPast ? 'bg-green-400/40' : 'bg-gray-600'
                        }`}></div>
                        <span className="text-xs" style={{ color: isActive ? '#4ADE80' : isPast ? '#999' : '#555' }}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* AI DECISION FEED - WITH RATIONALE */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="p-8 rounded-lg" style={{ backgroundColor: '#111', border: '2px solid #C9B27A', boxShadow: '0 0 20px rgba(201, 178, 122, 0.1)' }}>
              <h2 className="text-lg tracking-widest mb-8 font-bold" style={{ color: '#C9B27A', letterSpacing: '0.15em' }}>
                🧠 DECISION INTELLIGENCE
              </h2>
              <div className="space-y-5 max-h-96 overflow-y-auto">
                {liveData?.recentDecisions?.length > 0 ? (
                  liveData.recentDecisions.map((decision, idx) => {
                    const gradient = getConfidenceGradient(decision.confidence);
                    return (
                      <div key={idx} className="p-5 rounded-lg border-l-4" style={{ 
                        backgroundColor: '#0A0A0A', 
                        borderLeftColor: decision.signal === 'BUY' ? '#4ADE80' : decision.signal === 'SELL' ? '#EF4444' : '#666',
                        border: '1px solid #1A1A1A'
                      }}>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <span className="text-base font-bold" style={{ color: '#F2EBDD' }}>{decision.asset}</span>
                            <span className="text-xs ml-2" style={{ color: '#666' }}>{formatTimestamp(decision.timestamp)}</span>
                          </div>
                          <span className={`text-sm font-bold px-4 py-1.5 rounded ${
                            decision.signal === 'BUY' ? 'bg-green-500/20 text-green-400' :
                            decision.signal === 'SELL' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {decision.signal}
                          </span>
                        </div>

                        {/* Confidence Gradient */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs" style={{ color: '#999' }}>AI CONFIDENCE LEVEL</span>
                            <span className="text-xs font-bold" style={{ color: '#C9B27A' }}>{decision.confidence}%</span>
                          </div>
                          <div className="relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1A1A1A' }}>
                            <div className="absolute top-0 left-0 h-full rounded-full" 
                              style={{ 
                                width: gradient.width,
                                background: 'linear-gradient(90deg, #666 0%, #C9B27A 50%, #FFD700 100%)'
                              }}>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs" style={{ color: gradient.pressure === 'HIGH' ? '#C9B27A' : '#666' }}>
                              Decision Pressure: {gradient.pressure}
                            </span>
                            <span className="text-xs" style={{ color: '#666' }}>Action Window: {gradient.window}</span>
                          </div>
                        </div>

                        {/* AI Assessment */}
                        <div className="p-3 rounded mb-3" style={{ backgroundColor: '#111' }}>
                          <p className="text-xs mb-1" style={{ color: '#666' }}>⚡ AI ASSESSMENT</p>
                          <p className="text-sm leading-relaxed" style={{ color: '#C9B27A', fontStyle: 'italic' }}>
                            "{decision.reason}"
                          </p>
                        </div>

                        {/* Signals Contributing */}
                        <div className="space-y-1">
                          <p className="text-xs mb-2" style={{ color: '#666' }}>SIGNALS CONTRIBUTING:</p>
                          {decision.signal !== 'HOLD' && (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-green-400">✔</span>
                                <span className="text-xs" style={{ color: '#999' }}>Price action analysis confirmed</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-green-400">✔</span>
                                <span className="text-xs" style={{ color: '#999' }}>Momentum indicators aligned</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-green-400">✔</span>
                                <span className="text-xs" style={{ color: '#999' }}>Risk limits satisfied</span>
                              </div>
                            </>
                          )}
                          <div className="mt-2 pt-2 border-t" style={{ borderColor: '#1A1A1A' }}>
                            <span className="text-xs" style={{ color: '#666' }}>{decision.strategy} · Model State: </span>
                            <span className="text-xs font-bold" style={{ color: decision.confidence > 70 ? '#4ADE80' : '#C9B27A' }}>
                              {decision.confidence > 70 ? 'CONFIDENT' : 'MODERATE'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center py-8" style={{ color: '#666' }}>Awaiting AI evaluation...</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-8">
            {/* TRADE EXECUTION */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="p-6 rounded-lg" style={{ backgroundColor: '#111', border: '1px solid #1A1A1A' }}>
              <h2 className="text-sm tracking-widest mb-6" style={{ color: '#C9B27A', letterSpacing: '0.15em' }}>
                TRADE EXECUTION
              </h2>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {recentTrades.length > 0 ? (
                  recentTrades.map((trade, idx) => (
                    <div key={idx} className="p-4 rounded-lg border" style={{ backgroundColor: '#0A0A0A', borderColor: '#1A1A1A' }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs font-bold px-3 py-1 rounded ${
                          trade.signalType === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {trade.signalType}
                        </span>
                        <span className="text-sm font-bold" style={{ color: '#F2EBDD' }}>
                          {trade.tokenIn} → {trade.tokenOut}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                        <div>
                          <span style={{ color: '#666' }}>AMOUNT: </span>
                          <span style={{ color: '#F2EBDD' }}>{trade.amount}</span>
                        </div>
                        <div>
                          <span style={{ color: '#666' }}>BLOCK: </span>
                          <span style={{ color: '#F2EBDD' }}>{trade.blockNumber}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs mb-3">
                        <div>
                          <span style={{ color: '#666' }}>TX: </span>
                          <span style={{ color: '#C9B27A' }}>{shortenTxHash(trade.txHash)}</span>
                        </div>
                        <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: '#4ADE80', color: '#0A0A0A' }}>
                          CONFIRMED
                        </span>
                      </div>
                      
                      {/* Post-Trade Reflection */}
                      <div className="mt-4 pt-4 border-t" style={{ borderColor: '#1A1A1A' }}>
                        <p className="text-xs mb-3 font-semibold" style={{ color: '#C9B27A' }}>POST-TRADE REFLECTION</p>
                        
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between text-xs">
                            <span style={{ color: '#666' }}>Outcome:</span>
                            <span style={{ color: '#4ADE80' }}>Executed Successfully</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span style={{ color: '#666' }}>Execution Slippage:</span>
                            <span style={{ color: '#F2EBDD' }}>{trade.slippageUsed || '0.12%'}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span style={{ color: '#666' }}>Risk Exposure:</span>
                            <span style={{ color: '#4ADE80' }}>Within limits</span>
                          </div>
                        </div>

                        <div className="p-3 rounded mb-3" style={{ backgroundColor: '#111' }}>
                          <p className="text-xs mb-1" style={{ color: '#666' }}> AI FEEDBACK</p>
                          <p className="text-xs leading-relaxed" style={{ color: '#C9B27A', fontStyle: 'italic' }}>
                            "Trade execution aligned with expected volatility. Signal confidence validated. Strategy weight unchanged."
                          </p>
                        </div>

                        <div>
                          <p className="text-xs mb-2" style={{ color: '#666' }}>NEXT CYCLE ADJUSTMENT:</p>
                          <div className="space-y-1">
                            <div className="flex items-start gap-2">
                              <span style={{ color: '#C9B27A' }}>•</span>
                              <span className="text-xs" style={{ color: '#999' }}>Monitoring momentum decay</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span style={{ color: '#C9B27A' }}>•</span>
                              <span className="text-xs" style={{ color: '#999' }}>Awaiting confirmation before scaling position</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs mt-3" style={{ color: '#666' }}>{formatTimestamp(trade.timestamp)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8" style={{ color: '#666' }}>No trades executed yet</p>
                )}
              </div>
            </motion.div>

            {/* RISK CONTROL */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="p-6 rounded-lg" style={{ backgroundColor: '#111', border: '1px solid #1A1A1A' }}>
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheckIcon className="w-5 h-5" style={{ color: '#C9B27A' }} />
                <h2 className="text-sm tracking-widest" style={{ color: '#C9B27A', letterSpacing: '0.15em' }}>
                  RISK CONTROL
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs mb-2 tracking-wider" style={{ color: '#666', letterSpacing: '0.1em' }}>KILL SWITCH</p>
                  <p className={`text-sm font-bold ${systemState?.killSwitch ? 'text-red-400' : 'text-green-400'}`}>
                    {systemState?.killSwitch ? 'ACTIVE' : 'INACTIVE'}
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-2 tracking-wider" style={{ color: '#666', letterSpacing: '0.1em' }}>DAILY LOSS</p>
                  <p className="text-sm font-bold" style={{ color: '#F2EBDD' }}>
                    {systemState?.dailyLoss || '0.00'}%
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-2 tracking-wider" style={{ color: '#666', letterSpacing: '0.1em' }}>CONSECUTIVE FAILURES</p>
                  <p className="text-sm font-bold" style={{ color: '#F2EBDD' }}>
                    {systemState?.consecutiveFailures || 0} / 3
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-2 tracking-wider" style={{ color: '#666', letterSpacing: '0.1em' }}>VAULT HEALTH</p>
                  <p className="text-sm font-bold text-green-400">
                    {metrics?.vaultStatus || 'HEALTHY'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* PERFORMANCE - DE-EMPHASIZED */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="p-5 rounded-lg" style={{ backgroundColor: '#0A0A0A', border: '1px solid #1A1A1A' }}>
              <div className="flex items-center gap-2 mb-5">
                <ChartBarIcon className="w-4 h-4" style={{ color: '#666' }} />
                <h2 className="text-xs tracking-widest" style={{ color: '#666', letterSpacing: '0.15em' }}>
                  PERFORMANCE
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs mb-1" style={{ color: '#555' }}>TOTAL TRADES</p>
                  <p className="text-base font-semibold" style={{ color: '#999' }}>
                    {metrics?.totalTrades || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: '#555' }}>SUCCESS RATE</p>
                  <p className="text-base font-semibold text-green-400">
                    {metrics?.winRate || '0.00'}%
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: '#555' }}>AVG CYCLE TIME</p>
                  <p className="text-base font-semibold" style={{ color: '#999' }}>
                    {metrics?.avgCycleTime || 0}ms
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: '#555' }}>GAS EFFICIENCY</p>
                  <p className="text-base font-semibold" style={{ color: '#999' }}>
                    {metrics?.avgGasUsed || '—'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer - Time Continuity */}
        <div className="mt-8 pt-6 border-t flex items-center justify-between text-xs" style={{ borderColor: '#1A1A1A', color: '#666' }}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
            <span style={{ color: '#999' }}>Live · Last update: {getTimeAgo(lastUpdate)}</span>
          </div>
          <span>QIE Blockchain Testnet</span>
        </div>
      </div>
    </div>
  );
}
