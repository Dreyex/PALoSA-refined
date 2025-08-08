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
            alert("Einstellungen erfolgreich gespeichert!");
        } catch (err) {
            console.error("Fehler beim Senden der Einstellungen:", err);
            alert(
                "Fehler beim Senden der Einstellungen. Bitte versuche es erneut.",
                err
            );
        }
    };

    useEffect(() => {
        // The vite proxy will redirect this to http://localhost:3001/api/portfolio
        fetch("/api")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then((data) => {
                setData(data);
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
                <div className='flex flex-row justify-between w-10/12 mx-auto mt-12'>
                    <SettingField
                        id='logSettings'
                        options={["Option 1", "Option 2", "Option 3"]}
                        headline={data.settingTitles[0]}
                        value={settings.logSettings} //übergebener Wert
                        onChange={handleSettingsChange} //Callback bei Änderung
                    />
                    <SettingField
                        id='jsonSettings'
                        showFileInput={true}
                        showTextInput={true}
                        options={["Option 1", "Option 2", "Option 3"]}
                        headline={data.settingTitles[1]}
                        fileUploadType='json'
                        value={settings.jsonSettings} //übergebener Wert
                        onChange={handleSettingsChange} //Callback bei Änderung
                    />
                    <SettingField
                        id='xmlSettings'
                        showFileInput={true}
                        showTextInput={true}
                        options={["Option 1", "Option 2", "Option 3"]}
                        headline={data.settingTitles[2]}
                        fileUploadType='xml'
                        value={settings.xmlSettings} //übergebener Wert
                        onChange={handleSettingsChange} //Callback bei Änderung
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
                    <FileUploadCard fileUploadType='other' />
                </div>
                <div className='mt-12 mx-auto text-center'>
                    <Button
                        variant='danger'
                        className='font-extrabold text-2xl'
                        onClick={handleSubmit}
                    >
                        Pseudonymisieren
                    </Button>
                </div>
            </div>
        </>
    );
}

export default App;
