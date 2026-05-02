---
title: Life Link — Autonomous Flood-Rescue Robot
type: project
priority: 6
status: shipped
---

# Life Link

**Autonomous flood-rescue robot. YOLOv8 human detection, GPS-fused navigation, ROS-based control. Demonstrated 30% rescue-time reduction vs the manual baseline.**

## Stack

YOLOv8 for human detection from a forward-facing camera, GPS for outer-loop navigation, IMU + dead reckoning for the inner loop, OpenCV for the vision preprocessing, ROS as the orchestration framework, custom motor controllers for the chassis.

## Architectural decision

Tight separation between **perception** (vision pipeline emits "human at bearing θ, distance d, confidence c"), **planning** (GPS-fused planner consumes detections + waypoints + obstacles), and **control** (motor controller consumes velocity commands). This is just the ROS canon, but the discipline matters when you're debugging at 3am because perception is dropping detections under low-light water reflections.

## What was hard

Vision under flood conditions. Standard COCO-trained YOLOv8 underperforms on humans partially submerged or surrounded by water reflections. We retrained on a small dataset of flood-condition images we captured ourselves. The model improved meaningfully but it's the kind of problem where a 50× larger dataset would beat any clever architecture choice.

## What shipped

Functional prototype. Field-tested in a simulated flood environment. 30% reduction in rescue time vs the manual baseline measured across the test scenarios.
