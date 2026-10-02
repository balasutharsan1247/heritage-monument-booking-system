import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  TrendingUp, 
  AlertTriangle, 
  Info, 
  Loader2,
  Database,
  Search,
  Activity,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdminPredictionView = () => {
  const [monuments, setMonuments] = useState([]);
  const [selectedMonument, setSelectedMonument] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  
  const [predictionData, setPredictionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null);

  // Fetch monuments on load
  useEffect(() => {
    const fetchMonuments = async () => {
      try {
        const response = await fetch(`${API_URL}/monuments`);
        const json = await response.json();
        if (json.success) {
          setMonuments(json.data.monuments || json.data || []);
        }
      } catch (err) {
        console.error('Failed to load monuments', err);
      }
    };
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
    
    fetchMonuments();
  }, []);

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!selectedMonument || !selectedDate) return;

    setLoading(true);
    setError(null);
    setErrorType(null);
    setPredictionData(null);

    try {
      const token = localStorage.getItem('token') || 'fake-admin-token-for-tests';
      const response = await fetch(`${API_URL}/admin/predictions/${selectedMonument}?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const json = await response.json();
      
      if (!response.ok) {
        let type = 'ERROR';
        if (response.status === 404) type = 'NOT_FOUND';
        else if (response.status === 422) type = 'INSUFFICIENT_DATA';
        else if (response.status === 503) type = 'MODEL_UNAVAILABLE';
        
        throw { message: json.message || 'Failed to fetch prediction', type };
      }

      setPredictionData(json.data);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
      setErrorType(err.type || 'ERROR');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Excellent': return 'text-emerald-700 bg-emerald-50 border-emerald-300';
      case 'Good': return 'text-sky-700 bg-sky-50 border-sky-300';
      case 'Fair': return 'text-amber-700 bg-amber-50 border-amber-300';
      case 'Poor': return 'text-red-700 bg-red-50 border-red-300';
      default: return 'text-charcoal-700 bg-sandstone-50 border-sandstone-300';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-sandstone-200">
        <div>
          <h1 className="text-3xl font-black text-charcoal-900 font-serif tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-maroon-800" />
            <span>Visitor Footfall Prediction</span>
          </h1>
          <p className="text-charcoal-600 mt-1 text-sm">
            Machine learning powered estimations for advanced monument crowd management and staffing.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sandstone-100 text-charcoal-700 text-xs font-semibold border border-sandstone-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Random Forest Regression Engine</span>
        </div>
      </div>

      {/* Control Panel Form */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-sandstone-200">
        <form onSubmit={handlePredict} className="flex flex-col md:flex-row gap-5 items-end">
          <div className="flex-1 w-full space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-700 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-maroon-700" />
              Select Monument
            </label>
            <select 
              value={selectedMonument}
              onChange={(e) => setSelectedMonument(e.target.value)}
              className="w-full rounded-xl border-sandstone-300 border bg-white px-4 py-3 text-sm text-charcoal-900 focus:ring-2 focus:ring-maroon-600/20 focus:border-maroon-700 transition-all outline-none cursor-pointer"
              required
              data-testid="monument-select"
            >
              <option value="" disabled>Choose a monument...</option>
              {monuments.map(m => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 w-full space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-700 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-maroon-700" />
              Target Date
            </label>
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-xl border-sandstone-300 border bg-white px-4 py-3 text-sm text-charcoal-900 focus:ring-2 focus:ring-maroon-600/20 focus:border-maroon-700 transition-all outline-none"
              required
              data-testid="date-input"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-8 py-3 bg-maroon-800 hover:bg-maroon-700 text-white font-bold text-sm rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 border border-maroon-900/30 active:scale-[0.98]"
            data-testid="predict-button"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 text-gold-400" />}
            <span>{loading ? 'Analyzing...' : 'Generate Prediction'}</span>
          </button>
        </form>
      </div>

      {/* Error States */}
      {error && (
        <div className={`p-5 rounded-2xl border flex items-start gap-3.5 animate-in fade-in ${
          errorType === 'INSUFFICIENT_DATA' ? 'bg-amber-50 border-amber-300 text-amber-900' :
          errorType === 'MODEL_UNAVAILABLE' ? 'bg-slate-50 border-slate-300 text-slate-900' :
          'bg-red-50 border-red-300 text-red-900'
        }`} data-testid="error-state">
          {errorType === 'INSUFFICIENT_DATA' ? <Database className="w-6 h-6 text-amber-700 mt-0.5 shrink-0" /> : 
           errorType === 'MODEL_UNAVAILABLE' ? <Activity className="w-6 h-6 text-slate-700 mt-0.5 shrink-0" /> :
           <AlertTriangle className="w-6 h-6 text-red-700 mt-0.5 shrink-0" />}
          <div>
            <h3 className="font-bold text-base">{
              errorType === 'INSUFFICIENT_DATA' ? 'Insufficient Data for Prediction' :
              errorType === 'MODEL_UNAVAILABLE' ? 'Model Service Unavailable' :
              'Prediction Failed'
            }</h3>
            <p className="text-sm mt-1 leading-relaxed opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Prediction Results */}
      {predictionData && !loading && !error && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" data-testid="prediction-result">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Result Card */}
            <div className="lg:col-span-1 bg-gradient-to-br from-maroon-900 via-maroon-850 to-charcoal-950 rounded-3xl p-7 text-white shadow-heritage-lg flex flex-col justify-between relative overflow-hidden border border-gold-500/30">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp className="w-28 h-28 text-gold-400" />
              </div>
              
              <div className="z-10">
                <div className="flex items-center gap-1.5 text-gold-400 text-xs font-bold uppercase tracking-widest mb-2">
                  <Sparkles className="w-3.5 h-3.5" /> Expected Footfall
                </div>
                <h2 className="text-5xl font-black font-serif tracking-tight mb-2 text-ivory-50">
                  {predictionData.predictedVisitorCount.toLocaleString()}
                </h2>
                <div className="text-xs text-sandstone-300 font-medium">Estimated daily visitor attendance</div>
                
                <div className="flex items-center gap-2 text-ivory-100 mt-6 bg-white/10 w-fit px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm border border-white/10">
                  <Calendar className="w-3.5 h-3.5 text-gold-400" />
                  <span>{new Date(predictionData.targetDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Metrics & Telemetry Card */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-sandstone-200 shadow-sm p-7 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold font-serif text-charcoal-900 mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-maroon-800" />
                  Model Telemetry
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-[11px] text-charcoal-500 font-bold uppercase tracking-wider">Model</p>
                    <p className="font-bold text-charcoal-900 truncate text-sm" title={`${predictionData.modelName} ${predictionData.modelVersion}`}>
                      {predictionData.modelName} <span className="text-xs text-charcoal-500 font-normal">v{predictionData.modelVersion}</span>
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[11px] text-charcoal-500 font-bold uppercase tracking-wider">MAE</p>
                    <p className="font-bold text-charcoal-900 text-sm font-mono">{predictionData.metrics.mae.toFixed(2)}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[11px] text-charcoal-500 font-bold uppercase tracking-wider">RMSE</p>
                    <p className="font-bold text-charcoal-900 text-sm font-mono">{predictionData.metrics.rmse.toFixed(2)}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] text-charcoal-500 font-bold uppercase tracking-wider">Data Quality</p>
                    <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full border ${getStatusColor(predictionData.dataQualityStatus)}`}>
                      {predictionData.dataQualityStatus}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-sandstone-100">
                <div className="space-y-1">
                  <p className="text-[11px] text-charcoal-500 font-bold uppercase tracking-wider">Training Date Range</p>
                  <p className="text-xs font-medium text-charcoal-700">
                    {new Date(predictionData.trainingDateRange.start).toLocaleDateString()} — {new Date(predictionData.trainingDateRange.end).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer Banner */}
          <div className="bg-sandstone-50 border border-sandstone-200 rounded-2xl p-4 flex gap-3 text-charcoal-700 text-xs leading-relaxed">
            <Info className="w-5 h-5 text-maroon-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-charcoal-900 uppercase tracking-wide">Important Disclaimer</p>
              <p>The estimated visitor count is a <span className="font-semibold">prediction, not a guarantee</span>. This value is generated by a machine learning model based on historical patterns, weather, and calendar events. Actual footfall may vary significantly due to unforeseen circumstances, sudden weather changes, or unrecorded public events.</p>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
};

export default AdminPredictionView;
