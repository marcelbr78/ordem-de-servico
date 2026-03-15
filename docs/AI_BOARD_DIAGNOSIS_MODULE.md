# AI Board Diagnosis Module

## Overview of the module

The AI Board Diagnosis module is an intelligent diagnostic system designed to assist technicians in troubleshooting electronic boards (MacBook, iPhone, laptops, etc.). The system logically guides technicians step-by-step through real circuit conditions, isolating faults using a structured diagnostic flow. Eventually, this module will integrate with AI and enable parsing schemas to automatically build the diagnosis path.

## Goals of the system

- Standardize the troubleshooting process for board repairs.
- Reduce diagnostic time and increase repair success rates.
- Collect structured data on board failures to build a repair knowledge graph.
- Guide technicians using the universal troubleshooting order (Power, Clock, Reset/Enable, Data/Communication).
- Provide a scalable architecture that future-proofs the system for AI integration and automated boardview/schematic analysis.

## Main architecture components

The module is designed to be completely isolated from existing core modules to guarantee safety on production branches. It operates independently using dedicated tables, engines, and UI components.

- **Entities**: Board, Circuit, PowerRail, SymptomCategory, DiagnosticSession, DiagnosticStep, RepairCase.
- **REST API**: Controllers and Services handling diagnostic sessions, symptoms, and board definitions.
- **Frontend**: A dedicated React UI featuring interactive step-by-step guidance.

### Board Intelligence Engine

Responsible for managing the definition of electronic boards, their architecture, and specific hardware revisions. It acts as the foundational layer upon which circuits and power rails are defined.

### Circuit Intelligence

Defines the individual circuits and power lines within a board. It maps expected electrical behaviors (voltage, resistance, diode mode) and connects symptoms to specific circuits.

### Guided Diagnosis Engine

An algorithmic engine that dictates the step-by-step diagnostic workflow. It respects the universal troubleshooting sequence:

1. Power (Voltages, Shorts)
2. Clock (Oscillations)
3. Reset / Enable (Control signals)
4. Data / Communication (I2C, SPI, PCIe)

Each step automatically provides expected measurement ranges and determines the next logical step based on whether the measurement is OK or FAIL.

### Repair Knowledge Graph

A system designed to map relationships between common symptoms, failing circuits, and successful repairs. By logging each `RepairCase` associated with a `DiagnosticSession`, the system builds a historical database that will eventually allow the AI to predict the most likely component failure based on initial symptoms.

### Future AI integration

The architecture includes placeholders for a future AI engine. This engine will analyze diagnostic sessions in real-time and provide dynamic suggestions or override static decision trees when complex edge cases are detected.

### Future schematic and boardview parsing

Placeholders for parsers (e.g., BRD, PDF schematics) are included. The goal is to eventually allow the system to ingest schematic files and automatically generate the `Circuit` and `PowerRail` dependencies, removing the need for manual data entry of board logic.

## First Diagnostic Flow Implemented

An initial flow for the "No Power" symptom category is implemented. The guided engine executes a sequence of tests aligning with universal electronics rules:

1. **Power Check 1**: What is the voltage on VBUS? (Expected: 20V). Failure suggests charger/USB-C controller fault.
2. **Power Check 2**: What is the voltage on PPBUS_AON? (Expected: 12V-13V). Failure suggests input circuit fault (CD3217, fuse, MOSFET).
3. **Power Check 3**: What is the voltage on PP3V8_AON? (Expected: 3.8V). Failure suggests PMIC/regulator fault.
4. **Power Check 4**: What is the voltage on PP1V8_AON? (Expected: 1.8V). Failure suggests PMIC regulator issue.

If all power checks pass, the system returns a diagnostic summary recommending investigation of other potential elements.
