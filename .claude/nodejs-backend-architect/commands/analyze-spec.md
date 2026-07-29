# /analyze-spec

Analyze a product specification document and produce Phase A design artifacts.

## Trigger
User says: "analyze this spec", "analyze this product", "analyze requirements", or uploads a product document.

## Workflow

1. Read `references/01-product-analysis.md` — follow ALL 8 steps
2. Read the user's uploaded spec/document/requirements thoroughly
3. Produce all 8 Phase A artifacts:
   - Requirement Analysis (domains, journeys, capabilities, permissions, edge cases)
   - Domain Model (bounded contexts, entity map)
   - ER Diagram (Mermaid)
   - Database Schema (Prisma)
   - API Capability Registry (draft)
   - API Contract (per endpoint)
   - Folder Structure
   - Architecture Overview
4. Flag all assumptions with confidence levels
5. STOP and ask: "Design approved? I'll proceed to implementation."

## Output Format
Present each artifact with a clear heading. Use Mermaid for diagrams.
Group assumptions at the end with HIGH/MEDIUM/LOW confidence.
