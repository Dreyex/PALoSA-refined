import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import requestRegex from "./requestRegex.js";
import pseudoContentRegex from "./pseudoContentRegex.js";
import {
    processConfigDerived,
    processConfigSources,
} from "./processJsonFiles.js";
import xml2js from "xml2js";
dotenv.config();

export default async function processXmlFiles(
    uploadDir,
    outputDir,
    settings,
    logger
) {
    try {
        const patterns = await requestRegex(settings, "other", logger);
        logger.info(
            `Using ${patterns.length} regex patterns for Xml anonymization`
        );

        const dirents = fs.readdirSync(outputDir, { withFileTypes: true });

        const configPath = path.join(uploadDir, "xml", "xml-config.json");
        let derivedFields = {};
        let sources = [];
        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
            derivedFields = config.derived || {};
            sources = config.sources || [];
            logger.info(`Loaded config from ${configPath}`);
        } else {
            logger.warn(`Config file ${configPath} does not exist`);
        }

        const parser = new xml2js.Parser({
            explicitArray: false,
            mergeAttrs: true,
        });
        const builder = new xml2js.Builder();

        for (const dirent of dirents) {
            if (dirent.isFile() && dirent.name.endsWith(".xml")) {
                const filePath = path.join(outputDir, dirent.name);
                const xmlContent = fs.readFileSync(filePath, "utf-8");
                let jsonData = await parser.parseStringPromise(xmlContent);

                logger.info(
                    `Processing source fields for file: ${dirent.name}`
                );
                jsonData = await processConfigSources({
                    jsonData,
                    logger,
                    configPath,
                });

                logger.info(
                    `Processing derived fields for file: ${dirent.name}`
                );
                jsonData = processConfigDerived({
                    jsonData,
                    derivedFields,
                    sources,
                    uploadDir,
                    logger,
                });

                logger.info(
                    `Applying regex pseudonymization to file: ${dirent.name}`
                );
                const jsonString = JSON.stringify(jsonData);
                const updatedContent = await pseudoContentRegex(
                    jsonString,
                    patterns,
                    logger
                );

                if (typeof updatedContent !== "string") {
                    logger.error(`PseudoContentRegex hat keinen String zurückgegeben für Datei: ${dirent.name}`);
                    throw new Error(
                        "PseudoContentRegex hat keinen String zurückgegeben"
                    );
                }
                const updatedJson = JSON.parse(updatedContent);
                const rebuiltXml = builder.buildObject(updatedJson);;

                fs.writeFileSync(filePath, rebuiltXml, "utf-8");
                logger.warn(`Anonymized XML file: ${dirent.name}`);
            }
        }

        logger.info("Finished processing all XML files");
    } catch (error) {
        logger.error("Error in processXmlFiles:", { error });
        throw error; // Weiterwerfen für zentrale Behandlung
    }
}
