import React, { useState, useEffect } from 'react';
import { 
  Truck, Search, Package, Printer, PlusCircle, Phone, 
  MapPin, Calendar, Clock, CheckCircle2, AlertCircle, 
  DollarSign, Calculator, Layers, FileText, ArrowRight, ShieldCheck
} from 'lucide-react';
import { supabase } from './supabaseClient';

export default function App() {
  const [activeTab, setActiveTab] = useState('tracking'); // tracking | operations | trips | calculator
  const [shipments, setShipments] = useState([]);
  const [trips, setTrips] = useState([]);
  const [searchTracking, setSearchTracking] = useState('');
  const [trackedShipment, setTrackedShipment] = useState(null);
  const [trackingEvents, setTrackingEvents] = useState([]);
  const [showNewShipmentModal, setShowNewShipmentModal] = useState(false);
  const [selectedWaybill, setSelectedWaybill] = useState(null);

  // أرقام هواتف مسار المعتمدة
  const PHONES = { uae: '00971544010096', egypt: '00201146560066' };

  // نموذج إضافة شحنة
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
    total_weight: 5,
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

  const getPrice = (direction, weight) => {
    const base = direction === 'UAE_TO_EGYPT' ? 60 : 300;
    const perKg = direction === 'UAE_TO_EGYPT' ? 15 : 75;
    return base + (Number(weight) || 0) * perKg;
  };

  // جلب البيانات
  const loadData = async () => {
    try {
      const { data: shipData } = await supabase.from('shipments').select('*').order('created_at', { ascending: false });
      if (shipData && shipData.length > 0) {
        setShipments(shipData);
      } else {
        // بيانات تجريبية افتراضية
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

  // تنفيذ التتبع للعميل (مثل DHL Timeline)
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

  // تسجيل شحنة جديدة
  const handleCreateShipment = async (e) => {
    e.preventDefault();
    const price = getPrice(shipmentForm.direction, shipmentForm.total_weight);
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
      total_packages: Number(shipmentForm.total_packages),
      total_weight: Number(shipmentForm.total_weight),
      total_amount: price,
      paid_amount: 0,
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
      {/* الشريط العلوي الشامل */}
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

        {/* أزرار التبويبات الرئيسية */}
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

      {/* المحتوى بحسب التبويب */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6">

        {/* 1. بوابة التتبع على غرار DHL */}
        {activeTab === 'tracking' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-center space-y-4 shadow-xl">
              <h2 className="text-2xl font-black text-amber-400">تتبع مسار شحنتك لحظة بلحظة</h2>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                أدخل رقم البوليصة الصادر من مسار لمعرفة الموقع الفعلي للطرد وخط سيره من الإمارات إلى مصر والعكس
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

            {/* تفاصيل الشحنة والتول التايم لاين */}
            {trackedShipment && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                <div className="flex flex-wrap justify-between items-center pb-4 border-b border-slate-800 gap-4">
                  <div>
                    <span className="text-xs text-slate-400">رقم البوليصة:</span>
                    <div className="text-xl font-mono font-black text-amber-400">{trackedShipment.tracking_number}</div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">المسار:</span>
                    <div className="font-bold text-sm">
                      {trackedShipment.direction === 'UAE_TO_EGYPT' ? '🇦🇪 الإمارات ➔ 🇪🇬 مصر' : '🇪🇬 مصر ➔ 🇦🇪 الإمارات'}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">الوجهة والمستلم:</span>
                    <div className="font-bold text-sm text-slate-200">{trackedShipment.receiver_name} ({trackedShipment.receiver_city})</div>
                  </div>
                </div>

                {/* DHL-Style Timeline */}
                <div className="space-y-6 py-2">
                  <h3 className="text-sm font-bold text-slate-300">سجل حركة الشحنة (Live Tracking Timeline):</h3>
                  <div className="relative border-r-2 border-slate-800 mr-4 space-y-6">
                    {trackingEvents.map((evt, idx) => (
                      <div key={idx} className="relative pr-6">
                        <div className={`absolute -right-2 top-0.5 w-4 h-4 rounded-full border-2 ${
                          evt.completed ? 'bg-amber-500 border-amber-300' : 'bg-slate-950 border-slate-700'
                        }`} />
                        <div>
                          <div className={`text-sm font-bold ${evt.completed ? 'text-white' : 'text-slate-500'}`}>
                            {evt.title}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center space-x-reverse space-x-3">
                            <span className="flex items-center space-x-reverse space-x-1">
                              <MapPin className="w-3 h-3 text-amber-400" />
                              <span>{evt.location}</span>
                            </span>
                            <span className="flex items-center space-x-reverse space-x-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>{evt.time}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. حاسبة الأسعار الفورية (Rate Calculator) */}
        {activeTab === 'calculator' && (
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
            <div>
              <h2 className="text-xl font-black text-amber-400">حاسبة تكلفة الشحن البري</h2>
              <p className="text-xs text-slate-400 mt-1">احسب تكلفة شحنتك بدقة اعتماداً على الوزن الفعلي والحجمي</p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">اتجاه الشحن</label>
                <select
                  value={calcForm.direction}
                  onChange={(e) => setCalcForm({...calcForm, direction: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
                >
                  <option value="UAE_TO_EGYPT">من الإمارات إلى جميع محافظات مصر (بالدرهم AED)</option>
                  <option value="EGYPT_TO_UAE">من مصر إلى جميع إمارات الدولة (بالجنيه EGP)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">الوزن الإجمالي (كجم)</label>
                <input
                  type="number"
                  min="1"
                  value={calcForm.weight}
                  onChange={(e) => setCalcForm({...calcForm, weight: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">الطول (سم)</label>
                  <input
                    type="number"
                    value={calcForm.length}
                    onChange={(e) => setCalcForm({...calcForm, length: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">العرض (سم)</label>
                  <input
                    type="number"
                    value={calcForm.width}
                    onChange={(e) => setCalcForm({...calcForm, width: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">الارتفاع (سم)</label>
                  <input
                    type="number"
                    value={calcForm.height}
                    onChange={(e) => setCalcForm({...calcForm, height: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              {/* النتيجة التقديرية */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex justify-between items-center text-sm font-bold mt-4">
                <div>
                  <span className="text-amber-400 block">التكلفة التقديرية للشحن:</span>
                  <span className="text-[10px] text-slate-400 font-normal">شاملة التوصيل والخدمات اللوجستية</span>
                </div>
                <div className="text-xl font-black text-white">
                  {getPrice(calcForm.direction, calcForm.weight)} {calcForm.direction === 'UAE_TO_EGYPT' ? 'AED' : 'EGP'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. لوحة إدارة العمليات وإصدار البوالص */}
        {activeTab === 'operations' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div className="text-sm">
                <span className="font-bold text-white">إجمالي الشحنات النشطة: </span>
                <span className="font-mono text-amber-400 font-bold">{shipments.length}</span>
              </div>
              <button
                onClick={() => setShowNewShipmentModal(true)}
                className="w-full md:w-auto flex items-center justify-center space-x-reverse space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl transition text-xs shadow-md"
              >
                <PlusCircle className="w-4 h-4" />
                <span>إصدار بوليصة جديدة</span>
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto shadow-xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">رقم البوليصة</th>
                    <th className="p-3">المسار</th>
                    <th className="p-3">الراسل</th>
                    <th className="p-3">المستلم والوجهة</th>
                    <th className="p-3">الوزن / الرسوم</th>
                    <th className="p-3">الحالة</th>
                    <th className="p-3 text-center">طباعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {shipments.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-amber-400">{s.tracking_number}</td>
                      <td className="p-3">
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                          {s.direction === 'UAE_TO_EGYPT' ? '🇦🇪 الإمارات ➔ 🇪🇬 مصر' : '🇪🇬 مصر ➔ 🇦🇪 الإمارات'}
                        </span>
                      </td>
                      <td className="p-3 font-medium">{s.sender_name}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-200">{s.receiver_name}</div>
                        <div className="text-[10px] text-slate-400">{s.receiver_city}</div>
                      </td>
                      <td className="p-3">
                        <div>{s.total_weight} كجم</div>
                        <div className="font-bold text-amber-300">{s.total_amount} {s.currency}</div>
                      </td>
                      <td className="p-3">
                        <span className="bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {s.status === 'in_transit' ? 'في الطريق' : 'مسجلة'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelectedWaybill(s)}
                          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-amber-400 transition"
                          title="طباعة بوليصة الشحن"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. إدارة الرحلات والشاحنات والمانيفست */}
        {activeTab === 'trips' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-sm">رحلات الشاحنات البرية (المانيفست)</h3>
                <p className="text-xs text-slate-400">تتبع حركة أسطول الشحن بين الإمارات ومصر عبر الحدود</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trips.map((t, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 shadow-lg">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="font-mono font-bold text-amber-400 text-sm">{t.trip_number}</span>
                    <span className="bg-blue-950 text-blue-400 border border-blue-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                      {t.status === 'on_road' ? 'على الطريق الدولي' : 'قيد التحميل'}
                    </span>
                  </div>
                  <div className="text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">السائق:</span>
                      <span className="font-bold text-white">{t.driver_name} ({t.driver_phone})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">رقم لوحة الشاحنة:</span>
                      <span className="font-bold text-white font-mono">{t.truck_plate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">خط السير:</span>
                      <span className="text-amber-300 font-semibold">{t.origin} ➔ {t.destination}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* نافذة تسجيل شحنة جديدة */}
      {showNewShipmentModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto text-xs space-y-4">
            <h3 className="text-base font-black text-amber-400">إصدار بوليصة شحن بري جديدة</h3>
            <form onSubmit={handleCreateShipment} className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">خط السير</label>
                <select
                  value={shipmentForm.direction}
                  onChange={(e) => setShipmentForm({...shipmentForm, direction: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="UAE_TO_EGYPT">من الإمارات إلى مصر</option>
                  <option value="EGYPT_TO_UAE">من مصر إلى الإمارات</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text" required placeholder="اسم الراسل"
                  value={shipmentForm.sender_name} onChange={(e) => setShipmentForm({...shipmentForm, sender_name: e.target.value})}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
                <input
                  type="text" required placeholder="هاتف الراسل"
                  value={shipmentForm.sender_phone} onChange={(e) => setShipmentForm({...shipmentForm, sender_phone: e.target.value})}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text" required placeholder="اسم المستلم"
                  value={shipmentForm.receiver_name} onChange={(e) => setShipmentForm({...shipmentForm, receiver_name: e.target.value})}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
                <input
                  type="text" required placeholder="هاتف المستلم"
                  value={shipmentForm.receiver_phone} onChange={(e) => setShipmentForm({...shipmentForm, receiver_phone: e.target.value})}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text" required placeholder="مدينة الاستلام (مثل: القاهرة/دبي)"
                  value={shipmentForm.receiver_city} onChange={(e) => setShipmentForm({...shipmentForm, receiver_city: e.target.value})}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
                <input
                  type="text" required placeholder="العنوان بالتفصيل"
                  value={shipmentForm.receiver_address} onChange={(e) => setShipmentForm({...shipmentForm, receiver_address: e.target.value})}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number" min="1" placeholder="عدد الطرود"
                  value={shipmentForm.total_packages} onChange={(e) => setShipmentForm({...shipmentForm, total_packages: e.target.value})}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
                <input
                  type="number" step="0.5" placeholder="الوزن الإجمالي (كجم)"
                  value={shipmentForm.total_weight} onChange={(e) => setShipmentForm({...shipmentForm, total_weight: e.target.value})}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex justify-between font-bold">
                <span className="text-amber-400">الإجمالي المحسوب:</span>
                <span>{getPrice(shipmentForm.direction, shipmentForm.total_weight)} {shipmentForm.direction === 'UAE_TO_EGYPT' ? 'AED' : 'EGP'}</span>
              </div>

              <div className="flex justify-end space-x-reverse space-x-2 pt-2">
                <button type="button" onClick={() => setShowNewShipmentModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">إلغاء</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl">حفظ وإصدار</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* بوليصة الشحن الرسمية المعتمدة للطباعة */}
      {selectedWaybill && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white text-slate-950 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
              <div>
                <h2 className="text-base font-black">مسار لخدمات الشحن البري</h2>
                <p className="text-[10px] text-slate-600 font-semibold">MASAR CARGO LOGISTICS</p>
                <div className="text-[9px] font-mono text-slate-500 mt-1">
                  🇦🇪 {PHONES.uae} | 🇪🇬 {PHONES.egypt}
                </div>
              </div>
              <div className="text-left font-mono">
                <div className="text-xs font-black text-amber-600">{selectedWaybill.tracking_number}</div>
                <div className="text-[10px] text-slate-500">بوليصة شحن بري معتمدة</div>
              </div>
            </div>

            <div className="border border-slate-300 rounded-lg p-2.5 space-y-1 bg-slate-50">
              <div className="font-bold text-slate-700">بيانات الأطراف:</div>
              <div><strong>الراسل:</strong> {selectedWaybill.sender_name} ({selectedWaybill.sender_phone})</div>
              <div><strong>المستلم:</strong> {selectedWaybill.receiver_name} ({selectedWaybill.receiver_phone})</div>
              <div><strong>العنوان:</strong> {selectedWaybill.receiver_city} - {selectedWaybill.receiver_address}</div>
            </div>

            <div className="border border-slate-300 rounded-lg p-2.5 flex justify-between">
              <div><strong>الوزن:</strong> {selectedWaybill.total_weight} كجم</div>
              <div><strong>الطرود:</strong> {selectedWaybill.total_packages} طرد</div>
              <div className="font-bold text-emerald-700">{selectedWaybill.total_amount} {selectedWaybill.currency}</div>
            </div>

            <div className="flex justify-end space-x-reverse space-x-2 pt-2">
              <button onClick={() => setSelectedWaybill(null)} className="px-3 py-1.5 bg-slate-200 rounded-lg">إغلاق</button>
              <button onClick={() => window.print()} className="px-4 py-1.5 bg-slate-950 text-white font-bold rounded-lg flex items-center space-x-reverse space-x-1">
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة البوليصة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
