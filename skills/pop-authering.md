POP Authoring Skill

Purpose

This skill teaches an AI system how to transform requirements into high-quality POP specifications.

The goal is not to generate code.

The goal is not to generate implementation details.

The goal is to produce a stable, complete, human-readable POP specification that accurately communicates intent.

A good POP document should be understandable by both humans and compilers. It should expose the important concepts of a system, hide unnecessary implementation details, and make future modification easy.

The output of this skill is a POP document.

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

Implementation details belong in the specification only when they materially affect behavior, performance, compatibility, security, or correctness.

Concepts over construction

A POP document should describe concepts, not assembly instructions.

Prefer:

Render Todo Filter Controls.

Over:

Render three buttons.
Render the selected button.
Wire up click handlers.

When a concept becomes important enough to discuss, name it and define it.

Complete units of intent

Functions should describe complete behavior.

Avoid creating entities that represent isolated implementation steps unless those steps have independent meaning within the domain.

Prefer:

[function Validate Registration Request]

Over:

[function Validate Email]

[function Check Password Length]

[function Check Email Format]

unless those concepts are independently meaningful and reusable.

Stability matters

A specification is stable when different competent implementors would produce substantially similar behavior.

When writing POP, actively look for missing decisions.

Weak:

[function Sort Users]

Sort users.

Stronger:

[function Sort Users]

Sort users by creation date descending.

The purpose of POP is not to eliminate decisions.

The purpose of POP is to ensure the important decisions belong to the programmer.

Trust the compiler

Do not specify details simply because they exist.

Many implementation decisions can safely be left to the compiler.

For example:

Render a heading with text "Todos".

does not require:

Use an h2 element.

unless the heading level is important.

A POP specification should communicate intent, not micromanage code generation.

---

Using Types

Types describe concepts

A POP Type is not necessarily a target-language type.

Types describe structural intent.

Examples include:

- data structures
- contracts
- roles
- state
- styling hooks
- behavioral concepts
- UI concepts

Valid examples:

[type User]

A registered user with an email address and creation date.

[type Todo Filter Controls]

A control group that displays one button for each Todo Filter value.

[type Todo List CSS Classes]

Use "todo-list" for the container.

Use "todo-row" for todo rows.

Use "completed" for completed rows.

All of these are legitimate POP Types.

Extract concepts when findings accumulate

If a Function begins accumulating findings around a particular idea, consider extracting that idea into a Type.

Example:

Instead of repeatedly explaining filter buttons inside a component:

[function Todo List Component]

...

create:

[type Todo Filter Controls]

...

and reference it.

This usually produces more stable and maintainable specifications.

---

Using Functions

Functions describe reusable behavior.

A Function should answer:

«What behavior does this concept provide?»

Good examples:

[function Sort Todos]

Given an array of Todo values, return a new array sorted by creation date descending.

[function Create Change Tracker]

Create a Change Tracker around any object.

Functions should focus on behavior rather than internal mechanics.

---

Using Modifiers

Modifiers provide document-wide context.

Modifiers influence how all other entities should be understood.

Examples:

[modifier]

Target output is TypeScript.

[modifier]

All file operations are asynchronous.

[modifier]

Use plain semantic HTML elements.

Avoid repeating the same instruction across multiple entities when a Modifier can communicate it once.

---

Recognizing Missing Concepts

Many unstable POP specifications are actually missing concepts.

When a Function becomes long, repetitive, or difficult to describe, ask:

«Is there a concept here that deserves a name?»

If the answer is yes, introduce a Type and reference it.

POP specifications generally improve when important ideas become named concepts.

---

Intent and Realization

Different code does not necessarily indicate instability.

Different intent indicates instability.

Avoid introducing implementation details solely to reduce compiler freedom.

Specify realization details only when they materially affect:

- behavior
- safety
- compatibility
- accessibility
- performance
- external contracts
- maintainability

Otherwise, allow the compiler to choose an appropriate implementation.

---

Success Criteria

A POP specification is successful when:

- Humans can understand it quickly.
- Important concepts have names.
- Important decisions are explicit.
- Unimportant decisions are left to the compiler.
- The compiler can generate code with few or no findings.
- Different implementations preserve the same meaning.

The purpose of POP is not to produce code.

The purpose of POP is to communicate intent.