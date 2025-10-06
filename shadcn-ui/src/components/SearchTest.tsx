import React, { useState } from 'react';

export default function SearchTest() {
  const [search, setSearch] = useState('');
  const items = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];
  
  const filtered = items.filter(item => 
    item.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 border-2 border-red-500 bg-red-50 rounded-lg mb-4">
      <h3 className="text-lg font-bold text-red-900 mb-2">🧪 TESTE DE BUSCA ISOLADO</h3>
      <input 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Digite aqui para testar..."
        className="w-full p-2 border border-red-300 rounded mb-2"
      />
      <p className="text-sm text-red-700 mb-2">Busca atual: "<strong>{search}</strong>"</p>
      <p className="text-sm text-red-700 mb-2">Itens filtrados: <strong>{filtered.length}</strong> de {items.length}</p>
      <ul className="list-disc pl-5">
        {filtered.map((item, i) => (
          <li key={i} className="text-red-800">{item}</li>
        ))}
      </ul>
    </div>
  );
}