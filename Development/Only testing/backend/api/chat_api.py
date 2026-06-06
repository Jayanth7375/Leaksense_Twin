"""
LeakSense Twin — AI Chat Advisor API
Uses Groq LLM (llama-3.3-70b-versatile) for fast, intelligent engine diagnostics.
Falls back to a rule-based knowledge base if the Groq API is unavailable.
"""

from fastapi import APIRouter, Request
from pydantic import BaseModel
import os
import json

router = APIRouter(prefix="/api/chat", tags=["Chat Advisor"])

# ── Groq Configuration ────────────────────────────────────────────────────────
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
# llama-3.3-70b-versatile: best Groq model — fast, highly capable, long context
GROQ_MODEL   = "llama-3.3-70b-versatile"

# Lazy-init Groq client
_groq_client = None

def _get_groq_client():
    global _groq_client
    if _groq_client is None:
        try:
            from groq import Groq
            _groq_client = Groq(api_key=GROQ_API_KEY)
            print("[Chat] Groq client initialized (llama-3.3-70b-versatile)")
        except Exception as e:
            print(f"[Chat] Groq client init failed: {e}")
    return _groq_client


# ── Built-in Fallback Knowledge Base ─────────────────────────────────────────
FALLBACK_KB = {
    "leak": (
        "A leak in the Cat C18 engine is detected by comparing actual sensor readings "
        "against the digital twin's predicted healthy values. Large residuals (actual − predicted) "
        "in MAF, MAP_boost, T_cac_out, T_exh, or dP_dpf indicate a potential leak. "
        "The Energy Field correlation matrix further confirms by showing distorted "
        "inter-sensor relationships. Severity: SMALL (<5%), MEDIUM (5–12%), CRITICAL (>12% flow loss)."
    ),
    "zone": (
        "There are 5 leak zones:\n"
        "Zone 1 — Intake: between airflow meter and compressor inlet (key sensor: MAF)\n"
        "Zone 2 — Charge Air: compressor outlet to CAC inlet (key sensor: MAP_boost, T_boost)\n"
        "Zone 3 — CAC/Manifold: CAC outlet to intake manifold (key sensor: MAP_cac_out, T_cac_out)\n"
        "Zone 4 — Exhaust Manifold: manifold to turbo turbine (key sensor: T_exh_manifold)\n"
        "Zone 5 — DPF/SCR: aftertreatment system (key sensor: dP_dpf, T_dpf_out)"
    ),
    "sensor": (
        "The system monitors 13 SAE J1939 sensors at 1 Hz: RPM, MAF (kg/h), MAP_intake, "
        "MAP_boost, MAP_cac_in, MAP_cac_out (all kPa), T_intake, T_boost, T_cac_out, "
        "T_exh_manifold, T_dpf_in, T_dpf_out (all °C), and fuel_qty (mg/stroke)."
    ),
    "accuracy": (
        "LeakSense Twin achieves: Binary Detection F1=0.886, Precision=0.90, Recall=0.87. "
        "Zone localization Top-1 Accuracy=95.6%. Inference latency <10ms, end-to-end <500ms."
    ),
    "twin": (
        "Three physics-based Digital Twins predict healthy-state values:\n"
        "• Intake Twin: MAF = VE × V_cyl × (RPM/120) × ρ_air (mass continuity)\n"
        "• Charge Air Twin: compressor pressure ratio + isentropic boost temp + CAC model (ε=0.88)\n"
        "• Exhaust Twin: first-law combustion temperature + isentropic turbine + DPF back-pressure"
    ),
    "energy": (
        "The Energy Field is a 6×6 weighted correlation matrix across MAF, MAP_boost, "
        "MAP_cac_out, T_cac_out, T_exh_manifold, and dP_dpf. Under healthy conditions it "
        "has a stable shape. During a leak, specific rows distort — the most disrupted row "
        "identifies the likely fault zone. Deviation is measured via Frobenius norm and cosine similarity."
    ),
    "go": (
        "The GO/NO-GO decision requires 3 consecutive positive leak detections (anti-flicker logic) "
        "before flagging NO-GO. This prevents false alarms from transient sensor spikes. "
        "GO = engine healthy, NO-GO = confirmed leak detected."
    ),
    "default": (
        "I am the LeakSense Twin AI Advisor for Cat C18 diesel engine diagnostics. "
        "I can answer questions about leak detection zones, sensor readings, digital twin models, "
        "energy field analysis, accuracy metrics, and recommended actions. "
        "Please try rephrasing your question or ask about a specific topic like 'zone 2 leak', "
        "'energy field', 'sensor readings', or 'detection accuracy'."
    ),
}

def _fallback_response(message: str) -> str:
    """Rule-based fallback when Groq API is unavailable."""
    msg_lower = message.lower()
    if any(w in msg_lower for w in ["leak", "no-go", "nogo", "alert", "detect"]):
        return FALLBACK_KB["leak"]
    if any(w in msg_lower for w in ["zone", "location", "where", "area"]):
        return FALLBACK_KB["zone"]
    if any(w in msg_lower for w in ["sensor", "maf", "map", "temperature", "rpm", "dpf"]):
        return FALLBACK_KB["sensor"]
    if any(w in msg_lower for w in ["accuracy", "f1", "precision", "recall", "performance"]):
        return FALLBACK_KB["accuracy"]
    if any(w in msg_lower for w in ["twin", "physics", "model", "predict"]):
        return FALLBACK_KB["twin"]
    if any(w in msg_lower for w in ["energy", "field", "correlation", "matrix", "heatmap"]):
        return FALLBACK_KB["energy"]
    if any(w in msg_lower for w in ["go", "no go", "decision", "flicker", "consecutive"]):
        return FALLBACK_KB["go"]
    return FALLBACK_KB["default"]


def get_project_context():
    """Load context from GEMINI.md for grounding the LLM."""
    context = ""
    try:
        api_dir  = os.path.dirname(os.path.abspath(__file__))
        backend_dir = os.path.dirname(api_dir)
        root_dir = os.path.dirname(backend_dir)
        gemini_path = os.path.join(root_dir, "GEMINI.md")
        if os.path.exists(gemini_path):
            with open(gemini_path, "r", encoding="utf-8") as f:
                context = "PROJECT DOCUMENTATION:\n" + f.read()[:4000] + "\n\n"
    except Exception as e:
        print(f"[Chat] Context load error: {e}")
    return context


class ChatRequest(BaseModel):
    message: str
    history: list = []


@router.post("/ask")
async def ask_chatbot(request: Request, body: ChatRequest):
    # ── Get live sensor snapshot ───────────────────────────────────
    live_sensors = {}
    try:
        predictor = request.app.state.predictor
        if predictor and hasattr(predictor, 'window') and len(predictor.window) > 0:
            latest = predictor.window[-1]
            live_sensors = {
                "MAF":        round(float(latest[0]), 2),
                "MAP_boost":  round(float(latest[1]), 2),
                "MAP_cac_out":round(float(latest[2]), 2),
                "T_cac_out":  round(float(latest[3]), 2),
                "T_exh":      round(float(latest[4]), 2),
                "dP_dpf":     round(float(latest[5]), 3),
                "RPM":        round(float(latest[6]), 1),
            }
    except Exception:
        pass

    # ── Try Groq LLM ──────────────────────────────────────────────
    client = _get_groq_client()
    if client is not None:
        try:
            project_context = get_project_context()

            system_prompt = (
                "You are the LeakSense Twin AI Advisor — a specialized expert in "
                "Cat C18 diesel engine diagnostics and the LeakSense Twin AI leak detection system.\n"
                "Your role is to help engineers understand engine health, interpret leak detection results, "
                "and explain the physics, ML models, and energy field analysis behind the system.\n\n"
                f"{project_context}"
                f"CURRENT LIVE SENSOR READINGS:\n{json.dumps(live_sensors, indent=2)}\n\n"
                "Response guidelines:\n"
                "1. Be technical yet accessible — the user is an engineer.\n"
                "2. When asked about live sensors, refer to CURRENT LIVE SENSOR READINGS above.\n"
                "3. Keep answers concise (max 3 paragraphs) unless a detailed explanation is requested.\n"
                "4. You can explain Digital Twin physics, Energy Field Analysis, ML models, and zones.\n"
                "5. Always recommend specific actions when a leak is suspected.\n"
            )

            # Build clean alternating message history (user/assistant only)
            messages = [{"role": "system", "content": system_prompt}]
            clean_history = []
            for msg in body.history:
                role = msg.get("role")
                content = msg.get("content", "")
                if role not in ("user", "assistant") or not content:
                    continue
                if not clean_history or clean_history[-1]["role"] != role:
                    clean_history.append({"role": role, "content": content})

            # Keep last 8 exchanges for context window efficiency
            messages.extend(clean_history[-8:])

            # Append current user message
            if messages[-1].get("role") == "user":
                messages[-1]["content"] += f"\n\n{body.message}"
            else:
                messages.append({"role": "user", "content": body.message})

            completion = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                temperature=0.5,
                max_tokens=1024,
            )
            response_text = completion.choices[0].message.content
            return {
                "response": response_text,
                "source": "groq",
                "model": GROQ_MODEL,
            }

        except Exception as api_err:
            err_str = str(api_err)
            print(f"[Chat] Groq API error: {err_str}")
            fallback = _fallback_response(body.message)
            return {
                "response": (
                    f"⚠️ Groq AI advisor temporarily unavailable.\n"
                    f"Here's what I know from local knowledge:\n\n{fallback}"
                ),
                "source": "fallback",
                "api_error": err_str[:200],
            }

    # ── Local fallback when Groq client could not be initialized ──
    fallback = _fallback_response(body.message)
    return {
        "response": (
            "⚠️ AI advisor running in offline mode (Groq package not installed).\n"
            f"Here's what I know locally:\n\n{fallback}"
        ),
        "source": "offline_fallback",
    }

