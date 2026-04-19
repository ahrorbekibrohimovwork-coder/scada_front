import React from 'react';

const SchemaView: React.FC = () => {
  const [svgContent, setSvgContent] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const fetchSvg = () => {
    setLoading(true);
    setError(false);
    fetch('http://localhost:8000/api/schema/svg')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load');
        return res.text();
      })
      .then(svg => {
        setSvgContent(svg);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  React.useEffect(() => {
    fetchSvg();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-blue-400">
        <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mr-3" />
        Загрузка схемы...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-400 gap-4">
        <p>Не удалось загрузить схему. Проверьте что бекенд запущен на порту 8000.</p>
        <button
          onClick={fetchSvg}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex justify-end mb-2">
        <button
          onClick={fetchSvg}
          className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-lg text-sm transition-colors border border-blue-500/30"
        >
          Обновить данные
        </button>
      </div>
      <div
        className="flex-1 w-full overflow-auto"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </div>
  );
};

export default SchemaView;
