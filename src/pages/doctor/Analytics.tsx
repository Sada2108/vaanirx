import { Asset } from '@/components/Asset';

export default function DoctorAnalytics() {
  const wave = [5, 9, 6, 16, 25, 12, 21, 33, 20, 11, 27, 36, 18, 30, 21, 9, 18, 28, 12, 33, 20, 14, 23, 8, 17, 29, 12, 7, 17, 23, 10, 6, 11, 6, 3];

  return (
    <div>
      <section className="content">
        <div className="welcome">
          <div>
            <div className="eyebrow"><span className="role-dot" /> ANALYTICS</div>
            <h1>Practice Analytics</h1>
            <p>Weekly consultations and language distribution.</p>
          </div>
        </div>

        <div className="analytics-grid">
          <section className="card weekly">
            <div className="chart-heading">
              <div><h2>Weekly consultations</h2><strong>148</strong><span>↗ 18.4%</span><small>vs. last week</small></div>
              <button>This week⌄</button>
            </div>
            <div className="chart">
              <span className="axis a40">40</span><span className="axis a20">20</span><span className="axis a0">0</span>
              <div className="gridline g1" /><div className="gridline g2" /><div className="gridline g3" />
              <Asset name="a3865.svg" className="chart-area" />
              <Asset name="ed80e.svg" className="chart-line" />
              <div className="day-labels">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}</div>
            </div>
          </section>
          <section className="card language-card">
            <h2>Language distribution</h2>
            <p>Every patient. Their own language.</p>
            <div className="language-body">
              <div className="donut"><span><b>08</b><small>languages</small></span></div>
              <div className="legend">
                {[['Hindi', '42%'], ['English', '28%'], ['Tamil', '18%'], ['Other', '12%']].map(([name, percent], index) => (
                  <div key={name}><i className={`c${index}`} /><span>{name}</span><strong>{percent}</strong></div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="quick-actions">
          <span>Waveform sample</span>
          <div className="waveform">
            {wave.map((height, index) => <i key={index} style={{ height }} />)}
          </div>
          <small>Live audio levels during consultation</small>
        </div>
      </section>
    </div>
  );
}
