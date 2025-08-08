export default async function isIPv4Address(ip) {
    console.log("Checking if IP address is valid:", ip);
    // Regular expression to validate IPv4 addresses
    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$/;

    // Test the IP address against the regex
    const isValid = ipv4Regex.test(ip);
    //console.log("Is valid IP address:", isValid);
    return isValid;
}