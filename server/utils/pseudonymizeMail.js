import generatePseudonym from "pseudonymous-id-generator";
import "dotenv/config";

const anonymizationKey = process.env.pseudoKey;

export default async function pseudonymizeEmail(email) {
    const [localPart, domainPart] = email.split("@");
    const domainParts = domainPart.split(".");
    const tld = domainParts.pop(); // letzte Stelle ist TLD

    const pseudoLocal = await generatePseudonym(localPart, anonymizationKey);
    const pseudoDomain = await generatePseudonym(domainParts.join("."), anonymizationKey);

    return `${pseudoLocal}@${pseudoDomain}.${tld}`;
}