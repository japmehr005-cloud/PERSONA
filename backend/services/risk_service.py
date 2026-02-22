"""
Fraud & Protection Engine.

Weighted risk signals with explainable reasoning.
- Device trust, location anomaly, OTP retries, amount anomaly, rapid action.
- Total score 0–100; classification: Low / Medium / High.
- System response: Low → Allow, Medium → Warning + cooling-off, High → Block.
"""

from models.schemas import (
    RiskSignals,
    RiskAnalysis,
    RiskLevel,
    RiskSignalBreakdown,
)


# Weights for each signal (sum not required to be 1; we normalize to 0–100 total)
WEIGHTS = {
    "device_trust": 25,       # low trust = high risk
    "location_anomaly": 20,
    "otp_retry_attempts": 20, # each retry adds risk
    "investment_size_anomaly": 20,
    "rapid_action": 15,
}


def _device_score(trust: float) -> tuple[float, str]:
    """Trust 0–1 → risk contribution 0–25. Lower trust = higher risk."""
    score = (1 - trust) * WEIGHTS["device_trust"]
    explanation = (
        "Device is trusted; low risk."
        if trust >= 0.7
        else "Unfamiliar or low-trust device; higher risk."
    )
    return score, explanation


def _location_score(anomaly: bool) -> tuple[float, str]:
    score = WEIGHTS["location_anomaly"] if anomaly else 0
    explanation = "Login/action from unusual location." if anomaly else "Location is normal."
    return score, explanation


def _otp_score(retries: int) -> tuple[float, str]:
    # Each retry adds up to 5 points, cap at 20
    per_retry = 5
    score = min(retries * per_retry, WEIGHTS["otp_retry_attempts"])
    explanation = (
        f"Multiple OTP attempts ({retries}) may indicate sharing or phishing."
        if retries > 1
        else "Single OTP attempt; normal."
    )
    return score, explanation


def _size_anomaly_score(anomaly: bool) -> tuple[float, str]:
    score = WEIGHTS["investment_size_anomaly"] if anomaly else 0
    explanation = (
        "Transaction amount is unusually large compared to your history."
        if anomaly
        else "Amount is within your typical range."
    )
    return score, explanation


def _rapid_action_score(rapid: bool) -> tuple[float, str]:
    score = WEIGHTS["rapid_action"] if rapid else 0
    explanation = (
        "Action performed very quickly after trigger; possible automated or pressured decision."
        if rapid
        else "Normal time to action."
    )
    return score, explanation


def compute_risk_analysis(signals: RiskSignals) -> RiskAnalysis:
    """Compute total risk score, level, reasoning, and signal breakdown."""
    breakdown: list[RiskSignalBreakdown] = []
    total = 0.0

    s, exp = _device_score(signals.device_trust)
    total += s
    breakdown.append(
        RiskSignalBreakdown(
            name="device_trust",
            score=s,
            weight=WEIGHTS["device_trust"],
            explanation=exp,
        )
    )

    s, exp = _location_score(signals.location_anomaly)
    total += s
    breakdown.append(
        RiskSignalBreakdown(
            name="location_anomaly",
            score=s,
            weight=WEIGHTS["location_anomaly"],
            explanation=exp,
        )
    )

    s, exp = _otp_score(signals.otp_retry_attempts)
    total += s
    breakdown.append(
        RiskSignalBreakdown(
            name="otp_retry_attempts",
            score=s,
            weight=WEIGHTS["otp_retry_attempts"],
            explanation=exp,
        )
    )

    s, exp = _size_anomaly_score(signals.investment_size_anomaly)
    total += s
    breakdown.append(
        RiskSignalBreakdown(
            name="investment_size_anomaly",
            score=s,
            weight=WEIGHTS["investment_size_anomaly"],
            explanation=exp,
        )
    )

    s, exp = _rapid_action_score(signals.rapid_action)
    total += s
    breakdown.append(
        RiskSignalBreakdown(
            name="rapid_action",
            score=s,
            weight=WEIGHTS["rapid_action"],
            explanation=exp,
        )
    )

    # Clamp total to 0–100
    total_risk_score = min(100.0, max(0.0, total))

    # Classify
    if total_risk_score < 25:
        risk_level = RiskLevel.LOW
    elif total_risk_score < 60:
        risk_level = RiskLevel.MEDIUM
    else:
        risk_level = RiskLevel.HIGH

    # Explainable reasoning: summarize top contributors
    reasoning = [
        f"Total risk score: {total_risk_score:.0f}/100 (classification: {risk_level.value})."
    ]
    for b in sorted(breakdown, key=lambda x: -x.score):
        if b.score > 0:
            reasoning.append(f"- {b.name}: {b.explanation}")

    return RiskAnalysis(
        total_risk_score=round(total_risk_score, 1),
        risk_level=risk_level,
        reasoning=reasoning,
        signal_breakdown=breakdown,
    )


class RiskService:
    """Fraud & protection engine. Use compute(signals) for risk analysis."""

    def compute(self, signals: RiskSignals) -> RiskAnalysis:
        return compute_risk_analysis(signals)


risk_service = RiskService()
