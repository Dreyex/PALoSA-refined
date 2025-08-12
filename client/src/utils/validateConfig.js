import Ajv from "ajv";
const ajv = new Ajv();

const schema = {
    type: "object",
    properties: {
        sources: {
            type: "array",
            items: {
                type: "string",
            },
        },
        derived: {
            type: "object",
            propertyNames: {
                pattern: "^.*$",
            },
            additionalProperties: {
                type: "object",
                properties: {
                    sources: {
                        type: "array",
                        items: {
                            type: "string",
                        },
                    },
                    separator: {
                        type: "string",
                    },
                },
                required: ["sources", "separator"],
                additionalProperties: false,
            },
        },
    },
    required: ["sources", "derived"],
    additionalProperties: false,
};

const validate = ajv.compile(schema);

/**
 * Validiert ein JSON-Objekt anhand eines vordefinierten JSON-Schemas.
 *
 * Nutzt intern die zuvor definierte/geladene `validate`-Funktion
 * (z. B. erstellt durch eine JSON-Schema-Validierungsbibliothek wie Ajv),
 * um zu prüfen, ob das übergebene `data` den Schemaanforderungen entspricht.
 *
 * @function validateJson
 * @param {Object} data - Das zu prüfende JSON-Objekt.
 *
 * @returns {boolean} `true`, wenn das JSON den Vorgaben des Schemas entspricht,
 *                    andernfalls `false`.
 */
export default function validateJson(data) {
    if (validate(data)) {
        console.log("JSON-Format gültig");
        return true;
    } else {
        console.log("JSON-Format fehlerhaft:", validate.errors);
        return false;
    }
}
