import React, { useState, useRef, useEffect } from 'react';
import {
  Zap,
  ZapOff,
  RefreshCw,
  X,
  Check,
  Trash2,
  Edit2,
  Plus,
  Image as ImageIcon,
  CheckCircle2,
  Key,
  AlertTriangle,
} from 'lucide-react';
import { Ingredient, MainTab } from '../../types';
import { sound } from '../../utils/sound';
import {
  recognizeImageWithGemini,
  getGeminiApiKey,
  getDemoTestPresets,
  DemoTestPreset,
  RecognizedFoodItem,
  RecognitionError,
  RecognitionImageMetadata,
} from '../../services/foodRecognitionService';
import { useLanguage } from '../../i18n';

interface ScanScreenProps {
  onAddIngredients: (items: Array<Omit<Ingredient, 'id'>>) => void;
  onNavigate: (tab: MainTab) => void;
}

type ScanTabMode = 'fridge' | 'receipt' | 'manual';

export const ScanScreen: React.FC<ScanScreenProps> = ({
  onAddIngredients,
  onNavigate,
}) => {
  const { language, t, getFoodDisplayName, getFoodCanonicalName, getScanStages, formatQuantity } = useLanguage();
  const [activeTab, setActiveTab] = useState<ScanTabMode>('fridge');
  const [flashOn, setFlashOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'back' | 'front'>('back');
  const [isCameraLive, setIsCameraLive] = useState(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [lastImageMetadata, setLastImageMetadata] = useState<RecognitionImageMetadata | undefined>();

  // AI Recognition State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingStage, setAnalyzingStage] = useState(0);
  const [scanError, setScanError] = useState<RecognitionError | null>(null);
  const [detectedItems, setDetectedItems] = useState<RecognizedFoodItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showPresetsDrawer, setShowPresetsDrawer] = useState(false);

  // Inline "Add Another Ingredient" row in review screen
  const [isAddingExtra, setIsAddingExtra] = useState(false);
  const [extraName, setExtraName] = useState('');
  const [extraQty, setExtraQty] = useState('');
  const [extraCategory] = useState<'Vegetables' | 'Protein' | 'Dairy' | 'Fruits' | 'Others'>('Vegetables');

  // Manual entry tab state
  const [manualName, setManualName] = useState('');
  const [manualQty, setManualQty] = useState('');
  const [manualCategory, setManualCategory] = useState<'Vegetables' | 'Protein' | 'Dairy' | 'Fruits' | 'Others'>('Vegetables');
  const [manualDays, setManualDays] = useState(3);
  const [manualEmoji, setManualEmoji] = useState('🥗');

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Rotating loading messages
  const analyzingMessages = getScanStages();
  const getCategoryLabel = (category: string) => {
    const categoryKey: Record<string, string> = {
      Vegetables: 'scan.categoryVegetables',
      Protein: 'scan.categoryProtein',
      Dairy: 'scan.categoryDairy',
      Fruits: 'scan.categoryFruits',
      Others: 'scan.categoryOthers',
    };
    return t(categoryKey[category] || 'scan.categoryOthers');
  };

  // Camera Management
  const startCamera = async (facing: 'back' | 'front') => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setIsCameraLive(false);
      return;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing === 'back' ? { ideal: 'environment' } : 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setIsCameraLive(true);
    } catch {
      setIsCameraLive(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'manual') {
      startCamera(cameraFacing);
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        setIsCameraLive(false);
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [activeTab, cameraFacing]);

  // Loading animation stage cycler
  useEffect(() => {
    let timer: any;
    if (isAnalyzing) {
      setAnalyzingStage(0);
      timer = setInterval(() => {
        setAnalyzingStage((s) => (s + 1) % analyzingMessages.length);
      }, 1100);
    }
    return () => clearInterval(timer);
  }, [isAnalyzing, analyzingMessages.length]);

  const toggleFlash = () => {
    sound.playTap();
    setFlashOn(!flashOn);
  };

  const toggleCameraFacing = () => {
    sound.playTap();
    setCameraFacing((f) => (f === 'back' ? 'front' : 'back'));
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current || !isCameraLive) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  // Main Scan Trigger using Gemini Vision
  const executeScan = async (
    imagePayload: string,
    imageMetadata?: RecognitionImageMetadata
  ) => {
    sound.playShutter();
    setCapturedPhotoUrl(imagePayload);
    setLastImageMetadata(imageMetadata);
    setIsAnalyzing(true);
    setScanError(null);
    setDetectedItems([]);

    const { result, error } = await recognizeImageWithGemini(
      imagePayload,
      activeTab === 'receipt' ? 'receipt' : 'fridge',
      language,
      imageMetadata
    );

    setIsAnalyzing(false);

    if (error) {
      setScanError(error);
      sound.playTap();
    } else if (result) {
      // Filter out low confidence (< 0.65) items as required by prompt
      const confidentItems = result.items.filter((it) => it.confidence >= 0.65);

      if (confidentItems.length === 0) {
        setScanError({
          type: 'no_food_detected',
            message: t('scan.errorDesc'),
        });
      } else {
        setDetectedItems(confidentItems);
        sound.playSuccess();
      }
    }
  };

  const handleStartScan = (overrideImage?: string) => {
    const snapshot = overrideImage || captureFrame();
    if (!snapshot) {
      setCapturedPhotoUrl(null);
      setLastImageMetadata(undefined);
      setScanError({
        type: 'image_input_error',
        message: t('scan.errorDesc'),
      });
      return;
    }
    executeScan(snapshot);
  };

  const handleSelectPreset = (preset: DemoTestPreset) => {
    sound.playTap();
    setShowPresetsDrawer(false);
    executeScan(preset.imageUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setCapturedPhotoUrl(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = typeof event.target?.result === 'string' ? event.target.result : '';
      if (url) {
        executeScan(url, {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        });
      } else {
        setScanError({
          type: 'image_input_error',
          message: t('scan.errorDesc'),
        });
      }
    };
    reader.onerror = () => {
      setScanError({
        type: 'image_input_error',
        message: t('scan.errorDesc'),
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateItemName = (index: number, newName: string) => {
    setDetectedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, name: newName } : item))
    );
  };

  const handleUpdateItemQty = (index: number, newQty: string) => {
    setDetectedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantityEstimate: newQty } : item))
    );
    setEditingIndex(null);
  };

  const handleRemoveDetected = (index: number) => {
    sound.playTap();
    setDetectedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddExtraIngredient = () => {
    if (!extraName.trim()) return;
    sound.playTap();
    const newItem: RecognizedFoodItem = {
      name: extraName.trim(),
      confidence: 1.0,
      quantityEstimate: extraQty.trim() || '1 item',
      category: extraCategory,
      emoji: extraCategory === 'Vegetables' ? '🥬' : extraCategory === 'Protein' ? '🍗' : extraCategory === 'Dairy' ? '🥛' : '🍽️',
    };
    setDetectedItems((prev) => [...prev, newItem]);
    setExtraName('');
    setExtraQty('');
    setIsAddingExtra(false);
  };

  // Convert recognized items to centralized Inventory Ingredient items
  const handleConfirmAndAdd = () => {
    sound.playSuccess();

    const formatted: Array<Omit<Ingredient, 'id'>> = detectedItems.map((item) => {
      const canonicalName = getFoodCanonicalName(item.canonicalId, item.name);
      const nameLower = canonicalName.toLowerCase();

      // Estimate shelf-life days based on ingredient nature
      let daysLeft = 3;
      if (item.suggestedDaysLeft) {
        daysLeft = item.suggestedDaysLeft;
      } else if (nameLower.includes('spinach') || nameLower.includes('bayam')) {
        daysLeft = 1;
      } else if (nameLower.includes('fish') || nameLower.includes('ikan') || nameLower.includes('salmon')) {
        daysLeft = 2;
      } else if (nameLower.includes('chicken') || nameLower.includes('poultry') || nameLower.includes('ayam')) {
        daysLeft = 2;
      } else if (nameLower.includes('tomato') || nameLower.includes('tomat')) {
        daysLeft = 3;
      } else if (nameLower.includes('milk') || nameLower.includes('dairy')) {
        daysLeft = 4;
      } else if (nameLower.includes('egg') || nameLower.includes('telur')) {
        daysLeft = 7;
      } else if (nameLower.includes('carrot') || nameLower.includes('wortel')) {
        daysLeft = 14;
      } else if (nameLower.includes('garlic') || nameLower.includes('bawang')) {
        daysLeft = 20;
      }

      const urgency = daysLeft <= 2 ? 'High' : daysLeft <= 4 ? 'Medium' : 'Low';
      const score = daysLeft <= 1 ? 92 : daysLeft <= 2 ? 88 : daysLeft <= 3 ? 68 : 45;

      let value = 14000;
      if (nameLower.includes('fish') || nameLower.includes('salmon')) value = 45000;
      else if (nameLower.includes('chicken')) value = 32000;
      else if (nameLower.includes('milk')) value = 22000;
      else if (nameLower.includes('spinach')) value = 9000;

      return {
        name: canonicalName,
        canonicalId: item.canonicalId,
        emoji: item.emoji || (item.category === 'Protein' ? '🍗' : '🥬'),
        category: item.category,
        quantity: item.quantityEstimate,
        daysLeft,
        urgency,
        storageTip: `Keep in refrigerator ${item.category === 'Protein' ? 'coldest shelf' : 'crisper'}. Consume promptly.`,
        estimatedValueRp: value,
        dateAdded: new Date().toISOString().split('T')[0],
        freshnessPercent: Math.max(25, Math.min(95, daysLeft * 20)),
        useFirstScore: score,
        useFirstReason: `${item.name} has an estimated ${daysLeft}-day freshness window. Prioritize in today's cooking!`,
      };
    });

    onAddIngredients(formatted);
    onNavigate('inventory');
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    sound.playSuccess();
    const newItem: Omit<Ingredient, 'id'> = {
      name: manualName,
      emoji: manualEmoji,
      category: manualCategory,
      quantity: manualQty || '1 item',
      daysLeft: manualDays,
      urgency: manualDays <= 2 ? 'High' : manualDays <= 4 ? 'Medium' : 'Low',
      storageTip: 'Store in refrigerator crisper.',
      estimatedValueRp: 15000,
      dateAdded: new Date().toISOString().split('T')[0],
      freshnessPercent: Math.max(20, Math.min(95, manualDays * 15)),
      useFirstScore: manualDays <= 2 ? 88 : 45,
      useFirstReason: 'Manually logged ingredient.',
    };

    onAddIngredients([newItem]);
    onNavigate('inventory');
  };

  const hasConfiguredApiKey = !!getGeminiApiKey();

  return (
    <div className="flex-1 flex flex-col bg-[#0F1813] lg:bg-[#FAF8F5] text-white lg:text-[#1E2E25] relative min-h-0 overflow-y-auto select-none">
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* 1a. MOBILE TOP HEADER */}
      <div className="p-3 bg-[#0F1813]/95 backdrop-blur-md z-20 shrink-0 border-b border-[#23352A] lg:hidden">
        <div className="flex items-center justify-between mb-2">
          {/* Close button */}
          <button
            onClick={() => {
              sound.playTap();
              onNavigate('home');
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white active-press cursor-pointer"
            aria-label={t('scan.close')}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#52B788] animate-pulse" />
            <h2 className="font-['Outfit'] font-extrabold text-base text-white tracking-wide">
              {activeTab === 'receipt'
                ? t('scan.titleReceipt')
                : t('scan.titleFood')}
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                sound.playTap();
                setShowApiKeyModal(true);
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center active-press cursor-pointer ${
                hasConfiguredApiKey
                  ? 'bg-[#52B788]/20 text-[#52B788] border border-[#52B788]/40'
                  : 'bg-white/10 text-white/70'
              }`}
              title={t('scan.apiKeySettings')}
            >
              <Key className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={toggleFlash}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active-press cursor-pointer ${
                flashOn ? 'bg-[#F4A261] text-[#1B4332]' : 'bg-white/10 text-white'
              }`}
            >
              {flashOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleCameraFacing}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white active-press cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="flex items-center p-1 bg-[#1A261F] rounded-xl border border-[#2D3E33]">
          <button
            onClick={() => {
              sound.playTap();
              setActiveTab('fridge');
              setDetectedItems([]);
              setScanError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'fridge'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-[#8FA88D] hover:text-white'
            }`}
          >
            {t('scan.tabFridge')}
          </button>

          <button
            onClick={() => {
              sound.playTap();
              setActiveTab('receipt');
              setDetectedItems([]);
              setScanError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'receipt'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-[#8FA88D] hover:text-white'
            }`}
          >
            {t('scan.tabReceipt')}
          </button>

          <button
            onClick={() => {
              sound.playTap();
              setActiveTab('manual');
              setDetectedItems([]);
              setScanError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-[#8FA88D] hover:text-white'
            }`}
          >
            {t('scan.tabManual')}
          </button>
        </div>
      </div>

      {/* 1b. DESKTOP FOCUSED WORKSPACE HEADER */}
      <div className="hidden lg:block border-b border-[#EAE4D5] bg-[#FAF8F5]">
        <div className="page-container flex items-center justify-between pt-2 pb-5">
          <div>
            <h1 className="text-2xl font-['Outfit'] font-black text-[#1B4332] tracking-tight">
              {activeTab === 'receipt' ? t('scan.titleReceipt') : t('scan.titleFood')}
            </h1>
            <p className="text-xs sm:text-sm text-[#52796F] font-medium mt-0.5">
              {activeTab === 'receipt' ? t('scan.instructionReceipt') : t('scan.instructionFood')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playTap();
                setShowApiKeyModal(true);
              }}
              className={`h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold active-press cursor-pointer border ${
                hasConfiguredApiKey
                  ? 'bg-[#E8F2EC] text-[#2D6A4F] border-[#D5E5DB]'
                  : 'bg-white text-[#52796F] border-[#EDE8DD] hover:bg-[#F3EFE6]'
              }`}
              title={t('scan.apiKeySettings')}
            >
              <Key className="w-3.5 h-3.5" />
              <span>{t('scan.apiKeySettings')}</span>
            </button>

            <button
              onClick={toggleFlash}
              className={`h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold border transition-all active-press cursor-pointer ${
                flashOn
                  ? 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
                  : 'bg-white text-[#52796F] border-[#EDE8DD] hover:bg-[#F3EFE6]'
              }`}
            >
              {flashOn ? <Zap className="w-3.5 h-3.5 fill-current" /> : <ZapOff className="w-3.5 h-3.5" />}
              <span>{t('scan.flash')}</span>
            </button>

            <button
              onClick={toggleCameraFacing}
              className="h-9 px-3 rounded-xl bg-white text-[#52796F] border border-[#EDE8DD] hover:bg-[#F3EFE6] flex items-center gap-1.5 text-xs font-semibold active-press cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t('scan.flip')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Mode Tabs (Contained, centered ~420px) */}
      <div className="hidden lg:block page-container pt-4 pb-2">
        <div className="w-full max-w-md mx-auto p-1 bg-[#EAE4D5] rounded-2xl border border-[#DED7C6] flex items-center gap-1">
          <button
            onClick={() => {
              sound.playTap();
              setActiveTab('fridge');
              setDetectedItems([]);
              setScanError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'fridge'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-[#52796F] hover:text-[#1B4332]'
            }`}
          >
            {t('scan.tabFridge')}
          </button>
          <button
            onClick={() => {
              sound.playTap();
              setActiveTab('receipt');
              setDetectedItems([]);
              setScanError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'receipt'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-[#52796F] hover:text-[#1B4332]'
            }`}
          >
            {t('scan.tabReceipt')}
          </button>
          <button
            onClick={() => {
              sound.playTap();
              setActiveTab('manual');
              setDetectedItems([]);
              setScanError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-[#52796F] hover:text-[#1B4332]'
            }`}
          >
            {t('scan.tabManual')}
          </button>
        </div>
      </div>

      {/* 2. CAMERA FRAME & VIEWPORT */}
      <div className="flex-1 relative flex flex-col min-h-0">
        {/* FRIDGE / RECEIPT CAMERA MODE */}
        {(activeTab === 'fridge' || activeTab === 'receipt') &&
          detectedItems.length === 0 &&
          !isAnalyzing &&
          !scanError && (
            <>
              {/* Desktop Centered Camera Viewfinder */}
              <div className="hidden lg:block page-container py-4">
                <div className="mx-auto w-full max-w-[960px]">
                  <div className="rounded-[28px] border border-[#EAE4D5] bg-[#F5F1EA] p-3 shadow-[0_18px_45px_rgba(29,42,34,0.08)]">
                    <div className="relative mx-auto w-full max-w-[960px] aspect-[16/9] max-h-[560px] overflow-hidden rounded-[22px] bg-black shadow-inner">
                      {isCameraLive ? (
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className={`w-full h-full object-cover ${
                            cameraFacing === 'front' ? 'scale-x-[-1]' : ''
                          } ${flashOn ? 'brightness-125' : ''}`}
                        />
                      ) : (
                        <img
                          src={
                            activeTab === 'receipt'
                              ? 'https://images.unsplash.com/photo-1554415707-9e49016a3507?auto=format&fit=crop&w=800&q=80'
                              : 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80'
                          }
                          alt={t('scan.cameraView')}
                          className={`w-full h-full object-cover filter contrast-110 ${
                            flashOn ? 'brightness-125' : 'brightness-95'
                          }`}
                        />
                      )}

                      <div
                        className={`absolute pointer-events-none rounded-2xl ${
                          activeTab === 'receipt'
                            ? 'inset-x-8 top-8 bottom-8 border-2 border-dashed border-[#52B788] bg-black/25'
                            : 'inset-x-6 top-6 bottom-6 border border-white/20'
                        }`}
                      >
                        <div className="absolute left-0 right-0 h-px bg-[#52B788] animate-scan-laser" />
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-[#52B788] rounded-tl-xl" />
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-[#52B788] rounded-tr-xl" />
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-[#52B788] rounded-bl-xl" />
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-[#52B788] rounded-br-xl" />
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-6 pt-4">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-12 h-12 rounded-2xl bg-white border border-[#EDE8DD] hover:bg-[#F3EFE6] flex items-center justify-center text-[#1B4332] active-press cursor-pointer shadow-xs transition-colors"
                        title={t('scan.uploadPhoto')}
                      >
                        <ImageIcon className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => handleStartScan()}
                        className="w-20 h-20 rounded-full border-4 border-[#1B4332] p-1 shadow-lg active-press cursor-pointer transition-transform hover:scale-105"
                        aria-label={t('scan.captureScan')}
                      >
                        <div className="w-full h-full rounded-full bg-[#1B4332] hover:bg-[#2D6A4F] flex items-center justify-center text-white font-bold text-xs uppercase tracking-wider">
                          {t('actions.scanButton')}
                        </div>
                      </button>

                      {import.meta.env.DEV && (
                        <button
                          onClick={() => {
                            sound.playTap();
                            setShowPresetsDrawer(true);
                          }}
                          className="w-12 h-12 rounded-2xl bg-[#E8F2EC] hover:bg-[#D5E5DB] flex items-center justify-center text-[#1B4332] active-press cursor-pointer transition-colors shadow-xs"
                          title={t('scan.testPresetsLabel')}
                        >
                          <ImageIcon className="w-5 h-5 text-[#2D6A4F]" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Immersive Full-Height Viewfinder */}
              <div className="lg:hidden flex-1 relative flex flex-col justify-between overflow-hidden">
                <div className="absolute inset-0 bg-black flex items-center justify-center overflow-hidden">
                  {isCameraLive ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${
                        cameraFacing === 'front' ? 'scale-x-[-1]' : ''
                      } ${flashOn ? 'brightness-125' : ''}`}
                    />
                  ) : (
                    <img
                      src={
                        activeTab === 'receipt'
                          ? 'https://images.unsplash.com/photo-1554415707-9e49016a3507?auto=format&fit=crop&w=800&q=80'
                          : 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={t('scan.cameraView')}
                      className={`w-full h-full object-cover filter contrast-110 ${
                        flashOn ? 'brightness-125' : 'brightness-95'
                      }`}
                    />
                  )}

                  <div
                    className={`absolute pointer-events-none rounded-3xl ${
                      activeTab === 'receipt'
                        ? 'inset-x-8 top-8 bottom-28 border-2 border-dashed border-[#52B788] bg-black/30'
                        : 'inset-x-6 top-6 bottom-28 border border-white/20'
                    }`}
                  >
                    <div className="absolute left-0 right-0 h-px bg-[#52B788] animate-scan-laser" />
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-[#52B788] rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-[#52B788] rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-[#52B788] rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-[#52B788] rounded-br-xl" />
                  </div>
                </div>

                <div className="mt-auto relative z-10 p-4 bg-gradient-to-t from-black via-black/85 to-transparent flex flex-col items-center space-y-2">
                  <div className="text-center space-y-0.5">
                    <h3 className="font-['Outfit'] font-black text-sm text-white">
                      {activeTab === 'receipt'
                        ? t('scan.scanReceipt')
                        : t('scan.scanFood')}
                    </h3>
                    <p className="text-[11px] text-[#A3B899]">
                      {activeTab === 'receipt'
                          ? t('scan.instructionReceipt')
                          : t('scan.instructionFood')}
                    </p>
                  </div>

                  <div className="flex items-center justify-between w-full max-w-xs px-4 pt-1">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white active-press cursor-pointer"
                      title={t('scan.uploadPhoto')}
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => handleStartScan()}
                      className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center p-1 active:scale-95 transition-transform shadow-2xl cursor-pointer"
                      aria-label={t('scan.captureScan')}
                    >
                      <div className="w-full h-full rounded-full bg-[#2D6A4F] flex items-center justify-center text-white font-bold text-xs">
                        {t('actions.scanButton')}
                      </div>
                    </button>

                    {import.meta.env.DEV && (
                      <button
                        onClick={() => {
                          sound.playTap();
                          setShowPresetsDrawer(true);
                        }}
                        className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white active-press cursor-pointer"
                        title={t('scan.testPresetsLabel')}
                      >
                        <ImageIcon className="w-4 h-4 text-[#52B788]" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

        {/* 2b. ERROR / FEEDBACK STATE (Exact prompt 13: AI SCAN ERROR) */}
        {scanError && !isAnalyzing && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#FAF8F5] text-[#1E2E25] text-center space-y-4 animate-fade-in overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-[#FDF0EC] text-[#E05342] flex items-center justify-center shadow-xs border border-[#FAD2CD]">
              <AlertTriangle className="w-8 h-8 text-[#E05342]" />
            </div>

            <div className="space-y-1.5 max-w-xs">
              <h3 className="font-['Outfit'] font-black text-xl text-[#1B4332]">
                {scanError.type === 'no_food_detected'
                  ? t('scan.errorTitle')
                  : scanError.type === 'no_api_key'
                  ? t('scan.errorApiKeyNeeded')
                  : t('scan.errorAnalyze')}
              </h3>
              <p className="text-xs text-[#52796F] font-medium leading-relaxed">
                {scanError.type === 'no_api_key'
                  ? t('scan.errorApiKeyDesc')
                  : scanError.type === 'api_error' || scanError.type === 'parse_error'
                  ? t('scan.errorAnalyzeDesc')
                  : t('scan.errorDesc')}
              </p>
            </div>

            <div className="w-full max-w-xs space-y-2 pt-2">
              <button
                onClick={() => {
                  sound.playTap();
                  setScanError(null);
                  if (capturedPhotoUrl) {
                    executeScan(capturedPhotoUrl, lastImageMetadata);
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                className="w-full h-12 bg-[#1B4332] text-white rounded-2xl font-bold text-xs shadow-md shadow-[#1B4332]/25 active-press flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{t('actions.tryAgain')}</span>
              </button>

              <button
                onClick={() => {
                  sound.playTap();
                  setScanError(null);
                  setActiveTab('manual');
                }}
                className="w-full h-12 bg-white text-[#2D6A4F] border border-[#2D6A4F] rounded-2xl font-bold text-xs active-press flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t('actions.addManually')}</span>
              </button>

              {import.meta.env.DEV && (
                <button
                  onClick={() => {
                    sound.playTap();
                    setShowPresetsDrawer(true);
                  }}
                  className="w-full h-10 bg-[#E8F2EC] text-[#1B4332] rounded-xl font-bold text-[11px] active-press flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#52B788]" />
                  <span>{t('actions.selectTestPreset')}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3. ROTATING ANALYZING STATE (Prompt Section 7 & Section "LOADING STATE") */}
        {isAnalyzing && (
          <>
            <div className="lg:hidden flex-1 flex flex-col items-center justify-center p-6 bg-[#0F1813]/95 backdrop-blur-xl text-center space-y-5 animate-fade-in">
              <div className="relative w-16 h-16 rounded-full bg-[#1B4332]/40 border border-[#52B788] flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-[#52B788] animate-spin" />
              </div>

              <div className="space-y-1.5 max-w-xs">
                <h3 className="text-xl font-['Outfit'] font-black text-white">
                  {analyzingMessages[analyzingStage].title}
                </h3>
                <p className="text-xs text-[#A3B899] font-medium leading-relaxed">
                  {analyzingMessages[analyzingStage].desc}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                {analyzingMessages.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === analyzingStage ? 'w-6 bg-[#52B788]' : 'w-1.5 bg-white/20'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="hidden lg:block page-container py-4">
              <div className="mx-auto w-full max-w-[960px]">
                <div className="relative mx-auto flex w-full max-w-[960px] aspect-[16/9] max-h-[560px] items-center justify-center overflow-hidden rounded-[22px] border border-[#294739] bg-[#0F1813]/95 shadow-[0_18px_45px_rgba(9,13,11,0.22)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(82,183,136,0.12),transparent_55%)]" />

                  <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-5 px-6">
                    <div className="relative w-16 h-16 rounded-full bg-[#1B4332]/40 border border-[#52B788] flex items-center justify-center shadow-[0_0_24px_rgba(82,183,136,0.22)]">
                      <RefreshCw className="w-6 h-6 text-[#52B788] animate-spin" />
                    </div>

                    <div className="space-y-1.5 max-w-xs">
                      <h3 className="text-xl font-['Outfit'] font-black text-white">
                        {analyzingMessages[analyzingStage].title}
                      </h3>
                      <p className="text-xs text-[#A3B899] font-medium leading-relaxed">
                        {analyzingMessages[analyzingStage].desc}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      {analyzingMessages.map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            i === analyzingStage ? 'w-6 bg-[#52B788]' : 'w-1.5 bg-white/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 4. INGREDIENTS DETECTED / USER REVIEW SCREEN (Prompt Section 7, 8 & 9) */}
        {detectedItems.length > 0 && !isAnalyzing && (
          <div className="flex-1 overflow-y-auto bg-[#FAF8F5] text-[#1E2E25] py-4 sm:py-6 animate-fade-in">
            <div className="page-container flex flex-col space-y-4">
              {/* Header info */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#2D6A4F] uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t('scan.recognitionComplete')}
                  </span>
                  <h3 className="font-['Outfit'] font-black text-lg sm:text-xl text-[#1B4332]">
                    {activeTab === 'receipt'
                      ? t('scan.receiptItems')
                      : t('scan.weFound')}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 bg-[#E8F2EC] text-[#2D6A4F] text-xs font-bold rounded-xl font-mono">
                    {detectedItems.length} {t('scan.items')}
                  </span>
                </div>
              </div>

              {/* Responsive Workspace Grid: Left Image Preview (~60% max 680px), Right Detection Results (~40%) */}
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] gap-5 lg:gap-8 items-start">
                {/* Left Column: Contained Image Preview */}
                {capturedPhotoUrl ? (
                  <div className="relative w-full rounded-2xl overflow-hidden border border-[#EDE8DD] shadow-xs bg-black/5 aspect-[4/3] max-h-[360px] lg:max-h-[440px] shrink-0">
                    <img
                      src={capturedPhotoUrl}
                      alt={t('scan.scanFood')}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3">
                      <p className="text-[11px] text-white font-medium flex items-center gap-1">
                        <span>{t('scan.sourcePhotoAnalyzed')}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="hidden lg:flex aspect-[4/3] max-h-[360px] rounded-2xl bg-[#EDE8DD]/50 border border-dashed border-[#2D6A4F]/30 items-center justify-center text-xs text-[#52796F] font-semibold">
                    {t('scan.sourcePhotoAnalyzed')}
                  </div>
                )}

                {/* Right Column: Detected ingredients list & actions without excessive vertical dead space */}
                <div className="flex flex-col space-y-3">
                  {/* List with Emoji, Name, Quantity, Confidence badge, Edit & Delete */}
                  <div className="space-y-2">
                    {detectedItems.map((item, index) => {
                      const confPercent = Math.round(item.confidence * 100);
                      const isHighConfidence = item.confidence >= 0.85;

                      return (
                        <div
                          key={index}
                          className="p-3 bg-white rounded-2xl border border-[#EDE8DD] shadow-xs flex items-center justify-between gap-2.5"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="text-2xl shrink-0 p-1.5 bg-[#FAF8F5] rounded-xl border border-[#EDE8DD]">
                              {item.emoji}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {editingIndex === index ? (
                                  <input
                                    type="text"
                                    defaultValue={getFoodDisplayName(item.name)}
                                    onBlur={(e) => handleUpdateItemName(index, e.target.value)}
                                    className="font-extrabold text-sm text-[#1B4332] border-b border-[#2D6A4F] outline-hidden px-1"
                                    autoFocus
                                  />
                                ) : (
                                  <h4 className="font-extrabold text-sm text-[#1B4332] truncate">
                                    {getFoodDisplayName(item.name)}
                                  </h4>
                                )}

                                {/* Confidence Indicator Badge */}
                                <span
                                  className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                                    isHighConfidence
                                      ? 'text-[#2D6A4F] bg-[#E8F2EC]'
                                      : 'text-[#D97706] bg-[#FEF3C7]'
                                  }`}
                                >
                                  {t('scan.confidenceLabel', { percent: confPercent })}
                                </span>
                              </div>

                              {editingIndex === index ? (
                                <div className="flex items-center gap-1 mt-1">
                                  <input
                                    type="text"
                                    defaultValue={item.quantityEstimate}
                                    onBlur={(e) => handleUpdateItemQty(index, e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleUpdateItemQty(index, (e.target as HTMLInputElement).value);
                                      }
                                    }}
                                    className="w-28 px-2 py-0.5 text-xs border border-[#2D6A4F] rounded-md font-bold"
                                    placeholder={t('scan.quantityPlaceholder')}
                                  />
                                </div>
                              ) : (
                                <p className="text-xs text-[#738B7C] font-semibold mt-0.5">
                                  {formatQuantity(item.quantityEstimate)} · {getCategoryLabel(item.category)}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Edit Button */}
                            <button
                              onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                              className="w-7 h-7 rounded-lg bg-[#F0EBE0] text-[#52796F] flex items-center justify-center active-press cursor-pointer"
                              title={t('scan.editItem')}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Remove Button */}
                            <button
                              onClick={() => handleRemoveDetected(index)}
                              className="w-7 h-7 rounded-lg bg-[#FDF0EC] text-[#E05342] flex items-center justify-center active-press cursor-pointer"
                              title={t('scan.removeDetection')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* "Add Another Ingredient" row (Constrained button on desktop) */}
                  {isAddingExtra ? (
                    <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-[#52B788] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1B4332]">
                          {t('scan.addMissingItem')}
                        </span>
                        <button
                          onClick={() => setIsAddingExtra(false)}
                          className="text-xs text-[#738B7C]"
                        >
                          {t('actions.cancel')}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder={t('scan.ingredientName')}
                          value={extraName}
                          onChange={(e) => setExtraName(e.target.value)}
                          className="px-2.5 py-1.5 text-xs border border-[#EDE8DD] rounded-xl font-semibold"
                        />
                        <input
                          type="text"
                          placeholder={t('scan.quantityPlaceholder')}
                          value={extraQty}
                          onChange={(e) => setExtraQty(e.target.value)}
                          className="px-2.5 py-1.5 text-xs border border-[#EDE8DD] rounded-xl font-semibold"
                        />
                      </div>
                      <button
                        onClick={handleAddExtraIngredient}
                        className="w-full py-1.5 bg-[#2D6A4F] text-white text-xs font-bold rounded-xl active-press"
                      >
                        {t('actions.confirmItem')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex lg:justify-start">
                      <button
                        onClick={() => setIsAddingExtra(true)}
                        className="w-full sm:w-auto sm:min-w-[220px] sm:max-w-[320px] py-2.5 px-4 border border-dashed border-[#2D6A4F]/50 text-[#2D6A4F] bg-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 active-press cursor-pointer hover:bg-[#F3EFE6] transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('actions.addAnotherIngredient')}</span>
                      </button>
                    </div>
                  )}

                  {/* CTA Action Bar: Add to Inventory & Retake */}
                  <div className="pt-3 border-t border-[#EDE8DD] space-y-2 shrink-0">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <button
                        onClick={handleConfirmAndAdd}
                        className="w-full sm:w-auto sm:min-w-[260px] sm:max-w-[380px] h-12 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active-press cursor-pointer shadow-xs transition-colors"
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>
                          {t('scan.confirmAddInventory', { count: detectedItems.length })}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          sound.playTap();
                          setDetectedItems([]);
                        }}
                        className="text-center text-xs font-semibold text-[#738B7C] hover:text-[#1B4332] py-2 px-3 cursor-pointer transition-colors"
                      >
                        {t('scan.retake')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. MANUAL ENTRY MODE */}
        {activeTab === 'manual' && (
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#FAF8F5] text-[#1E2E25]">
            <div className="page-container flex justify-center">
              <div className="w-full max-w-xl bg-white p-5 sm:p-7 rounded-3xl border border-[#EDE8DD] shadow-xs space-y-4">
                <div className="mb-2">
                  <h3 className="font-['Outfit'] font-black text-xl text-[#1B4332]">
                    {t('scan.manualHeading')}
                  </h3>
                  <p className="text-xs text-[#6B8573] font-medium">
                    {t('scan.manualSubheading')}
                  </p>
                </div>

                <form onSubmit={handleManualAdd} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-[#1B4332] uppercase mb-1">
                      {t('scan.ingredientName')}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={manualEmoji}
                        onChange={(e) => setManualEmoji(e.target.value)}
                        className="w-12 h-11 text-xl text-center bg-white rounded-xl border border-[#EDE8DD] focus:border-[#2D6A4F] outline-hidden shadow-xs"
                        title={t('scan.emojiLabel')}
                      />
                      <input
                        type="text"
                        required
                        placeholder={t('scan.manualNamePlaceholder')}
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        className="flex-1 h-11 px-3 bg-white rounded-xl border border-[#EDE8DD] focus:border-[#2D6A4F] outline-hidden text-sm text-[#1B4332] font-semibold shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-[#1B4332] uppercase mb-1">
                        {t('scan.quantityLabel')}
                      </label>
                      <input
                        type="text"
                        placeholder={t('scan.manualQuantityPlaceholder')}
                        value={manualQty}
                        onChange={(e) => setManualQty(e.target.value)}
                        className="w-full h-11 px-3 bg-white rounded-xl border border-[#EDE8DD] focus:border-[#2D6A4F] outline-hidden text-xs text-[#1B4332] font-semibold shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1B4332] uppercase mb-1">
                        {t('scan.manualCategory')}
                      </label>
                      <select
                        value={manualCategory}
                        onChange={(e) => setManualCategory(e.target.value as any)}
                        className="w-full h-11 px-2.5 bg-white rounded-xl border border-[#EDE8DD] focus:border-[#2D6A4F] outline-hidden text-xs text-[#1B4332] font-semibold shadow-xs"
                      >
                        <option value="Vegetables">{t('scan.categoryVegetables')}</option>
                        <option value="Protein">{t('scan.categoryProtein')}</option>
                        <option value="Dairy">{t('scan.categoryDairy')}</option>
                        <option value="Fruits">{t('scan.categoryFruits')}</option>
                        <option value="Others">{t('scan.categoryOthers')}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-[#1B4332] uppercase">
                        {t('scan.manualFreshness')}
                      </label>
                      <span className="text-xs font-bold text-[#E05342]">
                        {t('scan.freshnessLeft', { days: manualDays })}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={21}
                      value={manualDays}
                      onChange={(e) => setManualDays(Number(e.target.value))}
                      className="w-full accent-[#2D6A4F]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full h-12 bg-[#1B4332] text-white rounded-2xl font-bold text-sm shadow-md shadow-[#1B4332]/25 active-press flex items-center justify-center gap-2 mt-4 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('actions.addToInventory')}</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. VISION TEST PRESETS DRAWER (The 6 Tests in Prompt) */}
      {import.meta.env.DEV && showPresetsDrawer && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col justify-end animate-fade-in">
          <div className="bg-[#FAF8F5] text-[#1E2E25] rounded-t-3xl max-h-[85%] flex flex-col overflow-hidden shadow-2xl animate-slide-up">
            <div className="p-4 border-b border-[#EDE8DD] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#2D6A4F] uppercase tracking-wider">
                  {t('scan.evaluationSuite')}
                </span>
                <h3 className="font-['Outfit'] font-black text-base text-[#1B4332]">
                  {t('scan.presetsTitle')}
                </h3>
              </div>
              <button
                onClick={() => setShowPresetsDrawer(false)}
                className="w-7 h-7 rounded-full bg-[#EDE8DD] flex items-center justify-center text-[#1E2E25] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
              <p className="text-xs text-[#52796F] font-medium">
                {t('scan.presetsDescription')}
              </p>

              {getDemoTestPresets(language).map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className="p-3 bg-white rounded-2xl border border-[#EDE8DD] hover:border-[#2D6A4F] transition-all cursor-pointer active-press flex items-center gap-3 shadow-xs"
                >
                  <img
                    src={preset.imageUrl}
                    alt={preset.label}
                    className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#EDE8DD]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-extrabold text-xs text-[#1B4332] truncate">
                        {preset.label}
                      </h4>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#E8F2EC] text-[#2D6A4F]">
                        {preset.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#52796F] mt-0.5 leading-snug">
                      {preset.expectedDescription}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. GEMINI API KEY MODAL */}
      {showApiKeyModal && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FAF8F5] text-[#1E2E25] rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4 animate-scale-up border border-[#EDE8DD]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1B4332] text-white flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="font-['Outfit'] font-black text-base text-[#1B4332]">
                  {t('scan.apiKeyModalTitle')}
                </h3>
              </div>
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="w-7 h-7 rounded-full bg-[#EDE8DD] flex items-center justify-center text-[#1E2E25] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-[#52796F] font-medium leading-relaxed">
                {t('scan.apiKeyModalDesc')}
              </p>
              <p className="text-[10px] text-[#8FA88D]">
                {t('scan.apiKeyModalNote')}
              </p>
            </div>

            <button
              onClick={() => {
                setShowApiKeyModal(false);
                sound.playTap();
              }}
              className="w-full h-10 bg-[#1B4332] text-white rounded-xl text-xs font-bold active-press cursor-pointer"
            >
              {t('actions.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
