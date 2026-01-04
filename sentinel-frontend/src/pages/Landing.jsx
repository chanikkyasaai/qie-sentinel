import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black">
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="border-b content-wrapper"
        style={{ borderColor: '#202020' }}
      >
        <div className="container mx-auto px-4 md:px-8 py-6 md:py-10">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base md:text-xl tracking-wider" style={{ color: '#F2EBDD' }}>QIE SENTINEL</h2>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-secondary text-xs px-6 md:px-10"
            >
              Launch Platform
            </button>
          </div>
        </div>
      </motion.nav>

      <section className="container mx-auto px-4 md:px-8 content-wrapper" style={{ paddingTop: 'clamp(60px, 10vw, 120px)', paddingBottom: 'clamp(60px, 10vw, 120px)' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="max-w-6xl mx-auto text-center"
        >
          <div className="mb-8 md:mb-12">
            <p className="label-gold mb-4">AUTONOMOUS TRADING INTELLIGENCE</p>
            <div className="w-12 md:w-16 h-px mx-auto" style={{ background: 'linear-gradient(90deg, transparent 0%, #C9B27A 50%, transparent 100%)' }}></div>
          </div>

          <h1 className="font-bold tracking-wider leading-none mb-12 md:mb-16 px-4" style={{
            fontSize: 'clamp(40px, 10vw, 140px)',
            color: '#FAFAFA',
            letterSpacing: 'clamp(0.04em, 1vw, 0.08em)'
          }}>
            QIE SENTINEL
          </h1>

          <p className="serif mb-12 md:mb-20 px-4" style={{
            color: '#F2EBDD',
            fontSize: 'clamp(1.25rem, 3vw, 2.25rem)',
            lineHeight: '1.6',
            fontStyle: 'italic',
            maxWidth: '900px',
            margin: '0 auto clamp(40px, 8vw, 80px)'
          }}>
            Institutional Execution Speed. Long-Horizon AI Edge. Global Liquidity Engine.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 mb-16 md:mb-32 px-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary w-full sm:w-auto"
            >
              Access Platform
            </button>
            <button className="btn-secondary w-full sm:w-auto">
              Documentation
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-20 max-w-5xl mx-auto"
          >
            <div className="text-center py-8 md:py-0">
              <p
                className="font-bold tracking-tight mb-3 md:mb-4"
                style={{
                  fontSize: 'clamp(3rem, 8vw, 5rem)',
                  color: '#FAFAFA',
                  lineHeight: '1'
                }}
              >
                2.5M
              </p>
              <p className="label-gold">TOTAL VOLUME</p>
            </div>
            <div className="text-center border-y md:border-y-0 md:border-x py-8 md:py-0" style={{ borderColor: '#202020' }}>
              <p
                className="font-bold tracking-tight mb-3 md:mb-4"
                style={{
                  fontSize: 'clamp(3rem, 8vw, 5rem)',
                  color: '#FAFAFA',
                  lineHeight: '1'
                }}
              >
                10K
              </p>
              <p className="label-gold">TRADES EXECUTED</p>
            </div>
            <div className="text-center py-8 md:py-0">
              <p
                className="font-bold tracking-tight mb-3 md:mb-4"
                style={{
                  fontSize: 'clamp(3rem, 8vw, 5rem)',
                  color: '#FAFAFA',
                  lineHeight: '1'
                }}
              >
                72%
              </p>
              <p className="label-gold">SUCCESS RATE</p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <div className="gold-divider"></div>

      <section style={{ paddingTop: 'clamp(60px, 10vw, 120px)', paddingBottom: 'clamp(60px, 10vw, 120px)' }}>
        <div className="container mx-auto px-4 md:px-8 content-wrapper">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="max-w-6xl mx-auto"
          >
            <h2 className="font-bold tracking-tight text-center mb-12 md:mb-24 px-4" style={{
              fontSize: 'clamp(2.5rem, 7vw, 6rem)',
              color: '#FAFAFA'
            }}>
              CORE CAPABILITIES
            </h2>

            <div className="grid md:grid-cols-2 gap-6 md:gap-x-24 md:gap-y-20">
              <div className="card-luxury double-border p-8 md:p-12 content-wrapper">
                <h3
                  className="font-bold tracking-tight mb-4 md:mb-6"
                  style={{
                    color: '#F2EBDD',
                    fontSize: 'clamp(1.25rem, 3vw, 1.875rem)'
                  }}
                >
                  AI-POWERED INTELLIGENCE
                </h3>
                <div className="w-10 md:w-12 h-px mb-4 md:mb-6" style={{ backgroundColor: '#C9B27A' }}></div>
                <p className="text-sm md:text-base" style={{ color: '#9B9B9B', lineHeight: '1.8' }}>
                  Advanced machine learning algorithms analyze market patterns in real-time, executing trades with institutional-grade precision and quantitative rigor.
                </p>
              </div>

              <div className="card-luxury double-border p-8 md:p-12 content-wrapper">
                <h3
                  className="font-bold tracking-tight mb-4 md:mb-6"
                  style={{
                    color: '#F2EBDD',
                    fontSize: 'clamp(1.25rem, 3vw, 1.875rem)'
                  }}
                >
                  MILLISECOND EXECUTION
                </h3>
                <div className="w-10 md:w-12 h-px mb-4 md:mb-6" style={{ backgroundColor: '#C9B27A' }}></div>
                <p className="text-sm md:text-base" style={{ color: '#9B9B9B', lineHeight: '1.8' }}>
                  Ultra-low latency infrastructure ensures optimal trade execution across multiple blockchain networks with sub-second settlement finality.
                </p>
              </div>

              <div className="card-luxury double-border p-8 md:p-12 content-wrapper">
                <h3
                  className="font-bold tracking-tight mb-4 md:mb-6"
                  style={{
                    color: '#F2EBDD',
                    fontSize: 'clamp(1.25rem, 3vw, 1.875rem)'
                  }}
                >
                  ENTERPRISE SECURITY
                </h3>
                <div className="w-10 md:w-12 h-px mb-4 md:mb-6" style={{ backgroundColor: '#C9B27A' }}></div>
                <p className="text-sm md:text-base" style={{ color: '#9B9B9B', lineHeight: '1.8' }}>
                  Bank-grade encryption and multi-layer security protocols protect your assets with institutional-level custody and operational safeguards.
                </p>
              </div>

              <div className="card-luxury double-border p-8 md:p-12 content-wrapper">
                <h3
                  className="font-bold tracking-tight mb-4 md:mb-6"
                  style={{
                    color: '#F2EBDD',
                    fontSize: 'clamp(1.25rem, 3vw, 1.875rem)'
                  }}
                >
                  REAL-TIME ANALYTICS
                </h3>
                <div className="w-10 md:w-12 h-px mb-4 md:mb-6" style={{ backgroundColor: '#C9B27A' }}></div>
                <p className="text-sm md:text-base" style={{ color: '#9B9B9B', lineHeight: '1.8' }}>
                  Comprehensive performance metrics and live monitoring provide complete transparency into every trading decision and risk parameter.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="gold-divider"></div>

      <section style={{ paddingTop: 'clamp(60px, 10vw, 120px)', paddingBottom: 'clamp(60px, 10vw, 120px)' }}>
        <div className="container mx-auto px-4 md:px-8 content-wrapper">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="font-bold tracking-tight mb-8 md:mb-12 px-4" style={{
              fontSize: 'clamp(2.5rem, 7vw, 6rem)',
              color: '#FAFAFA'
            }}>
              START TRADING
            </h2>
            <p className="serif mb-12 md:mb-16 px-4" style={{
              color: '#F2EBDD',
              fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)',
              lineHeight: '1.8',
              fontStyle: 'italic'
            }}>
              Institutional-grade cryptocurrency trading infrastructure for sophisticated investors seeking alpha generation and portfolio optimization.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary w-full sm:w-auto"
            >
              Access Platform
            </button>
          </motion.div>
        </div>
      </section>

      <footer className="border-t py-16 content-wrapper" style={{ borderColor: '#202020' }}>
        <div className="container mx-auto px-8">
          <div className="text-center">
            <p className="label-gold">
              © 2025 QIE SENTINEL. ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
