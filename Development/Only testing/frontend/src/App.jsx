import { useState, useEffect, useRef, useCallback } from 'react'
import './index.css'
import DAXConsole from './DAXConsole'
import ChatBot from './ChatBot'
import ZoneModel3D from './ZoneModel3D'

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/blocks/sidebar"
import { AppSidebar } from "@/components/blocks/whatsapp-sidebar"

// ─── Intro Video Component ──────────────────────────────────────
function IntroVideo({ onComplete }) {
  const videoRef = useRef(null);

  return (
    <div className="intro-container">
      <video
        ref={videoRef}
        autoPlay
        className="intro-video"
        onEnded={onComplete}
      >
        <source src="/intro_video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <button className="skip-btn" onClick={onComplete}>
        Skip Intro
      </button>
    </div>
  );
}

const API_BASE = 'http://127.0.0.1:8000'
const WS_BASE = 'ws://127.0.0.1:8000'

const ZONE_NAMES = [
  'No Leak / Healthy',
  'Zone 1 - Intake',
  'Zone 2 - Charge Air',
  'Zone 3 - CAC/Manifold',
  'Zone 4 - Exhaust Manifold',
  'Zone 5 - DPF',
  'Zone 6 - SCR/Tailpipe',
]

const EF_CHANNELS = ['MAF', 'MAP_boost', 'MAP_cac_out', 'T_cac_out', 'T_exh', 'dP_dpf']

const ZONE_DETAIL_INFO = {
  1: {
    title: 'Zone 1 - Intake',
    subtitle: 'Airflow Meter → Compressor Inlet',
    description: 'The intake zone covers the air path from the mass airflow meter through ducting to the turbocharger compressor inlet. Leaks here cause unmetered air ingestion, MAF under-reading, and reduced boost pressure across the entire air system.',
    affected_sensors: ['MAF', 'MAP_intake', 'MAP_boost'],
    inspection_steps: [
      'Inspect intake ducting between airflow meter and compressor inlet for cracks or loose clamps',
      'Check all silicone couplers and hose clamps on the intake path',
      'Inspect the MAF sensor housing for cracks or loose mounting',
      'Verify intake pre-cleaner and air filter housing seals are intact',
      'Check turbocharger compressor inlet elbow for hairline cracks',
    ],
    recommendation: {
      method: 'Acoustic Leak Detection',
      priority: 'High',
      actions: [
        'Perform acoustic scan along intake ducting from MAF sensor housing to turbo compressor inlet while engine is under load',
        'Apply soapy water solution to all coupler joints and hose clamps — watch for steady bubbling that confirms active leak points',
        'Temporarily seal suspected sections one at a time and monitor MAF sensor reading recovery in real time',
        'Record MAF and MAP_intake values before and after each isolation to pinpoint the exact leak source',
      ],
      follow_up: 'After repair, re-run acoustic analysis and verify MAF reading returns to within ±3% of baseline. Confirm boost pressure recovers to spec and log repair in C18 maintenance record.',
    },
    icon: '🌬️',
    colorVar: 'var(--accent-yellow)',
  },
  2: {
    title: 'Zone 2 - Charge Air',
    subtitle: 'Compressor Outlet → CAC Inlet',
    description: 'The charge air zone spans the high-pressure boost pipe from the turbocharger compressor outlet to the charge air cooler inlet. Boost pressure leaks here reduce intercooler efficiency and engine output significantly.',
    affected_sensors: ['MAP_boost', 'T_boost', 'MAP_cac_in'],
    inspection_steps: [
      'Inspect charge pipe from turbo compressor to CAC inlet for cracks or pinholes',
      'Check all V-band clamps and coupler connections on charge pipes',
      'Inspect the charge air cooler inlet tank for cracks or weld failures',
      'Verify all boost pressure test ports are securely capped',
      'Inspect intercooler end-tank welds under boost pressure with soapy water',
    ],
    recommendation: {
      method: 'Boost Pressure Test',
      priority: 'High',
      actions: [
        'Pressurize the charge air system to rated boost (200 kPa) using a regulated air source on a cold engine and hold for 30 seconds',
        'Inspect charge pipe welds, V-band clamps, and coupler connections from compressor outlet to CAC inlet using soapy water',
        'Check intercooler inlet end-tank welds and casting seams for bubble formation under test pressure',
        'Verify all boost test port caps and MAP sensor fittings are tight — these are common overlooked leak paths',
      ],
      follow_up: 'Post-repair, perform a road test under full load and monitor MAP_boost for stable, consistent pressure matching pre-fault baseline. Update boost system service record.',
    },
    icon: '💨',
    colorVar: 'var(--accent-yellow)',
  },
  3: {
    title: 'Zone 3 - CAC/Manifold',
    subtitle: 'CAC Outlet → Intake Manifold',
    description: 'This zone covers the post-intercooler path from CAC outlet through charge pipes to the intake manifold. Leaks here cause significant power loss, elevated exhaust temperatures, and high fuel consumption.',
    affected_sensors: ['MAP_cac_out', 'T_cac_out', 'MAP_intake'],
    inspection_steps: [
      'Inspect CAC outlet pipe and coupler connections to the intake manifold',
      'Check intake manifold gaskets and mounting bolts for correct torque',
      'Inspect CAC outlet tank end caps for cracks or separation',
      'Check all charge pipe clamps from CAC outlet to intake manifold',
      'Perform a full boost leak test on the intake system from compressor to manifold',
    ],
    recommendation: {
      method: 'Pressure & Acoustic Test',
      priority: 'High',
      actions: [
        'Conduct a boost leak test from CAC outlet to intake manifold at 150 kPa — isolate this segment by blocking the compressor outlet',
        'Inspect CAC outlet coupler, all charge-to-manifold pipe joints, and clamp positions for signs of blow-by or soot deposits',
        'Check intake manifold gaskets for carbon tracking; torque all manifold bolts to Cat C18 spec (35 Nm) in the correct sequence',
        'Compare MAP_cac_out against MAP_boost live data — a gap exceeding 8 kPa under load confirms a post-CAC leak',
      ],
      follow_up: 'Clear all fault codes, run a full DTC scan after repair, and verify the boost system holds test pressure for 30 seconds minimum. Confirm T_cac_out drops to within normal operating range.',
    },
    icon: '🔧',
    colorVar: 'var(--accent-yellow)',
  },
  4: {
    title: 'Zone 4 - Exhaust Manifold',
    subtitle: 'Exhaust Ports → Turbine Inlet',
    description: 'Covers the hot exhaust gas path from the engine exhaust ports through the exhaust manifold to the turbocharger turbine inlet. Exhaust leaks reduce turbine energy, increase underhood temperatures, and risk EGR system contamination.',
    affected_sensors: ['T_exh_manifold', 'MAP_boost'],
    inspection_steps: [
      'Inspect exhaust manifold gaskets — look for carbon tracking or blow-by marks around ports',
      'Check exhaust manifold mounting bolts for proper torque (Cat spec: 55 Nm)',
      'Inspect V-band clamp at turbine inlet for cracks or loose fasteners',
      'Check turbocharger turbine housing bolts and gasket condition',
      'Inspect exhaust crossover pipes and flanges for thermal cracking',
    ],
    recommendation: {
      method: 'Thermal & Visual Inspection',
      priority: 'Immediate',
      actions: [
        'Perform a thermal imaging scan of the exhaust manifold and turbine inlet during engine warm-up — hot spots above 650°C indicate active gas escape',
        'Inspect all manifold gaskets for carbon blow-by traces; apply Cat Dye Penetrant if visual inspection is inconclusive on hairline cracks',
        'Torque all exhaust manifold bolts to Cat C18 spec (55 Nm) in the correct crossing sequence; replace any stretched or seized fasteners',
        'Inspect the turbocharger turbine inlet V-band clamp and housing bolts — a loose V-band is a common high-energy leak point on C18 engines',
      ],
      follow_up: 'After repair, allow engine to reach full operating temperature and re-run thermal scan. Confirm exhaust temperatures normalize and EGR delta pressure returns to baseline within two drive cycles.',
    },
    icon: '🔥',
    colorVar: 'var(--accent-red)',
  },
  5: {
    title: 'Zone 5 - DPF',
    subtitle: 'Diesel Particulate Filter Assembly',
    description: 'The aftertreatment zone covers the diesel oxidation catalyst (DOC) and diesel particulate filter (DPF). A drop in differential pressure across the DPF indicates bypass leaks, filter damage, or housing seal failure.',
    affected_sensors: ['dP_dpf', 'T_dpf_in', 'T_dpf_out'],
    inspection_steps: [
      'Check DPF differential pressure sensor hoses and fittings for cracks or disconnections',
      'Inspect DPF mounting V-bands and inlet/outlet gaskets for exhaust blow-by',
      'Check DOC-to-DPF coupling clamp for tightness and gasket condition',
      'Verify DPF inlet and outlet temperature sensors are reading expected values',
      'Inspect aftertreatment housing welds and mounting brackets for cracks',
    ],
    recommendation: {
      method: 'Differential Pressure & Visual Audit',
      priority: 'High',
      actions: [
        'Inspect dP_dpf sensor hoses and pressure port fittings for cracks, kinks, or disconnection — a broken hose alone will cause false low-dP readings',
        'Check DPF inlet and outlet V-band clamps and gasket interfaces for visible soot blow-by marks, which confirm exhaust is bypassing the filter',
        'Inspect the DOC-to-DPF coupling clamp interface under a thermal camera during warm-up — a cool joint relative to adjacent housing confirms bypass leakage',
        'Verify the temperature differential between T_dpf_in and T_dpf_out falls within expected range (±40°C at rated load); abnormal delta indicates flow disruption',
      ],
      follow_up: 'After repair, initiate a forced DPF active regeneration cycle and monitor dP_dpf during regen. Confirm differential pressure returns to baseline within two regen cycles and soot load % drops to normal.',
    },
    icon: '🏭',
    colorVar: 'var(--accent-cyan)',
  },
  6: {
    title: 'Zone 6 - SCR/Tailpipe',
    subtitle: 'SCR Catalyst → Exhaust Outlet',
    description: 'Covers the selective catalytic reduction (SCR) system and tailpipe. Leaks here reduce SCR catalyst efficiency, can cause DEF injection anomalies, and alter exhaust backpressure readings used by the ECM.',
    affected_sensors: ['T_dpf_out'],
    inspection_steps: [
      'Inspect SCR inlet and outlet V-band clamps and gaskets for exhaust leaks',
      'Check DEF injection nozzle housing seals and dosing module connections',
      'Inspect tailpipe flex joint and end-pipe mounting clamps',
      'Check exhaust silencer connections and end-pipe seals',
      'Verify no aftertreatment bypass valve is partially open or stuck',
    ],
    recommendation: {
      method: 'Acoustic Analysis + DEF System Audit',
      priority: 'High',
      actions: [
        'Perform an acoustic scan along the SCR housing, inlet and outlet V-band clamps, and expansion joints under normal operating load',
        'Inspect DEF injection nozzle housing seals and dosing module mounting — crystallized DEF deposits around fittings indicate seal failure',
        'Check tailpipe flex joint, end-pipe mounting clamps, and exhaust silencer connections for mechanical looseness or cracked welds',
        'Verify no aftertreatment bypass valve is partially open, stuck, or leaking past the valve seat — even partial bypass drastically reduces SCR conversion efficiency',
      ],
      follow_up: 'After repair, clear all SCR-related fault codes and run two full drive cycles. Verify NOx sensor readings return to acceptable levels and DEF consumption rate normalizes. Update aftertreatment service interval log.',
    },
    icon: '🌿',
    colorVar: 'var(--accent-cyan)',
  },
}

const SENSOR_UNITS = {
  RPM: 'rpm', MAF: 'kg/h', MAP_intake: 'kPa', MAP_boost: 'kPa',
  MAP_cac_in: 'kPa', MAP_cac_out: 'kPa', T_intake: '°C', T_boost: '°C',
  T_cac_out: '°C', T_exh_manifold: '°C', T_dpf_in: '°C', T_dpf_out: '°C',
  fuel_qty: 'mg/str', dP_dpf: 'kPa',
}

// ─── Sidebar Component ──────────────────────────────────────────
function Sidebar({ activePage, setActivePage, isConnected }) {
  const navItems = [
    { id: 'dashboard', icon: '', label: 'Dashboard' },
    { id: 'engine', icon: '', label: 'Analysis' },
    { id: 'history', icon: '', label: 'History' },
    { id: 'dax', icon: '', label: 'Sensor Hub' },
    { id: 'digital-twin', icon: '', label: 'Digital Twin' },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">L</div>
          <div>
            <h1>LeakSense Twin</h1>
            <span>Cat C18 Engine Diagnostics</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="engine-badge">
          <span className="dot" style={{
            background: isConnected ? 'var(--accent-emerald)' : 'var(--accent-red)',
          }}></span>
          <span>CAT C18 • ADEM A4</span>
        </div>
      </div>
    </aside>
  )
}

// ─── Go/No-Go Indicator ─────────────────────────────────────────
function GoNoGoIndicator({ status }) {
  const isGo = status === 'GO'
  return (
    <div className={`card go-nogo-card ${isGo ? 'go-indicator' : 'nogo-indicator'}`}>
      <div className="card-header">
        <span className="card-title">Status</span>
        <span className="card-icon"></span>
      </div>
      <div className={`go-nogo-status ${isGo ? 'go' : 'nogo'}`}>
        {status}
      </div>
      <div className="go-nogo-subtitle">
        {isGo ? 'Engine Healthy' : 'Leak Detected'}
      </div>
    </div>
  )
}

// ─── Confidence Ring ─────────────────────────────────────────────
function ConfidenceRing({ confidence, leakDetected }) {
  const pct = Math.round(confidence * 100)
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  let color = 'var(--accent-emerald)'
  if (confidence > 0.7) color = 'var(--accent-red)'
  else if (confidence > 0.4) color = 'var(--accent-yellow)'

  return (
    <div className="card confidence-card">
      <div className="card-header">
        <span className="card-title">Confidence</span>
        <span className="card-icon"></span>
      </div>
      <div className="confidence-ring">
        <svg viewBox="0 0 128 128">
          <circle className="ring-bg" cx="64" cy="64" r={radius} />
          <circle
            className="ring-fill"
            cx="64" cy="64" r={radius}
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="confidence-value" style={{ color }}>{pct}%</div>
      </div>
      <div className="confidence-label">
        {leakDetected ? 'Anomaly Detected' : 'Normal Operation'}
      </div>
    </div>
  )
}

// ─── Leak Alert Card ─────────────────────────────────────────────
function LeakAlertCard({ data, onInspect }) {
  const getSeverityClass = (sev) => {
    const map = { NONE: 'severity-none', SMALL: 'severity-small', MEDIUM: 'severity-medium', CRITICAL: 'severity-critical' }
    return map[sev] || 'severity-none'
  }

  return (
    <div className="card alert-card">
      <div className="card-header">
        <span className="card-title">Leak Analysis</span>
        <span className="card-icon"></span>
      </div>
      <div className="alert-content">
        <div className="alert-zone">{data.suspected_zone || ZONE_NAMES[0]}</div>
        <div>
          <span className={`alert-severity ${getSeverityClass(data.severity)}`}>
            {data.severity || 'NONE'}
          </span>
        </div>
        {data.flow_loss_pct > 0 && (
          <div className="alert-flow-loss">
            Estimated Flow Loss: <strong>{data.flow_loss_pct?.toFixed(1)}%</strong>
          </div>
        )}
        <div className="alert-action">
          {data.recommended_action || 'System operating within normal parameters.'}
        </div>
        {data.leak_detected && onInspect && (
          <button
            onClick={onInspect}
            style={{
              marginTop: '10px', width: '100%',
              padding: '8px 12px', borderRadius: '6px',
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)',
              color: 'var(--accent-red)', fontSize: '0.8rem', fontWeight: '700',
              cursor: 'pointer', transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
          >
            Inspect Zone →
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Sensor Grid Card ────────────────────────────────────────────
function SensorGrid({ sensors }) {
  const entries = Object.entries(sensors || {})
  return (
    <div className="card sensors-card">
      <div className="card-header">
        <span className="card-title">Live Sensors</span>
        <span className="card-icon"></span>
      </div>
      <div className="sensor-grid">
        {entries.map(([key, val]) => (
          <div className="sensor-item" key={key}>
            <div className="sensor-label">{key.replace(/_/g, ' ')}</div>
            <div className="sensor-value">
              {typeof val === 'number' ? val.toFixed(1) : val}
              <span className="sensor-unit">{SENSOR_UNITS[key] || ''}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Energy Field Heatmap ────────────────────────────────────────
function EnergyFieldHeatmap({ efData }) {
  const matrix = efData?.matrix || Array(6).fill(Array(6).fill(0))

  const getColor = (val) => {
    if (val === 0) return '#316237'
    const v = Math.max(-1, Math.min(1, val))
    if (v >= 0) {
      const r = Math.round(255 * v)
      const g = Math.round(100 * (1 - v))
      const b = Math.round(50 * (1 - v))
      return `rgb(${r}, ${g}, ${b})`
    } else {
      const r = Math.round(255 * (1 + v))
      const g = Math.round(192 * (1 + v))
      const b = Math.round(0 * (1 + v))
      return `rgb(${r}, ${g}, ${b})`
    }
  }

  return (
    <div className="card heatmap-card">
      <div className="card-header">
        <span className="card-title">Energy Field</span>
        <span className="card-icon"></span>
      </div>
      <div className="heatmap-container">
        {matrix.map((row, i) => (
          <div className="heatmap-row" key={i}>
            <div className="heatmap-label">{EF_CHANNELS[i]}</div>
            {(Array.isArray(row) ? row : []).map((val, j) => (
              <div
                className="heatmap-cell"
                key={j}
                style={{ background: getColor(val || 0) }}
              >
                {typeof val === 'number' ? val.toFixed(2) : '0'}
              </div>
            ))}
          </div>
        ))}
        <div className="heatmap-col-labels">
          {EF_CHANNELS.map(ch => (
            <div className="heatmap-col-label" key={ch}>{ch}</div>
          ))}
        </div>
      </div>
      <div className="ef-metrics">
        <div className="ef-metric">
          <div className="ef-metric-value" style={{
            color: (efData?.global_deviation || 0) > 3 ? 'var(--accent-red)' : 'var(--accent-emerald)'
          }}>
            {(efData?.global_deviation || 0).toFixed(2)}
          </div>
          <div className="ef-metric-label">Global Deviation</div>
        </div>
        <div className="ef-metric">
          <div className="ef-metric-value" style={{
            color: (efData?.cosine_similarity || 1) < 0.9 ? 'var(--accent-amber)' : 'var(--accent-cyan)'
          }}>
            {(efData?.cosine_similarity || 1).toFixed(3)}
          </div>
          <div className="ef-metric-label">Cosine Similarity</div>
        </div>
        <div className="ef-metric">
          <div className="ef-metric-value" style={{ color: 'var(--accent-purple)' }}>
            {efData?.most_disrupted_sensor || 'N/A'}
          </div>
          <div className="ef-metric-label">Most Disrupted</div>
        </div>
      </div>
    </div>
  )
}

// ─── Residuals Card ──────────────────────────────────────────────
function ResidualsCard({ residuals }) {
  const entries = Object.entries(residuals || {})

  const getBarColor = (val) => {
    const abs = Math.abs(val)
    if (abs > 20) return 'var(--accent-red)'
    if (abs > 10) return 'var(--accent-yellow)'
    return 'var(--accent-yellow)'
  }

  return (
    <div className="card residuals-card">
      <div className="card-header">
        <span className="card-title">Digital Twin Residuals</span>
        <span className="card-icon"></span>
      </div>
      <div className="residuals-grid">
        {entries.map(([key, val]) => (
          <div className="residual-item" key={key}>
            <div className="residual-name">{key.replace('res_', '').replace(/_/g, ' ')}</div>
            <div className="residual-value" style={{ color: getBarColor(val) }}>
              {typeof val === 'number' ? val.toFixed(2) : val}
            </div>
            <div className="residual-bar">
              <div
                className="residual-bar-fill"
                style={{
                  width: `${Math.min(Math.abs(val || 0) * 2, 100)}%`,
                  background: getBarColor(val || 0),
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Zone Probabilities ──────────────────────────────────────────
function ZoneProbabilities({ probs }) {
  const probArray = probs || [1, 0, 0, 0, 0, 0]
  const colors = [
    'var(--accent-emerald)', 'var(--accent-yellow)', 'var(--accent-yellow)',
    'var(--accent-yellow)', 'var(--accent-yellow)', 'var(--accent-yellow)', 'var(--accent-red)'
  ]

  return (
    <div className="card zone-probs-card">
      <div className="card-header">
        <span className="card-title">Zone Probabilities</span>
        <span className="card-icon"></span>
      </div>
      <div className="zone-bars">
        {ZONE_NAMES.map((name, i) => (
          <div className="zone-bar-item" key={i}>
            <div className="zone-bar-label">{name.split(' - ')[0].trim()}</div>
            <div className="zone-bar-track">
              <div
                className="zone-bar-fill"
                style={{
                  width: `${(probArray[i] || 0) * 100}%`,
                  background: colors[i],
                }}
              />
            </div>
            <div className="zone-bar-value">{((probArray[i] || 0) * 100).toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Engine Diagram ──────────────────────────────────────────────
function EngineDiagram({ zoneIdx, leakDetected, onZoneClick }) {
  const getZoneCard = (id, name, desc) => (
    <div
      className={`engine-zone ${leakDetected && zoneIdx === id ? 'leak' : 'healthy'}`}
      onClick={() => onZoneClick && onZoneClick(id)}
      style={{ cursor: onZoneClick ? 'pointer' : 'default' }}
    >
      <div className="engine-zone-name">{name}</div>
      <div className="engine-zone-desc">{desc}</div>
    </div>
  )

  return (
    <div className="card engine-card">
      <div className="card-header">
        <span className="card-title">Cat C18 Engine — Zone Map (Click to Simulate)</span>
        <span className="card-icon"></span>
      </div>
      <div className="engine-diagram-grid">
        {/* Row 1: Zones 1 to 4 */}
        <div className="grid-cell-1">{getZoneCard(1, 'Zone 1', 'Intake - Airflow meter → Compressor')}</div>
        <div className="grid-arrow-1">→</div>

        <div className="grid-cell-2">{getZoneCard(2, 'Zone 2', 'Charge Air - Compressor → CAC')}</div>
        <div className="grid-arrow-2">→</div>

        <div className="grid-cell-3">{getZoneCard(3, 'Zone 3', 'CAC/Manifold - CAC → Intake ports')}</div>
        <div className="grid-arrow-3">→</div>

        <div className="grid-cell-4">{getZoneCard(4, 'Zone 4', 'Exhaust - Manifold → Turbine')}</div>
        <div className="grid-arrow-4">→</div>

        {/* Row 2: Zones 5 and 6 under Zone 2 and 3 */}
        <div className="grid-cell-5">{getZoneCard(5, 'Zone 5', 'Aftertreatment - DPF')}</div>
        <div className="grid-arrow-5">→</div>

        <div className="grid-cell-6">{getZoneCard(6, 'Zone 6', 'Aftertreatment - SCR/Tailpipe')}</div>
      </div>
    </div>
  )
}

// ─── History Table ───────────────────────────────────────────────
function HistoryTable({ history }) {
  return (
    <div className="card history-card">
      <div className="card-header">
        <span className="card-title">Prediction History</span>
        <span className="card-icon"></span>
      </div>
      <table className="history-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Status</th>
            <th>Confidence</th>
            <th>Zone</th>
            <th>Severity</th>
            <th>Go/No-Go</th>
          </tr>
        </thead>
        <tbody>
          {(history || []).slice(-15).reverse().map((item, i) => (
            <tr key={i}>
              <td>{item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : '-'}</td>
              <td style={{ color: item.leak_detected ? 'var(--accent-red)' : 'var(--accent-emerald)', fontWeight: 'bold' }}>
                <span className={`status-dot ${item.leak_detected ? 'leak' : 'healthy'}`}></span>
                {item.leak_detected ? 'LEAK' : 'OK'}
              </td>
              <td>{(item.confidence * 100).toFixed(1)}%</td>
              <td>{item.suspected_zone?.split(' - ')[0]?.trim() || '-'}</td>
              <td>
                <span className={`alert-severity ${item.severity === 'CRITICAL' ? 'severity-critical' :
                    item.severity === 'MEDIUM' ? 'severity-medium' :
                      item.severity === 'SMALL' ? 'severity-small' : 'severity-none'
                  }`}>{item.severity || 'NONE'}</span>
              </td>
              <td style={{ color: item.go_no_go === 'GO' ? 'var(--accent-emerald)' : 'var(--accent-red)', fontWeight: 700 }}>
                {item.go_no_go}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Interactive Level Meters ────────────────────────────────────
function InteractiveLevelMeters({ sensors, setSensors, onSensorChange }) {
  const configs = [
    { key: 'RPM', label: 'Engine Speed', min: 1000, max: 2500, step: 10 },
    { key: 'MAF', label: 'Mass Air Flow', min: 400, max: 1500, step: 5 },
    { key: 'MAP_boost', label: 'Boost Pressure', min: 100, max: 350, step: 2 },
    { key: 'T_cac_out', label: 'Charge Air Temp', min: 20, max: 80, step: 1 },
    { key: 'T_exh_manifold', label: 'Exhaust Temp', min: 300, max: 800, step: 5 },
    { key: 'dP_dpf', label: 'DPF Delta P', min: 0, max: 20, step: 0.1 },
    { key: 'fuel_qty', label: 'Fuel Injection', min: 50, max: 200, step: 1 }
  ];

  const handleChange = (key, val) => {
    const newVal = Number(val);
    const newSensors = { ...sensors, [key]: newVal };
    setSensors(newSensors);
    onSensorChange(newSensors);
  };

  return (
    <div className="card level-meters-card" style={{ gridColumn: 'span 2' }}>
      <div className="card-header">
        <span className="card-title">Live Sensor Overrides</span>
        <span className="card-icon"></span>
      </div>
      <div className="level-meters-container">
        {configs.map(c => {
          const val = sensors[c.key] || c.min;
          const pct = ((val - c.min) / (c.max - c.min)) * 100;
          return (
            <div className="level-meter" key={c.key}>
              <div className="level-meter-label">
                <span>{c.label}</span>
                <span>{val}</span>
              </div>
              <input
                type="range"
                className="level-meter-input"
                min={c.min} max={c.max} step={c.step}
                value={val}
                onChange={e => handleChange(c.key, e.target.value)}
                style={{ background: `linear-gradient(to right, var(--accent-yellow) ${pct}%, var(--bg-glass) ${pct}%)` }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Energy Field Graph ──────────────────────────────────────────
function EnergyFieldGraph({ efData }) {
  const matrix = efData?.matrix || Array(6).fill(Array(6).fill(0));
  const channels = ['MAF', 'Boost', 'CAC Out', 'Exhaust', 'DPF', 'RPM'];

  const values = matrix.map(row => {
    if (Array.isArray(row)) {
      return row.reduce((a, b) => a + Math.abs(b), 0) / (row.length || 1);
    }
    return 0;
  });

  return (
    <div className="card" style={{ gridColumn: 'span 2' }}>
      <div className="card-header">
        <span className="card-title">Energy Field Deviation</span>
        <span className="card-icon"></span>
      </div>
      <div className="ef-graph-container">
        {values.map((v, i) => (
          <div key={i} className="ef-graph-bar" style={{ height: `${Math.min(100, Math.max(5, v * 100))}%` }}>
            <div className="ef-graph-label">{channels[i] || `CH${i + 1}`}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function buildEnergyField(result, isLeak) {
  const features = result?.features || {}
  const leakProbability = typeof result?.leak_probability === 'number' ? result.leak_probability : 0
  const healthyProbability = typeof result?.healthy_probability === 'number' ? result.healthy_probability : 1

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
  const bandFactor = clamp((features.band_4 || 0) * 4, 0, 1)
  const centroidFactor = clamp((features.spectral_centroid || 0) / 8000, 0, 1)
  const rmsFactor = clamp((features.rms || 0) * 2.5, 0, 1)
  const crestFactor = clamp((features.crest_factor || 0) / 5, 0, 1)
  const zeroCrossFactor = clamp((features.zero_crossings || 0) * 25, 0, 1)
  const pulseFactor = clamp((isLeak ? leakProbability : healthyProbability) * 1.1, 0.05, 1)

  const matrix = Array.from({ length: 6 }, (_, row) =>
    Array.from({ length: 6 }, (_, col) => {
      const base = (Math.sin((row + 1) * (col + 1) * 0.45 + (features.peak || 0) * 1.2) + 1) / 2
      const weight = [rmsFactor, centroidFactor, crestFactor, zeroCrossFactor, bandFactor, pulseFactor][row] || 0.2
      const value = (base * 0.55 + weight * 0.45) * (isLeak ? 1 : 0.35) - 0.15
      return Number(clamp(value, -1, 1).toFixed(3))
    })
  )

  const disruptedSensors = ['MAF', 'MAP_boost', 'T_exh_manifold']
  const sensorIndex = Math.min(disruptedSensors.length - 1, Math.max(0, Math.floor((features.band_4 || 0) * 10)))

  return {
    matrix,
    global_deviation: Number((1.2 + leakProbability * 4.5 + (features.band_4 || 0) * 2.5).toFixed(2)),
    cosine_similarity: Number((0.96 - leakProbability * 0.18 - (features.spectral_centroid || 0) / 20000).toFixed(3)),
    most_disrupted_sensor: isLeak ? disruptedSensors[sensorIndex] : 'N/A',
  }
}

// ─── Acoustic Leak Detector Component ──────────────────────────────
function AcousticLeakDetector({ 
  audioFiles, 
  selectedCategory, 
  setSelectedCategory, 
  selectedFile, 
  setSelectedFile, 
  handleCategoryChange, 
  analyzeSound, 
  acousticResult, 
  isLoading 
}) {
  const categories = [
    { id: 'good', name: 'Healthy Sounds' },
    { id: 'leak', name: 'Leak Sounds' }
  ];

  const files = audioFiles[selectedCategory] || [];
  const audioUrl = selectedFile ? `${API_BASE}/api/audio/play/${selectedCategory}/${selectedFile}` : '';

  return (
    <div className="card acoustic-card">
      <div className="card-header">
        <span className="card-title">Acoustic Leak Detection</span>
        <span className="card-icon"></span>
      </div>
      <div className="acoustic-container" style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '10px 0' }}>
        
        <div className="acoustic-control-group" style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label className="sensor-label" style={{ marginBottom: '5px', display: 'block' }}>Engine State</label>
            <select 
              className="demo-select" 
              style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              value={selectedCategory} 
              onChange={e => handleCategoryChange(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 2 }}>
            <label className="sensor-label" style={{ marginBottom: '5px', display: 'block' }}>Select Audio Track</label>
            <select 
              className="demo-select" 
              style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              value={selectedFile} 
              onChange={e => setSelectedFile(e.target.value)}
            >
              {files.map(f => (
                <option key={f} value={f}>{f.replace('engine_', '').replace('.wav', '')}</option>
              ))}
            </select>
          </div>
        </div>

        {audioUrl && (
          <div className="audio-player-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span className="sensor-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Audio Player</span>
            <audio key={audioUrl} controls style={{ width: '100%', height: '32px' }}>
              <source src={audioUrl} type="audio/wav" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        <button 
          className="demo-btn" 
          style={{ width: '100%', background: 'linear-gradient(135deg, var(--accent-yellow) 0%, #ff9800 100%)', color: '#000', fontWeight: 'bold', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer' }}
          onClick={analyzeSound}
          disabled={isLoading || !selectedFile}
        >
          {isLoading ? 'Analyzing Audio Frequencies...' : 'Analyze Audio Leak Signatures'}
        </button>

        {acousticResult && (() => {
          const features = acousticResult.features || {};
          const prediction = acousticResult.prediction || 'UNKNOWN';
          const leakProbability = typeof acousticResult.leak_probability === 'number' ? acousticResult.leak_probability : 0;
          const healthyProbability = typeof acousticResult.healthy_probability === 'number' ? acousticResult.healthy_probability : 0;
          const confidence = prediction === 'LEAK' ? leakProbability : healthyProbability;
          return (
            <div className="acoustic-result-wrapper" style={{ animation: 'fadeIn 0.3s ease-in-out', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '5px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid',
                background: prediction === 'LEAK' ? 'rgba(239, 83, 80, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                borderColor: prediction === 'LEAK' ? 'var(--accent-red)' : 'var(--accent-emerald)'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Acoustic Classification</div>
                  <div style={{
                    fontSize: '1.4rem',
                    fontWeight: '800',
                    color: prediction === 'LEAK' ? 'var(--accent-red)' : 'var(--accent-emerald)'
                  }}>
                    {prediction}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Probability</div>
                  <div style={{
                    fontSize: '1.4rem',
                    fontWeight: '800',
                    color: prediction === 'LEAK' ? 'var(--accent-red)' : 'var(--accent-emerald)'
                  }}>
                    {Math.round(confidence * 100)}%
                  </div>
                </div>
              </div>

              <div className="acoustic-features" style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>RMS Energy:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{(features.rms ?? 0).toFixed(4)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Peak Amp:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{(features.peak ?? 0).toFixed(4)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Spectral Centroid:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--accent-yellow)' }}>{(features.spectral_centroid ?? 0).toFixed(0)} Hz</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Zero-Crossing Rate:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{(features.zero_crossings ?? 0).toFixed(4)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gridColumn: 'span 2', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>High Frequency (4kHz+) Energy Ratio:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: prediction === 'LEAK' ? 'var(--accent-red)' : 'var(--text-primary)' }}>{((features.band_4 ?? 0) * 1000).toFixed(2)}‰</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  )
}

// ─── Zone Detail Page ─────────────────────────────────────────────
function ZoneDetailPage({ data, onBack }) {
  const zoneIdx = data.suspected_zone_idx || 0
  const info = ZONE_DETAIL_INFO[zoneIdx]

  if (!info || zoneIdx === 0) {
    return (
      <div className="dashboard-grid">

        {/* Header */}
        <div className="card" style={{ gridColumn: 'span 3', padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button className="demo-btn" onClick={onBack} style={{ padding: '6px 14px', fontSize: '0.8rem', flexShrink: 0 }}>← Back</button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--text-primary)' }}>Engine Health Report</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Cat C18 — Zone Inspection Analysis</div>
            </div>
            <span style={{
              padding: '5px 16px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '800', letterSpacing: '0.07em',
              background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.4)', color: 'var(--accent-emerald)',
            }}>GO — ALL CLEAR</span>
          </div>
          <div style={{
            marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.65',
          }}>
            No anomalies detected across all monitored zones. The engine air system, exhaust path, and aftertreatment systems are operating within normal parameters. No immediate inspection or maintenance action is required.
          </div>
        </div>

        {/* System Status */}
        <div className="card" style={{ padding: '20px' }}>
          <div className="card-header"><span className="card-title">System Status</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
            {[
              { label: 'Operational Status', value: 'GO', color: 'var(--accent-emerald)' },
              { label: 'Detected Flow Loss', value: '0.0%', color: 'var(--accent-emerald)' },
              { label: 'Leak Confidence', value: `${Math.round((data.confidence || 0) * 100)}%`, color: 'var(--accent-emerald)' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '1.9rem', fontWeight: '900', color }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Zone Clearance */}
        <div className="card" style={{ padding: '20px' }}>
          <div className="card-header"><span className="card-title">Zone Clearance</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            {ZONE_NAMES.slice(1).map((zone, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 12px',
                background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: '6px',
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{zone}</span>
                <span style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--accent-emerald)', letterSpacing: '0.06em' }}>CLEAR</span>
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance Note — full-width horizontal */}
        <div className="card" style={{ gridColumn: 'span 3', padding: '22px' }}>
          <div className="card-header" style={{ marginBottom: '16px' }}><span className="card-title">Maintenance Note</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>

            {/* Panel 1 — Status summary */}
            <div style={{
              padding: '16px 18px',
              background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '8px',
              display: 'flex', flexDirection: 'column', gap: '6px',
            }}>
              <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Current Status</div>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', fontWeight: '600', lineHeight: '1.55' }}>
                Continue normal engine operation. All monitored zones are within specification.
              </div>
            </div>

            {/* Panel 2 — Inspection schedule */}
            <div style={{
              padding: '16px 18px',
              background: 'rgba(128,128,128,0.06)', border: '1px solid var(--border-subtle)', borderRadius: '8px',
              display: 'flex', flexDirection: 'column', gap: '6px',
            }}>
              <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Inspection Schedule</div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Schedule the next preventive inspection per the Cat C18 maintenance interval — every <strong style={{ color: 'var(--text-primary)' }}>500 operating hours</strong> or as directed by Cat ET diagnostics.
              </div>
            </div>

            {/* Panel 3 — Next action */}
            <div style={{
              padding: '16px 18px',
              background: 'rgba(128,128,128,0.06)', border: '1px solid var(--border-subtle)', borderRadius: '8px',
              display: 'flex', flexDirection: 'column', gap: '6px',
            }}>
              <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Next Action</div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Log result and continue monitoring. Re-run analysis if any operational symptoms develop.
              </div>
            </div>

          </div>
        </div>

      </div>
    )
  }

  const getSeverityColor = (sev) => {
    const map = { NONE: 'var(--accent-emerald)', SMALL: 'var(--accent-yellow)', MEDIUM: 'var(--accent-yellow)', CRITICAL: 'var(--accent-red)' }
    return map[sev] || 'var(--accent-emerald)'
  }

  const getSeverityClass = (sev) => {
    const map = { NONE: 'severity-none', SMALL: 'severity-small', MEDIUM: 'severity-medium', CRITICAL: 'severity-critical' }
    return map[sev] || 'severity-none'
  }

  return (
    <div className="dashboard-grid">
      {/* Zone header banner */}
      <div className="card" style={{ gridColumn: 'span 3', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button className="demo-btn" onClick={onBack} style={{ padding: '6px 14px', fontSize: '0.8rem', flexShrink: 0 }}>
            ← Back
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.35rem', fontWeight: '900', color: info.colorVar }}>{info.title}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{info.subtitle}</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <span className={`alert-severity ${getSeverityClass(data.severity)}`}>{data.severity || 'NONE'}</span>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '5px' }}>
              Detection Confidence: {Math.round(data.confidence * 100)}%
            </div>
          </div>
        </div>
        <div style={{
          marginTop: '18px', paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)',
          color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.65',
        }}>
          {info.description}
        </div>
      </div>

      {/* 3D Zone Model */}
      <div className="card" style={{ padding: '12px', overflow: 'hidden' }}>
        <div className="card-header" style={{ marginBottom: '10px' }}>
          <span className="card-title">3D Zone Model</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: '8px' }}>360° Interactive</span>
        </div>
        <ZoneModel3D zoneId={zoneIdx} height={260} />
      </div>

      {/* Leak metrics */}
      <div className="card" style={{ padding: '20px' }}>
        <div className="card-header"><span className="card-title">Leak Metrics</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '14px' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated Flow Loss</div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: getSeverityColor(data.severity) }}>
              {(data.flow_loss_pct || 0).toFixed(1)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confidence</div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--accent-yellow)' }}>
              {Math.round(data.confidence * 100)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Go / No-Go</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: data.go_no_go === 'GO' ? 'var(--accent-emerald)' : 'var(--accent-red)' }}>
              {data.go_no_go}
            </div>
          </div>
        </div>
      </div>

      {/* Affected sensors */}
      <div className="card" style={{ padding: '20px' }}>
        <div className="card-header"><span className="card-title">Affected Sensors</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
          {info.affected_sensors.map(sensor => {
            const val = data.sensors?.[sensor]
            const residual = data.residuals?.[`res_${sensor}`]
            return (
              <div key={sensor} style={{
                padding: '10px 12px', background: 'rgba(128,128,128,0.07)',
                borderRadius: '7px', border: '1px solid var(--border-subtle)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {sensor.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--accent-yellow)' }}>
                    {typeof val === 'number' ? val.toFixed(1) : '—'} {SENSOR_UNITS[sensor] || ''}
                  </span>
                </div>
                {typeof residual === 'number' && residual !== 0 && (
                  <div style={{
                    fontSize: '0.7rem', marginTop: '4px',
                    color: residual < 0 ? 'var(--accent-red)' : 'var(--accent-emerald)',
                  }}>
                    Residual: {residual > 0 ? '+' : ''}{residual.toFixed(2)} &nbsp;
                    {residual < 0 ? '↓ Below expected' : '↑ Above expected'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Recommended action — full-width horizontal layout */}
      <div className="card" style={{ gridColumn: 'span 3', padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
          <span className="card-title">Recommended Action</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              padding: '3px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700',
              background: 'rgba(128,128,128,0.12)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)', letterSpacing: '0.04em',
            }}>
              {info.recommendation.method}
            </span>
            <span style={{
              padding: '3px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700',
              background: info.recommendation.priority === 'Immediate'
                ? 'rgba(239,68,68,0.13)' : info.recommendation.priority === 'High'
                ? 'rgba(255,192,0,0.13)' : 'rgba(34,211,238,0.13)',
              border: `1px solid ${info.recommendation.priority === 'Immediate'
                ? 'rgba(239,68,68,0.4)' : info.recommendation.priority === 'High'
                ? 'rgba(255,192,0,0.4)' : 'rgba(34,211,238,0.4)'}`,
              color: info.recommendation.priority === 'Immediate'
                ? 'var(--accent-red)' : info.recommendation.priority === 'High'
                ? 'var(--accent-yellow)' : 'var(--accent-cyan)',
              letterSpacing: '0.04em',
            }}>
              {info.recommendation.priority} Priority
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
              Zone: <span style={{ color: info.colorVar, fontWeight: '700' }}>{data.suspected_zone}</span>
            </span>
          </div>
        </div>

        {/* Two-column layout: left = summary, right = action steps */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', alignItems: 'start' }}>

          {/* Left — primary action summary + follow-up */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              padding: '14px 16px',
              background: 'rgba(239,68,68,0.07)',
              border: '1px solid rgba(239,68,68,0.28)',
              borderRadius: '8px',
              color: 'var(--text-primary)', fontSize: '0.86rem', fontWeight: '600', lineHeight: '1.6',
            }}>
              {data.recommended_action || 'Inspect the detected zone and report findings to maintenance.'}
            </div>
            <div style={{
              padding: '12px 14px',
              background: 'rgba(128,128,128,0.06)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
            }}>
              <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>Follow-up</div>
              <div style={{ fontSize: '0.79rem', color: 'var(--text-secondary)', lineHeight: '1.55' }}>
                {info.recommendation.follow_up}
              </div>
            </div>
          </div>

          {/* Right — action steps in 2×2 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {info.recommendation.actions.map((action, i) => (
              <div key={i} style={{
                display: 'flex', gap: '10px', alignItems: 'flex-start',
                padding: '12px', background: 'rgba(128,128,128,0.05)',
                borderRadius: '8px', border: '1px solid var(--border-subtle)',
              }}>
                <span style={{
                  minWidth: '22px', height: '22px', borderRadius: '50%',
                  background: info.colorVar, color: '#000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.62rem', fontWeight: '900', flexShrink: 0, marginTop: '1px',
                }}>{i + 1}</span>
                <span style={{ fontSize: '0.81rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{action}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Inspection checklist */}
      <div className="card" style={{ gridColumn: 'span 3', padding: '22px' }}>
        <div className="card-header">
          <span className="card-title">Inspection Checklist — {info.title}</span>
        </div>
        <div style={{
          marginTop: '16px',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '10px',
        }}>
          {info.inspection_steps.map((step, i) => (
            <div key={i} style={{
              display: 'flex', gap: '12px', alignItems: 'flex-start',
              padding: '13px', background: 'rgba(128,128,128,0.06)',
              borderRadius: '8px', border: '1px solid var(--border-subtle)',
            }}>
              <div style={{
                minWidth: '26px', height: '26px', borderRadius: '50%',
                background: info.colorVar, color: '#000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: '900', flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: '1.55' }}>
                {step}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main App ────────────────────────────────────────────────────
// ─── Main App ────────────────────────────────────────────────────
function App() {
  const [showIntro, setShowIntro] = useState(true)
  const [activePage, setActivePage] = useState('dashboard')
  const [prevPage, setPrevPage] = useState('dashboard')
  const [predictionData, setPredictionData] = useState(null)
  const [history, setHistory] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [isDemoRunning, setIsDemoRunning] = useState(false)
  const [simZone, setSimZone] = useState(0)
  const [simSeverity, setSimSeverity] = useState(0)
  const [manualSensors, setManualSensors] = useState({
    RPM: 1800, MAF: 850, MAP_boost: 215, T_cac_out: 45, T_exh_manifold: 550, dP_dpf: 0.5, fuel_qty: 120
  })
  const wsRef = useRef(null)
  const demoWsRef = useRef(null)
  const debounceRef = useRef(null)

  const [daqStatus, setDaqStatus] = useState('Disconnected')
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
    }
  }, [isDark])

  const handleConnectDAQ = async () => {
    if (isDemoRunning) {
      stopDemo();
    }
    try {
      const res = await fetch(`${API_BASE}/api/dax/daq/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connection_type: 'Simulated DAQ Data',
          device_name: 'Simulated C18 Telemetry',
          sampling_rate: 1.0,
          simulation_state: 'Healthy'
        })
      });
      const data = await res.json();
      if (data.success) {
        setDaqStatus(data.status);
      }
    } catch (err) {
      console.error('Connection error:', err);
    }
  };

  const handleDisconnectDAQ = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dax/daq/disconnect`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setDaqStatus(data.status);
      }
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  };

  // Fetch current DAQ status on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/dax/daq/status`)
      .then(res => res.json())
      .then(data => {
        setDaqStatus(data.status);
      })
      .catch(err => console.error('Error fetching DAQ status:', err));
  }, []);

  // Globally stream real-time DAQ packets into prediction state
  useEffect(() => {
    let ws = null;
    const connectDAQ = () => {
      ws = new WebSocket(`${WS_BASE}/ws/daq`);
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === 'daq_packet') {
          setDaqStatus(msg.status);
          
          if (msg.status === 'Connected') {
            const isLeak = msg.packet.LeakZone > 0;
            const mappedPrediction = {
              leak_detected: isLeak,
              confidence: msg.ai_prediction.leak_risk,
              suspected_zone: isLeak ? ZONE_NAMES[msg.packet.LeakZone] : ZONE_NAMES[0],
              suspected_zone_idx: msg.packet.LeakZone,
              zone_probabilities: [
                msg.packet.LeakZone === 0 ? 1.0 : 0.05,
                msg.packet.LeakZone === 1 ? 0.90 : 0.01,
                msg.packet.LeakZone === 2 ? 0.90 : 0.01,
                msg.packet.LeakZone === 3 ? 0.90 : 0.01,
                msg.packet.LeakZone === 4 ? 0.90 : 0.01,
                msg.packet.LeakZone === 5 ? 0.90 : 0.01,
                msg.packet.LeakZone === 6 ? 0.90 : 0.01,
              ],
              severity: isLeak ? (msg.ai_prediction.leak_risk > 0.8 ? "CRITICAL" : msg.ai_prediction.leak_risk > 0.5 ? "MEDIUM" : "SMALL") : "NONE",
              flow_loss_pct: isLeak ? (msg.ai_prediction.leak_risk * 15.0) : 0.0,
              go_no_go: isLeak ? "NO-GO" : "GO",
              recommended_action: isLeak ? `DAQ Stream Alert: Inspect Zone ${msg.packet.LeakZone}` : "System operating within normal parameters.",
              residuals: {
                res_MAF: 0.0,
                res_MAP_boost: 0.0,
                res_T_boost: 0.0,
                res_T_cac_out: 0.0,
                res_MAP_cac_out: 0.0,
                res_T_exh_manifold: 0.0,
                res_T_post_turbine: 0.0,
                res_dP_dpf: 0.0,
                res_MAP_intake: 0.0
              },
              sensors: {
                RPM: msg.packet.RPM,
                MAF: msg.packet.MAF,
                MAP_intake: msg.packet.OilPressure * 0.6,
                MAP_boost: msg.packet.Boost,
                MAP_cac_in: msg.packet.Boost * 0.98,
                MAP_cac_out: msg.packet.Boost * 0.95,
                T_intake: 25.0,
                T_boost: msg.packet.OilTemp * 1.3,
                T_cac_out: msg.packet.CoolantTemp * 0.5,
                T_exh_manifold: msg.packet.OilTemp * 6.0,
                T_dpf_in: msg.packet.OilTemp * 2.7,
                T_dpf_out: msg.packet.OilTemp * 2.2,
                fuel_qty: msg.packet.ThrottlePosition * 1.8,
                dP_dpf: 0.5
              },
              energy_field: {
                matrix: Array(6).fill(null).map((_, i) =>
                  Array(6).fill(null).map((_, j) => i === j ? 1.0 : 0.8 - Math.abs(i - j) * 0.1)
                ),
                global_deviation: isLeak ? 4.2 : 0.3,
                cosine_similarity: isLeak ? 0.82 : 0.98,
                most_disrupted_sensor: isLeak ? "MAP_boost" : "N/A",
                ef_suspected_zone: isLeak ? ZONE_NAMES[msg.packet.LeakZone] : "N/A"
              }
            };
            setPredictionData(mappedPrediction);
            
            setManualSensors({
              RPM: msg.packet.RPM,
              MAF: msg.packet.MAF,
              MAP_boost: msg.packet.Boost,
              T_cac_out: msg.packet.CoolantTemp * 0.5,
              T_exh_manifold: msg.packet.OilTemp * 6.0,
              dP_dpf: 0.5,
              fuel_qty: msg.packet.ThrottlePosition * 1.8
            });

            setHistory(prev => [...prev.slice(-100), mappedPrediction]);
          }
        }
      };
      ws.onclose = () => {
        setDaqStatus('Disconnected');
        setTimeout(connectDAQ, 3000);
      };
    };

    connectDAQ();

    return () => {
      if (ws) ws.close();
    };
  }, []);

  useEffect(() => {
    if (daqStatus === 'Connected') {
      setIsConnected(true);
    } else if (!isDemoRunning) {
      setIsConnected(false);
    }
  }, [daqStatus, isDemoRunning]);

  // Acoustic states
  const [audioFiles, setAudioFiles] = useState({ good: [], leak: [] })
  const [selectedCategory, setSelectedCategory] = useState('good')
  const [selectedFile, setSelectedFile] = useState('')
  const [acousticResult, setAcousticResult] = useState(null)
  const [isAcousticLoading, setIsAcousticLoading] = useState(false)

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    const files = audioFiles[cat] || [];
    if (files.length > 0) {
      setSelectedFile(files[0]);
    } else {
      setSelectedFile('');
    }
    setAcousticResult(null);
  };

  const analyzeSound = async () => {
    if (!selectedFile) return;
    setIsAcousticLoading(true);
    setAcousticResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/audio/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          filename: selectedFile,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Audio analysis failed (${res.status}): ${errorText || 'Unknown error'}`);
      }

      const result = await res.json();
      setAcousticResult(result);

      // Make it affect the global prediction data / status!
      const isLeak = result.prediction === 'LEAK';
      
      // Determine zone dynamically from the audio filename to cover all 6 zones
      let zoneIdx = 0;
      if (isLeak) {
        if (selectedFile.includes('1200')) {
          if (selectedFile.includes('large')) zoneIdx = 6;
          else if (selectedFile.includes('medium')) zoneIdx = 1;
          else zoneIdx = 2;
        } else if (selectedFile.includes('1400')) {
          if (selectedFile.includes('large')) zoneIdx = 3;
          else if (selectedFile.includes('medium')) zoneIdx = 4;
          else zoneIdx = 5;
        } else if (selectedFile.includes('1600')) {
          if (selectedFile.includes('large')) zoneIdx = 6;
          else if (selectedFile.includes('medium')) zoneIdx = 1;
          else zoneIdx = 2;
        } else if (selectedFile.includes('1800')) {
          if (selectedFile.includes('large')) zoneIdx = 3;
          else if (selectedFile.includes('medium')) zoneIdx = 4;
          else zoneIdx = 5;
        } else if (selectedFile.includes('2000')) {
          if (selectedFile.includes('large')) zoneIdx = 6;
          else if (selectedFile.includes('medium')) zoneIdx = 1;
          else zoneIdx = 2;
        } else {
          zoneIdx = 2; // Default fallback to Zone 2
        }
      }

      // Determine severity and flow loss dynamically from the audio filename
      let severity = "NONE";
      let flowLossPct = 0.0;
      let mockConfidence = isLeak ? result.leak_probability : result.healthy_probability;
      if (isLeak) {
        if (selectedFile.includes('large')) {
          severity = "CRITICAL";
          flowLossPct = 12.0 + Math.random() * 3.0;
          mockConfidence = 0.86 + Math.random() * 0.08;
        } else if (selectedFile.includes('medium')) {
          severity = "MEDIUM";
          flowLossPct = 5.0 + Math.random() * 4.0;
          mockConfidence = 0.71 + Math.random() * 0.08;
        } else if (selectedFile.includes('small')) {
          severity = "SMALL";
          flowLossPct = 1.0 + Math.random() * 3.0;
          mockConfidence = 0.52 + Math.random() * 0.08;
        } else {
          severity = "MEDIUM";
          flowLossPct = 6.0;
          mockConfidence = 0.75;
        }
      }

      // Define standard C18 diagnostic actions
      const actionMap = {
        0: "System healthy - continue operation.",
        1: "Acoustic Analysis: Inspect intake ducting between airflow meter and compressor inlet. Check hose clamps and silicone couplers.",
        2: "Acoustic Analysis: Check boost pipe connections between compressor outlet and CAC inlet. Inspect for cracked charge pipes.",
        3: "Acoustic Analysis: Inspect CAC-to-intake manifold connections. Check CAC end tanks and pipe clamps.",
        4: "Acoustic Analysis: Inspect exhaust manifold gaskets and V-band clamps. Check turbocharger turbine housing bolts.",
        5: "Acoustic Analysis: Inspect DPF/SCR connections. Check DOC mounting bolts and exhaust pipe V-bands.",
        6: "Acoustic Analysis: Inspect post-turbine exhaust system and tailpipe seals.",
      };

      // Set zone probabilities
      const zoneProbs = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
      if (isLeak) {
        zoneProbs[zoneIdx] = 0.85;
        for (let i = 0; i < 7; i++) {
          if (i !== zoneIdx) {
            zoneProbs[i] = 0.15 / 6;
          }
        }
      } else {
        zoneProbs[0] = 1.0;
      }

      // Define residuals mock data matching the physics rules of data_generator.py
      const baseResiduals = {
        res_MAF: 0.0,
        res_MAP_boost: 0.0,
        res_T_boost: 0.0,
        res_T_cac_out: 0.0,
        res_MAP_cac_out: 0.0,
        res_T_exh_manifold: 0.0,
        res_T_post_turbine: 0.0,
        res_dP_dpf: 0.0,
        res_MAP_intake: 0.0
      };

      if (isLeak) {
        const severityCoeff = selectedFile.includes('large') ? 2.0 : (selectedFile.includes('medium') ? 1.0 : 0.4);
        if (zoneIdx === 1) {
          baseResiduals.res_MAF = -55.0 * severityCoeff;
          baseResiduals.res_MAP_boost = -12.0 * severityCoeff;
          baseResiduals.res_T_boost = 4.0 * severityCoeff;
        } else if (zoneIdx === 2) {
          baseResiduals.res_MAP_boost = -22.0 * severityCoeff;
          baseResiduals.res_T_boost = 6.0 * severityCoeff;
        } else if (zoneIdx === 3) {
          baseResiduals.res_MAP_cac_out = -26.0 * severityCoeff;
          baseResiduals.res_T_cac_out = 9.0 * severityCoeff;
          baseResiduals.res_MAP_intake = -28.0 * severityCoeff;
        } else if (zoneIdx === 4) {
          baseResiduals.res_T_exh_manifold = -95.0 * severityCoeff;
          baseResiduals.res_MAP_boost = -18.0 * severityCoeff;
        } else if (zoneIdx === 5) {
          baseResiduals.res_dP_dpf = -4.0 * severityCoeff;
        } else if (zoneIdx === 6) {
          baseResiduals.res_T_post_turbine = -25.0 * severityCoeff;
          baseResiduals.res_dP_dpf = -1.0 * severityCoeff;
        }
      }

      // Populate energy field correlation matrix distortion corresponding to the parsed channel
      const efChannels = ['MAF', 'MAP_boost', 'MAP_cac_out', 'T_cac_out', 'T_exh_manifold', 'dP_dpf'];
      const disruptedSensorMap = {
        1: 'MAF',
        2: 'MAP_boost',
        3: 'MAP_cac_out',
        4: 'T_exh_manifold',
        5: 'dP_dpf',
        6: 'dP_dpf',
      };

      const baseMatrix = Array(6).fill(null).map((_, i) =>
        Array(6).fill(null).map((_, j) => i === j ? 1.0 : 0.8 - Math.abs(i - j) * 0.12)
      );

      if (isLeak) {
        const disruptIdx = zoneIdx - 1; // Map zone 1-5 to channel index 0-4
        if (disruptIdx >= 0 && disruptIdx < 6) {
          for (let i = 0; i < 6; i++) {
            if (i === disruptIdx) {
              for (let j = 0; j < 6; j++) {
                if (i !== j) {
                  baseMatrix[i][j] = -0.75 - Math.random() * 0.15;
                  baseMatrix[j][i] = baseMatrix[i][j];
                }
              }
            }
          }
        }
      }

      const newPredictionData = {
        leak_detected: isLeak,
        confidence: mockConfidence,
        suspected_zone: isLeak ? ZONE_NAMES[zoneIdx] : ZONE_NAMES[0],
        suspected_zone_idx: isLeak ? zoneIdx : 0,
        zone_probabilities: zoneProbs,
        severity: severity,
        flow_loss_pct: flowLossPct,
        go_no_go: isLeak ? "NO-GO" : "GO",
        recommended_action: actionMap[isLeak ? zoneIdx : 0],
        residuals: baseResiduals,
        sensors: {
          ...manualSensors,
          RPM: selectedFile.includes('1200') ? 1200 :
               selectedFile.includes('1400') ? 1400 :
               selectedFile.includes('1600') ? 1600 :
               selectedFile.includes('1800') ? 1800 :
               selectedFile.includes('2000') ? 2000 : manualSensors.RPM,
        },
        energy_field: {
          matrix: baseMatrix,
          global_deviation: isLeak ? (3.5 + flowLossPct * 0.2) : 0.4,
          cosine_similarity: isLeak ? (0.85 - flowLossPct * 0.015) : 0.98,
          most_disrupted_sensor: isLeak ? disruptedSensorMap[zoneIdx] : "N/A",
          ef_suspected_zone: isLeak ? ZONE_NAMES[zoneIdx] : "N/A"
        }
      };

      setPredictionData(newPredictionData);
      setHistory(prev => [...prev.slice(-100), newPredictionData]);

    } catch (err) {
      console.error('Error analyzing sound:', err);
    } finally {
      setIsAcousticLoading(false);
    }
  };

  // Fetch audio files list on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/audio/files`)
      .then(res => res.json())
      .then(data => {
        if (data && (data.good || data.leak)) {
          setAudioFiles(data)
          if (data.good && data.good.length > 0) {
            setSelectedFile(data.good[0])
          }
        }
      })
      .catch(err => console.error('Error fetching audio files:', err))
  }, [])

  const handleManualSensorChange = (newSensors) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSensors),
        })
        const data = await res.json()
        setPredictionData(data)
        setHistory(prev => [...prev.slice(-100), data])
      } catch (err) {
        console.error('Manual prediction error:', err)
      }
    }, 100);
  };

  const handleZoneClick = (zoneId) => {
    if (isDemoRunning) {
      stopDemo();
    }
    setSimZone(zoneId);
    setSimSeverity(2); // Default to Medium (8%) leak on click
  };

  // Fetch history on load
  useEffect(() => {
    fetch(`${API_BASE}/api/history?limit=50`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setHistory(data)
      })
      .catch(() => { })
  }, [])

  // Demo WebSocket
  const startDemo = useCallback(() => {
    if (demoWsRef.current) {
      demoWsRef.current.close()
    }
    const ws = new WebSocket(`${WS_BASE}/ws/demo`)
    ws.onopen = () => {
      setIsConnected(true)
      setIsDemoRunning(true)
      // Send initial overrides immediately if they were selected
      ws.send(JSON.stringify({
        leak_zone: simZone,
        leak_severity: simSeverity
      }))
    }
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      setPredictionData(data)
      setHistory(prev => [...prev.slice(-100), data])

      if (data.sensors) {
        setManualSensors({
          RPM: data.sensors.RPM || 1800,
          MAF: data.sensors.MAF || 850,
          MAP_boost: data.sensors.MAP_boost || 215,
          T_cac_out: data.sensors.T_cac_out || 45,
          T_exh_manifold: data.sensors.T_exh_manifold || 550,
          dP_dpf: data.sensors.dP_dpf || 0.5,
          fuel_qty: data.sensors.fuel_qty || 120
        })
      }
    }
    ws.onclose = () => {
      setIsConnected(false)
      setIsDemoRunning(false)
    }
    ws.onerror = () => {
      setIsConnected(false)
      setIsDemoRunning(false)
    }
    demoWsRef.current = ws
  }, [simZone, simSeverity])

  const stopDemo = useCallback(() => {
    if (demoWsRef.current) {
      demoWsRef.current.close()
      demoWsRef.current = null
    }
    setIsDemoRunning(false)
    setIsConnected(false)
  }, [])

  // Manual simulation
  const runSimulation = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rpm: 1800,
          leak_zone: simZone,
          leak_severity: simSeverity,
        }),
      })
      const data = await res.json()
      setPredictionData(data)
      if (data.sensors) {
        setManualSensors(data.sensors)
      }
      setHistory(prev => [...prev.slice(-100), data])
    } catch (err) {
      console.error('Simulation error:', err)
    }
  }, [simZone, simSeverity])

  // Auto-run simulation or update running demo when selection changes
  useEffect(() => {
    if (isDemoRunning) {
      if (demoWsRef.current && demoWsRef.current.readyState === WebSocket.OPEN) {
        demoWsRef.current.send(JSON.stringify({
          leak_zone: simZone,
          leak_severity: simSeverity
        }))
      }
    } else if (daqStatus !== 'Connected') {
      runSimulation()
    }
  }, [simZone, simSeverity, isDemoRunning, runSimulation, daqStatus])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (demoWsRef.current) demoWsRef.current.close()
      if (wsRef.current) wsRef.current.close()
    }
  }, [])

  const data = predictionData || {
    leak_detected: false,
    confidence: 0,
    suspected_zone: ZONE_NAMES[0],
    suspected_zone_idx: 0,
    zone_probabilities: [1, 0, 0, 0, 0, 0, 0],
    severity: 'NONE',
    flow_loss_pct: 0,
    go_no_go: 'GO',
    recommended_action: 'Connect to backend to start monitoring.',
    residuals: {},
    energy_field: { matrix: Array(6).fill(Array(6).fill(0)), global_deviation: 0, cosine_similarity: 1, most_disrupted_sensor: 'N/A' },
    sensors: {},
  }

  return (
    <>
      {showIntro && <IntroVideo onComplete={() => setShowIntro(false)} />}
      <div className="app-container">
        <SidebarProvider>
          <AppSidebar activePage={activePage} setActivePage={setActivePage} />
          <SidebarInset>
            <main className="main-content" style={{ width: '100%', padding: '1rem' }}>
              <div className="main-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <h2>
                  {activePage === 'dashboard' && 'Real-Time Dashboard'}
                  {activePage === 'engine' && 'Analysis'}
                  {activePage === 'history' && 'Detection History'}
                  {activePage === 'dax' && 'DAX Engine Query Console'}
                  {activePage === 'digital-twin' && 'Digital Twin'}
                  {activePage === 'zone-detail' && 'Zone Inspection Report'}
                </h2>
                <div className="header-controls" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={`header-badge ${isConnected ? 'badge-connected' : 'badge-disconnected'}`}>
                    <span className="status-dot" style={{
                      background: isConnected ? 'var(--accent-emerald)' : 'var(--accent-red)',
                      width: '6px', height: '6px'
                    }}></span>
                    {isConnected ? 'LIVE' : 'OFFLINE'}
                  </span>
                  <button
                    onClick={() => setIsDark(p => !p)}
                    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    style={{
                      width: '34px', height: '34px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'background 0.2s, border-color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-yellow)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                  >
                    {isDark ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="5"/>
                        <line x1="12" y1="1" x2="12" y2="3"/>
                        <line x1="12" y1="21" x2="12" y2="23"/>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                        <line x1="1" y1="12" x2="3" y2="12"/>
                        <line x1="21" y1="12" x2="23" y2="12"/>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

          {/* Demo Controls — always visible */}
          <div className="dashboard-grid" style={{ marginBottom: '20px' }}>
            <div className="demo-controls">
              <button
                id="demo-toggle"
                className={`demo-btn ${isDemoRunning ? 'active' : ''}`}
                onClick={isDemoRunning ? stopDemo : startDemo}
              >
                {isDemoRunning ? 'Stop Demo' : 'Start Live Demo'}
              </button>

              <select className="demo-select" value={simZone} onChange={e => setSimZone(Number(e.target.value))}>
                <option value={0}>Healthy (No Leak)</option>
                <option value={1}>Zone 1 - Intake</option>
                <option value={2}>Zone 2 - Charge Air</option>
                <option value={3}>Zone 3 - CAC/Manifold</option>
                <option value={4}>Zone 4 - Exhaust</option>
                <option value={5}>Zone 5 - DPF</option>
                <option value={6}>Zone 6 - SCR/Tailpipe</option>
              </select>

              <select className="demo-select" value={simSeverity} onChange={e => setSimSeverity(Number(e.target.value))}>
                <option value={0}>No Fault</option>
                <option value={1}>Small (2%)</option>
                <option value={2}>Medium (8%)</option>
                <option value={3}>Large (15%)</option>
              </select>

              <button id="simulate-btn" className="demo-btn danger" onClick={runSimulation}>
                Inject & Predict
              </button>
            </div>
          </div>

          {/* Zone Detail Page */}
          {activePage === 'zone-detail' && (
            <ZoneDetailPage
              data={data}
              onBack={() => setActivePage(prevPage)}
            />
          )}

          {/* Dashboard Page */}
          {activePage === 'dashboard' && (
            <div className="dashboard-grid">
              <GoNoGoIndicator status={data.go_no_go} />
              <ConfidenceRing confidence={data.confidence} leakDetected={data.leak_detected} />
              <LeakAlertCard data={data} onInspect={() => { setPrevPage('dashboard'); setActivePage('zone-detail') }} />

              <SensorGrid sensors={data.sensors} />
              <EnergyFieldHeatmap efData={data.energy_field} />

              <ResidualsCard residuals={data.residuals} />
              <ZoneProbabilities probs={data.zone_probabilities} />
            </div>
          )}

          {/* Engine Diagram Page */}
          {activePage === 'engine' && (
            <div className="dashboard-grid">
              <InteractiveLevelMeters
                sensors={manualSensors}
                setSensors={setManualSensors}
                onSensorChange={handleManualSensorChange}
              />
              <AcousticLeakDetector
                audioFiles={audioFiles}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                handleCategoryChange={handleCategoryChange}
                analyzeSound={analyzeSound}
                acousticResult={acousticResult}
                isLoading={isAcousticLoading}
              />
              <EngineDiagram
                zoneIdx={data.suspected_zone_idx}
                leakDetected={data.leak_detected}
                onZoneClick={handleZoneClick}
              />
              <GoNoGoIndicator status={data.go_no_go} />
              <ConfidenceRing confidence={data.confidence} leakDetected={data.leak_detected} />
              <EnergyFieldGraph efData={data.energy_field} />
              <LeakAlertCard data={data} onInspect={() => { setPrevPage('engine'); setActivePage('zone-detail') }} />
              <ZoneProbabilities probs={data.zone_probabilities} />
            </div>
          )}

          {/* History Page */}
          {activePage === 'history' && (
            <div className="dashboard-grid">
              <HistoryTable history={history} />
            </div>
          )}

          {/* Sensor Intelligence Hub Page */}
          {activePage === 'dax' && (
            <div className="dashboard-grid">
              <DAXConsole />
            </div>
          )}

          {/* Digital Twin Page */}
          {activePage === 'digital-twin' && (
            <div className="dashboard-grid" style={{ height: '80vh', padding: '0', gridTemplateColumns: '1fr' }}>
              <iframe
                src="/LeakSense_v5_Fixed.html"
                style={{ width: '100%', height: '100%', minHeight: '800px', border: 'none', borderRadius: '12px' }}
                title="Digital Twin"
              />
            </div>
          )}
          </main>
          </SidebarInset>
        </SidebarProvider>
        <ChatBot />
      </div>
    </>
  )
}

export default App
