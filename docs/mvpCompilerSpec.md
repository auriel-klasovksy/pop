# POP Compiler Specification

**Version:** MVP 1.0  
**Target language:** TypeScript  
**Status:** Implemented

---

## Introduction

This document describes the architecture, pipeline, data structures, compilation policy, and design decisions of the POP compiler MVP.

The compiler accepts a POP document — a structured natural-language specification written in the POP language — and produces a TypeScript source file. It is not a conventional compiler. It does not parse a formal grammar or apply deterministic transformation rules. It is an intent compiler: a pipeline of directed AI inference stages, each constrained by the shared knowledge of the POP language and the structured outputs of previous stages.

The compiler's primary obligation is not to produce code. It is to produce code that accurately reflects programmer intent. When intent is unclear, the compiler must say so. It must not improvise, fill gaps silently, or emit runtime stubs to paper over ambiguity. It should complain about missing ideas before it complains about anything else.

This specification was written after the implementation. Where implementation and specification diverge, the specification describes the intended behavior. Deferred items are noted explicitly.

---

## Scope

This specification covers:

- The POP document model as understood by the compiler
- The six-stage compilation pipeline
- Internal data structures produced and consumed at each stage
- The findings system and compilation policy
- The stability model and how it is applied
- Type Intent Contracts and their role in the pipeline
- The two available interfaces: React UI and CLI

This specification does not cover:

- The POP language itself (see the POP Language Specification)
- Actions (deferred from MVP)
- Imports (deferred from MVP)
- Scoped modifiers (deferred from MVP)
- Deterministic compilation or stability scoring systems

---

## The POP Document Model

A POP document is a plain-text file. It consists of entity declarations. Each entity declaration begins with a header tag on its own line and continues until the next header tag.

### Header syntax

```
[kind name]
```

The header must appear alone on its line. Whitespace after the closing bracket is ignored. Everything between this header and the next is the entity body.

```
[modifier]
All functions are async and use TypeScript strict mode.

[type User]
A registered customer with an email address, a display name, and a boolean
indicating whether the account is active.

[function Register User]
Validate that the email is non-empty and contains an "@" symbol, and that the
display name is non-empty. Return the new User on success or throw a descriptive
error on failure.
```

Blank lines within an entity body are legal and preserved. An entity body may span multiple paragraphs. This is the primary reason the compiler parses by header rather than by paragraph break.

### Entity kinds (MVP)

| Kind | Syntax | Named |
|---|---|---|
| Modifier | `[modifier]` | No |
| Type | `[type Name]` | Yes |
| Function | `[function Name]` | Yes |

Actions are defined in the POP Language Specification but are deferred from this MVP. The compiler will emit a warning for `[action]` blocks and skip them.

### Naming rules

- Types and functions require explicit names.
- Names must be unique across all types and functions in the document.
- Name comparison is case-sensitive.
- Duplicate names produce a compile error.

---

## Compilation Pipeline

The compiler executes six sequential stages. Each stage may produce findings. Errors at any stage halt the pipeline before the next stage begins. Warnings allow the pipeline to continue.

```
Stage 1 — Parse
Stage 2 — Intent Analysis
Stage 3 — Type Intent Contracts
Stage 4 — Function Signatures
Stage 5 — Function Implementations
Stage 6 — Assembly
```

All findings from all stages are collected and returned together at the end of compilation.

---

### Stage 1 — Parse

**Type:** Deterministic (no AI)  
**Input:** Raw POP document source  
**Output:** `ParsedEntities`, parse-level `Finding[]`

The parser scans the document line by line, looking for header patterns. When a header is found, a new segment begins. The previous segment is closed and pushed to the segment list. Body lines accumulate until the next header.

**Structural checks performed at parse time:**

- Content appearing before the first entity header is flagged as a warning and ignored.
- An empty modifier body is a warning.
- An empty function or type body is a warning.
- A function or type with no name after the kind keyword is an error.
- Any entity kind not in the supported set is a warning; the entity is skipped.
- Duplicate names across functions and types are an error.

Parse errors abort the pipeline. Parse warnings do not.

**Output structure:**

```typescript
type ParsedEntities = {
  modifiers: { body: string }[];
  types:     { name: string; body: string }[];
  functions: { name: string; body: string }[];
};
```

---

### Stage 2 — Intent Analysis

**Type:** AI-assisted  
**Input:** `ParsedEntities`, modifier context, full document source  
**Output:** `Finding[]`

This stage evaluates the stability and completeness of every entity in the document. It is the intent alignment stage. Its job is to refuse or warn loudly before any code is generated.

**Stability** measures how consistently a specification will be interpreted. If different competent programmers would reach materially different implementations from the same specification, it is unstable. The compiler should say so.

**Completeness** measures whether sufficient information exists to generate a faithful implementation. An entity may be stable but incomplete — for example, a function that clearly describes a sort algorithm but does not specify what to sort.

Stability is evaluated in document context, not in isolation. A function that references a vague concept may be perfectly stable if that concept is defined precisely by another entity in the same document. The full document source is always provided to the analyzer.

**Stability levels:**

| Level | Meaning | Policy |
|---|---|---|
| `none` | No meaningful constraints. Compiler would have to invent the entire concept. | Error |
| `low` | Concept named but all meaningful decisions left open. | Error |
| `medium` | Clear direction but some decisions ambiguous. | Warning |
| `high` | Tightly constrained. Competent programmers would reach equivalent implementations. | No finding |

**Critical design decision:** The AI model returns a structured stability level. The compiler maps that level to a finding severity using a deterministic policy function. The model never decides whether something is an error or a warning. That decision belongs to the compiler.

```typescript
function stabilityToFindingLevel(stability: string): "error" | "warning" | null {
  if (stability === "none" || stability === "low") return "error";
  if (stability === "medium")                      return "warning";
  return null; // "high" — no finding
}
```

This separation ensures that policy changes do not require prompt changes, and that the same analyzer output can be applied under different policy regimes in future.

**Finding structure from this stage:**

```typescript
type Finding = {
  level:     "error" | "warning";
  entity:    string;   // e.g. "[function Register User]"
  stability: string;   // "none" | "low" | "medium" | "high"
  message:   string;   // one-line summary
  detail:    string;   // explanation and actionable suggestion
};
```

Errors from this stage abort the pipeline. The programmer must revise the specification before compilation can proceed.

---

### Stage 3 — Type Intent Contracts

**Type:** AI-assisted  
**Input:** `ParsedEntities` (types only), modifier context  
**Output:** `TypeIntentContract[]`, `Finding[]`

This is the most conceptually significant stage in the compiler. Each POP type is interpreted once and converted into a `TypeIntentContract`. All subsequent stages consume these contracts. They never re-read raw type bodies.

The purpose of this stage is to establish a single authoritative interpretation of every structural concept in the document, so that all functions share a consistent understanding of the types they work with.

**POP Types are not TypeScript types.** A POP Type encapsulates structural intent. It may describe a data shape, a role, a contract, a set of allowed values, a behavioral expectation, a styling hook, or a purely conceptual constraint that has no corresponding TypeScript output. The contract interprets what the type means and decides whether any TypeScript should be emitted.

**TypeIntentContract structure:**

```typescript
type TypeIntentContract = {
  name:                 string;    // POP entity name, exactly as written
  emittedCode:          string;    // TypeScript to emit, or empty string
  intentSummary:        string;    // one sentence: what IS this type?
  usageRules:           string[];  // rules functions must follow when using this concept
  observableProperties: string[];  // fields, behaviors, roles, or constraints
                                   // that implementations may rely on
};
```

**Emitted code options:**

| TypeScript form | Use when |
|---|---|
| `interface` or type alias | Concrete data shape with known fields |
| `class` | Type with behavioral methods |
| JSDoc `@typedef` | Conceptual type referenced only in function documentation |
| Type guard function | Type representing a validation constraint |
| Empty string | Purely conceptual; emitting TypeScript would add noise |

**Usage rules** are explicit constraints passed to every function implementation. They must be actionable. For example: *"Always check the active field before generating a greeting"* or *"Never mutate a PropertyChange after construction."*

**Observable properties** list everything an implementation may rely on — fields, methods, behaviors, roles. These are the things the implementation can touch.

Per-type findings may be produced here if a type body is too vague to generate a meaningful contract. These are surfaced as warnings.

**Serialization for downstream prompts:**

Contracts are serialized into a structured plain-text format before being passed to subsequent stages:

```
TYPE: Change Tracker
INTENT: A proxy-wrapped object that intercepts property writes and records changes.
OBSERVABLE PROPERTIES:
  - target object (the original object being tracked)
  - changes array (list of PropertyChange values)
  - all properties of the original object (transparently proxied)
USAGE RULES:
  - Use the JavaScript Proxy API to intercept property writes
  - Only record a change when the new value differs from the current value
EMITTED TYPESCRIPT:
interface ChangeTracker<T extends object> {
  changes: PropertyChange[];
}
```

---

### Stage 4 — Function Signatures

**Type:** AI-assisted  
**Input:** `ParsedEntities` (functions only), `TypeIntentContract[]`, modifier context  
**Output:** `FunctionSignatureArtifact[]`, `Finding[]`

This stage generates TypeScript function signatures without bodies. All type contracts are provided. The generator is explicitly instructed not to invent types and not to deviate from the contracts.

**FunctionSignatureArtifact structure:**

```typescript
type FunctionSignatureArtifact = {
  entityName:    string;    // POP function name
  signatureCode: string;    // TypeScript function signature, no body
  dependencies:  string[];  // names of types or functions this depends on
};
```

Each signature includes a JSDoc comment reproducing the POP function description. This preserves intent in the generated output.

Modifiers are respected. An async modifier produces async function signatures. A strict mode modifier produces signatures consistent with TypeScript strict conventions.

Errors from this stage abort the pipeline.

---

### Stage 5 — Function Implementations

**Type:** AI-assisted, one call per function  
**Input:** `ParsedEntities` (functions only), `TypeIntentContract[]`, `FunctionSignatureArtifact[]`, modifier context  
**Output:** `FunctionImplementationPart[]`, `Finding[]`

This stage generates the body of each function. Functions are implemented individually, one per AI call.

**Every TypeIntentContract is passed to every function implementation.** The MVP does not filter contracts by relevance. This is a deliberate design choice: relevance filtering introduces a failure mode where the compiler withholds a concept the function actually needed. Passing all contracts is simpler, more predictable, and easier to debug. Token efficiency is not an MVP concern.

The implementation context passed to every function call:

```typescript
type ImplementationContext = {
  modifiers:         string[];                    // document-wide constraints
  typeContracts:     TypeIntentContract[];         // all types, serialized
  functionSignatures: FunctionSignatureArtifact[]; // all signatures
};
```

**Critical rules enforced by the implementation prompt:**

- Conform exactly to the provided signature — same name, same parameters, same return type.
- Treat every TypeIntentContract as the single source of truth for that concept. Do not reinterpret raw type bodies.
- Do not re-emit type declarations.
- Do not emit inline warning comments, TODOs, or runtime stubs to paper over ambiguity.
- Do not import modules unless modifiers or specs explicitly require them.

**Abort signal:** If the implementation generator cannot produce a faithful implementation, it responds with a structured abort signal rather than emitting broken or incomplete code:

```json
{ "abort": true, "reason": "The function references a persistence layer that is not defined anywhere in the document and cannot be inferred." }
```

The compiler detects this, converts it into an error finding, and halts. The programmer must revise the specification.

This is a fundamental principle: compile-time findings are always preferable to runtime surprises.

**FunctionImplementationPart structure:**

```typescript
type FunctionImplementationPart = {
  label: string;  // e.g. "// ── Function: Register User"
  code:  string;  // complete TypeScript function implementation
};
```

---

### Stage 6 — Assembly

**Type:** Deterministic (no AI)  
**Input:** `TypeIntentContract[]`, `FunctionImplementationPart[]`  
**Output:** TypeScript source string

The assembler concatenates the compiled output in a fixed order:

1. File header with generation timestamp and do-not-edit notice
2. Type sections (only contracts where `emittedCode` is non-empty), each preceded by a section comment
3. Function sections, each preceded by a section comment

```typescript
// Generated by POP Compiler — 2025-01-01T00:00:00.000Z
// Do not edit directly. Modify the POP specification and recompile.

// ── Type: User
interface User {
  email: string;
  displayName: string;
  active: boolean;
}

// ── Function: Register User
function registerUser(email: string, displayName: string): User {
  // ...
}
```

Types are not re-generated during this stage. They appear exactly as produced by the Type Intent Contracts stage. Functions appear exactly as produced by the Implementation stage. The assembler performs no transformation.

---

## The Findings System

Findings are first-class compiler output. They are not side effects of code generation. A compiler run that produces only findings and no output is a valid and informative result.

### Finding structure

```typescript
type Finding = {
  level:      "error" | "warning";
  entity:     string | null;   // which entity this concerns, or null for document-level
  stability?: string;          // if produced by the intent analyzer
  message:    string;          // short one-line summary
  detail:     string;          // actionable explanation and suggestion
};
```

### Finding levels

| Level | Meaning | Effect on compilation |
|---|---|---|
| `error` | The compiler cannot proceed faithfully. | Aborts the pipeline after the current stage completes. |
| `warning` | The specification has a concern, but the compiler can continue with dissatisfaction. | Compilation proceeds. Findings are returned alongside output. |

### Hardcoded policy (MVP)

The MVP uses a single hardcoded policy. A more sophisticated policy system — where teams can configure different thresholds — is a future concern. The current policy:

- `none` stability → error
- `low` stability → error
- `medium` stability → warning
- `high` stability → no finding
- Structural problems (missing names, duplicates, empty bodies) → error or warning based on severity
- Implementation abort signals → error

### Findings are part of the authoring process

Findings are not just error messages. They are observations about the specification. Each finding must explain why the problem exists and suggest how the programmer can improve the specification. A finding that says only "too vague" is not useful. A finding that says "the function references a persistence layer but no storage mechanism is defined in the document or modifiers — add a modifier specifying the database or ORM" is useful.

The compiler should not silently repair ambiguous or unstable specifications. It should return findings and refuse to guess.

---

## Stability

Stability is a first-class property of POP specifications. It is not a property of implementations.

A specification is stable when different competent programmers, given the same specification, would produce materially equivalent implementations. Stability measures how much implementation freedom remains within a specification.

### Stability is not binary

The compiler recognizes four levels: `none`, `low`, `medium`, `high`. These map to the range from fully unconstrained to tightly constrained, not to a pass/fail outcome.

### Stability is evaluated in document context

An entity is not evaluated in isolation. A function that seems vague may be fully stable when the document also defines the types and concepts it references. The full document is always provided to the stability analyzer.

### Delegation is not the same as instability

Delegating implementation decisions to the compiler is one of the primary benefits of AI-assisted development. Low or medium stability is not inherently wrong. It becomes a problem only when the programmer did not intend to delegate — when the vagueness is accidental rather than conscious.

Stability exists so that delegation becomes a visible, deliberate choice rather than an invisible risk.

---

## Type Intent Contracts

Type Intent Contracts are the mechanism by which the compiler achieves consistent type interpretation across all functions.

### The problem they solve

Without contracts, each function implementation stage would receive raw POP type bodies and interpret them independently. Different functions might arrive at different understandings of the same type. The generated code might compile but contain subtle semantic inconsistencies — `PropertyChange` treated as mutable in one function and immutable in another, for example.

### The solution

Every type is interpreted exactly once, in Stage 3, before any function code is generated. The interpretation produces a contract: an explicit statement of what the type means, what properties it exposes, what rules govern its use, and what TypeScript it emits (if any).

All downstream stages receive the serialized contracts, not the raw type bodies. The serialization format is designed to be unambiguous in a prompt context — structured plain text with explicit labels.

### Conceptual types

Some POP types do not correspond to TypeScript types. A type called `Authenticated User` might describe a role or security invariant rather than a data shape. A type called `Loading State` might describe a UI concern. A type called `Change Tracker` might describe a behavioral wrapper implemented via `Proxy`.

For these types, `emittedCode` may be empty, or may be a JSDoc comment. The contract still carries `intentSummary`, `usageRules`, and `observableProperties`, which guide function implementations even when no TypeScript is emitted.

This is a significant departure from conventional compilers, where types are always emitted as type declarations. In a POP compiler, a type's primary value is its intent, not its TypeScript representation.

---

## Interfaces

The compiler is available in two forms. Both implement the identical six-stage pipeline. The compilation logic is not shared via a module in the current implementation; the two versions maintain parallel copies of the core pipeline. Factoring this into a shared module is a future improvement.

### React UI (`pop-compiler.jsx`)

A browser-based interface for interactive use.

**Features:**
- Inline editor for POP specifications
- Compile button triggering the full pipeline
- Progress bar across compilation stages
- Slide-up panel displaying findings or generated TypeScript output
- Expandable finding rows with detail text
- Copy button for findings and output
- Findings are colour-coded by severity

**Design notes:**
- All diagnostic output is displayed in the slide-up panel, not inline in the editor
- The output panel opens automatically on successful compilation
- The findings panel opens automatically when compilation begins
- The editor fills the available screen, optimised for mobile use

### CLI (`pop-compiler.mjs`)

A Node.js ES module for terminal use, CI integration, and scripting.

**Requirements:** Node.js 18 or later (built-in `fetch`), `ANTHROPIC_API_KEY` environment variable.

**Usage:**

```bash
# Compile — writes output.ts next to input.pop by default
node pop-compiler.mjs spec.pop

# Explicit output path
node pop-compiler.mjs spec.pop -o generated/output.ts

# Print TypeScript to stdout (for piping)
node pop-compiler.mjs spec.pop --stdout

# Run analysis only — no code generation
node pop-compiler.mjs spec.pop --findings-only
```

**Output behaviour:**
- All diagnostic output (stage labels, findings, summary) goes to `stderr`
- Generated TypeScript goes to the output file or `stdout`
- This separation keeps `--stdout` mode safe for piping

**Exit codes:**

| Code | Meaning |
|---|---|
| `0` | Compiled successfully. Warnings may be present. |
| `1` | Compilation aborted due to one or more errors. |
| `2` | Usage error or input file not found. |

**Findings format (stderr):**

```
  error [low] [function Example]: Implementation aborted: ...
    The function references a persistence layer not defined in the document.
    Add a modifier specifying the database or ORM.
```

**The `--findings-only` flag** runs the parse and intent analysis stages without generating any code. This is useful as a pre-commit check or in CI to validate that a specification meets stability requirements before generation is attempted.

---

## Prompt Architecture

Each AI stage uses the shared `POP_KNOWLEDGE` constant as its system prompt foundation. This constant contains the core principles of POP, stability level definitions, entity kind descriptions, completeness requirements, the findings philosophy, and the type intent contract principle.

All generation prompts include:

> Do not reinterpret POP Type bodies directly during function implementation. Use the provided Type Intent Contracts as the authoritative meaning of each Type.

This principle appears in `POP_KNOWLEDGE` so it is present in every stage without requiring per-prompt maintenance.

### Structured outputs

AI responses that produce compiler data structures (stability assessments, contracts, signatures) are requested as JSON. Responses are stripped of any markdown fences before parsing. Parse failures produce a warning and, in critical stages, an error.

### Abort signals

When a generation stage cannot produce faithful output, it is instructed to return a structured abort signal rather than broken code:

```json
{ "abort": true, "reason": "..." }
```

The compiler checks for this pattern before treating the response as code. If detected, the reason is surfaced as an error finding and the function is skipped.

---

## Design Decisions

### Why header-delimited parsing?

Early versions of the compiler split documents on blank lines, treating each paragraph as an entity. This broke entities whose bodies contained intentional blank lines — for example, a type describing multiple distinct concepts, or a function with multi-paragraph requirements.

Header-delimited parsing is more robust. An entity begins at its header and continues until the next header. Blank lines within a body are meaningful and preserved.

### Why separate stability assessment from policy?

The AI model is well-positioned to assess how stable a specification is. It is not well-positioned to decide organizational policy about what level of stability is acceptable.

By having the model return a structured stability level and having the compiler apply policy deterministically, the two concerns are separated. Policy can change without prompt changes. Different teams can apply different policies to the same compiler output.

### Why pass all contracts to every function?

Relevance filtering — deciding which types a given function actually needs — introduces a failure mode: the compiler might decide a concept is irrelevant when the function actually requires it.

Passing all contracts is simpler, more predictable, and easier to debug. In the MVP, token budget is not a constraint. If documents grow large enough that this becomes a problem, a relevance selection stage can be added later.

### Why no inline warning stubs?

A function implementation that emits a stub throwing a runtime error is worse than no implementation at all. It appears to compile successfully, it appears to run, and it fails at runtime in ways that may be hard to trace back to the original specification gap.

Compile-time findings are always preferable to runtime surprises. If a function cannot be implemented faithfully, the compiler should say so clearly and halt. The programmer should fix the specification, not work around a stub.

### Why is type generation not repeated in the implementation stage?

Previous versions generated types twice — once in a combined type-and-signature planning stage, and again during implementation. This created a risk of inconsistency: the TypeScript type might differ between the two generations.

With Type Intent Contracts, types are generated exactly once. The implementation stage receives the serialized contracts and the already-emitted TypeScript. It is explicitly instructed not to re-emit type declarations.

---

## Deferred Items

The following are explicitly outside the scope of this MVP and may be addressed in future versions.

**Actions.** The `[action]` entity kind is defined in the POP Language Specification. It is not implemented in this compiler. Actions describe executable runtime behavior and introduce concerns around document order, async wrapping, and top-level statements that are better addressed once the type and function pipeline is stable.

**Imports.** The `[import]` entity kind allows one POP document to expose entities from another. Not implemented.

**Scoped modifiers.** Modifiers currently apply to the entire document. Scoped modifiers that apply to a subset of entities are not implemented.

**Relevance filtering.** Currently all TypeIntentContracts are passed to every function implementation. A relevance selection stage could reduce prompt size for large documents.

**Shared compiler core.** The React UI and CLI currently maintain parallel copies of the compilation pipeline. A shared JavaScript module would reduce duplication and ensure the two interfaces stay in sync.

**TypeScript validation.** The compiler does not validate that generated TypeScript compiles correctly. A post-assembly stage that runs `tsc` and surfaces type errors as findings would improve confidence in the output.

**Stability scoring.** The current stability assessment is qualitative. A more precise scoring system — with numeric thresholds and configurable policies — could give teams finer control over compilation behaviour.

**Compiler policy configuration.** The MVP uses a hardcoded policy. Future versions may allow teams to configure different stability thresholds, warning vs. error treatments, and finding filters.

---

## Appendix — Example Document

```
[modifier]
Use TypeScript strict mode conventions. All functions are pure and stateless.

[type User]
A registered customer with an email address, a display name, and a boolean
indicating whether the account is active.

[type Validation Error]
Represents a failed validation. Contains a field name and a human-readable
description of why validation failed.

[function Validate Registration]
Ensure the email is non-empty and contains an "@" symbol, and that the display
name is non-empty. Return a list of Validation Errors, which will be empty if
the input is valid.

[function Register User]
Run Validate Registration on the input. If there are any Validation Errors,
throw an error describing the first failure. Otherwise return a new active User.

[function Greet User]
Return a greeting string for the User. If the account is inactive, return a
message indicating the account is suspended instead of a greeting.
```

This document has high stability throughout. The modifier establishes coding conventions. The types are concrete and well-described. The functions reference each other by name and describe their behavior in terms of the defined types. A compiler running this document should produce no findings and generate faithful TypeScript.
