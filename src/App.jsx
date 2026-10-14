import React, { useState, useEffect } from 'react';
import { 
  Truck, Search, Package, Printer, PlusCircle, Phone, 
  MapPin, Calendar, Clock, CheckCircle2, AlertCircle, 
  DollarSign, Calculator, Layers, FileText, ArrowRight, ShieldCheck,
  CreditCard
} from 'lucide-react';
import { supabase } from './supabaseClient';

export default function App() {
  const [activeTab, setActiveTab] = useState('tracking');
  const [shipments, setShipments] = useState([]);
  const [trips, setTrips] = useState([]);
  const [searchTracking, setSearchTracking] = useState('');
  const [trackedShipment, setTrackedShipment] = useState(null);
  const [trackingEvents, setTrackingEvents] = useState([]);
  const [showNewShipmentModal, setShowNewShipmentModal] = useState(false);
  const [selectedWaybill, setSelectedWaybill] = useState(null);

  const PHONES = { uae: '00971544010096', egypt: '00201146560066' };

  // نموذج إضافة شحنة مع التحديثات الجديدة
  const [shipmentForm, setShipmentForm] = useState({
    direction: 'UAE_TO_EGYPT',
    sender_name: '',
    sender_phone: '',
    sender_city: 'دبي',
    sender_address: '',
    receiver_name: '',
    receiver_phone: '',
    receiver_city: 'القاهرة',
    receiver_address: '',
    total_packages: 1,
    total_weight: '', // غير إلزامي
    description: '',   // خانة الوصف
    payment_method: 'PREPAID', // PREPAID أو COD
    custom_amount: '', // مبلغ يدوي اختياري
    package_type: 'carton'
  });

  // نموذج الحاسبة التفاعلية
  const [calcForm, setCalcForm] = useState({
    direction: 'UAE_TO_EGYPT',
    weight: 10,
    length: 40,
    width: 30,
    height: 30
  });

  const getPrice = (direction, weight, customAmount) => {
    if (customAmount && Number(customAmount) > 0) {
      return Number(customAmount);
    }
    const base = direction === 'UAE_TO_EGYPT' ? 60 : 300;
    const perKg = direction === 'UAE_TO_EGYPT' ? 15 : 75;
    const w = Number(weight) || 0;
    return base + (w * perKg);
  };

  const loadData = async () => {
    try {
      const { data: shipData } = await supabase.from('shipments').select('*').order('created_at', { ascending: false });
      if (shipData && shipData.length > 0) {
        setShipments(shipData);
      } else {
        setShipments([
          {
            id: '1',
            tracking_number: 'MAS-2026-000101',
            direction: 'UAE_TO_EGYPT',
            sender_name: 'شركة النور للتجارة',
            sender_phone: '+971501234567',
            receiver_name: 'أحمد محمود العوضي',
            receiver_phone: '+201098765432',
            receiver_city: 'القاهرة - مدينة نصر',
            receiver_address: 'شارع عباس العقاد عمارة 15',
            total_packages: 2,
            total_weight: 18.5,
            description: 'ملابس وهدايا عائلية وأجهزة شخصية',
            payment_method: 'PREPAID',
            total_amount: 337.5,
            currency: 'AED',
            status: 'in_transit',
            created_at: new Date().toISOString()
          }
        ]);
      }

      const { data: tripData } = await supabase.from('trips').select('*').order('created_at', { ascending: false });
      if (tripData && tripData.length > 0) {
        setTrips(tripData);
      } else {
        setTrips([
          {
            id: '1',
            trip_number: 'TRP-DXB-CAI-2026-01',
            driver_name: 'محمد صابر',
            driver_phone: '+971552345678',
            truck_plate: 'دبي - 84920 نقل',
            origin: 'مستودع دبي المركزي',
            destination: 'مستودع القاهرة الرئيسي',
            status: 'on_road',
            created_at: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTrack = async (e) => {
    e.preventDefault();
    const query = searchTracking.trim().toUpperCase();
    if (!query) return;

    const found = shipments.find(s => (s.tracking_number || '').toUpperCase() === query);
    if (found) {
      setTrackedShipment(found);
      const { data: evts } = await supabase.from('shipment_events').select('*').eq('tracking_number', found.tracking_number).order('created_at', { ascending: true });
      if (evts && evts.length > 0) {
        setTrackingEvents(evts);
      } else {
        setTrackingEvents([
          {
            title: 'تم تسجيل الشحنة وإصدار البوليصة',
            location: found.direction === 'UAE_TO_EGYPT' ? 'دبي - فرع مسار' : 'القاهرة - فرع مسار',
            time: '09:30 ص',
            completed: true
          },
          {
            title: 'تم الاستلام في مستودع التجميع المركزي',
            location: found.direction === 'UAE_TO_EGYPT' ? 'مستودع دبي الرئيسي' : 'مستودع القاهرة المركزي',
            time: '02:15 م',
            completed: true
          },
          {
            title: 'تحميل الشاحنة والتحرك في خط السير الدولي',
            location: 'المنفذ الحدودي والعبور الجمركي',
            time: 'في المسار',
            completed: found.status === 'in_transit' || found.status === 'delivered'
          },
          {
            title: 'تسليم الشحنة للعميل النهائي',
            location: found.receiver_city,
            time: found.status === 'delivered' ? 'تم بنجاح' : 'قيد الانتظار',
            completed: found.status === 'delivered'
          }
        ]);
      }
    } else {
      alert('عذراً، لم يتم العثور على شحنة بهذا الرقم. تأكد من الرقم وحاول مجدداً.');
    }
  };

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    const price = getPrice(shipmentForm.direction, shipmentForm.total_weight, shipmentForm.custom_amount);
    const curr = shipmentForm.direction === 'UAE_TO_EGYPT' ? 'AED' : 'EGP';
    const trackingNum = `MAS-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const newShipment = {
      tracking_number: trackingNum,
      direction: shipmentForm.direction,
      sender_name: shipmentForm.sender_name,
      sender_phone: shipmentForm.sender_phone,
      sender_city: shipmentForm.sender_city,
      sender_address: shipmentForm.sender_address,
      receiver_name: shipmentForm.receiver_name,
      receiver_phone: shipmentForm.receiver_phone,
      receiver_city: shipmentForm.receiver_city,
      receiver_address: shipmentForm.receiver_address,
      total_packages: Number(shipmentForm.total_packages) || 1,
      total_weight: shipmentForm.total_weight ? Number(shipmentForm.total_weight) : null,
      description: shipmentForm.description || 'بضائع متنوعة',
      payment_method: shipmentForm.payment_method,
      total_amount: price,
      paid_amount: shipmentForm.payment_method === 'PREPAID' ? price : 0,
      currency: curr,
      status: 'registered'
    };

    try {
      await supabase.from('shipments').insert([newShipment]);
    } catch (err) {}

    setShipments([newShipment, ...shipments]);
    setShowNewShipmentModal(false);
    setSelectedWaybill(newShipment);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" dir="rtl">
      {/* الشريط العلوي */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-3 flex flex-wrap justify-between items-center shadow-lg gap-2">
        <div className="flex items-center space-x-reverse space-x-3">
          <div className="w-10 h-10 bg-amber-500 text-slate-950 font-black text-xl rounded-xl flex items-center justify-center shadow">
            M
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-wide">مسار لخدمات الشحن البري</h1>
            <p className="text-[11px] text-amber-400 font-semibold">بوابة الشحن المعتمدة | الإمارات ⇄ مصر</p>
          </div>
        </div>

        {/* أزرار التبويبات */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('tracking')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'tracking' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}`}
          >
            تتبع الشحنات
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'calculator' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}`}
          >
            حاسبة الأسعار
          </button>
          <button
            onClick={() => setActiveTab('operations')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'operations' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}`}
          >
            إدارة العمليات
          </button>
          <button
            onClick={() => setActiveTab('trips')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'trips' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}`}
          >
            الرحلات والمانيفست
          </button>
        </div>

        {/* أرقام التواصل */}
        <div className="hidden xl:flex items-center space-x-reverse space-x-3 text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-slate-300">🇦🇪 {PHONES.uae}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">🇪🇬 {PHONES.egypt}</span>
        </div>
      </header>

      {/* المحتوى */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6">

        {/* 1. التتبع */}
        {activeTab === 'tracking' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-center space-y-4 shadow-xl">
              <h2 className="text-2xl font-black text-amber-400">تتبع مسار شحنتك لحظة بلحظة</h2>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                أدخل رقم البوليصة الصادر من مسار لمعرفة الموقع الفعلي والبيانات الكاملة للطرد
              </p>

              <form onSubmit={handleTrack} className="max-w-md mx-auto flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute right-3 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="مثال: MAS-2026-000101"
                    value={searchTracking}
                    onChange={(e) => setSearchTracking(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-3 py-3 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-2xl transition shadow-md"
                >
                  تتبع الآن
                </button>
              </form>
            </div>

            {trackedShipment && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                <div className="flex flex-wrap justify-between items-center pb-4 border-b border-slate-800 gap-4">
                  <div>
                    <span className="text-xs text-slate-400">رقم البوليصة:</span>
                    <div className="text-xl font-mono font-black text-amber-400">{trackedShipment.tracking_number}</div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">طريقة الدفع:</span>
                    <div className="font-bold text-sm text-emerald-400">
                      {trackedShipment.payment_method === 'COD' ? 'دفع عند الاستلام (COD)' : 'مدفوع مسبقاً (كاش)'}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">عدد الطرود:</span>
                    <div className="font-bold text-sm text-slate-200">{trackedShipment.total_packages} طرد</div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">الوزن:</span>
                    <div className="font-bold text-sm text-slate-200">
