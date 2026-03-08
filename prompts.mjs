import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { PromptTemplate } from "@langchain/core/prompts";

const popError = z.object({
  description: z.string(),
  severity: z.enum(["note","warning","error","critical error"]),
  title: z.string(),
})

const runStructuredPrompt = async ({ template, schema, vars, prompt }) => {
  const openai = new OpenAI();
  const sysprompt = await template.format(vars);
  const modelInput = {
      model: "gpt-5.1-2025-11-13",
      temperature: 0.000001,
      input: [
          { role: "system", content: sysprompt },
          {
          role: "user",
          content: prompt,
          },
      ],
      text: {
          format: zodTextFormat(schema , "formatedResponse"),
      },
  }

  const response = await openai.responses.parse(modelInput);

  const res = response.output_parsed;
  return res;
};

export const llmNameGiver = async ({prompt, comments = "" , programmingLanguage}) => {
  const template = new PromptTemplate( {
  template: `You are pop, the naming convention specialist for {programmingLanguage}.
  You are given a natural language definition that describes a function or a data structure and your job is to provide diversive ways for different teams to talk about it.
  Note that the description will definitly contain the names of all sorts of objects you are not aware of, this is ok, you will get to know them in time.
  At this point in time you must only concern yourself with the naming of the function or structure described by the paragraph, not the names of the atoms it is composed by.
  Keep true to the names of other objects and functions that you encounter and treat them as Axioms set in stone, whether they have a typo, make no sense in the context or are just plain gibrish, this should not matter to you at all.
  Your response should be all sorts of possible ways for people to refer to the concept described in the definition in varius degrees of formality and contexts.
  First in the list, you should provide the name given to the structure in the paragraph you are given, this is how the team named it and how they are expected to describe it in the futere.
  After that, give it a technical description, good for people who dont know the convention but understand what the structure does.
  Then, provide a camelCase version of the name, this is how it would be written in the codebase, dont be afrait to provide a long name here, we like long descriptive names in our codebase.
  After that you should try to be creative and provide some variance, nicknames, slang, refer to minor technical details that differ from the main function etc.
  We want to make sure that everyone in the team have a convinient way to talk about it and that if they end up talking about it then we can identify it using the list that you provide.
  If the paragraph does not have a clear candidate for a name, or if the definition is too vague for a technical description, feel free to note that in the "issues" section of your response.
  
  {comments}
  `,
  inputVariables: ["programmingLanguage","comments"],
  })
  const responseSchema = z.object({
    functionOrDataStructure: z.enum(["func", "struct"]),
    givenName: z.string(),
    technicalDescription: z.string(),
    camelCaseTechnicalName: z.string(),
    variations: z.array(z.string()),
    issues: z.array(popError),
  })
  if(comments != "") {
    comments = "Here are some comments from the team regarding the definition, you can use them to better understand the context and provide a more accurate response:\n" + comments;
  }
  return await runStructuredPrompt({ template, schema:responseSchema, vars: {programmingLanguage, comments}, prompt: prompt});
}


export const llmSignatureMaker = async ({prompt, signatureName, allObjects, comments= "",  programmingLanguage}) => {
  const template = new PromptTemplate( {
  template: `You are pop, the technical writer for {programmingLanguage} functions and structures.
  You are given a natural language definition and a signature name which you should use in order to provide the full signature of the function or data structure described in the definition.
  As part of your job, you must also help the team by decipering the none technical language (using the knowledge base terminology) and asigning the true technical name of things that might be described using slang or non technical language.
  Read through the definition and cross refferance it with the object array you get in order to understand and communicate exactly what the definition is refering to.
  Be aware that you should not and cannot (with the information provided to you) make any attempt at actually implementing the function or structure.
  Implementing it requires access to tools and libraries you definitly do not have access to, even if it seems like you are able there are subtle decisions that you have not been privilaged to.
  Just focus on creating the best signature representing the intention of the paragraph to enable effective communication and task management down the line.
  You are also given a list of all other data structures avaliable in the codebase, in case you need to refer to them in the signature.
  If there is any possible confusion between the objects avaliable in the codebase and a different, standard structure, the meaning is always the existing structure in the codebase.
  Note that the paragraph will not be using the exact name of structures, but rather a variation of it.
  If the target programming language does not have types, you should provide type hinting or type annotation as part of the signature in a comment above the signature.
  The signature you provide must be valied {programmingLanguage} to be accepted.
  If the signature require types which are not avaliable in the codebase, try to be flexible and use your best guess for what the writter of the definition might have meant.
  If anything is not cristal clear then please provide your feedback in the "issues" section of your response, we want to make sure that the team can understand what is missing in the definition and provide better information in the future.

  {comments}

  #### List of all objects in the codebase ####

  {allObjects}

  #### required signature name ####

  {signatureName}
  `,
  inputVariables: ["programmingLanguage", "comments", "allObjects", "signatureName"],
} )
  const responseSchema = z.object({
    dictionary: z.array(z.object({
      termInDefinition: z.string(),
      trueName: z.string(),
    })),
    signature: z.string(),
    issues: z.array(popError),
})
  return await runStructuredPrompt({ template, schema:responseSchema, vars: {programmingLanguage, comments, allObjects, signatureName}, prompt: prompt});
}

export const llmCodeWritter = async ({prompt, signatureName, allObjects, dictionary, comments= "",  programmingLanguage}) => {
  const template = new PromptTemplate( {
  template: `You are pop, the code writer for {programmingLanguage} functions and structures.
  You are given a natural language definition and a signature name which you should use in order to provide the full code of the function or data structure described in the definition.
  You are also given a list of all other functions and data structures avaliable in the codebase, make sure that you recognize and understand when the definition is requiring you to use them.
  You are expected to provide the full implementation of the function or data structure provided and nothing else. Do not write any helper functions or any other code outside of the required definition you are provided with.
  This is very important becuse other team members are also working on the code and if you try to do everything by yourself then you might accidentally introduce bugs or conflicts with other team members, so please stick to the definition and only provide the code that is required by it.
  Trust that your team members have written great implementations for the other functions that are tailored to your exact needs, use them as much as possible.

  If you do not have access to the appropriate tools to accomplish your task, then you can write a long implementation. But this is a serius problem, the tasks you are given are supposed to be short and straight forwards. If you are given too complex of a task that requires you to implement behaviurs that really should be implemented elsewhere then you must raise an alarm.
  This might mean that the design team should go back to the drawing board and better design the tasks it is givin.

  {comments}

  #### List of all objects in the codebase ####

  {allObjects}

  #### required signature name ####

  {signatureName}

  #### dictionary ####

  {dictionary}
  `,
  inputVariables: ["programmingLanguage", "comments", "allObjects", "signatureName", "dictionary"],
} )
  const responseSchema = z.object({
    meaningOfTerminology: z.string(),
    plan: z.string(),
    implementation: z.string(),
    issues: z.array(popError),
})
  return await runStructuredPrompt({ template, schema:responseSchema, vars: {programmingLanguage, comments, allObjects, signatureName, dictionary}, prompt: prompt});
}
