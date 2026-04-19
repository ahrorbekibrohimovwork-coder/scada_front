import React from 'react';
import { Link } from 'react-router';
import { FileX } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <FileX size={64} className="text-slate-300 mx-auto mb-4" />
        <h1 className="text-slate-700 mb-2">404 — Страница не найдена</h1>
        <p className="text-slate-500 text-sm mb-6">Запрошенная страница не существует</p>
        <Link to="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
          На главную
        </Link>
      </div>
    </div>
  );
}
