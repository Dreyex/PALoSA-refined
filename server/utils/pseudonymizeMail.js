import generatePseudonym from "pseudonymous-id-generator";
import "dotenv/config";

const anonymizationKey = process.env.pseudoKey;

/**
 * Pseudonymisiert eine E-Mail-Adresse, indem sowohl der lokale Teil (vor dem "@") 
 * als auch der Domainteil (ohne TLD) mit einem Anonymisierungsschlüssel in Pseudonyme umgewandelt werden.
 * 
 * Der letzte Teil der Domain (Top-Level-Domain, z. B. `.com`, `.de`) bleibt unverändert,
 * um die Formatvalidität der E-Mail-Adresse beizubehalten.
 * 
 * @async
 * @function pseudonymizeEmail
 * @param {string} email - Die Original-E-Mail-Adresse, z. B. "muster@example.com".
 * @returns {Promise<string>} - Die pseudonymisierte E-Mail-Adresse im gleichen Format wie das Original, 
 * aber mit anonymisierten lokalen und Domain-Teilen.
 * 
 * @throws {Error} Wenn die übergebene E-Mail-Adresse kein gültiges Format hat oder die Pseudonymisierung fehlschlägt.
 */
export default async function pseudonymizeEmail(email) {
    const [localPart, domainPart] = email.split("@");
    const domainParts = domainPart.split(".");
    const tld = domainParts.pop(); // letzte Stelle ist TLD

    const pseudoLocal = await generatePseudonym(localPart, anonymizationKey);
    const pseudoDomain = await generatePseudonym(domainParts.join("."), anonymizationKey);

    return `${pseudoLocal}@${pseudoDomain}.${tld}`;
}