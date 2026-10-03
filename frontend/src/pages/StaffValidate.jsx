import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  ScanLine, 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck,
  Camera,
  CameraOff,
  Keyboard,
  Upload,
  User,
  Clock,
  Calendar,
  Landmark,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Zap,
  ArrowRight,
  Check,
  Users
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';

export default function StaffValidate() {
  const { user } = useAuth();
  const isStaff = user?.role === 'staff';
  const assignedMonumentId = user?.assignedMonument?._id || (typeof user?.assignedMonument === 'string' ? user?.assignedMonument : null);

  const [activeTab, setActiveTab] = useState('camera'); // 'camera' or 'manual'
  const [qrData, setQrData] = useState('');
  const [monuments, setMonuments] = useState([]);
  const [selectedMonument, setSelectedMonument] = useState(assignedMonumentId || '');
  const [autoMark, setAutoMark] = useState(false); // default to inspect & verify first

  // Ticket Mark Popup State
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupStep, setPopupStep] = useState('verify'); // 'verify' or 'success' or 'error'
  const [currentTicket, setCurrentTicket] = useState(null);
  const [popupError, setPopupError] = useState('');
  const [admittedRecord, setAdmittedRecord] = useState(null);

  // Loading States
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingMark, setLoadingMark] = useState(false);

  // Camera State
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef(null);

  // Recent Session Admissions
  const [recentAdmissions, setRecentAdmissions] = useState([]);

  const toast = useToast();

  useEffect(() => {
    if (isStaff) {
      if (assignedMonumentId) {
        setSelectedMonument(assignedMonumentId);
      }
    } else {
      api.getMonuments().then((res) => {
        if (res.success) {
          setMonuments(res.data.monuments || res.data || []);
        }
      });
    }
  }, [isStaff, assignedMonumentId]);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader');
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // Ignore individual frame decoding errors
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.warn('Camera start error:', err);
      setCameraError('Unable to access camera. Please allow camera permissions or enter token code below.');
      setIsScanning(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn('Error stopping camera:', err);
      }
    }
    setIsScanning(false);
  };

  const playBeepSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // AudioContext not supported or restricted
    }
  };

  const handleScanSuccess = async (scannedPayload) => {
    playBeepSound();

    // Temporarily pause camera so popup is stable
    if (scannerRef.current && isScanning) {
      try {
        scannerRef.current.pause();
      } catch {
        // Ignore pause error
      }
    }

    if (autoMark) {
      // Instant Admit Mode: verify & mark immediately in popup
      processDirectAdmit(scannedPayload);
    } else {
      // Inspect & Verify First Mode: open popup with verify details
      processVerifyPopup(scannedPayload);
    }
  };

  // Open Popup with Verification Details
  const processVerifyPopup = async (payload) => {
    setLoadingVerify(true);
    setPopupError('');
    setCurrentTicket(null);
    setAdmittedRecord(null);
    setPopupStep('verify');
    setIsPopupOpen(true);

    try {
      const res = await api.verifyTicket({
        qrPayload: payload,
        selectedMonumentId: selectedMonument || undefined,
      });

      if (res.success) {
        setCurrentTicket(res.data);
        if (!res.data.valid) {
          setPopupError(res.data.reason || 'Ticket not valid for admission');
        }
      } else {
        setPopupStep('error');
        setPopupError(res.message || 'Ticket not found or invalid');
      }
    } catch {
      setPopupStep('error');
      setPopupError('Network error checking ticket validity.');
    } finally {
      setLoadingVerify(false);
    }
  };

  // Instant Admit & Open Success Popup
  const processDirectAdmit = async (payloadOrId) => {
    setLoadingMark(true);
    setPopupError('');
    setCurrentTicket(null);
    setPopupStep('verify');
    setIsPopupOpen(true);

    try {
      const isPayloadString = typeof payloadOrId === 'string' && payloadOrId.length > 30;
      const res = await api.validateTicket({
        qrPayload: isPayloadString ? payloadOrId : undefined,
        ticketId: !isPayloadString ? payloadOrId : undefined,
        tokenNumber: !isPayloadString ? payloadOrId : undefined,
        selectedMonumentId: selectedMonument || undefined,
      });

      if (res.success) {
        setAdmittedRecord(res.data);
        setPopupStep('success');
        toast.success(`Admitted: #${res.data.tokenNumber}`);

        // Add to recent shift log
        setRecentAdmissions((prev) => [
          {
            id: res.data.ticketId,
            tokenNumber: res.data.tokenNumber,
            monumentName: res.data.monumentName,
            visitorName: res.data.visitorName || 'Visitor',
            numberOfPeople: res.data.numberOfPeople || 1,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev.slice(0, 9),
        ]);
      } else {
        setPopupStep('error');
        setPopupError(res.message || 'Ticket invalid or already used');
      }
    } catch {
      setPopupStep('error');
      setPopupError('Network error processing admission.');
    } finally {
      setLoadingMark(false);
    }
  };

  // Mark the currently verified ticket as used from inside the popup
  const handleConfirmMarkInPopup = async () => {
    if (!currentTicket) return;

    setLoadingMark(true);
    setPopupError('');

    try {
      const res = await api.validateTicket({
        ticketId: currentTicket.ticketId,
        selectedMonumentId: selectedMonument || undefined,
      });

      if (res.success) {
        setAdmittedRecord(res.data);
        setPopupStep('success');
        toast.success(`Ticket #${res.data.tokenNumber} marked as USED`);

        // Update shift log
        setRecentAdmissions((prev) => [
          {
            id: res.data.ticketId,
            tokenNumber: res.data.tokenNumber,
            monumentName: res.data.monumentName,
            visitorName: res.data.visitorName || currentTicket.visitor?.name || 'Visitor',
            numberOfPeople: res.data.numberOfPeople || currentTicket.numberOfPeople || 1,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev.slice(0, 9),
        ]);
      } else {
        setPopupError(res.message || 'Could not mark ticket as used');
      }
    } catch {
      setPopupError('Network error marking ticket.');
    } finally {
      setLoadingMark(false);
    }
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setCurrentTicket(null);
    setAdmittedRecord(null);
    setPopupError('');
    setQrData('');

    // Resume camera scanner if it was scanning
    if (scannerRef.current && isScanning) {
      try {
        scannerRef.current.resume();
      } catch {
        // Ignore resume error
      }
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!qrData.trim()) return;

    if (autoMark) {
      processDirectAdmit(qrData.trim());
    } else {
      processVerifyPopup(qrData.trim());
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const scanner = new Html5Qrcode('qr-reader-hidden');
      const decodedText = await scanner.scanFile(file, true);
      scanner.clear();
      handleScanSuccess(decodedText);
    } catch (err) {
      toast.error('Could not detect QR code in image. Please try another photo or enter token manually.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-14">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sandstone-200 pb-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-sans text-charcoal-900 flex items-center gap-2">
            <ScanLine className="w-6 h-6 text-maroon-800" />
            <span>Ticket Validator</span>
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Scan visitor QR pass, inspect credentials in popup, and mark admission
          </p>
        </div>

        {/* Workflow Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-sandstone-100 p-1.5 rounded-xl border border-sandstone-300">
          <button
            type="button"
            onClick={() => setAutoMark(!autoMark)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              autoMark
                ? 'bg-maroon-800 text-white shadow-2xs'
                : 'bg-white text-charcoal-700 hover:bg-sandstone-200'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${autoMark ? 'text-gold-400' : 'text-charcoal-400'}`} />
            <span>{autoMark ? 'Instant Mode (ON)' : 'Popup Review (ON)'}</span>
          </button>
        </div>
      </div>

      {/* Monument Selection Bar or Locked Station Bar */}
      {isStaff ? (
        assignedMonumentId ? (
          <div className="bg-white rounded-2xl border border-sandstone-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-maroon-800/10 text-maroon-800 flex items-center justify-center shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-500 block">
                  Station Gate Allocation
                </span>
                <span className="text-sm font-bold text-charcoal-900 block font-sans">
                  {user?.assignedMonument?.name || 'Allocated Monument'}
                </span>
                {user?.assignedMonument?.location && (
                  <span className="text-xs text-charcoal-500 block">
                    {user.assignedMonument.location}
                  </span>
                )}
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold self-start sm:self-auto">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Gate Station Locked</span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold block">No Monument Station Allocated</span>
              <span>You are not currently allocated to any monument site. Please contact an administrator to assign your gate before validating passes.</span>
            </div>
          </div>
        )
      ) : (
        <div className="bg-white rounded-2xl border border-sandstone-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-maroon-800" />
            <span className="text-xs font-bold text-charcoal-800">Gate / Monument Check (Admin):</span>
          </div>
          <select
            value={selectedMonument}
            onChange={(e) => setSelectedMonument(e.target.value)}
            className="p-2 border border-sandstone-300 rounded-xl bg-sandstone-50 text-charcoal-900 text-xs font-semibold focus:outline-none focus:border-maroon-700 cursor-pointer max-w-xs"
          >
            <option value="">Auto-Detect from Pass</option>
            {monuments.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Main Scanner Box */}
      <div className="bg-white rounded-3xl border border-sandstone-200 shadow-sm overflow-hidden">
        
        {/* Switcher Tabs */}
        <div className="flex border-b border-sandstone-200 bg-sandstone-50/60 p-1.5 gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('camera');
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-white text-maroon-900 shadow-2xs border border-sandstone-200'
                : 'text-charcoal-600 hover:text-charcoal-900'
            }`}
          >
            <Camera className="w-4 h-4 text-maroon-800" />
            <span>Live Camera Scanner</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('manual');
              stopCamera();
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-white text-maroon-900 shadow-2xs border border-sandstone-200'
                : 'text-charcoal-600 hover:text-charcoal-900'
            }`}
          >
            <Keyboard className="w-4 h-4 text-maroon-800" />
            <span>Token / Manual Input</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* CAMERA SCANNER TAB */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-charcoal-950 border border-sandstone-300 min-h-[300px] flex flex-col items-center justify-center text-white">
                
                {/* HTML5 QR Code Container */}
                <div id="qr-reader" className="w-full max-w-[380px]" />
                <div id="qr-reader-hidden" className="hidden" />

                {!isScanning && (
                  <div className="p-8 text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto text-gold-400">
                      <QrCode className="w-8 h-8" />
                    </div>
                    <h3 className="font-sans font-extrabold text-lg text-white">
                      Camera Scanner Ready
                    </h3>
                    <p className="text-xs text-sandstone-300 max-w-xs mx-auto">
                      Point camera directly at visitor's digital QR pass to open the Ticket Mark Popup.
                    </p>
                    <Button
                      variant="gold"
                      size="md"
                      icon={Camera}
                      onClick={startCamera}
                    >
                      Start Camera
                    </Button>
                  </div>
                )}

                {isScanning && (
                  <div className="absolute top-3 right-3 z-10">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={CameraOff}
                      onClick={stopCamera}
                      className="bg-white/90 text-charcoal-900 text-xs backdrop-blur-sm"
                    >
                      Stop Camera
                    </Button>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Upload QR Image Fallback */}
              <div className="flex items-center justify-between pt-1 border-t border-sandstone-100 text-xs text-charcoal-500">
                <span>Or scan an image from gallery:</span>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sandstone-100 hover:bg-sandstone-200 text-charcoal-800 font-semibold cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-maroon-800" />
                  <span>Upload QR Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* MANUAL / TOKEN TAB */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-charcoal-700 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-maroon-800" />
                  Ticket Token Code or QR String
                </label>
                <input
                  type="text"
                  value={qrData}
                  onChange={(e) => setQrData(e.target.value)}
                  placeholder="e.g. TAJ-123456-A1 or paste QR string..."
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-white font-mono text-sm border border-sandstone-300 focus:outline-none focus:border-maroon-700 focus:ring-2 focus:ring-maroon-600/20 text-charcoal-900"
                />
                <p className="text-[11px] text-charcoal-500">
                  Compatible with barcode scanner guns or token codes printed below the visitor's pass.
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                type="submit"
                fullWidth
                loading={loadingVerify || loadingMark}
                icon={ShieldCheck}
              >
                Inspect & Verify Ticket
              </Button>
            </form>
          )}

        </div>
      </div>

      {/* RECENT SESSION LOG */}
      {recentAdmissions.length > 0 && (
        <div className="bg-white rounded-2xl border border-sandstone-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-sandstone-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-maroon-800" />
              Recent Shift Admittance Log ({recentAdmissions.length})
            </h3>
            <button
              type="button"
              onClick={() => setRecentAdmissions([])}
              className="text-[11px] text-charcoal-400 hover:text-charcoal-700 cursor-pointer"
            >
              Clear Log
            </button>
          </div>

          <div className="divide-y divide-sandstone-100 max-h-48 overflow-y-auto">
            {recentAdmissions.map((item, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-mono font-bold text-charcoal-900">
                    #{item.tokenNumber}
                  </span>
                  <span className="text-charcoal-600">
                    ({item.visitorName})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-charcoal-400">
                    {item.time}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[10px]">
                    Admitted
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TICKET MARK POPUP (MODAL) */}
      {/* ========================================================= */}
      <Modal
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
        title={
          popupStep === 'success'
            ? 'Admission Confirmed'
            : popupStep === 'error'
            ? 'Admission Denied'
            : 'Verify & Mark Ticket'
        }
        description={
          popupStep === 'success'
            ? 'Visitor pass has been marked as used in system records.'
            : popupStep === 'error'
            ? 'Ticket could not be verified for entry.'
            : 'Verify attendee credentials below and confirm admission.'
        }
        maxWidth="max-w-lg"
      >
        <div className="space-y-5">
          
          {/* STATE 1: LOADING VERIFICATION */}
          {loadingVerify && (
            <div className="py-8 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-maroon-800 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-charcoal-700">
                Verifying digital pass credentials...
              </p>
            </div>
          )}

          {/* STATE 2: VERIFY DETAILS & READY TO MARK */}
          {!loadingVerify && popupStep === 'verify' && currentTicket && (
            <div className="space-y-4">
              
              {/* Status Header Banner */}
              <div className={`p-3.5 rounded-2xl border flex items-center gap-2.5 ${
                currentTicket.valid
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-red-50 border-red-300 text-red-950'
              }`}>
                {currentTicket.valid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                )}
                <div className="flex-1">
                  <span className="font-bold text-xs uppercase tracking-wide block">
                    {currentTicket.valid ? 'VALID PASS — READY TO MARK' : 'INVALID PASS'}
                  </span>
                  <span className="text-xs opacity-90 block">
                    {currentTicket.reason}
                  </span>
                </div>
              </div>

              {/* Pass Token & Monument Badge */}
              <div className="bg-sandstone-50 p-4 rounded-2xl border border-sandstone-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-charcoal-500 block">
                    Ticket Token
                  </span>
                  <span className="text-xl font-black font-mono text-maroon-900 tracking-tight">
                    #{currentTicket.tokenNumber}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-charcoal-500 block">
                    Monument
                  </span>
                  <span className="text-sm font-bold text-charcoal-800 block truncate max-w-[150px]">
                    {currentTicket.monumentName}
                  </span>
                </div>
              </div>

              {/* Headcount Verification Card */}
              <div className="bg-sandstone-100/90 p-3.5 rounded-2xl border border-sandstone-300 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-maroon-800 text-gold-300 flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-charcoal-500 block">
                      Physical Headcount to Admit
                    </span>
                    <span className="text-lg font-black text-charcoal-900 leading-tight">
                      {currentTicket.numberOfPeople || 1} {(currentTicket.numberOfPeople || 1) === 1 ? 'Person' : 'People (Bulk Pass)'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-lg bg-gold-400/20 text-maroon-900 border border-gold-300 font-bold text-[11px] block">
                    Count at Gate
                  </span>
                </div>
              </div>

              {/* Visitor Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-sandstone-200">
                  <span className="text-[10px] uppercase font-bold text-charcoal-500 block">Visitor</span>
                  <span className="font-bold text-charcoal-900 text-sm mt-0.5 block truncate">
                    {currentTicket.visitor?.name || 'Visitor'}
                  </span>
                  <span className="text-[11px] text-charcoal-500 block truncate">
                    {currentTicket.visitor?.email || 'N/A'}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-sandstone-200">
                  <span className="text-[10px] uppercase font-bold text-charcoal-500 block">Entry Slot</span>
                  <span className="font-mono font-bold text-charcoal-900 text-xs mt-0.5 block">
                    {currentTicket.slotStart} – {currentTicket.slotEnd}
                  </span>
                  <span className="text-[11px] text-charcoal-500 block">
                    {new Date(currentTicket.visitDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {popupError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{popupError}</span>
                </div>
              )}

              {/* Action Buttons inside Popup */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <Button
                  variant="primary"
                  size="lg"
                  icon={ShieldCheck}
                  loading={loadingMark}
                  disabled={!currentTicket.valid || loadingMark}
                  onClick={handleConfirmMarkInPopup}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                >
                  {loadingMark 
                    ? 'Marking Admitted...' 
                    : `Confirm & Admit (${currentTicket.numberOfPeople || 1} ${(currentTicket.numberOfPeople || 1) === 1 ? 'Person' : 'People'})`}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleClosePopup}
                  disabled={loadingMark}
                >
                  Cancel
                </Button>
              </div>

            </div>
          )}

          {/* STATE 3: ADMISSION CONFIRMED SUCCESS */}
          {popupStep === 'success' && admittedRecord && (
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                <Check className="w-9 h-9 stroke-[3]" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold font-sans text-charcoal-900">
                  {admittedRecord.numberOfPeople && admittedRecord.numberOfPeople > 1
                    ? `Group Admitted (${admittedRecord.numberOfPeople} Visitors)`
                    : 'Visitor Admitted!'}
                </h3>
                <p className="text-xs text-charcoal-500 mt-1">
                  Ticket #{admittedRecord.tokenNumber} verified &amp; marked as <strong>USED</strong> for {admittedRecord.numberOfPeople || 1} {(admittedRecord.numberOfPeople || 1) === 1 ? 'visitor' : 'visitors'}.
                </p>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs flex justify-between items-center max-w-xs mx-auto">
                <span className="text-charcoal-600">Check-In Time:</span>
                <span className="font-mono font-bold text-emerald-950">
                  {new Date(admittedRecord.checkInTime).toLocaleTimeString()}
                </span>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon={RefreshCw}
                  onClick={handleClosePopup}
                >
                  Scan Next Ticket
                </Button>
              </div>
            </div>
          )}

          {/* STATE 4: ERROR / ACCESS DENIED */}
          {popupStep === 'error' && (
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-red-100 border-2 border-red-300 text-red-700 flex items-center justify-center mx-auto shadow-inner">
                <XCircle className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-lg font-extrabold font-sans text-charcoal-900">
                  Admission Denied
                </h3>
                <p className="text-xs text-red-700 mt-1 max-w-xs mx-auto">
                  {popupError || 'Ticket is invalid, expired, or has already been used.'}
                </p>
              </div>

              <div className="pt-2">
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={handleClosePopup}
                >
                  Close & Scan Next
                </Button>
              </div>
            </div>
          )}

        </div>
      </Modal>

    </div>
  );
}