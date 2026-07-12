import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { Card, Badge, LoadingSkeleton } from '../components/UI';
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  ShieldAlert, 
  Activity, 
  User, 
  ExternalLink,
  TrendingUp,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const checkDark = () => document.documentElement.classList.contains('dark');

export default function Dashboard() {
  const [assets, setAssets] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubAssets = dbService.subscribeAssets((data) => {
      setAssets(data);
    });
    let unsubIssues = dbService.subscribeIssues((data) => {
      setIssues(data);
      setLoading(false);
    });
    return () => {
      if (unsubAssets) unsubAssets();
      if (unsubIssues) unsubIssues();
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-slate-900/60 h-32 rounded-2xl border border-slate-200/60 dark:border-slate-800/60"></div>
          ))}
        </div>
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  const totalAssets = assets.length;
  const operationalAssets = assets.filter(a => a.status === 'Operational').length;
  const activeIssues = issues.filter(i => !['Resolved', 'Closed'].includes(i.status)).length;
  const resolvedIssues = issues.filter(i => ['Resolved', 'Closed'].includes(i.status)).length;
  const criticalIssuesCount = issues.filter(i => i.priority === 'Critical' && !['Resolved', 'Closed'].includes(i.status)).length;
  const now = new Date();
  const maintenanceDueCount = assets.filter(a => 
    ['Under Inspection', 'Under Maintenance', 'Out of Service'].includes(a.status) || 
    (a.nextService && new Date(a.nextService) <= now)
  ).length;
  const upcomingServices = assets
    .filter(a => a.nextService && new Date(a.nextService) > now)
    .sort((a, b) => new Date(a.nextService) - new Date(b.nextService))
    .slice(0, 4);

  const statusCounts = assets.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {});

  const statusColors = {
    'Operational': '#10b981',
    'Issue Reported': '#f59e0b',
    'Under Inspection': '#3b82f6',
    'Under Maintenance': '#6366f1',
    'Out of Service': '#f43f5e',
    'Retired': '#64748b'
  };

  const assetChartData = {
    labels: Object.keys(statusCounts),
    datasets: [{
      data: Object.values(statusCounts),
      backgroundColor: Object.keys(statusCounts).map(s => statusColors[s] || '#cbd5e1'),
      borderWidth: 0,
      hoverOffset: 6
    }]
  };

  const issueCategoryCounts = issues.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {});

  const issueChartData = {
    labels: Object.keys(issueCategoryCounts).slice(0, 5),
    datasets: [{
      label: 'Issues',
      data: Object.values(issueCategoryCounts).slice(0, 5),
      backgroundColor: ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'],
      borderRadius: 10,
      borderSkipped: false
    }]
  };

  const historyLogs = JSON.parse(localStorage.getItem('maintainiq_history')) || [];
  const sortedRecentLogs = [...historyLogs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  const criticalIssuesList = issues.filter(i => i.priority === 'Critical' && !['Resolved', 'Closed'].includes(i.status)).slice(0, 4);

  const kpiCards = [
    {
      label: 'Total Assets',
      value: totalAssets,
      sub: `${operationalAssets} operational`,
      icon: <Wrench className="h-5 w-5" />,
      gradient: 'from-indigo-500 to-blue-600',
      bgIcon: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
    },
    {
      label: 'Active Issues',
      value: activeIssues,
      sub: `${resolvedIssues} resolved total`,
      icon: <AlertTriangle className="h-5 w-5" />,
      gradient: 'from-amber-500 to-orange-600',
      bgIcon: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
    },
    {
      label: 'Critical Alerts',
      value: criticalIssuesCount,
      sub: criticalIssuesCount > 0 ? 'Immediate attention' : 'All systems safe',
      icon: <ShieldAlert className="h-5 w-5" />,
      gradient: 'from-rose-500 to-pink-600',
      bgIcon: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
    },
    {
      label: 'Maintenance Due',
      value: maintenanceDueCount,
      sub: 'Scheduled + overdue',
      icon: <Calendar className="h-5 w-5" />,
      gradient: 'from-violet-500 to-purple-600',
      bgIcon: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Live Dashboard</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Overview</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time asset health monitoring and service analytics.</p>
        </div>
        <Link to="/assets" className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:shadow-xl hover:shadow-indigo-600/30 active:scale-[0.97]">
          <Zap className="h-4 w-4" />
          Manage Assets
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((card, i) => (
          <motion.div key={i} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 400 }}>
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm p-6 shadow-sm">
              {/* Gradient accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`}></div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{card.label}</p>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2 tabular-nums">{card.value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${card.bgIcon}`}>
                  {card.icon}
                </div>
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-400 dark:text-slate-500">{card.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts & Critical Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Asset Status Distribution</h3>
              <div className="h-56 flex items-center justify-center">
                {assets.length > 0 ? (
                  <Doughnut data={assetChartData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: { boxWidth: 10, padding: 12, font: { size: 10, weight: '600' }, color: checkDark() ? '#94a3b8' : '#475569' }
                      }
                    }
                  }} />
                ) : <p className="text-sm text-slate-400">No asset data.</p>}
              </div>
            </Card>
            <Card>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Issues by Category</h3>
              <div className="h-56 flex items-center justify-center">
                {issues.length > 0 ? (
                  <Bar data={issueChartData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { grid: { color: checkDark() ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }, ticks: { color: checkDark() ? '#94a3b8' : '#475569', stepSize: 1, font: { weight: '600' } } },
                      x: { grid: { display: false }, ticks: { color: checkDark() ? '#94a3b8' : '#475569', font: { weight: '600' } } }
                    }
                  }} />
                ) : <p className="text-sm text-slate-400">No issues logged.</p>}
              </div>
            </Card>
          </div>

          {/* Critical Issues */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Critical Failures</h3>
              {criticalIssuesCount > 0 && (
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/30 rounded-full animate-pulse">URGENT</span>
              )}
            </div>
            {criticalIssuesList.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {criticalIssuesList.map((issue) => (
                  <div key={issue.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">{issue.assetCode}</span>
                        <span className="text-xs text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{issue.category}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">{issue.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Reported by {issue.reporterName} • {issue.assignedTo || 'Unassigned'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge status={issue.status} />
                      <Link to="/technician" className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Inspect →</Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-semibold">All systems operating safely.</p>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-500" />
              Upcoming Services
            </h3>
            {upcomingServices.length > 0 ? (
              <div className="space-y-4">
                {upcomingServices.map((asset) => (
                  <div key={asset.id} className="flex gap-3 items-start p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/40">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{asset.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">{asset.code}</p>
                      <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold mt-1">Due: {new Date(asset.nextService).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No upcoming services.</p>
            )}
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Activity Feed</h3>
            </div>
            {sortedRecentLogs.length > 0 ? (
              <div className="relative border-l-2 border-slate-100 dark:border-slate-800 pl-4 ml-2 space-y-5">
                {sortedRecentLogs.map((log) => (
                  <div key={log.id} className="relative">
                    <span className="absolute -left-[22px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-white dark:bg-slate-950 ring-2 ring-indigo-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{new Date(log.date).toLocaleString()}</span>
                    <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5 capitalize">{log.action}</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{log.details}</p>
                    <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <User className="h-3 w-3" /> {log.actor}
                    </span>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-slate-400 text-center py-6">No activity yet.</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}
