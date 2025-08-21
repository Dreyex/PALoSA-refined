import React, { useRef, useState } from "react";
import { Upload, CircleCheck } from "lucide-react";

import Button from "./ui/Button";
import Card from "./ui/Card";
import FileInput from "./ui/FileInput";
import FileList from "./ui/FileList";

const ACCEPTED_FILE_TYPES =
    ".xml,.json,.log,.txt,application/xml,application/json,text/plain";

export default function FileUploadCard({fileUploadType, onUploadStatusChange, sessionId}) {
    const fileInput = useRef(null);
    const [files, setFiles] = useState([]);
    const [feedback, setFeedback] = useState(false);

    const handleSelectFiles = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles((prev) => [
            ...prev,
            ...selectedFiles.filter(
                (file) =>
                    !prev.some(
                        (existing) =>
                            existing.name === file.name &&
                            existing.size === file.size
                    )
            ),
        ]);
        e.target.value = "";
    };

    const handleRemoveFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));

        try {
            const res = await fetch(
                `/api/upload/${sessionId}?buttonType=${encodeURIComponent(fileUploadType)}`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const result = await res.json();
            handleUploadComplete();
            setFeedback(true); //sucess
            console.log("Upload erfolgreich:", result);
        } catch (error) {
            console.error("Beim Upload ist ein Fehler aufgetreten:", error);
        }
    };

    // Nach erfolgreichem Upload
    const handleUploadComplete = () => {
        if (typeof onUploadStatusChange === "function") {
            onUploadStatusChange(true);
        }
        else {
            console.log("onUploadStatusChange ist keine Function:", onUploadStatusChange);
        }
    };

    return (
        <Card>
            <div className='grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6 w-full'>
                {/* Erste Spalte: Überschrift + Buttons */}
                <div className='flex flex-col gap-4 text-center border-r-2 border-steel-400 p-4'>
                    <h2 className='text-3xl font-bold'>Datei-Upload</h2>
                    <p className='mb-8 text-sm'>
                        {" "}
                        Nur .log, .txt, .json & .xml
                    </p>
                    <FileInput
                        accept={ACCEPTED_FILE_TYPES}
                        multiple
                        onChange={handleSelectFiles}
                        inputRef={fileInput}
                    />

                    <div className='flex gap-2'>
                        <Button onClick={() => fileInput.current.click()}>
                            Dateien auswählen
                        </Button>
                        <Button
                            onClick={handleUpload}
                            variant='danger'
                            disabled={files.length === 0 || feedback}
                        >
                            {feedback ? <CircleCheck /> : <Upload />}
                        </Button>
                    </div>
                </div>

                {/* Zweite Spalte: Dateiansicht als Grid */}
                <FileList files={files} onRemove={handleRemoveFile} disable={feedback}/>
            </div>
        </Card>
    );
}
