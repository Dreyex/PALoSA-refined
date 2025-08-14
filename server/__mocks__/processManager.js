// Mock für processManager
const processManager = async (sessionId) => {
    // Simuliere den Process Manager für Tests
    console.log(`Mock: Processing session ${sessionId}`);
    return Promise.resolve();
};

module.exports = processManager;
