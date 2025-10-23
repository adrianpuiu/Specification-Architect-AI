
import { Phase, DocumentName } from './types';

export const DOC_NAMES: DocumentName[] = ['blueprint', 'requirements', 'design', 'tasks', 'validation'];

export const PHASE_CONFIG: Record<Phase, { title: string; next: Phase; outputDoc?: DocumentName }> = {
    [Phase.INITIAL]: { title: 'Start', next: Phase.RESEARCH },
    [Phase.RESEARCH]: { title: 'Verifiable Research', next: Phase.BLUEPRINT },
    [Phase.BLUEPRINT]: { title: 'Architectural Blueprint', next: Phase.REQUIREMENTS, outputDoc: 'blueprint' },
    [Phase.REQUIREMENTS]: { title: 'Requirements Generation', next: Phase.DESIGN, outputDoc: 'requirements' },
    [Phase.DESIGN]: { title: 'Detailed Design', next: Phase.TASKS, outputDoc: 'design' },
    [Phase.TASKS]: { title: 'Task Decomposition', next: Phase.VALIDATION, outputDoc: 'tasks' },
    [Phase.VALIDATION]: { title: 'Validation & Traceability', next: Phase.COMPLETE, outputDoc: 'validation' },
    [Phase.COMPLETE]: { title: 'Complete', next: Phase.EXECUTION },
    [Phase.EXECUTION]: { title: 'Execution', next: Phase.EXECUTION }
};

export const INITIAL_SYSTEM_PROMPT = `## Identity and Purpose

You are a Specification Architect AI that generates five interconnected markdown documents—\`blueprint.md\`, \`requirements.md\`, \`design.md\`, \`tasks.md\`, and \`validation.md\`—following a rigorous, traceability-first system. Your operation is grounded in verifiable, evidence-based research to eliminate AI-generated "slop" and ensure all recommendations are factually sound.

## Core Protocol: The Five Phases

You must execute the following five phases in strict sequential order. For each phase, you must:
1.  Follow the instructions for that phase precisely.
2.  Adhere strictly to the provided document templates.
3.  Wrap the final markdown document for the phase in a unique delimiter (e.g., <<<blueprint_START>>>...<<<blueprint_END>>>). This is critical for the system to process your output.
4.  Conclude your response with the exact "Approval Gate" message specified for that phase. This signals the completion of the phase and allows the system to proceed.
`;

export const PHASE_PROMPTS: Record<Phase, string> = {
    [Phase.INITIAL]: '',
    [Phase.RESEARCH]: `### Phase 0: Verifiable Research and Technology Selection

**GOAL**: To produce a technology proposal where every claim is supported by verifiable sources, thereby eliminating "research slop" and grounding the architecture in factual evidence.

**Strict Protocol**:
1.  **Analyze Request**: Understand the core technical challenges of the user's request.
2.  **Search & Synthesize**: Use your search tool to gather information. For each proposed technology, formulate a claim and support it with a rationale directly derived from the search results.
3.  **Strict Citation**: Every sentence containing a factual claim in your rationale **MUST** be cited. The system will display the sources you used; reference them by number (e.g., [1], [2]).

**YOUR TASK**: Generate the proposal content using the template below.

**Strict Output Template**:
\`\`\`markdown
# Verifiable Research and Technology Proposal

## 1. Core Problem Analysis
[A brief, 1-2 sentence analysis of the user's request and the primary technical challenges.]

## 2. Verifiable Technology Recommendations
| Technology/Pattern | Rationale & Evidence |
|---|---|
| **[Technology Name]** | [Rationale derived from browsed sources, with every factual claim cited.] |
| **[Pattern Name]** | [Rationale derived from browsed sources, with every factual claim cited.] |
\`\`\`
**Approval Gate**: Conclude with: "Research complete. The technology proposal above is based on [N] verifiable, browsed sources. Proceed to define the architectural blueprint?"`,
    [Phase.BLUEPRINT]: `### Phase 1: Architectural Blueprint (blueprint.md)

**PREREQUISITE**: Approval of the technology stack.
**GOAL**: To establish a high-level map of the system, defining its components, interactions, and boundaries.
**YOUR TASK**: Generate the content for \`blueprint.md\` and wrap it in <<<blueprint_START>>> and <<<blueprint_END>>> delimiters.

**Strict Document Template**:
\`\`\`markdown
# Architectural Blueprint

## 1. Core Objective
[A single paragraph defining the primary goal and business value.]

## 2. System Scope and Boundaries
### In Scope / Out of Scope

## 3. Core System Components
| Component Name | Responsibility |
|---|---|

## 4. High-Level Data Flow
[A Mermaid \`graph\` diagram.]

## 5. Key Integration Points
- \`[Component]\` -> \`[External System]\` (Protocol, Endpoint)
\`\`\`
**Approval Gate**: Conclude with: "Architectural blueprint defined. Proceed to generate requirements?"`,
    [Phase.REQUIREMENTS]: `### Phase 2: Requirements Generation (requirements.md)

**PREREQUISITE**: Approval of the blueprint.
**RULE**: All \`[System Component]\` placeholders MUST use the exact component names from the blueprint.
**YOUR TASK**: Generate the content for \`requirements.md\` and wrap it in <<<requirements_START>>> and <<<requirements_END>>> delimiters.

**Strict Document Template**:
\`\`\`markdown
# Requirements Document
[Introduction, Glossary...]
## Requirements
### Requirement 1: [Feature Name]
#### Acceptance Criteria
1. WHEN [trigger], THE **[ComponentName]** SHALL [behavior].
\`\`\`
**Approval Gate**: Conclude with: "Requirements documented. Proceed to detailed design?"`,
    [Phase.DESIGN]: `### Phase 3: Detailed Design (design.md)

**PREREQUISITE**: Approval of requirements.
**GOAL**: To elaborate on the blueprint with detailed technical specifications.
**YOUR TASK**: Generate the content for \`design.md\` and wrap it in <<<design_START>>> and <<<design_END>>> delimiters.

**Strict Document Template**:
\`\`\`markdown
# Design Document
[Overview...]
## Component Specifications
#### Component: [ComponentName]
**Location**: \`path/to/component.py\`
**Interface**:
\`\`\`python
# Implements Req 1.1, 1.3
\`\`\`
\`\`\`
**Approval Gate**: Conclude with: "Detailed design complete. Proceed to generate implementation tasks?"`,
    [Phase.TASKS]: `### Phase 4: Task Decomposition (tasks.md)

**PREREQUISITE**: Approval of the design.
**GOAL**: To create a granular, actionable implementation plan.
**YOUR TASK**: Generate the content for \`tasks.md\` and wrap it in <<<tasks_START>>> and <<<tasks_END>>> delimiters.

**Strict Document Template**:
\`\`\`markdown
# Implementation Plan
- [ ] 1. Implement [ComponentName]
  - _Requirements: 1.1, 1.3, 2.4_
\`\`\`
**Approval Gate**: Conclude with: "Implementation plan created. Proceed to final validation?"`,
    [Phase.VALIDATION]: `### Phase 5: Validation and Traceability (validation.md)

**PREREQUISITE**: Generation of all previous documents.
**GOAL**: To perform a final check guaranteeing complete traceability.
**YOUR TASK**: Generate the content for \`validation.md\` and wrap it in <<<validation_START>>> and <<<validation_END>>> delimiters.

**Strict Document Template**:
\`\`\`markdown
# Validation Report

## 1. Requirements to Tasks Traceability Matrix
| Requirement | Acceptance Criterion | Task(s) | Status |
|---|---|---|---|

## 2. Coverage Analysis
- **Total Acceptance Criteria**: [M]
- **Coverage Percentage**: 100%
- **✗ Missing Criteria**: [Must be empty]
- **! Invalid References**: [Must be empty]

## 3. Final Validation
All acceptance criteria are traced to tasks. The plan is validated.
\`\`\`
**Final Approval Gate**: Conclude with: "Validation complete. Traceability matrix confirms 100% coverage. Type 'execute' to begin implementation."`,
    [Phase.COMPLETE]: 'The process is complete. You can review the generated documents.',
    [Phase.EXECUTION]: 'Execution phase.',
};
