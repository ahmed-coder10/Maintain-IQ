import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { dbService } from '../services/db';
import { Card, Badge, LoadingSkeleton } from '../components/UI';
import { 
  Wrench, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Activity, 
  CheckCircle,
  FileQuestion
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function PublicAsset() {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const assetData = await dbService.getAssetById(id);
        if (assetData) {
          setAsset(assetData);
          // Subscribe to safe activity history logs
          const historyLogs = await dbService.getHistory(id);
          // Filter to only show safe/public logs (Asset Created, Issue Reported, Resolved, Operational)
          const publicLogs = historyLogs.filter(h => 
            ['Asset Created', 'Issue Reported', 'Resolved', 'Operational'].includes(h.action)
          );
          setHistory(publicLogs);
        }
      } catch (err) {
        console.error("Error loading public asset details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <LoadingSkeleton count={2} />
        </div>
      </div>
    );
  }

  // Not Found State
  if (!asset) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center p-8 glass-panel border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 text-slate-400 mb-4">
            <FileQuestion className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-slate-50">Asset Not Found</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            The QR tag or link you requested is invalid or the corresponding asset has been removed from the registry.
          </p>
          <div className="mt-6">
            <Link 
              to="/login"
              className="inline-flex items-center justify-center py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-indigo-500/10"
            >
              Go to Workspace Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 py-8 px-4 flex flex-col items-center">
      {/* Brand Header */}
      <div className="flex items-center gap-2 mb-8 select-none">
        <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
          <Activity className="h-4 w-4" />
        </div>
        <span className="font-bold text-base bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
          MaintainIQ Public Portal
        </span>
      </div>

      <div className="max-w-lg w-full space-y-6">
        {/* Core Asset Overview Card */}
        <Card className="p-6 relative overflow-hidden">
          {/* Decorative background flare */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none"></div>

          {/* Cover image if available */}
          {asset.imageUrl && (
            <div className="h-44 w-full rounded-xl overflow-hidden mb-6 border border-slate-100 dark:border-slate-800">
              <img src={asset.imageUrl} alt={asset.name} className="h-full w-full object-cover" />
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-wider">
                  {asset.category}
                </span>
                <h1 className="text-2xl font-extrabold text-slate-950 dark:text-slate-50 mt-0.5 leading-tight">
                  {asset.name}
                </h1>
                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded mt-2 inline-block">
                  {asset.code}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <Badge status={asset.status} />
                <Badge status={asset.condition} />
              </div>
            </div>

            {/* Asset description */}
            {asset.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800/80">
                {asset.description}
              </p>
            )}

            {/* Key Metadata Fields */}
            <div className="grid grid-cols-2 gap-4 py-3 border-t border-b border-slate-100 dark:border-slate-800/80 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-400">Location</p>
                  <p className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">{asset.location}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-400">Department</p>
                  <p className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">{asset.department}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-400">Last Serviced</p>
                  <p className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                    {asset.lastService ? new Date(asset.lastService).toLocaleDateString() : 'No log'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-400">Next Service Due</p>
                  <p className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                    {asset.nextService ? new Date(asset.nextService).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Retired Notice Banner */}
            {asset.status === 'Retired' && (
              <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-xs font-bold">
                ⚠️ NOTICE: This asset is permanently retired from operation and is no longer being actively maintained.
              </div>
            )}

            {/* Report Issue Action Button */}
            {asset.status !== 'Retired' && (
              <div className="pt-2">
                <Link
                  to={`/public/report/${asset.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-bold bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/10 hover:shadow-lg transition-all active:scale-[0.98]"
                >
                  <AlertTriangle className="h-5 w-5" />
                  <span>Report Equipment Malfunction</span>
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Public Timeline Activity */}
        <Card className="p-6">
          <h3 className="text-sm font-bold text-slate-950 dark:text-slate-50 mb-4 flex items-center gap-2">
            <CheckCircle className="h-4.5 w-4.5 text-indigo-500" />
            Verified Activity Log
          </h3>

          {history.length > 0 ? (
            <div className="relative border-l border-slate-200 dark:border-slate-800 pl-4 ml-1.5 space-y-4 text-xs">
              {history.map((log) => (
                <div key={log.id} className="relative">
                  <span className="absolute -left-[20.5px] top-1 flex h-2 w-2 rounded-full bg-indigo-500"></span>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-semibold">{new Date(log.date).toLocaleDateString()}</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">{log.action}</span>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">{log.details}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-4">No verified activities logged yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
