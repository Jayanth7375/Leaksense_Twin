import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// ─── Per-zone color palette ──────────────────────────────────────
const ZONE_COLORS = {
  1: { primary: 0xFFC000, accent: 0xff9900 },
  2: { primary: 0x3b82f6, accent: 0x60a5fa },
  3: { primary: 0x22d3ee, accent: 0x67e8f9 },
  4: { primary: 0xef4444, accent: 0xf97316 },
  5: { primary: 0x8b5cf6, accent: 0xa78bfa },
  6: { primary: 0x10b981, accent: 0x34d399 },
}

// ─── Material factory ────────────────────────────────────────────
function M(color, { m = 0.6, r = 0.4, e = 0x000000, ei = 0, t, back } = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: m,
    roughness: r,
    emissive: e,
    emissiveIntensity: ei,
    transparent: t !== undefined,
    opacity: t ?? 1,
    side: back ? THREE.BackSide : THREE.FrontSide,
  })
}

// ─── Geometry helpers ────────────────────────────────────────────
function HC(rx, len, x, y, z, color, opts) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rx, rx, len, 28), M(color, opts))
  mesh.rotation.z = Math.PI / 2
  mesh.position.set(x, y, z)
  return mesh
}
function VC(rx, ry, h, x, y, z, color, opts) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rx, ry, h, 28), M(color, opts))
  mesh.position.set(x, y, z)
  return mesh
}
function BX(w, h, d, x, y, z, color, opts) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(color, opts))
  mesh.position.set(x, y, z)
  return mesh
}
function TC(r, tube, x, y, z, color, opts) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 10, 36), M(color, opts))
  mesh.rotation.y = Math.PI / 2
  mesh.position.set(x, y, z)
  return mesh
}

// ─── Zone 1: Intake — Airflow meter → Compressor inlet ──────────
function buildZone1(c) {
  const g = new THREE.Group()
  g.add(BX(0.85, 0.68, 0.68, -2.3, 0, 0, 0x4a4a4a, { m: 0.3, r: 0.75 }))
  for (let i = -1; i <= 1; i++) g.add(BX(0.03, 0.64, 0.65, -2.3 + i * 0.2, 0.01, 0, 0x666666, { m: 0.4, r: 0.6 }))
  g.add(HC(0.18, 0.42, -1.75, 0, 0, 0x666666, { m: 0.5, r: 0.5 }))
  g.add(HC(0.20, 1.1, -0.98, 0, 0, 0x3d3d3d, { m: 0.5, r: 0.6 }))
  g.add(BX(0.52, 0.52, 0.48, -0.28, 0, 0, 0x2d2d2d, { m: 0.65, r: 0.45 }))
  g.add(BX(0.53, 0.53, 0.02, -0.28, 0, 0.24, 0x555555, { m: 0.2, r: 0.9 }))
  g.add(BX(0.20, 0.28, 0.20, -0.28, 0.42, 0, 0x1e1e1e, { m: 0.3, r: 0.85 }))
  g.add(VC(0.05, 0.04, 0.18, -0.28, 0.60, 0, 0x333333, { m: 0.4, r: 0.7 }))
  g.add(HC(0.20, 0.85, 0.31, 0, 0, 0x3d3d3d, { m: 0.5, r: 0.6 }))
  g.add(TC(0.22, 0.036, 0.73, 0, 0, 0x999999, { m: 0.92, r: 0.15 }))
  g.add(HC(0.21, 0.75, 1.12, 0, 0, c.primary, { m: 0.65, r: 0.35, e: c.primary, ei: 0.35 }))
  g.add(HC(0.26, 0.73, 1.12, 0, 0, c.accent, { m: 0, r: 1, t: 0.08, back: true }))
  return g
}

// ─── Zone 2: Charge Air — Compressor outlet → CAC inlet ─────────
function buildZone2(c) {
  const g = new THREE.Group()
  g.add(VC(0.34, 0.34, 0.52, -1.85, -0.42, 0, 0x4a4a4a, { m: 0.75, r: 0.3 }))
  g.add(VC(0.19, 0.19, 0.48, -1.85, 0.08, 0, 0x555555, { m: 0.65, r: 0.35 }))
  const vb1 = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.045, 10, 36), M(c.primary, { m: 0.9, r: 0.15, e: c.primary, ei: 0.45 }))
  vb1.position.set(-1.85, 0.36, 0)
  g.add(vb1)
  g.add(HC(0.185, 0.55, -1.85, 0.7, 0, 0x4a9eff, { m: 0.5, r: 0.4 }))
  g.add(HC(0.185, 2.9, 0.1, 0.9, 0, 0x4a9eff, { m: 0.5, r: 0.4 }))
  g.add(TC(0.21, 0.036, 0.1, 0.9, 0, 0x888888, { m: 0.9, r: 0.2 }))
  g.add(TC(0.21, 0.04, 1.55, 0.9, 0, 0x888888, { m: 0.9, r: 0.18 }))
  g.add(BX(0.68, 0.82, 0.58, 2.1, 0.9, 0, 0x2e2e2e, { m: 0.65, r: 0.45 }))
  g.add(BX(0.06, 0.78, 0.54, 2.46, 0.9, 0, 0x444444, { m: 0.8, r: 0.3 }))
  g.add(BX(0.06, 0.78, 0.54, 1.74, 0.9, 0, 0x444444, { m: 0.8, r: 0.3 }))
  return g
}

// ─── Zone 3: CAC/Manifold — CAC outlet → Intake ports ───────────
function buildZone3(c) {
  const g = new THREE.Group()
  g.add(BX(1.45, 0.78, 0.58, -2.05, 0, 0, 0x222233, { m: 0.45, r: 0.7 }))
  for (let i = -3; i <= 3; i++) g.add(BX(0.03, 0.72, 0.54, -2.05 + i * 0.18, 0, 0, 0x334455, { m: 0.6, r: 0.45 }))
  g.add(BX(0.12, 0.78, 0.58, -2.79, 0, 0, 0x3a3a4a, { m: 0.7, r: 0.3 }))
  g.add(BX(0.12, 0.78, 0.58, -1.31, 0, 0, 0x3a3a4a, { m: 0.7, r: 0.3 }))
  g.add(HC(0.17, 0.58, -0.96, 0, 0, 0x555566, { m: 0.55, r: 0.45 }))
  g.add(HC(0.29, 1.82, 0.18, 0, 0, c.primary, { m: 0.65, r: 0.35, e: c.primary, ei: 0.28 }))
  g.add(TC(0.31, 0.05, -0.73, 0, 0, 0x444444, { m: 0.75, r: 0.3 }))
  g.add(TC(0.31, 0.05, 1.09, 0, 0, 0x444444, { m: 0.75, r: 0.3 }))
  ;[-0.63, -0.38, -0.13, 0.12, 0.37, 0.62].forEach(x => {
    g.add(VC(0.10, 0.10, 0.52, x + 0.18, -0.54, 0, 0x2e2e2e, { m: 0.65, r: 0.4 }))
    g.add(VC(0.13, 0.13, 0.04, x + 0.18, -0.82, 0, 0x444444, { m: 0.7, r: 0.3 }))
  })
  return g
}

// ─── Zone 4: Exhaust Manifold — Exhaust ports → Turbine inlet ───
function buildZone4(c) {
  const g = new THREE.Group()
  ;[-0.75, -0.45, -0.15, 0.15, 0.45, 0.75].forEach(x => {
    g.add(VC(0.11, 0.11, 0.60, x, 0.48, 0, 0x8b2515, { m: 0.55, r: 0.65 }))
    g.add(VC(0.14, 0.14, 0.04, x, 0.15, 0, 0x555555, { m: 0.7, r: 0.35 }))
  })
  g.add(HC(0.225, 2.05, 0, 0.18, 0, c.primary, { m: 0.72, r: 0.28, e: c.accent, ei: 0.42 }))
  g.add(HC(0.32, 2.0, 0, 0.18, 0, c.accent, { m: 0, r: 1, t: 0.11, back: true }))
  g.add(HC(0.42, 1.95, 0, 0.18, 0, c.primary, { m: 0, r: 1, t: 0.05, back: true }))
  g.add(TC(0.24, 0.05, -1.05, 0.18, 0, 0x555555, { m: 0.75, r: 0.28 }))
  g.add(HC(0.24, 0.10, 1.08, 0.18, 0, 0x666666, { m: 0.8, r: 0.25 }))
  g.add(HC(0.22, 0.58, 1.42, 0.18, 0, 0x555555, { m: 0.72, r: 0.3 }))
  g.add(TC(0.25, 0.042, 1.72, 0.18, 0, 0x999999, { m: 0.92, r: 0.15 }))
  g.add(VC(0.32, 0.32, 0.45, 1.72, 0.18, 0, 0x444444, { m: 0.75, r: 0.3 }))
  return g
}

// ─── Zone 5: DPF — DOC → coupling → DPF housing ─────────────────
function buildZone5(c) {
  const g = new THREE.Group()
  g.add(HC(0.42, 1.08, -1.62, 0, 0, 0x4a4a4a, { m: 0.72, r: 0.32 }))
  g.add(TC(0.44, 0.055, -2.19, 0, 0, 0x777777, { m: 0.82, r: 0.2 }))
  g.add(TC(0.44, 0.055, -1.05, 0, 0, 0x777777, { m: 0.82, r: 0.2 }))
  ;[-1.85, -1.62, -1.39].forEach(x => g.add(TC(0.43, 0.018, x, 0, 0, 0x666666, { m: 0.75, r: 0.25 })))
  g.add(HC(0.235, 0.44, -0.81, 0, 0, c.primary, { m: 0.72, r: 0.28, e: c.primary, ei: 0.32 }))
  g.add(TC(0.25, 0.04, -1.04, 0, 0, c.accent, { m: 0.9, r: 0.18, e: c.accent, ei: 0.3 }))
  g.add(TC(0.25, 0.04, -0.58, 0, 0, c.accent, { m: 0.9, r: 0.18, e: c.accent, ei: 0.3 }))
  g.add(HC(0.60, 1.90, 0.77, 0, 0, 0x2e2e2e, { m: 0.82, r: 0.22 }))
  g.add(TC(0.62, 0.065, -0.18, 0, 0, 0x666666, { m: 0.88, r: 0.18 }))
  g.add(TC(0.62, 0.065, 1.72, 0, 0, 0x666666, { m: 0.88, r: 0.18 }))
  ;[0.2, 0.77, 1.34].forEach(x => g.add(TC(0.61, 0.02, x, 0, 0, 0x444444, { m: 0.78, r: 0.25 })))
  ;[0.36, 1.18].forEach(x => {
    g.add(VC(0.045, 0.045, 0.40, x, 0.64, 0, 0xbbbbbb, { m: 0.92, r: 0.18 }))
    g.add(VC(0.065, 0.065, 0.06, x, 0.86, 0, 0x888888, { m: 0.85, r: 0.25 }))
  })
  g.add(HC(0.025, 0.86, 0.77, 0.86, 0.2, 0x222222, { m: 0.3, r: 0.8 }))
  return g
}

// ─── Zone 6: SCR/Tailpipe — SCR → DEF → Elbow → Tailpipe ────────
function buildZone6(c) {
  const g = new THREE.Group()
  g.add(HC(0.57, 1.88, -0.92, 0, 0, 0x1e3d30, { m: 0.72, r: 0.32 }))
  g.add(TC(0.59, 0.06, -1.88, 0, 0, 0x3a5a4a, { m: 0.8, r: 0.22 }))
  g.add(TC(0.59, 0.06, 0.04, 0, 0, 0x3a5a4a, { m: 0.8, r: 0.22 }))
  ;[-1.4, -0.92, -0.44].forEach(x => g.add(TC(0.585, 0.02, x, 0, 0, 0x2d5040, { m: 0.75, r: 0.28 })))
  g.add(VC(0.065, 0.042, 0.50, -1.38, 0.65, 0, c.primary, { m: 0.72, r: 0.28, e: c.primary, ei: 0.55 }))
  g.add(VC(0.08, 0.03, 0.06, -1.38, 0.92, 0, c.accent, { m: 0.5, r: 0.4, e: c.accent, ei: 1.0 }))
  const defLine = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 10), M(0x34d399, { m: 0.5, r: 0.5 }))
  defLine.rotation.x = Math.PI / 2
  defLine.position.set(-1.38, 0.88, 0.22)
  g.add(defLine)
  g.add(HC(0.14, 0.60, 0.34, 0, 0, 0x3a3a3a, { m: 0.65, r: 0.5 }))
  const elb1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.48, 24), M(0x3a3a3a, { m: 0.65, r: 0.5 }))
  elb1.rotation.z = Math.PI / 4; elb1.position.set(0.72, -0.17, 0); g.add(elb1)
  const elb2 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.36, 24), M(0x3a3a3a, { m: 0.65, r: 0.5 }))
  elb2.rotation.z = Math.PI / 6; elb2.position.set(0.92, -0.52, 0); g.add(elb2)
  g.add(VC(0.13, 0.15, 1.05, 1.05, -1.08, 0, 0x2a2a2a, { m: 0.62, r: 0.62 }))
  g.add(VC(0.16, 0.16, 0.05, 1.05, -0.53, 0, 0x444444, { m: 0.75, r: 0.3 }))
  g.add(VC(0.16, 0.06, 0.10, 1.05, -1.63, 0, c.accent, { m: 0, r: 1, e: c.accent, ei: 0.9, t: 0.65 }))
  g.add(VC(0.25, 0.04, 0.12, 1.05, -1.67, 0, c.accent, { m: 0, r: 1, e: c.accent, ei: 0.5, t: 0.22 }))
  return g
}

const BUILDERS = { 1: buildZone1, 2: buildZone2, 3: buildZone3, 4: buildZone4, 5: buildZone5, 6: buildZone6 }

const LEAK_POS = {
  1: [0.73, 0.26, 0.22],
  2: [-1.85, 0.36, 0.22],
  3: [-0.96, 0.19, 0.17],
  4: [-0.75, 0.82, 0.11],
  5: [-0.81, 0.28, 0.22],
  6: [-1.38, 0.92, 0],
}

const ZONE_LABELS = {
  1: 'Zone 1 · Intake',
  2: 'Zone 2 · Charge Air',
  3: 'Zone 3 · CAC / Manifold',
  4: 'Zone 4 · Exhaust Manifold',
  5: 'Zone 5 · DPF',
  6: 'Zone 6 · SCR / Tailpipe',
}

// ─── Main component ──────────────────────────────────────────────
export default function ZoneModel3D({ zoneId, height = 320 }) {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const w = mount.clientWidth || 400
    const colors = ZONE_COLORS[zoneId] || ZONE_COLORS[1]

    // ── Scene / Camera / Renderer ──
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(44, w / height, 0.1, 100)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)

    // ── Lights ──
    scene.add(new THREE.AmbientLight(0xffffff, 0.55))
    const key = new THREE.DirectionalLight(0xffffff, 1.4)
    key.position.set(6, 9, 6); scene.add(key)
    const fill = new THREE.DirectionalLight(0xaabbcc, 0.35)
    fill.position.set(-6, -3, -5); scene.add(fill)
    const rim = new THREE.DirectionalLight(0xffffff, 0.5)
    rim.position.set(0, -5, -6); scene.add(rim)
    const zonePt = new THREE.PointLight(colors.primary, 2.0, 10)
    zonePt.position.set(0, 2, 4); scene.add(zonePt)

    // ── Build model ──
    const builder = BUILDERS[zoneId]
    const group = builder ? builder(colors) : new THREE.Group()

    // Center model in view
    scene.add(group)
    renderer.render(scene, camera) // dummy render to force matrix update
    const bbox = new THREE.Box3().setFromObject(group)
    const center = bbox.getCenter(new THREE.Vector3())
    const size   = bbox.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const dist   = maxDim * 1.6 + 2.2
    camera.position.set(center.x, center.y + size.y * 0.3, center.z + dist)
    camera.lookAt(center)

    // ── Leak pulse sphere + ring ──
    const lp = LEAK_POS[zoneId] || [0, 0.5, 0]
    const pulseGeo = new THREE.SphereGeometry(0.10, 18, 18)
    const pulseMat = new THREE.MeshStandardMaterial({
      color: colors.accent, emissive: colors.accent, emissiveIntensity: 2.8,
      transparent: true, opacity: 0.88,
    })
    const pulseSphere = new THREE.Mesh(pulseGeo, pulseMat)
    pulseSphere.position.set(...lp)
    group.add(pulseSphere)

    const ringGeo = new THREE.TorusGeometry(0.14, 0.02, 8, 32)
    const ringMat = new THREE.MeshStandardMaterial({
      color: colors.accent, emissive: colors.accent, emissiveIntensity: 1.5,
      transparent: true, opacity: 0.5,
    })
    const pulseRing = new THREE.Mesh(ringGeo, ringMat)
    pulseRing.position.set(...lp)
    group.add(pulseRing)

    // ── Rotation state (no OrbitControls) ──
    let rotY    = 0
    let rotX    = 0.18   // slight tilt
    let isDrag  = false
    let lastX   = 0
    let lastY   = 0
    let velX    = 0
    let velY    = 0
    let zoom    = dist

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

    const onDown = (e) => {
      isDrag = true
      lastX  = e.clientX ?? e.touches?.[0]?.clientX ?? 0
      lastY  = e.clientY ?? e.touches?.[0]?.clientY ?? 0
      velX = velY = 0
      renderer.domElement.setPointerCapture?.(e.pointerId)
    }
    const onMove = (e) => {
      if (!isDrag) return
      const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0
      const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0
      velX = (cx - lastX) * 0.013
      velY = (cy - lastY) * 0.010
      lastX = cx; lastY = cy
    }
    const onUp = () => { isDrag = false }
    const onWheel = (e) => {
      e.preventDefault()
      zoom = clamp(zoom + e.deltaY * 0.01, dist * 0.4, dist * 2.5)
    }

    renderer.domElement.addEventListener('pointerdown', onDown)
    renderer.domElement.addEventListener('pointermove', onMove)
    renderer.domElement.addEventListener('pointerup',   onUp)
    renderer.domElement.addEventListener('pointerleave', onUp)
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false })

    // ── Animate ──
    const clock = new THREE.Clock()
    let id
    const animate = () => {
      id = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      if (isDrag) {
        rotY += velX
        rotX += velY
        rotX = clamp(rotX, -0.6, 0.7)
      } else {
        rotY += velX * 0.92 + 0.007   // momentum + auto-spin
        velX *= 0.88
        velY *= 0.88
        rotX += velY * 0.88
        rotX += (0.18 - rotX) * 0.04  // ease back to tilt
      }

      group.rotation.y = rotY
      group.rotation.x = rotX

      // Camera zoom
      const dir = camera.position.clone().sub(center).normalize()
      camera.position.copy(center).addScaledVector(dir, zoom)
      camera.lookAt(center)

      // Pulse leak sphere
      const s = 1 + Math.sin(t * 3.2) * 0.24
      pulseSphere.scale.set(s, s, s)
      pulseMat.emissiveIntensity = 1.8 + Math.sin(t * 3.2) * 1.2
      pulseMat.opacity = 0.7 + Math.sin(t * 3.2) * 0.18
      const rs = 1 + Math.sin(t * 3.2 + 1) * 0.35
      pulseRing.scale.set(rs, rs, rs)
      ringMat.opacity = 0.5 - Math.sin(t * 3.2 + 1) * 0.3

      // Gentle bob
      group.position.y = Math.sin(t * 0.65) * 0.04

      renderer.render(scene, camera)
    }
    animate()

    // ── Resize ──
    const onResize = () => {
      const nw = mount.clientWidth || 400
      camera.aspect = nw / height
      camera.updateProjectionMatrix()
      renderer.setSize(nw, height)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('pointerdown', onDown)
      renderer.domElement.removeEventListener('pointermove', onMove)
      renderer.domElement.removeEventListener('pointerup',   onUp)
      renderer.domElement.removeEventListener('pointerleave', onUp)
      renderer.domElement.removeEventListener('wheel', onWheel)
      renderer.dispose()
      pulseGeo.dispose(); ringGeo.dispose()
      pulseMat.dispose(); ringMat.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [zoneId, height])

  const colors = ZONE_COLORS[zoneId] || ZONE_COLORS[1]
  const hexP = '#' + colors.primary.toString(16).padStart(6, '0')
  const hexA = '#' + colors.accent.toString(16).padStart(6, '0')
  const label = ZONE_LABELS[zoneId] || ''

  return (
    <div style={{ width: '100%', borderRadius: '10px', overflow: 'hidden', position: 'relative', background: 'rgba(0,0,0,0.35)' }}>
      <div ref={mountRef} style={{ width: '100%', height }} />

      {/* Zone label */}
      <div style={{
        position: 'absolute', top: 10, left: 12,
        fontSize: '0.68rem', fontWeight: '800', letterSpacing: '0.07em',
        color: hexP, textShadow: `0 0 8px ${hexP}88`,
        pointerEvents: 'none', textTransform: 'uppercase',
      }}>{label}</div>

      {/* Leak badge */}
      <div style={{
        position: 'absolute', top: 10, right: 12,
        display: 'flex', alignItems: 'center', gap: 5,
        background: 'rgba(0,0,0,0.55)', borderRadius: 5,
        padding: '3px 8px', border: `1px solid ${hexA}44`,
        pointerEvents: 'none',
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: hexA, boxShadow: `0 0 6px ${hexA}`, display: 'inline-block' }} />
        <span style={{ fontSize: '0.6rem', fontWeight: '700', color: hexA, letterSpacing: '0.05em' }}>LEAK ZONE</span>
      </div>

      {/* Interaction hint */}
      <div style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        fontSize: '0.58rem', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.04em',
        pointerEvents: 'none', whiteSpace: 'nowrap',
      }}>
        Drag to rotate · Scroll to zoom
      </div>
    </div>
  )
}
