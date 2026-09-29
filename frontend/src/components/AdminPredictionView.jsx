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
  Activity
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
          setMonuments(json.data);
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
      // In a real scenario, this would have an auth token
      const response = await fetch(`${API_URL}/admin/predictions/${selectedMonument}?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer fake-admin-token-for-tests`
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
      case 'Excellent': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'Good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Fair': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Visitor Footfall Prediction</h1>
          <p className="text-gray-500 mt-1">Machine learning powered estimations for advanced planning.</p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <form onSubmit={handlePredict} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              Select Monument
            </label>
            <select 
              value={selectedMonument}
              onChange={(e) => setSelectedMonument(e.target.value)}
              className="w-full rounded-lg border-gray-300 border px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              required
              data-testid="monument-select"
            >
              <option value="" disabled>Choose a monument...</option>
              {monuments.map(m => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 w-full space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              Target Date
            </label>
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-lg border-gray-300 border px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              required
              data-testid="date-input"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            data-testid="predict-button"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            {loading ? 'Analyzing...' : 'Generate Prediction'}
          </button>
        </form>
      </div>

      {/* Error States */}
      {error && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          errorType === 'INSUFFICIENT_DATA' ? 'bg-amber-50 border-amber-200 text-amber-800' :
          errorType === 'MODEL_UNAVAILABLE' ? 'bg-slate-50 border-slate-200 text-slate-800' :
          'bg-red-50 border-red-200 text-red-800'
        }`} data-testid="error-state">
          {errorType === 'INSUFFICIENT_DATA' ? <Database className="w-6 h-6 text-amber-600 mt-0.5" /> : 
           errorType === 'MODEL_UNAVAILABLE' ? <Activity className="w-6 h-6 text-slate-600 mt-0.5" /> :
           <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />}
          <div>
            <h3 className="font-semibold">{
              errorType === 'INSUFFICIENT_DATA' ? 'Insufficient Data for Prediction' :
              errorType === 'MODEL_UNAVAILABLE' ? 'Model Service Unavailable' :
              'Prediction Failed'
            }</h3>
            <p className="text-sm mt-1 opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Prediction Results */}
      {predictionData && !loading && !error && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" data-testid="prediction-result">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Result Card */}
            <div className="lg:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp className="w-24 h-24" />
              </div>
              
              <div className="z-10">
                <p className="text-blue-100 font-medium text-sm tracking-wide uppercase mb-1">Expected Footfall</p>
                <h2 className="text-5xl font-bold tracking-tight mb-2">
                  {predictionData.predictedVisitorCount.toLocaleString()}
                </h2>
                <div className="flex items-center gap-2 text-blue-100 mt-4 bg-white/10 w-fit px-3 py-1.5 rounded-full text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(predictionData.targetDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Metrics & Details */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Model Telemetry
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Model</p>
                  <p className="font-semibold text-gray-900 truncate" title={`${predictionData.modelName} ${predictionData.modelVersion}`}>
                    {predictionData.modelName} <span className="text-xs text-gray-500 font-normal">v{predictionData.modelVersion}</span>
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">MAE</p>
                  <p className="font-semibold text-gray-900">{predictionData.metrics.mae.toFixed(2)}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">RMSE</p>
                  <p className="font-semibold text-gray-900">{predictionData.metrics.rmse.toFixed(2)}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Data Quality</p>
                  <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(predictionData.dataQualityStatus)}`}>
                    {predictionData.dataQualityStatus}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Training Date Range</p>
                  <p className="text-sm text-gray-700">
                    {new Date(predictionData.trainingDateRange.start).toLocaleDateString()} — {new Date(predictionData.trainingDateRange.end).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3 text-slate-700 text-sm">
            <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-slate-900">Important Disclaimer</p>
              <p>The estimated visitor count is a <span className="font-semibold">prediction, not a guarantee</span>. This value is generated by a machine learning model based on historical patterns, weather, and calendar events. Actual footfall may vary significantly due to unforeseen circumstances, sudden weather changes, or unrecorded public events.</p>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
};

export default AdminPredictionView;
