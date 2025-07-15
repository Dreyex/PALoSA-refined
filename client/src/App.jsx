import { useState, useEffect } from 'react';

//Icons
import { Camera } from 'lucide-react';

//Components
import Template_layout from './components/layouts/template_layout';
import SettingField from './components/ui/settingField';

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
    <div className='flex flex-col'>
      <h1 className='text-center p-10 text-8xl font-black text-rose-600'> {data.title} </h1>
      <h2 className='text-center text-2xl font-bold'> 
        <span className='text-rose-600'>P</span>seudonymisierungs-
        <span className='text-rose-600'>A</span>pp für  
        <span className='text-rose-600'> Lo</span>g-Dateien von 
        <span className='text-rose-600'> S</span>erver-
        <span className='text-rose-600'>A</span>nwendungen
      </h2>
      <div className='flex flex-row justify-between w-9/12 mx-auto mt-12'>
        <SettingField showGroup={false} options={['Option 1', 'Option 2', 'Option 3']} headline={data.settingTitles[0]}/>
        <SettingField showGroup={true} options={['Option 1', 'Option 2', 'Option 3']} headline={data.settingTitles[1]}/>
        <SettingField showGroup={true} options={['Option 1', 'Option 2', 'Option 3']} headline={data.settingTitles[2]}/>
      </div>
      <div>

      </div>
      
    </div>
  );
}

export default App;