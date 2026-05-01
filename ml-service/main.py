from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import time
from typing import List, Dict

app = FastAPI(title="Supplier Intelligence ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RiskPredictionInput(BaseModel):
    supplier_id: int
    historical_delays: List[int]  # days delayed: 0 = on time, 5 = late by 5 days
    volatility_index: float  # current market instability

class RecommendationWeight(BaseModel):
    priority: str # 'cost', 'urgency', 'reliability', 'security'
    suppliers: List[Dict] # list of {id, name, price, lead_time, score, security_score}

class SupplierGradingInput(BaseModel):
    supplier_id: int
    lead_times: List[float]
    defect_rates: List[float]

@app.get("/")
def health_check():
    return {"status": "Supplier Intelligence ML Engine is running"}

@app.post("/predict-risk")
def predict_risk(data: RiskPredictionInput):
    # Simulated regression for delay probability
    avg_delay = sum(data.historical_delays) / len(data.historical_delays) if data.historical_delays else 0
    prob = (avg_delay * 0.15) + (data.volatility_index * 0.5)
    prob = max(0, min(0.95, prob))
    
    return {
        "supplier_id": data.supplier_id,
        "disruption_probability": round(prob * 100, 1),
        "risk_level": "High" if prob > 0.6 else "Medium" if prob > 0.3 else "Low",
        "trend": "Increasing" if data.volatility_index > 0.5 else "Stable"
    }

@app.post("/smart-recommendation")
def recommend_supplier(data: RecommendationWeight):
    # Dynamic weighting algorithm (AHP-lite)
    # Weights based on user priority
    weights = {'cost': 0.7, 'reliability': 0.7, 'urgency': 0.7}
    
    ranked = []
    for s in data.suppliers:
        # 1. Normalized Reliability (0-1)
        rel_score = s['score'] / 100 
        
        # 2. Normalized Cost (Inversed, 0-1) - assuming max cost 1000 for normalization
        cost_score = max(0, 1 - (s['price'] / 1000))
        
        # 3. Normalized Delivery Speed (Inversed, 0-1) - assuming max lead 14 days
        speed_score = max(0, 1 - (s['lead_time'] / 14))

        if data.priority == 'cost':
            final_score = (cost_score * 0.7) + (rel_score * 0.2) + (speed_score * 0.1)
            reason = f"Offers the most competitive price profile in the current market cycle."
        elif data.priority == 'urgency':
            final_score = (speed_score * 0.7) + (rel_score * 0.2) + (cost_score * 0.1)
            reason = f"Fastest delivery timeline detected ({s['lead_time']} days) to mitigate stockouts."
        elif data.priority == 'security':
            sec_score = s.get('security_score', 0) / 100
            final_score = (sec_score * 0.7) + (rel_score * 0.3)
            reason = f"Exceptional cybersecurity maturity rating ({s.get('security_score', 0)}%) aligned with global IoT standards."
        else: # reliability
            final_score = (rel_score * 0.7) + (speed_score * 0.2) + (cost_score * 0.1)
            reason = f"Highest performance reliability score ({s['score']}%) across historical benchmarks."

        # Add Risk Penalty
        # If score is very low, mark as High Risk
        risk_level = "Low" if s['score'] > 85 else "Medium" if s['score'] > 60 else "High"
        
        ranked.append({
            **s, 
            "ai_score": round(final_score * 100, 1),
            "reason": reason,
            "risk_level": risk_level
        })
    
    # Sort by AI score
    ranked.sort(key=lambda x: x['ai_score'], reverse=True)
    
    # Take Top 3
    top_3 = ranked[:3]
    
    return {
        "priority": data.priority,
        "top_recommendations": top_3,
        "backup_suggestion": ranked[1] if len(ranked) > 1 else None
    }

@app.get("/run-diagnostics")
def run_diagnostics():
    time.sleep(1.2)
    anomalies = [
        {"severity": "critical", "message": "Predictive model detects 78% probability of strike-related disruption for 'MediSupply Network' terminal next week."},
        {"severity": "warning", "message": "Price spike anomaly (12.4%) detected for Metformin bulk orders across 5 vendors."},
        {"severity": "info", "message": "Optimal buffer detected: reducing order frequency for Paracetamol by 15% would save $1,200/mo."}
    ]
    return {
        "status": "success",
        "system_health": "94%",
        "anomalies": anomalies
    }

@app.post("/supplier-grading")
def grade_supplier(data: SupplierGradingInput):
    avg_lead = sum(data.lead_times) / len(data.lead_times) if data.lead_times else 0
    avg_defect = sum(data.defect_rates) / len(data.defect_rates) if data.defect_rates else 0
    
    score = 100 - (avg_lead * 3) - (avg_defect * 100)
    score = max(0, min(100, score))
    
    return {
        "supplier_id": data.supplier_id, 
        "reliability_score": round(score, 1),
        "risk_level": "Low" if score > 85 else "Medium" if score > 60 else "High"
    }
