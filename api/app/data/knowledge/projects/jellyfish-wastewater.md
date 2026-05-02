---
title: The Jellyfish — Smart Wastewater Monitoring
type: project
priority: 6
status: shipped
---

# The Jellyfish — Smart Wastewater Monitoring

**Dual-node ESP32 wastewater monitoring rig with three-layer on-edge AI and auto-actuating treatment relays.**

## Stack

Two ESP32 nodes (sensing + actuation), pH / TDS / turbidity / temperature sensors, MQTT for inter-node comms, Python on a small edge box for the model serving, scikit-learn for the classical models, PyTorch for the LSTM, relays driving UV / pump / electrolysis.

## The three AI layers

1. **Anomaly detection** — Isolation Forest on the sensor stream. Flags out-of-distribution events early; cheap to run on the edge box.
2. **Pollutant classification** — Random Forest, 4-class (organic / inorganic / heavy-metal / biological). Trained on a labeled dataset of known contamination signatures.
3. **Time-series forecast** — LSTM, 10-step ahead on the multivariate sensor stream. Lets the actuation logic stage interventions instead of reacting after the fact.

## Architectural decision

All three models run on the edge box, not in the cloud. The whole point of an in-line wastewater monitor is that you can't tolerate the network round-trip when a pollutant spike calls for the UV stage to engage. Cloud is only used for retraining the random forest as new labeled data accumulates, not for inference.

## What was hard

Sensor calibration drift. Cheap pH and TDS sensors degrade fast in real wastewater conditions, and untreated drift cascades into the anomaly detector treating the calibration walk as a real event. The fix was a baseline-correction step that re-zeros against a known reference reading on a schedule.

## What shipped

Working installation. Detected and auto-actuated through several real contamination events during the deployment window. Documented end-to-end and presented as a project demo.
