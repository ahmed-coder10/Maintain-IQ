import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../services/db';
import { useToast, Card, Badge, ConfirmationDialog, LoadingSkeleton } from '../components/UI';
import { 
  Plus, 
  Search, 
  Filter, 
  QrCode, 
  Edit, 
  Trash2, 
  Download, 
  Copy, 
  Printer, 
  ExternalLink, 
  Image as ImageIcon,
  X,
  Sparkles
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Assets() {
  const { showToast } = useToast();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [conditionFilter, setConditionFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Form states
  const [formOpen, setFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formCondition, setFormCondition] = useState('Good');
  const [formStatus, setFormStatus] = useState('Operational');
  const [formTechnician, setFormTechnician] = useState('');
  const [formPurchaseDate, setFormPurchaseDate] = useState('');
  const [formLastService, setFormLastService] = useState('');
  const [formNextService, setFormNextService] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // QR Modal State
  const [qrAsset, setQrAsset] = useState(null);
  const qrCanvasRef = useRef(null);

  // Delete State
  const [deleteId, setDeleteId] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Technicians List for assignment dropdown
  const technicians = ['Alex Rivier', 'Sarah Jenkins'];

  // Categories & Departments
  const categories = ['Electronics', 'HVAC', 'Laboratory', 'Networking', 'Electrical', 'Furniture', 'Plumbing', 'Safety'];
  const departments = ['Education', 'Facilities', 'Science', 'IT', 'Administration', 'Security'];

  useEffect(() => {
    // Check if query parameter "search" exists
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
    }

    const unsub = dbService.subscribeAssets((data) => {
      setAssets(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Filter Assets
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || asset.status === statusFilter;
    const matchesCondition = conditionFilter === 'All' || asset.condition === conditionFilter;
    const matchesCategory = categoryFilter === 'All' || asset.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCondition && matchesCategory;
  });

  // Open Form for creating
  const handleCreateOpen = () => {
    setEditingAsset(null);
    setFormName('');
    setFormCode('');
    setFormCategory(categories[0]);
    setFormDepartment(departments[0]);
    setFormLocation('');
    setFormCondition('Good');
    setFormStatus('Operational');
    setFormTechnician(technicians[0]);
    setFormPurchaseDate(new Date().toISOString().split('T')[0]);
    setFormLastService(new Date().toISOString().split('T')[0]);
    setFormNextService('');
    setFormDescription('');
    setFormImage(null);
    setImagePreview('');
    setFormOpen(true);
  };

  // Open Form for editing
  const handleEditOpen = (asset) => {
    setEditingAsset(asset);
    setFormName(asset.name);
    setFormCode(asset.code);
    setFormCategory(asset.category);
    setFormDepartment(asset.department);
    setFormLocation(asset.location);
    setFormCondition(asset.condition);
    setFormStatus(asset.status);
    setFormTechnician(asset.assignedTechnician || '');
    setFormPurchaseDate(asset.purchaseDate || '');
    setFormLastService(asset.lastService || '');
    setFormNextService(asset.nextService || '');
    setFormDescription(asset.description || '');
    setFormImage(null);
    setImagePreview(asset.imageUrl || '');
    setFormOpen(true);
  };

  // Image Upload handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formName || !formCode || !formLocation) {
      showToast('Please fill in Name, Unique Code, and Location.', 'warning');
      return;
    }

    // Business Rule Check: Next Service Date cannot be before Last Service Date
    if (formLastService && formNextService && new Date(formNextService) < new Date(formLastService)) {
      showToast('Next Service Date cannot be before the Last Service Date.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = imagePreview;
      
      // If a new image was chosen, upload it
      if (formImage) {
        imageUrl = await dbService.uploadFile(formImage, 'assets');
      }

      const assetData = {
        name: formName,
        code: formCode.toUpperCase(),
        category: formCategory,
        department: formDepartment,
        location: formLocation,
        condition: formCondition,
        status: formStatus,
        assignedTechnician: formTechnician,
        purchaseDate: formPurchaseDate,
        lastService: formLastService,
        nextService: formNextService,
        description: formDescription,
        imageUrl: imageUrl,
        createdBy: 'Admin',
        updatedBy: 'Admin'
      };

      if (editingAsset) {
        await dbService.updateAsset(editingAsset.id, assetData);
        showToast('Asset updated successfully.', 'success');
      } else {
        await dbService.createAsset(assetData);
        showToast('New asset registered successfully.', 'success');
      }
      setFormOpen(false);
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Failed to save asset. Check unique code.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete handler
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await dbService.deleteAsset(deleteId);
      showToast('Asset deleted successfully.', 'success');
    } catch (error) {
      showToast('Failed to delete asset.', 'error');
    }
  };

  // Get Public Link
  const getPublicLink = (asset) => {
    // Generate link matching routing in App.jsx
    return `${window.location.origin}/public/asset/${asset?.id}`;
  };

  // Copy Link
  const handleCopyLink = (asset) => {
    const link = getPublicLink(asset);
    navigator.clipboard.writeText(link);
    showToast('Public Asset link copied to clipboard.', 'success');
  };

  // Download QR
  const handleDownloadQr = (asset) => {
    const canvas = qrCanvasRef.current;
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `QR_${asset.code}.png`;
      link.href = url;
      link.click();
      showToast('QR code downloaded.', 'success');
    }
  };

  // Print QR Label
  const handlePrintLabel = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Asset Registry</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Register, monitor condition, and manage unique QR labels.</p>
        </div>
        <button
          onClick={handleCreateOpen}
          className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white font-bold bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/10 self-start sm:self-center"
        >
          <Plus className="h-5 w-5" />
          <span>Register Asset</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <Card className="py-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search bar */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search assets by name, code or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                Clear
              </button>
            )}
          </div>
          
          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-600 dark:text-slate-300 focus:outline-none"
              >
                <option value="All">All Categories</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-600 dark:text-slate-300 focus:outline-none"
              >
                <option value="All">All Conditions</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-600 dark:text-slate-300 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Operational">Operational</option>
                <option value="Issue Reported">Issue Reported</option>
                <option value="Under Inspection">Under Inspection</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Out of Service">Out of Service</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Asset Grid / Table */}
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : filteredAssets.length > 0 ? (
        <Card className="p-0 overflow-hidden border-slate-200/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Asset Detail</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Location</th>
                  <th className="py-4 px-6">Condition</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        {asset.imageUrl ? (
                          <img src={asset.imageUrl} alt={asset.name} className="h-10 w-10 rounded-xl object-cover border border-slate-200 dark:border-slate-800" />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{asset.name}</h4>
                          <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded mt-1 inline-block">
                            {asset.code}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">{asset.category}</td>
                    <td className="py-4 px-6 text-sm font-medium text-slate-500 dark:text-slate-400">{asset.location}</td>
                    <td className="py-4 px-6">
                      <Badge status={asset.condition} />
                    </td>
                    <td className="py-4 px-6">
                      <Badge status={asset.status} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setQrAsset(asset)}
                          className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-lg transition-colors"
                          title="QR Labels & Codes"
                        >
                          <QrCode className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() => handleEditOpen(asset)}
                          className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg transition-colors"
                          title="Edit Asset"
                        >
                          <Edit className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteId(asset.id);
                            setDeleteOpen(true);
                          }}
                          className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                          title="Delete Asset"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="py-12 text-center text-slate-400 dark:text-slate-500">
          No assets match the search criteria. Click "Register Asset" to add a new one.
        </Card>
      )}

      {/* --------------------------------------------------
          QR CODE DETAILS MODAL
      -------------------------------------------------- */}
      <AnimatePresence>
        {qrAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setQrAsset(null)} className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm"></div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 rounded-2xl shadow-xl z-10 print-area"
            >
              <div className="absolute top-4 right-4 print:hidden">
                <button onClick={() => setQrAsset(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Print-ready asset label container */}
              <div className="flex flex-col items-center text-center p-4">
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-bold">
                  Asset Tracking Tag
                </span>
                <h3 className="text-xl font-extrabold text-slate-950 dark:text-slate-50 mt-1">{qrAsset.name}</h3>
                
                {/* QR Canvas */}
                <div className="my-6 p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-center">
                  <QRCodeCanvas
                    id="qrcode-canvas"
                    ref={qrCanvasRef}
                    value={getPublicLink(qrAsset)}
                    size={160}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <div className="space-y-1 text-sm font-semibold">
                  <div className="flex items-center gap-1.5 justify-center">
                    <span className="text-slate-400">Code:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {qrAsset.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-center mt-1">
                    <span className="text-slate-400">Location:</span>
                    <span className="text-slate-700 dark:text-slate-300">{qrAsset.location}</span>
                  </div>
                </div>

                <p className="mt-4 text-[10px] text-slate-400 max-w-xs leading-relaxed">
                  Scan this QR code using a mobile camera to access the public profile, inspect service history, and report malfunctions.
                </p>
              </div>

              {/* Action utilities */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 justify-center print:hidden">
                <button
                  onClick={() => handleCopyLink(qrAsset)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy Link</span>
                </button>
                <button
                  onClick={() => handleDownloadQr(qrAsset)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </button>
                <button
                  onClick={handlePrintLabel}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Tag</span>
                </button>
                <Link
                  to={`/public/asset/${qrAsset.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Open Page</span>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --------------------------------------------------
          REGISTER / EDIT ASSET DRAWER
      -------------------------------------------------- */}
      <AnimatePresence>
        {formOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div onClick={() => setFormOpen(false)} className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm"></div>
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              className="relative bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-xl h-full flex flex-col z-10 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingAsset ? `Edit Asset: ${editingAsset.name}` : 'Register New Physical Asset'}
                </h3>
                <button onClick={() => setFormOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Image upload section */}
                <div className="flex gap-4 items-center">
                  <div className="h-20 w-20 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 overflow-hidden relative">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-8 w-8" />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Asset Cover Image</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange}
                      className="mt-1.5 block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-300 hover:file:bg-slate-200 dark:hover:file:bg-slate-700 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Asset Name *</label>
                    <input 
                      type="text" 
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Classroom Projector 01"
                      className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Unique Code *</label>
                    <input 
                      type="text" 
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      placeholder="e.g. PROJ-001"
                      className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      disabled={editingAsset} // Code shouldn't change once setup for QR consistency
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Category *</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Department *</label>
                    <select
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
                    >
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Condition *</label>
                    <select
                      value={formCondition}
                      onChange={(e) => setFormCondition(e.target.value)}
                      className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
                    >
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Status *</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
                    >
                      <option value="Operational">Operational</option>
                      <option value="Issue Reported">Issue Reported</option>
                      <option value="Under Inspection">Under Inspection</option>
                      <option value="Under Maintenance">Under Maintenance</option>
                      <option value="Out of Service">Out of Service</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Location (Room/Area) *</label>
                    <input 
                      type="text" 
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      placeholder="e.g. Science Lab B"
                      className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Assigned Technician</label>
                    <select
                      value={formTechnician}
                      onChange={(e) => setFormTechnician(e.target.value)}
                      className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
                    >
                      <option value="">Unassigned</option>
                      {technicians.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Purchase Date</label>
                    <input 
                      type="date" 
                      value={formPurchaseDate}
                      onChange={(e) => setFormPurchaseDate(e.target.value)}
                      className="mt-1.5 block w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Last Service</label>
                    <input 
                      type="date" 
                      value={formLastService}
                      onChange={(e) => setFormLastService(e.target.value)}
                      className="mt-1.5 block w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Next Service Due</label>
                    <input 
                      type="date" 
                      value={formNextService}
                      onChange={(e) => setFormNextService(e.target.value)}
                      className="mt-1.5 block w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Description</label>
                  <textarea 
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
                    placeholder="Provide details about asset specifications, warranty or usage guides..."
                    className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    type="button" 
                    onClick={() => setFormOpen(false)}
                    className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-lg shadow-indigo-500/10 disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Asset'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Asset"
        message="Are you sure you want to permanently delete this asset and all its service logs? This action cannot be undone."
        confirmText="Delete Asset"
        type="danger"
      />
    </div>
  );
}
