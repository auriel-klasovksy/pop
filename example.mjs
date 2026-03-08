import { popCompiler } from "./compiler.mjs"

var res = await popCompiler([
    "a node is a structure that holds a value and a reference to the next node (might be null)",
    "a linked list is a structure that points to the head node of the list",
    "list copy is a function that takes a linked list and return a deep copy of it. This is done by first creating a reverse copy of the list and then reversing it",
    "a list reverser takes a linked list and reverse its values in place, by using a stack and a while loop",
    "a doubler takes a linked list of numbers and return a new list of them doubled",
    "a sumdbler takes a linked list and sum the doubles of all entries"
])

console.log("\n\n\n\n\n\n")
console.log(res.join("\n\n"))