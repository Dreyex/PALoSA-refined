import { Upload } from "lucide-react";
import React, { useState } from "react";
import Button from "./Button";
import validateConfig from "../../utils/validateConfig";

export default function FileUploadInput({
    headline,
    comment,
    buttonType = "other",
}) {
    // State für das ausgewählte File
    const [file, setFile] = useState(null);

    const handleChange = async (e) => {
        const selectedFile = e.target.files[0] ?? null;
        if (!selectedFile) {
            setFile(null);
            return;
        }
        const text = await selectedFile.text();
        try {
            const data = JSON.parse(text);
            if (!validateConfig(data)) {
                alert("Die Konfigurationsdatei hat ein ungültiges Format!");
                setFile(null);
                return;
            }
        } catch (err) {
            alert("Die Datei ist keine gültige JSON!");
            setFile(null);
            return;
        }
        setFile(selectedFile);
    };

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append("files", file);

        try {
            const res = await fetch(
                `/api/upload?buttonType=${encodeURIComponent(buttonType)}`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const result = await res.json();
            console.log("Upload erfolgreich:", result);
        } catch (error) {
            console.error("Beim Upload ist ein Fehler aufgetreten:", error);
        }
    };

    return (
        <div className="flex items-center space-x-2 mb-8">
            <div className="w-full">
                <label className="mb-2 text-md" htmlFor="file_input">
                    {headline}
                </label>
                <input
                    className="w-full text-md rounded-md cursor-pointer bg-eclipse-800 p-2"
                    id="file_input"
                    type="file"
                    onChange={handleChange}
                    accept=".json"
                />
                <p className="mt-1 text-xs" id="file_input_help">
                    {comment}
                </p>
            </div>
            {/* Button ist deaktiviert solange keine Datei gewählt */}
            <Button variant="danger" onClick={handleUpload} disabled={!file}>
                <Upload />
            </Button>
        </div>
    );
}
