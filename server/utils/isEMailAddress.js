/**
 * Prüft, ob ein gegebener String eine gültige E-Mail-Adresse ist.
 * 
 * Die Funktion verwendet einen einfachen regulären Ausdruck,
 * um sicherzustellen, dass die Eingabe ein Zeichen vor und nach
 * dem `@`-Symbol enthält, gefolgt von einer Top-Level-Domain.
 * 
 * **Hinweis:**  
 * Dieser Regex ist bewusst einfach gehalten und entspricht nicht allen 
 * Nuancen der offiziellen E-Mail-Standards (RFC 5322). Er deckt jedoch
 * die meisten gebräuchlichen Formate ab.
 * 
 * @function isEmailAddress
 * @param {string} str - Der zu prüfende Text.
 * 
 * @returns {boolean} `true`, wenn der String eine gültige E-Mail-Adresse ist, 
 *                    andernfalls `false`.
 */
export default function isEmailAddress(str) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(str);
}
