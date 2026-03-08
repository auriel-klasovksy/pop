🧠 POP

POP is not really a programming language — it is a programming dialect.

Instead of writing code directly, developers describe functions and data structures in natural language, and the POP compiler converts those descriptions into executable code in a target programming language.

The idea is to treat software development more like specification writing and less like manual code authoring.

💡 Core Idea

A POP program is simply an array of natural language paragraphs.

Each paragraph describes either:

🔹 a data structure
🔹 a function

The POP compiler processes these descriptions and produces code implementing them.

Example description
"a node is a structure that holds a value and a reference to the next node (might be null)"

From this, POP generates the appropriate structure in the chosen language.

⚙️ Architecture

The POP compiler works in three stages.

Natural Language
       │
       ▼
   🏷 Naming
       │
       ▼
   ✍ Signature
       │
       ▼
   🧩 Implementation
       │
       ▼
   Generated Code
🏷 1. Naming

The compiler first analyzes each paragraph to determine:

✔ whether it describes a function or data structure
✔ the canonical technical name
✔ possible variations and synonyms

This step helps the compiler understand how different descriptions might refer to the same concept.

Example naming output
linked list
linkedList
list head structure
chain list
✍ 2. Signature Generation

Next, POP generates a language-valid signature for the function or structure.

This includes:

• parameters
• return types (or type hints)
• references to previously defined objects

The compiler also builds a dictionary mapping natural language terms to technical names.

🧩 3. Code Generation

Finally, POP generates the implementation for the described object using:

• the generated signature
• the object dictionary
• previously defined structures and functions

The output is valid code in the target programming language.
