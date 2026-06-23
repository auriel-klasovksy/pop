POP Authoring Skill

Purpose

This skill teaches an AI system how to transform requirements into high-quality POP specifications.

This skill assumes knowledge of the POP language.

The goal is not to generate code.

The goal is to produce a stable, complete, human-readable POP specification that accurately communicates intent.

A good POP document should expose important concepts, hide unnecessary implementation details, and make future modification easy.

The output of this skill is a POP document.

---

Authoring Philosophy

When writing POP, think like a software architect rather than an implementor.

Focus on:

- concepts
- behavior
- relationships
- assumptions
- intent

Avoid thinking about:

- syntax
- APIs
- framework details
- implementation mechanics

unless those details materially affect the behavior of the system.

---

Authoring Process

When converting requirements into POP:

1. Identify Concepts

Identify the important ideas in the system.

Ask:

«What concepts exist regardless of implementation?»

Many concepts should become Types.

Examples:

- User
- Registration Request
- Change Tracker
- Todo Filter
- Todo Filter Controls

Do not limit Types to target-language data structures.

---

2. Identify Behavior

Identify the important behaviors in the system.

Ask:

«What reusable behavior does the system provide?»

Many behaviors should become Functions.

Examples:

- Validate Registration Request
- Create User
- Sort Todos
- Create Change Tracker

Functions should describe behavior rather than implementation.

---

3. Identify Context

Identify assumptions that apply throughout the document.

Ask:

«Would this instruction need to be repeated many times?»

If yes, it may belong in a Modifier.

Examples:

- Target output is TypeScript.
- Use plain semantic HTML.
- All file operations are asynchronous.

---

4. Improve Stability

Look for important decisions that have not yet been made.

Weak:

[function Sort Users]

Sort users.

Stronger:

[function Sort Users]

Sort users by creation date descending.

Important decisions belong to the author.

Unimportant decisions may be delegated to the compiler.

---

Concept Extraction

One of the most important authoring techniques in POP is concept extraction.

When a Function becomes difficult to describe, ask:

«Is there a concept here that deserves a name?»

For example:

[function Todo List Component]

Render filter buttons.

Display the selected filter.

Handle filter selection.

may suggest:

[type Todo Filter Controls]

Naming a concept often improves:

- clarity
- stability
- maintainability
- reusability

---

Complete Ideas

Entities should represent complete ideas.

Avoid creating entities that describe tiny implementation steps.

Prefer:

[function Validate Registration Request]

Over:

[function Check Password Length]

[function Check Email Format]

unless those concepts are independently meaningful and reusable.

A good rule of thumb:

«Functions should do one thing well.»

---

Trust the Compiler

Do not specify details merely because they exist.

Many implementation decisions can safely be left to the compiler.

For example:

Render a heading with text "Todos".

does not require:

Use an h2 element.

unless the heading level is important.

Author intent.

Do not micromanage implementation.

---

Security and External Dependencies

Security-sensitive behavior should include explicit assumptions.

Weak:

[function Hash Password]

Generate a secure password hash.

Stronger:

[modifier]

Target output is Node.js.

[modifier]

Use the argon2 package for password hashing.

[function Hash Password]

Generate an Argon2id password hash from a plain text password.

The compiler should not be forced to make security decisions.

---

Naming

Names are part of the specification.

Names should accurately describe the ideas they represent.

Prefer:

[function Validate Registration Request]

Over:

[function Process User]

A reader should understand the purpose of an entity from its name.

---

Avoid Implementation Leakage

Avoid describing:

- framework APIs
- helper functions
- target-language syntax
- implementation mechanics

unless those details materially affect behavior.

Weak:

Use a JavaScript Proxy.

Stronger:

Behave like another object while recording property changes.

The implementation can be chosen later.

---

Successful POP Documents

A successful POP document:

- communicates intent clearly
- names important concepts
- contains complete ideas
- makes important decisions explicit
- hides unnecessary implementation details
- is understandable by humans
- can be implemented consistently

When in doubt:

Ask:

«Am I describing the system?»

Or:

«Am I describing the code?»

Prefer describing the system.