import { useState, useEffect } from 'react';

//Icons


//Components
import FileUploadCard from './components/fileUploadCard';
import SettingField from './components/ui/settingField';
import Button from './components/ui/button';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // The vite proxy will redirect this to http://localhost:3001/api/portfolio
    fetch('/api')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setLoading(false);
      });
  }, []); // Empty dependency array means this effect runs once on mount

  if (loading) return <div className="text-center p-10">Loading...</div>;
  if (error) return <div className="text-center p-10 text-rose-500">Error: {error}</div>;

  return (
    <div className='flex flex-col [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-rose-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-steel-900'>
      <h1 className='text-center p-10 text-8xl font-black text-rose-600'> {data.title} </h1>
      <h2 className='text-center text-2xl font-bold'> 
        <span className='text-rose-600'>P</span>seudonymisierungs-
        <span className='text-rose-600'>A</span>pp für  
        <span className='text-rose-600'> Lo</span>g-Dateien von 
        <span className='text-rose-600'> S</span>erver-
        <span className='text-rose-600'>A</span>nwendungen
      </h2>
      <div className='flex flex-row justify-between w-10/12 mx-auto mt-12'>
        <SettingField options={['Option 1', 'Option 2', 'Option 3']} headline={data.settingTitles[0]}/>
        <SettingField showFileInput={true} showTextInput={true} options={['Option 1', 'Option 2', 'Option 3']} headline={data.settingTitles[1]}/>
        <SettingField showFileInput={true} showTextInput={true} options={['Option 1', 'Option 2', 'Option 3']} headline={data.settingTitles[2]}/>
        <SettingField showTextInput={true} headline={data.settingTitles[3]} comment="Für alle Dateien"/>
      </div>
      <div className='mt-12'>
        <FileUploadCard />
      </div>
      <div className='mt-12 mx-auto text-center'>
        <Button variant="danger" className="font-extrabold text-2xl">
          Pseudonymisieren
        </Button>
      </div>
    </div>
  );
}

export default App;