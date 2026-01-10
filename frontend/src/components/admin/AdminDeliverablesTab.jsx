import React from 'react';
import { FileCheck, CheckCircle, Clock, AlertCircle, RefreshCw, Eye, ExternalLink } from 'lucide-react';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-PY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const StatusBadge = ({ status, type }) => {
  const configs = {
    deliverable: {
      assigned: { color: 'text-gray-400 bg-gray-500/20', label: 'Asignado' },
      submitted: { color: 'text-yellow-400 bg-yellow-500/20', label: 'Enviado' },
      resubmitted: { color: 'text-orange-400 bg-orange-500/20', label: 'Reenviado' },
      approved: { color: 'text-green-400 bg-green-500/20', label: 'Aprobado' },
      completed: { color: 'text-blue-400 bg-blue-500/20', label: 'Completado' },
      changes_requested: { color: 'text-purple-400 bg-purple-500/20', label: 'Cambios' },
      rejected: { color: 'text-red-400 bg-red-500/20', label: 'Rechazado' }
    }
  };

  const config = configs[type]?.[status] || { color: 'text-gray-400 bg-gray-500/20', label: status };
  return (
    <span className={`px-2 py-1 rounded-full text-xs ${config.color}`}>
      {config.label}
    </span>
  );
};

const AdminDeliverablesTab = ({
  deliverables,
  deliverableFilter,
  setDeliverableFilter,
  fetchDeliverables,
  handleApproveDeliverable,
  handleRejectDeliverable
}) => {
  return (
    <div className="space-y-6" data-testid="admin-deliverables-tab">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4">
          <select
            value={deliverableFilter.status}
            onChange={(e) => { setDeliverableFilter({...deliverableFilter, status: e.target.value}); fetchDeliverables(); }}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="submitted">Enviados</option>
            <option value="resubmitted">Reenviados</option>
            <option value="approved">Aprobados</option>
            <option value="completed">Completados</option>
            <option value="changes_requested">Cambios Solicitados</option>
            <option value="rejected">Rechazados</option>
          </select>
        </div>
        <button 
          onClick={fetchDeliverables}
          className="p-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Deliverables List */}
      <div className="space-y-4">
        {deliverables.length === 0 ? (
          <div className="p-12 bg-white/5 border border-white/10 rounded-xl text-center">
            <FileCheck className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl text-white mb-2">Sin entregas</h3>
            <p className="text-gray-400">No hay entregas que coincidan con los filtros</p>
          </div>
        ) : (
          deliverables.map((deliverable) => (
            <div key={deliverable.id} className="p-5 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <StatusBadge status={deliverable.status} type="deliverable" />
                    <span className="text-gray-500 text-sm">#{deliverable.delivery_number}</span>
                  </div>
                  
                  <h4 className="text-white font-medium mb-2">{deliverable.campaign?.name}</h4>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>Creator: <span className="text-white">{deliverable.creator?.name}</span></span>
                    <span>Fecha límite: <span className="text-white">{formatDate(deliverable.deadline)}</span></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {deliverable.content_url && (
                    <a 
                      href={deliverable.content_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  
                  {['submitted', 'resubmitted'].includes(deliverable.status) && (
                    <>
                      <button
                        onClick={() => handleApproveDeliverable(deliverable.id)}
                        className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" /> Aprobar
                      </button>
                      <button
                        onClick={() => handleRejectDeliverable(deliverable.id)}
                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 flex items-center gap-2"
                      >
                        <AlertCircle className="w-4 h-4" /> Rechazar
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Preview */}
              {deliverable.content_url && (
                <div className="mt-4 p-3 bg-black/30 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">URL del contenido:</p>
                  <a 
                    href={deliverable.content_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#d4a968] text-sm hover:underline truncate block"
                  >
                    {deliverable.content_url}
                  </a>
                </div>
              )}

              {/* Review comments */}
              {deliverable.review?.comment && (
                <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <p className="text-xs text-purple-400 mb-1">Comentario de revisión:</p>
                  <p className="text-gray-300 text-sm">{deliverable.review.comment}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDeliverablesTab;
