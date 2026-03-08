import {llmNameGiver, llmSignatureMaker, llmCodeWritter} from "./prompts.mjs"
import chalk from 'chalk';


export function popErrorLog(location,stage,error) {
    switch(error.severity) {
        case "note":
            console.log(chalk.white(location + " - " + stage + " - " + error.severity + ": " + error.title));
            break;
        case "warning":
            console.log(chalk.yellow(location + " - " + stage + " - " + error.severity + ": " + error.title));
            break;
        case "error":
            console.log(chalk.red(location + " - " + stage + " - " + error.severity + ": " + error.title));
            break;
        case "critical error":
            console.log(chalk.redBright(location + " - " + stage + " - " + error.severity + ": " + error.title));
            break;
    }
    console.log(chalk.white(error.description))
}

export async function popCompiler(paragraphArray, comments, programmingLanguage = "JavaScript", errorCallback = popErrorLog) {
    
    var names = await Promise.all(
        paragraphArray.map(paragraph => {
            return llmNameGiver({
                prompt:paragraph,
                comments:comments,
                programmingLanguage:programmingLanguage,
            })
        })
    )
    // console.log(JSON.stringify(names))
    names.forEach(name => name.issues.forEach(error => errorCallback(name.givenName, "Naming", error)))

    var allObjects = names.map(n => {
        return {
            type: n.functionOrDataStructure,
            name: n.camelCaseTechnicalName,
            description: n.technicalDescription,
            alternativeNames: [n.givenName, ...n.variations.slice(0,10)]
        }
    })

    // var structs = allObjects.filter(thing=>thing.type === "struct")

    var signatures = await Promise.all(
        paragraphArray.map((paragraph,i) => {
            return llmSignatureMaker({
                prompt:paragraph,
                signatureName: names[i].camelCaseTechnicalName,
                allObjects: JSON.stringify(allObjects),
                comments:comments,
                programmingLanguage:programmingLanguage
            })
        })
    )
    // console.log(JSON.stringify(signatures))
    signatures.forEach((sig, i) => sig.issues.forEach(error => errorCallback(names[i].givenName, "Signature", error)))

    var code = await Promise.all(
        paragraphArray.map((paragraph,i) => {
            return llmCodeWritter({
                allObjects: JSON.stringify(allObjects),
                signatureName: signatures[i].signature,
                prompt:paragraph,
                dictionary: signatures[i].dictionary,
                comments:comments,
                programmingLanguage:programmingLanguage
            })
        })
    )
    // console.log(JSON.stringify(code))
    code.forEach((c, i) => c.issues.forEach(error => errorCallback(names[i].givenName, "Implementation", error)))

    return code.map(c=>c.implementation)
}
