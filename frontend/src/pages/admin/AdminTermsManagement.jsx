import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';
import { 
  FileText, Download, Users, ExternalLink, RefreshCw, Loader2,
  ChevronDown, ChevronUp, Calendar, Shield, ArrowLeft, Check
} from 'lucide-react';

const API_URL = getApiUrl();

const AdminTermsManagement = () => {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [acceptances, setAcceptances] = useState([]);
  const [usersSummary, setUsersSummary] = useState([]);
  const [activeTab, setActiveTab] = useState('documents');
  const [expandedDoc, setExpandedDoc] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    
    try {
      // Fetch documents with stats
      const docsRes = await fetch(`${API_URL}/api/terms/admin/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (docsRes.ok) {
        const data = await docsRes.json();
        setDocuments(data.documents || []);
      }

      // Fetch recent acceptances
      const accRes = await fetch(`${API_URL}/api/terms/admin/acceptances?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (accRes.ok) {
        const data = await accRes.json();
        setAcceptances(data.acceptances || []);
      }

      // Fetch users summary
      const usersRes = await fetch(`${API_URL}/api/terms/admin/users-summary?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsersSummary(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (termsSlug = null) => {
    setExporting(true);
    const token = localStorage.getItem('auth_token');
    
    try {
      const url = termsSlug 
        ? `${API_URL}/api/terms/admin/acceptances/export?terms_slug=${termsSlug}`
        : `${API_URL}/api/terms/admin/acceptances/export`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `terms_acceptances_${termsSlug || 'all'}_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        a.remove();
      }
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'UGC': 'bg-purple-500/20 text-purple-400',
      'E-commerce': 'bg-blue-500/20 text-blue-400',
      'Studio': 'bg-cyan-500/20 text-cyan-400',
      'Legal': 'bg-gray-500/20 text-gray-400'
    };
    return colors[category] || 'bg-gray-500/20 text-gray-400';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-PY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2 text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            Volver a Admin
          </Link>
          <span className="text-[#d4a968] italic">Términos y Condiciones</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-light text-white flex items-center gap-3">
              <Shield className="w-6 h-6 text-[#d4a968]" />
              Gestión de Términos y Condiciones
            </h1>
            <p className="text-gray-500 mt-1">Documentos legales y registro de aceptaciones</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport()}
              disabled={exporting}
              className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exportando...' : 'Exportar Todo'}
            </button>
            <button
              onClick={fetchData}
              className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
              activeTab === 'documents'
                ? 'bg-[#d4a968] text-black'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            Documentos ({documents.length})
          </button>
          <button
            onClick={() => setActiveTab('acceptances')}
            className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
              activeTab === 'acceptances'
                ? 'bg-[#d4a968] text-black'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Check className="w-4 h-4" />
            Aceptaciones ({acceptances.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
              activeTab === 'users'
                ? 'bg-[#d4a968] text-black'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4" />
            Por Usuario ({usersSummary.length})
          </button>
        </div>

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
              >
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-[#d4a968]" />
                        <h3 className="text-white font-medium">{doc.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getCategoryColor(doc.category)}`}>
                          {doc.category}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-3">{doc.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">Versión: {doc.version}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-[#d4a968]">{doc.acceptance_count || 0} aceptaciones</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={doc.content_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title="Ver documento"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport(doc.slug);
                        }}
                        className="p-2 bg-green-500/10 hover:bg-green-500/20 rounded-lg text-green-400 transition-colors"
                        title="Exportar aceptaciones"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {expandedDoc === doc.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedDoc === doc.id && (
                  <div className="px-5 pb-5 border-t border-white/10 pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 block mb-1">Slug</span>
                        <span className="text-white font-mono text-xs bg-white/10 px-2 py-1 rounded">{doc.slug}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1">Requerido para</span>
                        <span className="text-white">{doc.required_for?.join(', ') || 'Todos'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1">Creado</span>
                        <span className="text-white">{formatDate(doc.created_at)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1">URL</span>
                        <a href={doc.content_url} target="_blank" rel="noopener noreferrer" className="text-[#d4a968] hover:underline truncate block">
                          {doc.content_url}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Acceptances Tab */}
        {activeTab === 'acceptances' && (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-gray-400 text-sm font-normal">Usuario</th>
                    <th className="text-left p-4 text-gray-400 text-sm font-normal">Documento</th>
                    <th className="text-left p-4 text-gray-400 text-sm font-normal">Versión</th>
                    <th className="text-left p-4 text-gray-400 text-sm font-normal">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {acceptances.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500">
                        No hay aceptaciones registradas
                      </td>
                    </tr>
                  ) : (
                    acceptances.map((acc) => (
                      <tr key={acc.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-4">
                          <div>
                            <p className="text-white text-sm">{acc.user_name || acc.creator_name || acc.brand_name || 'Usuario'}</p>
                            <p className="text-gray-500 text-xs">{acc.user_email}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-white text-sm">{acc.terms_name}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-gray-400 text-sm">{acc.terms_version}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-gray-400 text-sm">{formatDate(acc.accepted_at)}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Summary Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {usersSummary.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">No hay usuarios con aceptaciones registradas</p>
              </div>
            ) : (
              usersSummary.map((user) => (
                <div
                  key={user.user_id}
                  className="bg-white/5 border border-white/10 rounded-xl p-5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-medium">
                          {user.user_name || user.creator_name || user.brand_name || 'Usuario'}
                        </h3>
                        {user.is_creator && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-400">
                            Creator {user.creator_level}
                          </span>
                        )}
                        {user.is_brand && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400">
                            Marca
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm">{user.user_email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#d4a968] font-medium">{user.total_accepted} documentos</p>
                      <p className="text-gray-500 text-xs">Última: {formatDate(user.last_acceptance)}</p>
                    </div>
                  </div>

                  {/* Accepted documents */}
                  <div className="flex flex-wrap gap-2">
                    {user.acceptances?.map((acc, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2"
                      >
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-sm text-gray-300">{acc.terms_name}</span>
                        <span className="text-xs text-gray-500">v{acc.version}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTermsManagement;
