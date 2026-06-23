POP Language Skill

Purpose

This document teaches an AI system the POP language.

POP (Prompt-Oriented Programming) is an implementation of Intent-Oriented Programming.

Intent is written directly as code.

Implementation is derived from it.

The purpose of POP is to minimize the gap between what the programmer means and what the compiler builds.

A POP document is a human-readable software specification composed of named entities.

The compiler analyzes those entities, reports findings when necessary, and generates code.

---

Core Principles

Intent over implementation

POP specifications describe what a system means and what it should do.

They should not describe how the target language happens to implement those ideas unless the implementation mechanism is itself important.

Prefer:

[type Change Tracker]

An object that behaves like another object while recording Property Change values.

Over:

[type Change Tracker]

An object implemented using a JavaScript Proxy.

Implementation details belong in the specification only when they materially affect:

- behavior
- performance
- compatibility
- security
- correctness

---

Concepts over construction

POP documents describe concepts rather than assembly instructions.

Prefer:

Render Todo Filter Controls.

Over:

Render three buttons.
Render the selected button.
Wire up click handlers.

When an idea becomes important enough to discuss, it usually deserves a name.

---

Complete ideas

Entities should represent complete ideas.

Avoid creating entities that represent tiny implementation steps unless those steps have independent meaning.

Prefer:

[function Validate Registration Request]

Over:

[function Validate Email]

[function Check Password Length]

unless those concepts are independently meaningful and reusable.

---

Entity Types

POP MVP supports three entity kinds.

Modifier

Modifiers provide document-wide context.

Modifiers influence how all other entities should be understood.

Example:

[modifier]

Target output is TypeScript.

Example:

[modifier]

Use plain semantic HTML elements.

Avoid repeating instructions that can be communicated through a modifier.

---

Type

Types describe concepts.

A POP Type is not necessarily a target-language type.

Types may describe:

- data structures
- contracts
- state
- roles
- styling hooks
- behavioral concepts
- UI concepts

Examples:

[type User]

A registered user with an email address and creation date.

[type Todo Filter Controls]

A control group that displays one button for each Todo Filter value.

[type Todo List CSS Classes]

Use "todo-list" for the container.

Use "todo-row" for todo rows.

---

Function

Functions describe reusable behavior.

A Function should answer:

«What behavior does this concept provide?»

Example:

[function Sort Todos]

Given an array of Todo values, return a new array sorted by creation date descending.

Example:

[function Create Change Tracker]

Create a Change Tracker around any object.

Functions should focus on behavior rather than implementation.

A Function may represent:

- business logic
- UI components
- workflows
- examples
- utility behavior

as long as it represents a complete idea.

---

Stability

Stability measures how much control over the implementation remains with the author.

A specification is stable when different competent implementors would preserve the same meaning.

A specification is unstable when important decisions have been delegated to the compiler.

Weak:

[function Sort Users]

Sort users.

Stronger:

[function Sort Users]

Sort users by creation date descending.

The purpose of stability is not to eliminate implementation freedom.

Different implementations are expected.

The purpose of stability is to ensure that important decisions belong to the author.

---

Intent and Realization

Different code does not necessarily indicate instability.

Different intent indicates instability.

For example:

Render a heading with text "Todos".

may become:

<h1>Todos</h1>

or:

<h2>Todos</h2>

The implementation differs, but the intent remains the same.

Do not add implementation details merely to reduce compiler freedom.

Specify realization details only when they materially affect:

- behavior
- safety
- compatibility
- accessibility
- performance
- external contracts
- maintainability

---

Findings

The compiler may produce findings.

Findings help the author improve the specification.

Common findings include:

- instability
- missing requirements
- unresolved references
- contradictions
- target constraints

A finding is not necessarily an error.

Many findings are opportunities to improve clarity.

The compiler should complain about missing ideas or unclear meaning rather than syntax.

---

Naming

Names are important.

Names should accurately represent the ideas they describe.

Prefer:

[function Validate Registration Request]

Over:

[function Process User]

A reader should understand the purpose of an entity from its name.

---

Concept Extraction

When a specification becomes difficult to describe, it is often missing a concept.

For example:

[function Todo List Component]

Render filter buttons.

Display the selected filter.

Handle filter selection.

may suggest:

[type Todo Filter Controls]

When an important idea appears repeatedly, consider giving it a name.

---

Success Criteria

A good POP specification:

- communicates intent clearly
- names important concepts
- makes important decisions explicit
- leaves unimportant decisions to the compiler
- is understandable by humans
- can be implemented consistently by different implementors

The purpose of POP is not to produce code.

The purpose of POP is to communicate intent.