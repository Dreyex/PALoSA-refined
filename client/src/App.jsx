import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";

//Icons

//Components
import FileUploadCard from "./components/FileUploadCard";
import SettingField from "./components/SettingField";
import Button from "./components/ui/Button";

function App() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [processingDone, setProcessingDone] = useState(false);
    const [hasUploads, setHasUploads] = useState(false);

    const [settings, setSettings] = useState({
        logSettings: { checkedOptions: [] },
        jsonSettings: { patterns: [], checkedOptions: [] },
        xmlSettings: { patterns: [], checkedOptions: [] },
        regexSettings: { patterns: [] },
    });

    const handleSettingsChange = (id, newData) => {
        setSettings((prevSettings) => ({
            ...prevSettings,
            [id]: {
                ...prevSettings[id],
                ...newData,
            },
        }));
    };

    const handleSubmit = async () => {
        //console.log(settings);
        try {
            const response = await fetch("/api/pseudo", {
                // Beispiel: Endpunkt "/api/settings"
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(settings),
            });

            if (!response.ok) {
                throw new Error(`Fehler beim Senden: ${response.statusText}`);
            }

            const result = await response.json();
            console.log("Server-Antwort:", result);
            setProcessingDone(true);
        } catch (err) {
            console.error("Fehler beim Senden der Einstellungen:", err);
            alert(
                "Fehler beim Senden der Einstellungen. Bitte versuche es erneut.",
                err
            );
            setProcessingDone(false);
        }
    };

    // Methode zum Download der ZIP-Datei für eine bestimmte Session
    async function handleDownload() {
        try {
            const response = await fetch(`/api/download/${sessionId}`, {
                method: "GET",
            });

            if (!response.ok) {
                throw new Error(
                    `Download fehlgeschlagen: ${response.statusText}`
                );
            }

            // Datei als Blob herunterladen
            const blob = await response.blob();

            // Link zum Starten des Dateidownloads erzeugen
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `pseudo-files.zip`; // Dateiname für den Download
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            console.log("Download erfolgreich gestartet.");
        } catch (error) {
            console.error("Fehler beim Download:", error);
        }
    }

    // Methode zum Aufruf der Cleanup API für eine Session
    async function handleCleanup() {
        try {
            //console.log(sessionId);
            const response = await fetch(`/api/clean/${sessionId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(
                    `Cleanup fehlgeschlagen: ${response.statusText}`
                );
            }

            const result = await response.json();
            console.log("Cleanup erfolgreich:", result);
            //alert("Bereinigung und Session-Zerstörung erfolgreich.");

            //Reload der Seite für Urspungszustand
            window.location.reload();
        } catch (error) {
            console.error("Fehler bei der Bereinigung:", error);
            alert("Fehler bei der Bereinigung. Siehe Konsole.");
        }
    }

    //Erster Aufruf der API für Textdaten und für SessionID
    useEffect(() => {
        // The vite proxy will redirect this to http://localhost:3001/api
        fetch("/api")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then((data) => {
                setData(data);
                setSessionId(data.sessionId);
                setLoading(false);
            })
            .catch((error) => {
                setError(error.message);
                setLoading(false);
            });
    }, []); // Empty dependency array means this effect runs once on mount

    if (loading) return <div className='text-center p-10'>Loading...</div>;
    if (error)
        return (
            <div className='text-center p-10 text-rose-500'>Error: {error}</div>
        );

    return (
        <>
            <Helmet>
                <title> {data.title} </title>
                <link rel='icon' href='\favicon.ico'></link>
            </Helmet>
            <div className='flex flex-col [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-rose-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-steel-900'>
                <h1 className='flex items-center justify-center p-10 text-8xl font-black text-rose-600'>
                    <img
                        src='/logo.svg'
                        alt='Logo von PALoSA'
                        className='mr-6 h-24 w-24'
                    />
                    {data.title}
                </h1>
                <h2 className='text-center text-2xl font-bold'>
                    <span className='text-rose-600'>P</span>seudonymisierungs-
                    <span className='text-rose-600'>A</span>pp für
                    <span className='text-rose-600'> Lo</span>g-Dateien von
                    <span className='text-rose-600'> S</span>erver-
                    <span className='text-rose-600'>A</span>nwendungen
                </h2>
                <div className='justify-between w-10/12 mx-auto mt-12 grid grid-cols-1 2xl:grid-cols-4 gap-4 space-x-16 s:grid-cols-2'>
                    <SettingField
                        id='logSettings'
                        options={["E-Mail", "IP-Adressen"]} //Muss mit server/utils/requestRegex.js übereinstimmen
                        headline={data.settingTitles[0]}
                        value={settings.logSettings} //übergebener Wert
                        onChange={handleSettingsChange} //Callback bei Änderung
                    />
                    <SettingField
                        id='jsonSettings'
                        showFileInput={true}
                        showTextInput={true}
                        //options={["Option 1", "Option 2", "Option 3"]}
                        headline={data.settingTitles[1]}
                        fileUploadType='json'
                        value={settings.jsonSettings} //übergebener Wert
                        onChange={handleSettingsChange} //Callback bei Änderung
                    />
                    <SettingField
                        id='xmlSettings'
                        showFileInput={true}
                        showTextInput={true}
                        //options={["Option 1", "Option 2", "Option 3"]}
                        headline={data.settingTitles[2]}
                        fileUploadType='xml'
                        value={settings.xmlSettings} //übergebener Wert
                        onChange={handleSettingsChange} //Callback bei Änderung
                        comment="Work In Progress / Ohne Funktion"
                    />
                    <SettingField
                        id='regexSettings'
                        showTextInput={true}
                        headline={data.settingTitles[3]}
                        comment='Für alle Dateien'
                        value={settings.regexSettings} //übergebener Wert
                        onChange={handleSettingsChange} //Callback bei Änderung
                    />
                </div>
                <div className='mt-12'>
                    <FileUploadCard fileUploadType='other' onUploadStatusChange={setHasUploads}/>
                </div>
                <div className='mt-12 mx-auto text-center'>
                    <Button
                        variant='danger'
                        className='font-extrabold text-2xl'
                        onClick={handleSubmit}
                        disabled={!hasUploads || processingDone}
                    >
                        Pseudonymisieren
                    </Button>
                </div>
                <div className='mt-12 mx-auto text-center space-x-4'>
                    <Button
                        variant='default'
                        className='font-bold text-1xl'
                        onClick={handleDownload}
                        disabled={!processingDone}
                    >
                        Download
                    </Button>
                    <Button
                        variant='default'
                        className='font-bold text-1xl'
                        onClick={handleCleanup}
                        disabled={!processingDone}
                    >
                        Cleanup
                    </Button>
                </div>
            </div>
        </>
    );
}

export default App;