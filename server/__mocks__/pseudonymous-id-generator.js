// Mock für pseudonymous-id-generator
const generatePseudonym = (input, key) => {
    // Einfacher Mock der die Funktion simuliert
    const crypto = require('crypto');
    return crypto.createHmac('sha256', key || 'test-key').update(input).digest('hex').substring(0, 16);
};

module.exports = generatePseudonym;
