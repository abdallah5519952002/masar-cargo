import React, { useState, useEffect } from 'react';
import {
  Truck, Package, PlusCircle, Search, ShieldCheck, Printer,
  DollarSign, MapPin, Users, History, FileText, CheckCircle2,
  AlertCircle, ChevronRight, ArrowUpDown, Filter, Lock,
  Building2, Phone, Calendar, RefreshCw, Eye
} from 'lucide-react';
import { supabase } from './supabaseClient';

const ROLES = {
  super_admin: { label: 'مدير عام النظام', color: 'bg-purple-600' },
  admin: { label: 'مدير العمليات', color: 'bg-blue-600' },
  accountant: { label: 'المحاسب المالي', color: 'bg-emerald-600' },
  registration_staff: { label: 'موظف التسجيل', color: 'bg-amber-600' },
  warehouse_staff: { label: 'أمين المستودع', color: 'bg-orange-600' },
  courier: { label: 'مندوب التوصيل', color: 'bg-teal-600' },
  customer: { label: 'بوابة العملاء', color: 'bg-slate-600' }
};

export default function App() {
  const [currentRole, setCurrentRole] = useState('super_admin');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDirection, setFilterDirection] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // أرقام هواتف الشركة المعتمدة
  const COMPANY_PHONES = {
    uae: '00971544010096',
    egypt: '00201146560066'
  };

  // نوافذ منبثقة
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printType, setPrintType] = useState('waybill');

  // بيانات شحنة جديدة
  const [formData, setFormData] = useState({
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
    package_type: 'carton',
    package_description: 'أغراض شخصية وهدايا',
    currency: 'AED'
  });

  // حساب التسعير التلقائي
  const calculatedPrice = () => {
    const base = formData.direction === 'UAE_TO_EGYPT' ? 60 : 300;
    const perKg = formData.direction === 'UAE_TO_EGYPT' ? 15 : 75;
    return base + (Number(formData.total_weight) || 0) * perKg;
  };

  // جلب الشحنات من Supabase
  const fetchShipments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        setShipments([
          {
            id: '1',
            tracking_number: 'MAS-2026-000101',
            direction: 'UAE_TO_EGYPT',
            sender_name: 'عبدالله محمد',
            sender_phone: '+971501234567',
            receiver_name: 'أحمد محمود',
            receiver_phone: '+201098765432',
            receiver_city: 'القاهرة - مدينة نصر',
            receiver_address: 'شارع عباس العقاد عمارة 12',
            total_packages: 2,
            total_weight: 18.5,
            total_amount: 337.5,
            paid_amount: 337.5,
            currency: 'AED',
            status: 'in_transit',
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            tracking_number: 'MAS-2026-000102',
            direction: 'EGYPT_TO_UAE',
            sender_name: 'محمود السيد',
            sender_phone: '+201123456789',
            receiver_name: 'إبراهيم علي',
            receiver_phone: '+971554321098',
            receiver_city: 'أبوظبي - الخالدية',
            receiver_address: 'شارع زايد الأول برج النور',
            total_packages: 1,
            total_weight: 8,
            total_amount: 900,
            paid_amount: 500,
            currency: 'EGP',
            status: 'registered',
            created_at: new Date().toISOString()
          }
        ]);
      } else {
        setShipments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  // إضافة شحنة جديدة
  const handleCreateShipment = async (e) => {
    e.preventDefault();
    setLoading(true);
    const price = calculatedPrice();
    const curr = formData.direction === 'UAE_TO_EGYPT' ? 'AED' : 'EGP';

    try {
      const { data, error } = await supabase
        .from('shipments')
        .insert([{
          direction: formData.direction,
          receiver_name: formData.receiver_name,
          receiver_phone: formData.receiver_phone,
          receiver_city: formData.receiver_city,
          receiver_address: formData.receiver_address,
          total_packages: Number(formData.total_packages),
          total_weight: Number(formData.total_weight),
          total_amount: price,
          paid_amount: 0,
          currency: curr,
          status: 'registered'
        }])
        .select();

      if (error) {
        const newLocal = {
          id: String(Date.now()),
          tracking_number: `MAS-2026-000${Math.floor(100 + Math.random() * 900)}`,
          direction: formData.direction,
          sender_name: formData.sender_name,
          sender_phone: formData.sender_phone,
          receiver_name: formData.receiver_name,
          receiver_phone: formData.receiver_phone,
          receiver_city: formData.receiver_city,
          receiver_address: formData.receiver_address,
          total_packages: Number(formData.total_packages),
          total_weight: Number(formData.total_weight),
          total_amount: price,
          paid_amount: 0,
          currency: curr,
          status: 'registered',
          created_at: new Date().toISOString()
        };
        setShipments([newLocal, ...shipments]);
      } else if (data) {
        setShipments([data[0], ...shipments]);
      }
      setShowCreateModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredShipments = shipments.filter(s => {
    const matchSearch = (s.tracking_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (s.receiver_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (s.receiver_phone || '').includes(searchQuery);
    const matchDir = filterDirection === 'ALL' || s.direction === filterDirection;
    const matchStatus = filterStatus === 'ALL' || s.status === filterStatus;
    return matchSearch && matchDir && matchStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo']" dir="rtl">
      {/* الشريط العلوي */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-reverse space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
            M
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wide text-white">مسار لخدمات الشحن البري</h1>
            <p className="text-xs text-amber-400 font-semibold">الإمارات ⇄ مصر | مسارك الأفضل للشحن</p>
          </div>
        </div>

        {/* أرقام التواصل والأدوار */}
        <div className="flex items-center space-x-reverse space-x-4">
          <div className="hidden lg:flex items-center space-x-reverse space-x-3 text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="flex items-center space-x-reverse space-x-1 text-slate-300 font-mono">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>🇦🇪 {COMPANY_PHONES.uae}</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center space-x-reverse space-x-1 text-slate-300 font-mono">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>🇪🇬 {COMPANY_PHONES.egypt}</span>
            </span>
          </div>

          <div className="flex items-center space-x-reverse space-x-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-400 hidden sm:inline">الصلاحية:</span>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              className="bg-slate-900 text-xs font-bold text-amber-300 rounded-lg px-2 py-1 outline-none border border-slate-700"
            >
              {Object.entries(ROLES).map(([key, role]) => (
                <option key={key} value={key}>{role.label}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* القائمة الجانبية */}
        <aside className="w-full md:w-64 bg-slate-900/60 border-l border-slate-800/80 p-4 flex md:flex-col space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-reverse space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeTab === 'dashboard' ? 'bg-amber-500 text-slate-950 shadow-md font-bold' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>لوحة التحكم والشحنات</span>
          </button>

          <button
            onClick={() => setActiveTab('tracking')}
            className={`w-full flex items-center space-x-reverse space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeTab === 'tracking' ? 'bg-amber-500 text-slate-950 shadow-md font-bold' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>بوابة تتبع العملاء</span>
          </button>

          <button
            onClick={() => setActiveTab('finance')}
            className={`w-full flex items-center space-x-reverse space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeTab === 'finance' ? 'bg-amber-500 text-slate-950 shadow-md font-bold' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>الحسابات والخزائن</span>
          </button>

          <div className="hidden md:block mt-auto pt-6 border-t border-slate-800/60 text-xs space-y-2">
            <span className="text-slate-400 font-bold block">خدمة العملاء:</span>
            <div className="text-slate-300 font-mono flex items-center space-x-reverse space-x-1.5">
              <span>🇦🇪</span>
              <span>{COMPANY_PHONES.uae}</span>
            </div>
            <div className="text-slate-300 font-mono flex items-center space-x-reverse space-x-1.5">
              <span>🇪🇬</span>
              <span>{COMPANY_PHONES.egypt}</span>
            </div>
          </div>
        </aside>

        {/* عرض الشاشات */}
        <main className="flex-1 p-4 md:p-6 space-y-6">
          {activeTab === 'dashboard' && (
            <>
              {/* إحصائيات */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
                  <span className="text-xs text-slate-400">إجمالي الشحنات</span>
                  <div className="text-2xl font-black text-amber-400 mt-1">{shipments.length}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
                  <span className="text-xs text-slate-400">شحنات في الطريق</span>
                  <div className="text-2xl font-black text-blue-400 mt-1">
                    {shipments.filter(s => s.status === 'in_transit').length}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
                  <span className="text-xs text-slate-400">تحصيلات درهم (AED)</span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {shipments.filter(s => s.currency === 'AED').reduce((acc, c) => acc + (c.paid_amount || 0), 0)} د.إ
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p
