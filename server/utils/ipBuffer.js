/**
 * Konvertiert eine IPv4-Adresse als String in einen Buffer mit 4 Bytes.
 * @param {string} ip - Die IPv4-Adresse im Format "x.x.x.x".
 * @returns {Buffer} - Ein Buffer, der die vier Bytes der IP-Adresse enthält.
 */
export function ipStringToBuffer(ip) {
    // Zerlegt IPv4-Adresse in 4 Byte
    return Buffer.from(ip.split(".").map((octet) => parseInt(octet, 10)));
}

/**
 * Konvertiert einen Buffer mit 4 Bytes zurück zu einer IPv4-Adresse als String.
 * @param {Buffer} buf - Ein Buffer mit vier Bytes.
 * @returns {string} - Die rekonstruierte IPv4-Adresse im Format "x.x.x.x".
 */
export function bufferToIpString(buf) {
    return Array.from(buf).join(".");
}