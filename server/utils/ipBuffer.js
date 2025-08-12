/**
 * Konvertiert eine IPv4-Adresse (als String im Format `"x.x.x.x"`) 
 * in einen Buffer mit genau 4 Bytes.
 * 
 * Jedes Oktett der IPv4-Adresse wird in eine Ganzzahl umgewandelt
 * und als Byte im Buffer gespeichert.
 * 
 * @function ipStringToBuffer
 * @param {string} ip - Die IPv4-Adresse im Format `"x.x.x.x"`.
 * @returns {Buffer} Ein Buffer mit den vier Bytes der IPv4-Adresse.
 */
export function ipStringToBuffer(ip) {
    // Zerlegt IPv4-Adresse in 4 Byte
    return Buffer.from(ip.split(".").map((octet) => parseInt(octet, 10)));
}

/**
 * Wandelt einen Buffer mit 4 Bytes in eine IPv4-Adresse (String) um.
 * 
 * Jedes Byte im Buffer wird in eine Dezimalzahl konvertiert
 * und durch Punkte (`"."`) getrennt im typischen IPv4-Format zurückgegeben.
 * 
 * @function bufferToIpString
 * @param {Buffer} buf - Ein Buffer mit genau 4 Bytes.
 * @returns {string} Die rekonstruierte IPv4-Adresse im Format `"x.x.x.x"`.
 */
export function bufferToIpString(buf) {
    return Array.from(buf).join(".");
}