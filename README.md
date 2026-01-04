# QIE Sentinel

**Autonomous AI Trading Intelligence on QIE Blockchain**

---

## Overview

**QIE Sentinel** is a fully autonomous, on-chain trading agent that combines **AI-driven decision intelligence**, **oracle-validated execution**, and **risk-governed capital management** on the QIE blockchain.

It is not a simulator, backtest, or manual bot.  
QIE Sentinel runs continuously, evaluates live market conditions, makes independent decisions, and executes real on-chain transactions with full transparency and control.

Built for the **QIE Blockchain Hackathon 2025**, this project demonstrates how autonomous AI agents can safely operate capital on decentralized infrastructure.

---

## Why QIE Sentinel Matters

- **AI × Blockchain (Core Theme)**  
  An autonomous agent that reasons, decides, executes, and self-evaluates on-chain.

- **DeFi Without Borders**  
  Continuous, permissionless trading without centralized control.

- **Oracles & Real-World Data**  
  Oracle-validated pricing ensures fair execution and prevents manipulation.

- **Performance on QIE**  
  Fast finality and near-zero fees enable high-frequency autonomous operation.

---

## System Architecture (High-Level)

**Four-layer autonomous architecture:**

1. **AI Decision Engine**  
   Multi-signal strategy evaluation with confidence scoring

2. **Risk & Governance Layer**  
   Pre-trade validation, exposure limits, kill-switch control

3. **On-Chain Execution Layer**  
   Smart contracts executing validated trades via oracle prices

4. **Frontend Control Plane**  
   Real-time transparency into agent behavior and decisions

---

## Live System Screenshots

> All screenshots are from a **running system on QIE Testnet**  
> showing live cycles, signals, executions, and risk enforcement.

---

### 1. System Status & Agent Lifecycle

![System Status](assets/screenshots/system-status.png)

**What this shows:**
- Autonomous agent is **RUNNING**
- Continuous cycle heartbeat (live trading loop)
- Current asset, strategy, uptime
- Internal AI lifecycle stages:
  - Market data collection  
  - Strategy evaluation  
  - Signal generation  
  - Risk validation  
  - On-chain execution  

This confirms the agent is **actively operating**, not idle or simulated.

---

### 2. Decision Intelligence (AI Reasoning)

![Decision Intelligence](assets/screenshots/decision-intelligence.png)

**What this shows:**
- AI-generated BUY/SELL signals
- Confidence scoring (e.g. 75%)
- Decision pressure indicator
- Contributing signals:
  - Price action confirmation
  - Momentum alignment
  - Risk limits satisfied

This is the **core AI layer**, making decisions independently — not hardcoded rules.

---

### 3. Trade Execution & Post-Trade Reflection

![Trade Execution](assets/screenshots/trade-execution.png)

**What this shows:**
- On-chain trade execution details
- Asset pair, amount, block number
- Transaction hash
- Oracle-validated execution status
- **Post-trade AI reflection**, including:
  - Execution outcome
  - Slippage validation
  - Strategy adjustment notes

This demonstrates **learning-aware execution**, not blind trading.

---

### 4. Risk Control & Governance

![Risk Control](assets/screenshots/risk-control.png)

**What this shows:**
- Kill-switch state (Inactive / Armed)
- Daily loss tracking
- Consecutive failure counter
- Vault health status

Every trade passes through this layer before execution.  
If constraints are violated, the system **halts automatically**.

---

### 5. Performance & System Metrics

![Performance Metrics](assets/screenshots/performance.png)

**What this shows:**
- Total trades executed
- Average cycle time
- Success rate tracking
- Gas efficiency indicators

This provides **operational transparency**, critical for autonomous systems.

---

## Smart Contract Layer

- **Vault Contract**
  - Manages multi-asset capital
  - Enforces balance and exposure constraints

- **Executor Contract**
  - Executes trades on-chain
  - Validates oracle price data before execution

All contracts are deployed on **QIE Testnet** and interact directly with the backend agent.

---

## Backend Engine

- **Node.js Orchestrator**
  - Trading cycle control
  - Pre-trade validation
  - Risk enforcement
  - On-chain interaction

- **Python AI Module**
  - Signal generation
  - Confidence scoring
  - Strategy evaluation

- **Risk Manager**
  - Kill-switch logic
  - Exposure limits
  - Failure handling

---

## Frontend Control Plane

The frontend is **not a marketing UI**.  
It is a **monitoring and governance console** designed for:

- Real-time visibility into AI decisions
- Trust through transparency
- Debugging and validation of autonomous behavior

---

## Repository Structure

