import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { dbService } from '../services/db';
import { geminiService } from '../services/gemini';
import { useToast, Card, Badge, LoadingSkeleton } from '../components/UI';
import { 
  Sparkles, 
  Send, 
  ArrowLeft, 
  AlertTriangle, 
  User, 
  Mail, 
  Wrench, 
  Image as ImageIcon,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function ReportIssue() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [complaintText, setComplaintText] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidencePreview, setEvidencePreview] = useState('');

  // AI Output states (User editable!)
  const [aiTriageDone, setAiTriageDone] = useState(false);
  const [triaging, setTriaging] = useState(false);
  
  const [issueTitle, setIssueTitle] = useState('');
  const [issueCategory, setIssueCategory] = useState('General');
  const [issuePriority, setIssuePriority] = useState('Medium');
  const [possibleCauses, setPossibleCauses] = useState([]);
  const [diagnosticChecks, setDiagnosticChecks] = useState([]);
  const [safetyWarning, setSafetyWarning] = useState('');
  const [isAiEdited, setIsAiEdited] = useState(false);

  // Success states
  const [submittedIssueNum, setSubmittedIssueNum] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Dropdown categories
  const categories = ['Electrical', 'HVAC', 'Plumbing', 'Electronics', 'Mechanical', 'Networking', 'IT', 'General'];

  useEffect(() => {
    async function loadAsset() {
      try {
        const assetData = await dbService.getAssetById(id);
        if (assetData) {
          setAsset(assetData);
        }
      } catch (err) {
        showToast('Error loading asset info.', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadAsset();
  }, [id]);

  const handleEvidenceChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEvidenceFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEvidencePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Run AI Triage on the natural complaint description
  const handleAiTriage = async () => {
    if (!complaintText.trim()) {
      showToast('Please enter a description of the issue first.', 'warning');
      return;
    }
    setTriaging(true);
    try {
      const assetContext = asset ? { name: asset.name, category: asset.category, location: asset.location } : null;
      const triageResult = await geminiService.triageIssue(complaintText, assetContext);
      
      // Load AI suggestions into state (reporters can edit these!)
      setIssueTitle(triageResult.title);
      setIssueCategory(triageResult.category);
      setIssuePriority(triageResult.priority);
      setPossibleCauses(triageResult.causes);
      setDiagnosticChecks(triageResult.checks);
      setSafetyWarning(triageResult.warning);
      setAiTriageDone(true);
      setIsAiEdited(false);
      showToast('AI diagnostics ready. Please review the values below.', 'success');
    } catch (error) {
      showToast('AI triage failed. Standard fallback applied.', 'warning');
    } finally {
      setTriaging(false);
    }
  };

  const handleInputChange = (field, value) => {
    setIsAiEdited(true);
    if (field === 'title') setIssueTitle(value);
    if (field === 'category') setIssueCategory(value);
    if (field === 'priority') setIssuePriority(value);
    if (field === 'warning') setSafetyWarning(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reporterName || !reporterEmail || !complaintText) {
      showToast('Please fill in your name, email, and description.', 'warning');
      return;
    }

    if (!aiTriageDone) {
      showToast('Please run AI Triage to review classifications before submitting.', 'warning');
      return;
    }

    setLoading(true);
    try {
      let evidenceUrl = evidencePreview;
      if (evidenceFile) {
        evidenceUrl = await dbService.uploadFile(evidenceFile, 'issues');
      }

      const issueData = {
        assetId: id,
        assetName: asset.name,
        assetCode: asset.code,
        title: issueTitle || `Issue report for ${asset.code}`,
        description: complaintText,
        priority: issuePriority,
        category: issueCategory,
        reporterName,
        reporterEmail,
        evidenceUrl,
        isAiTriaged: true,
        isAiEdited: isAiEdited,
        possibleCauses,
        diagnosticChecks,
        safetyWarning
      };

      const result = await dbService.createIssue(issueData);
      setSubmittedIssueNum(result.issueNumber);
      setSubmitSuccess(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      showToast('Ticket submitted successfully. Asset status updated.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to submit maintenance ticket.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !submitSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <LoadingSkeleton count={3} />
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-300">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center p-8 glass-panel border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 mb-4">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-50">Report Submitted!</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Thank you for reporting this issue. A technician has been alerted and will inspect the equipment shortly.
          </p>

          <div className="my-6 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 rounded-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase">Your Reference Code</span>
            <h4 className="text-lg font-mono font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
              {submittedIssueNum}
            </h4>
          </div>

          <div className="space-y-3">
            <Link
              to={`/public/asset/${id}`}
              className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl text-white font-bold bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/10"
            >
              Back to Asset Profile
            </Link>
            <button
              onClick={() => {
                setSubmitSuccess(false);
                setComplaintText('');
                setAiTriageDone(false);
                setEvidenceFile(null);
                setEvidencePreview('');
              }}
              className="w-full text-xs font-semibold text-slate-500 dark:text-slate-400 hover:underline"
            >
              Report Another Issue
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 flex flex-col items-center transition-colors duration-300">
      <div className="max-w-xl w-full">
        {/* Back Link */}
        <Link 
          to={`/public/asset/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Profile</span>
        </Link>

        {/* Header card */}
        <Card className="p-6 mb-6">
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-bold">
            Maintenance Dispatch
          </span>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-slate-50 mt-1">Report Equipment Issue</h1>
          {asset && (
            <p className="text-xs text-slate-500 mt-2">
              Reporting for: <span className="font-bold text-slate-700 dark:text-slate-300">{asset.name}</span> ({asset.code}) 
              located in <span className="font-bold text-slate-700 dark:text-slate-300">{asset.location}</span>.
            </p>
          )}
        </Card>

        {/* Wizard Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Contact Details */}
          <Card className="space-y-4">
            <h3 className="text-sm font-bold text-slate-950 dark:text-slate-50 border-b border-slate-100 dark:border-slate-800/80 pb-2">
              1. Reporter Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">Your Full Name *</label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-slate-950 dark:text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">Email Address *</label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="email"
                    value={reporterEmail}
                    onChange={(e) => setReporterEmail(e.target.value)}
                    placeholder="john@workplace.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-slate-950 dark:text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Section 2: Narrative description */}
          <Card className="space-y-4">
            <h3 className="text-sm font-bold text-slate-950 dark:text-slate-50 border-b border-slate-100 dark:border-slate-800/80 pb-2">
              2. Describe the Malfunction
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Explain what is wrong *
              </label>
              <textarea 
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                rows={3}
                placeholder="Describe symptoms, noise, warning lights, or when the issue occurs. Example: 'The central cooling is leaking water onto the server rack and cooling is extremely weak.'"
                className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-slate-950 dark:text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Evidence image */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">Upload Photo Evidence (Optional)</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleEvidenceChange}
                className="mt-1.5 block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-300 hover:file:bg-slate-200 cursor-pointer"
              />
            </div>

            {evidencePreview && (
              <div className="h-32 w-32 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
                <img src={evidencePreview} alt="Evidence" className="h-full w-full object-cover" />
              </div>
            )}

            {/* Run Triage trigger button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleAiTriage}
                disabled={triaging}
                className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl text-white font-bold bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/10 hover:shadow-lg transition-all disabled:opacity-50 text-sm"
              >
                <Sparkles className="h-4.5 w-4.5 animate-pulse" />
                <span>{triaging ? 'Diagnosing with AI...' : 'Analyze with AI Triage'}</span>
              </button>
            </div>
          </Card>

          {/* Section 3: AI Output Panel (Editable) */}
          <AnimatePresence>
            {aiTriageDone && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
              >
                <Card className="space-y-4 border-indigo-200 dark:border-indigo-900/30 bg-indigo-50/20 dark:bg-indigo-950/5">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                      <Sparkles className="h-4.5 w-4.5" />
                      <h3 className="text-sm font-bold">3. AI Triage Diagnostics</h3>
                    </div>
                    {isAiEdited && (
                      <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                        Edited by User
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Proposed Ticket Title (Editable)
                    </label>
                    <input 
                      type="text" 
                      value={issueTitle}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Suggested Category
                      </label>
                      <select
                        value={issueCategory}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                      >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Suggested Severity
                      </label>
                      <select
                        value={issuePriority}
                        onChange={(e) => handleInputChange('priority', e.target.value)}
                        className="mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  {/* Safety Alert Warning */}
                  {safetyWarning && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs font-medium flex gap-2 items-start leading-relaxed">
                      <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-rose-500" />
                      <div>
                        <span className="font-bold">Safety Directive: </span>
                        {safetyWarning}
                      </div>
                    </div>
                  )}

                  {/* Causes & Checks lists */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1">
                        <Wrench className="h-3.5 w-3.5" />
                        Possible Causes
                      </h4>
                      <ul className="list-disc pl-4 space-y-1 text-slate-500 dark:text-slate-400 leading-normal font-medium">
                        {possibleCauses.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1">
                        <HelpCircle className="h-3.5 w-3.5" />
                        Recommended Safety Checks
                      </h4>
                      <ul className="list-disc pl-4 space-y-1 text-slate-500 dark:text-slate-400 leading-normal font-medium">
                        {diagnosticChecks.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Actions */}
          <div className="flex gap-4">
            <Link
              to={`/public/asset/${id}`}
              className="flex-1 inline-flex items-center justify-center py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !aiTriageDone}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4.5 w-4.5" />
              <span>Submit Ticket</span>
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}
