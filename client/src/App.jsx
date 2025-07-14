import { useState, useEffect } from 'react';

import template_layout from './components/layouts/template_layout';
import template_ui from './components/ui/template_ui';

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
  if (error) return <div className="text-center p-10 text-red-500">Error: {error}</div>;

  return (
    <div>
      <h1 className='text-center p-10 text-4xl'> {data} </h1>
      <template_layout />
      <template_ui />
    </div>
  );
}

export default App;