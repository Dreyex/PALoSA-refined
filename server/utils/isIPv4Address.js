/**
 * Prüft, ob ein gegebener Wert eine gültige IPv4-Adresse ist.
 * 
 * Die Funktion validiert nur Strings und verwendet dazu einen regulären Ausdruck,
 * um sicherzustellen, dass die Adresse aus vier oktalen Zahlen besteht (0–255),
 * getrennt durch Punkte.
 * 
 * @function isIPv4Address
 * @param {String} ip - Der zu prüfende Wert. 
 *                 Muss ein String im IPv4-Format sein, z. B. `"192.168.0.1"`.
 * 
 * @returns {boolean} `true`, wenn der Wert eine gültige IPv4-Adresse ist, andernfalls `false`.
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
