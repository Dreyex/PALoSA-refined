import Ajv from "ajv";
const ajv = new Ajv();

const schema = {
    type: "object",
    properties: {
        sources: {
            type: "array",
        },
        derived: {
            type: "object",
            propertyNames: {
                pattern: "^.*$", // jeder Name erlaubt
            },
            additionalProperties: {
                type: "object",
                properties: {
                    sources: {
                        type: "array",
                        items: {
                            type: "array",
                            items: {
                                type: "string",
                            },
                            minItems: 1, // Mindestens ein String im Array!
                        },
                    },
                    separator: {
                        type: "string",
                    },
                },
                required: ["sources", "seperator"],
            },
        },
    },
    required: ["sources", "derived"],
};

const validate = ajv.compile(schema);

export default function validateJson(data) {
    if (validate(data)) {
        console.log("JSON-Format gültig");
        return true;
    } else {
        console.log("JSON-Format fehlerhaft:", validate.errors);
        return false;
    }
}
