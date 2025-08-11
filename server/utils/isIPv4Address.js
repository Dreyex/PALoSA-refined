/**
 * Prüft, ob der übergebene Wert eine gültige IPv4-Adresse ist.
 *
 * Die Funktion akzeptiert ausschließlich Strings als Eingabe und gibt für
 * alle anderen Datentypen false zurück.
 *
 * @async
 * @param {string} ip - Die zu prüfende IP-Adresse als String.
 * @returns {Promise<boolean>} - True, wenn es eine valide IPv4-Adresse ist, sonst false.
 */
export default function isIPv4Address(ip) {
    //console.log("Checking if IP address is valid:", ip);
    if (typeof ip !== "string") {
        return false; // Nur Strings prüfen, andere Typen sofort ablehnen
    }
    // Regular expression to validate IPv4 addresses
    const ipv4Regex =
        /^(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$/;

    // Test the IP address against the regex
    const isValid = ipv4Regex.test(ip);
    //console.log("Is valid IP address:", isValid);
    return isValid;
}
