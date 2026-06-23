POP Reviewing Skill

Purpose

This skill teaches an AI system how to review and improve POP specifications.

This skill assumes knowledge of the POP language.

The goal is not to compile the specification.

The goal is not to generate code.

The goal is to improve the quality of a POP document while preserving the author's intent.

A reviewer should think like an architect, technical lead, or experienced engineer.

The output of this skill is a review of a POP document.

Reviews may contain:

- findings
- recommendations
- notes
- questions
- proposed refactorings

---

Reviewing Philosophy

The purpose of POP review is to improve the communication of intent.

A reviewer should not rewrite a specification merely to match personal preferences.

Every suggestion should improve one or more of:

- clarity
- stability
- completeness
- maintainability
- readability
- reusability

If a specification is already good, the reviewer should say so.

---

Findings, Recommendations, and Notes

Findings

Findings describe objective problems.

Examples:

- missing concepts
- unstable requirements
- contradictory requirements
- unresolved references
- missing assumptions

A finding should explain:

- what the problem is
- why it matters
- how it can be improved

---

Recommendations

Recommendations describe potential improvements.

Examples:

- extracting a concept
- renaming an entity
- reorganizing a document
- simplifying a specification

Recommendations are suggestions rather than requirements.

A specification may be valid even if recommendations are not adopted.

---

Notes

Notes are observations.

Examples:

- effective decomposition
- particularly clear concepts
- opportunities for reuse
- recurring patterns

Notes help the author understand the strengths of the specification.

---

Stability

Stability is one of the most important review concerns.

Stability measures how much control over the implementation remains with the author.

A specification is stable when different competent implementors would preserve the same meaning.

A specification is unstable when important decisions have been delegated to the compiler.

Weak:

[function Sort Users]

Sort users.

Stronger:

[function Sort Users]

Sort users by creation date descending.

The goal is not to eliminate implementation freedom.

The goal is to ensure that important decisions belong to the author.

Reviewers should focus on preserving intent rather than controlling implementation.

---

Review Checklist

Concepts

Does this entity represent a complete idea?

Are important concepts named?

Are there unnamed concepts hiding inside larger entities?

Would extracting a Type improve clarity?

Would combining multiple entities improve clarity?

---

Naming

Are the entity names good representations of the ideas they describe?

Would a reader understand the purpose of an entity from its name alone?

Are any names overly broad, vague, or misleading?

Could a better name improve understanding?

---

Structure

Are entities arranged in an order that makes sense for human readers?

Can the document be understood from top to bottom?

Are related concepts located near each other?

Does the document introduce concepts before using them?

Entity order does not affect compilation, but it does affect readability.

---

Stability

Would different competent implementors preserve the same meaning?

Are important decisions explicit?

Are assumptions visible?

Are security-sensitive decisions specified?

Are dependency assumptions specified?

Are framework assumptions specified?

Are there hidden requirements that should be made explicit?

---

Completeness

Does every referenced concept exist?

Can each entity be reasonably implemented?

Are important behaviors described?

Are contracts sufficiently specified?

Is additional information required to preserve intent?

---

Intent

Is this entity focused too much on implementation details?

Can implementation details be removed without losing meaning?

Does the specification describe intent rather than construction?

Is the specification relying on target-language details unnecessarily?

Can the compiler reasonably choose an implementation without affecting the author's intent?

---

Maintainability

Is this the most natural and efficient way to express the system?

Can concepts be modified independently?

Is there duplication?

Would future readers understand this quickly?

Are responsibilities clearly separated?

Would future modifications naturally fit into the current structure?

---

Recognizing Missing Concepts

Many POP specifications become difficult to understand because they contain unnamed concepts.

Reviewers should actively search for concepts that deserve names.

For example:

[function Todo List Component]

Render filter buttons.

Display the selected filter.

Handle filter selection.

may suggest:

[type Todo Filter Controls]

A reviewer should frequently ask:

«Is there a concept here that deserves a name?»

When important ideas receive names, specifications often become:

- clearer
- more stable
- easier to maintain
- easier to extend

---

Recognizing Over-Specification

Not all implementation freedom is a problem.

Different implementations are expected.

Reviewers should avoid recommending implementation details merely to reduce compiler freedom.

For example:

Render a heading with text "Todos".

does not necessarily require:

Use an h2 element.

unless the heading level is important.

Reviewers should focus on preserving intent rather than controlling code generation.

---

Recognizing Under-Specification

Reviewers should identify places where important decisions have been delegated to the compiler.

Examples:

Sort users.

without specifying sort order.

Hash passwords securely.

without specifying security assumptions.

Validate registration requests.

without specifying validation rules.

Important decisions belong to the author.

Unimportant decisions may be left to the compiler.

---

Successful Reviews

A successful review:

- improves clarity
- improves stability
- improves maintainability
- preserves intent
- avoids unnecessary implementation detail
- helps future readers understand the specification

The goal of POP review is not to control the implementation.

The goal of POP review is to improve the communication of intent.