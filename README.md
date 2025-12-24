# Cable Validator

## Project Overview
Cable Validator is a web application designed to validate cable designs against international standards (like IEC 60502-1). It leverages Google's Gemini AI to analyze user-provided design specifications and compare them against internal database records and general engineering knowledge.

## Folder Structure

The project is organized as a monorepo containing both the frontend and backend:

```
root/
├── app/                 # Next.js App Router (Frontend pages and components)
├── backend/             # NestJS Backend Application
│   ├── src/
│   │   ├── design-validation/ # Logic for validating designs via AI
│   │   ├── iec-standards/     # Management of IEC standard data
│   │   └── ...
│   └── ...
├── public/              # Static assets
├── ...
```

## Architecture

The system follows a modern client-server architecture:

1.  **Frontend (Next.js)**:
    - Provides a dynamic interface for users to define cable designs.
    - Allows adding multiple processes (e.g., Conductor, Insulation) and specifications (e.g., Material, Thickness).
    - Displays validation results including status, reasoning, and suggestions.

2.  **Backend (NestJS)**:
    - **API Layer**: Receives design data from the frontend.
    - **Database Layer**: Stores design history and IEC standard reference data (using TypeORM).
    - **AI Integration**: Acts as an orchestrator that combines user data with internal standard data and prompts Google Gemini AI for validation.

3.  **AI Engine (Google Gemini)**:
    - Analyzes the structured prompt containing the design and reference standards.
    - Returns a structured JSON assessment of the design compliance.

## How It Works

1.  **Input**: The user selects a standard (e.g., IEC 60502-1) and adds processes (e.g., "Conductor", "Insulation") with specific attributes (e.g., "Size: 50mm²", "Thickness: 1.0mm").
2.  **Processing**:
    - The backend saves the design.
    - It retrieves relevant technical data (e.g., required thickness for a given voltage/size) from the local database.
    - It constructs a detailed prompt for the AI, including the user's design and the ground-truth data.
3.  **Validation**:
    - The AI evaluates each specification.
    - It assigns a status: **PASS**, **WARN**, or **FAIL**.
4.  **Output**: The user receives a detailed report highlighting any non-compliant areas with suggestions for correction.

## Rules & Guidelines

- **Data Accuracy**: Ensure input values (like voltage, size) are accurate as they determine the reference standards used.
- **Standard Selection**: Currently optimized for **IEC 60502-1**. Other standards rely more heavily on the AI's general knowledge.
- **Validation Logic**:
    - **PASS**: Value matches the standard or is safely above the minimum requirement.
    - **WARN (Borderline)**: Value is slightly below the standard (within 10% tolerance) or represents an unusual configuration (e.g., 16mm² Aluminum conductor).
    - **FAIL**: Value is significantly below the standard (>10% deviation) or is strictly forbidden.

## Example Test Cases

### Scenario 1: PASS (Compliant Design)
**Context**: A standard low-voltage cable design.
- **Standard**: IEC 60502-1
- **Process**: Conductor
    - **Specification**: Material -> Copper
    - **Specification**: Size -> 50mm²
- **Process**: Insulation (XLPE)
    - **Specification**: Thickness -> 1.0mm (Assuming standard requires ~0.9mm or 1.0mm)
- **Expected Result**: **PASS**. The material is standard and thickness meets the requirement.

### Scenario 2: BORDERLINE (Review Required)
**Context**: A design with an unusual material choice for the size or a value just on the limit.
- **Standard**: IEC 60502-1
- **Process**: Conductor
    - **Specification**: Material -> Aluminum
    - **Specification**: Size -> 16mm²
- **Expected Result**: **WARN / Borderline**. While 16mm² Aluminum might be technically possible, it is often discouraged or non-standard for certain applications compared to Copper. The system flags this for manual review.

### Scenario 3: FAIL (Non-Compliant)
**Context**: A design with insufficient insulation thickness.
- **Standard**: IEC 60502-1
- **Process**: Insulation
    - **Specification**: Voltage -> 0.6/1 kV
    - **Specification**: Thickness -> 0.2mm
- **Expected Result**: **FAIL**. For a 0.6/1 kV cable, 0.2mm insulation is significantly below the required safety standard (typically >0.7mm depending on material). The system will reject this as unsafe.
