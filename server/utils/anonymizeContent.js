import generatePseudonym from "pseudonymous-id-generator";
import "dotenv/config";

const anonymizationKey = process.env.pseudoKey;

//TODO: Refactor this function to Pseudonymize EMail to remain their structure
//TODO: Refactor this function to Pseudonymize IPs with CryptoPan
export default async function anonymizeContent(content, patterns) {
    let result = content;
    console.log("Anonymizing content with patterns:", patterns);
    const regexes = patterns.map((patternStr) => {
        return new RegExp(patternStr, "g");
    });
    console.log("Anonymizing content with regexes:", regexes);
    for (const regex of regexes) {
        // Nutze replace mit async Callback:
        result = await replaceAsync(result, regex, async (match) =>
            generatePseudonym(match, anonymizationKey)
        );
    }
    return result;
}

async function replaceAsync(str, regex, asyncFn) {
    const matches = [];
    str.replace(regex, (match, ...args) => {
        const offset = args[args.length - 2];
        matches.push({ match, offset });
        return match;
    });

    const pieces = [];
    let lastIndex = 0;

    for (const { match, offset } of matches) {
        pieces.push(str.substring(lastIndex, offset));
        const replacement = await asyncFn(match);
        pieces.push(replacement);
        lastIndex = offset + match.length;
    }
    pieces.push(str.substring(lastIndex));
    return pieces.join("");
}