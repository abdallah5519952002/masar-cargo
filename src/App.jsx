import React, { useState, useEffect } from 'react';
import { Truck, Search, Printer, PlusCircle } from 'lucide-react';
import { supabase } from './supabaseClient';

export default function App() {
  const [shipments, setShipments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);

  const PHONES = { uae: '00971544010096', egypt: '00201146560066' };

  const [form, setForm] = useState({
    direction: 'UAE_TO_EGYPT',
    sender_name: '',
    sender_phone: '',
    receiver_name: '',
    receiver_phone: '',
    receiver_city: 'القاهرة',
    receiver_address: '',
    total_packages: 1,
    total_weight: 5
  });

  const calcPrice = () => {
    const base = form.direction === 'UAE_TO_EGYPT' ? 60 : 300;
    const perKg = form.direction === 'UAE_TO_EGYPT' ? 15 : 75;
    return base + (Number(form.total_weight) || 0) * perKg;
  };

  const loadData = async () => {
    try {
      const { data } = await supabase.from('shipments').select('*').order('created_at', { ascending: false });
      if (data && data.length > 0) setShipments(data);
      else {
        setShipments([
          {
            id: '1',
            tracking_number: 'MAS-2026-000101',
            direction: 'UAE_TO_EGYPT',
            sender_name: 'عبدالله محمد',
            sender_phone: '+971501234567',
            receiver_name: 'أحمد محمود',
            receiver_phone: '+201098765432',
            receiver_city: 'القاهرة',
            receiver_address: 'مدينة نصر',
            total_packages: 2,
            total_weight: 18.5,
            total_amount: 337.5,
            currency: 'AED',
            status: 'in_transit'
          }
        ]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const curr = form.direction === 'UAE_TO_EGYPT' ? 'AED' : 'EGP';
    const price = calcPrice();
    const newEntry = {
      tracking_number: `MAS-2026-000${Math.floor(100 + Math.random() * 900)}`,
      direction: form.direction,
      sender_name: form.sender_name,
      sender_phone: form.sender_phone,
      receiver_name: form.receiver_name,
      receiver_phone: form.receiver_phone,
      receiver_city: form.receiver_city,
      receiver_address: form.receiver_address,
      total_packages: Number(form.total_packages),
      total_weight: Number(form.total_weight),
      total_amount: price,
      currency: curr,
      status: 'registered'
    };

    try {
      await supabase.from('shipments').insert([newEntry]);
    } catch (err) {}

    setShipments([newEntry, ...shipments]);
    setShowModal(false);
  };

  const list = shipments.filter(s =>
    (s.tracking_number || '').includes(searchQuery) ||
    (s.receiver_name || '').includes(searchQuery) ||
    (s.receiver_phone || '').includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans" dir="rtl">
      <header className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-reverse space-x-3">
          <div className="w-10 h-10 bg-amber-500 text-slate-950 font-black text-xl rounded-xl flex items-center justify-center">M</div>
          <div>
            <h1 className="text-lg font-bold text-white">مسار لخدمات الشحن البري</h1>
            <p className="text-xs text-amber-400">الإمارات ⇄ مصر</p>
          </div>
        </div>

        <div className="flex items-center space-x-reverse space-x-4 text-xs font-mono">
          <span className="hidden md:inline text-slate-300">🇦🇪 {PHONES.uae}</span>
          <span className="hidden md:inline text-slate-300">🇪🇬 {PHONES.egypt}</span>
          <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-lg border border-amber-500/30">مدير عام</span>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-6xl mx-auto space-x-reverse space-y-4">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="بحث برقم التتبع أو المستلم..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-9 pl-3 py-2 text-sm text-white focus:outline-none"
            />
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="w-full md:w-auto flex items-center justify-center space-x-reverse space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>تسجيل شحنة جديدة</span>
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto shadow-md">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">رقم التتبع</th>
                <th className="p-3">المسار</th>
                <th className="p-3">المستلم والوجهة</th>
                <th className="p-3">الوزن والطرود</th>
                <th className="p-3">المبلغ</th>
                <th className="p-3">الحالة</th>
                <th className="p-3 text-center">طباعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {list.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-800/50">
                  <td className="p-3 font-mono font-bold text-amber-400">{s.tracking_number}</td>
                  <td className="p-3">{s.direction === 'UAE_TO_EGYPT' ? '🇦🇪 الإمارات ➔ 🇪🇬 مصر' : '🇪🇬 مصر ➔ 🇦🇪 الإمارات'}</td>
                  <td className="p-3">
                    <div className="font-bold text-slate-200">{s.receiver_name}</div>
                    <div className="text-[11px] text-slate-400">{s.receiver_city} - {s.receiver_phone}</div>
                  </td>
                  <td className="p-3">{s.total_weight} كجم ({s.total_packages} طرد)</td>
                  <td className="p-3 font-bold text-white">{s.total_amount} {s.currency}</td>
                  <td className="p-3">
                    <span className="bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded text-[10px]">
                      {s.status === 'in_transit' ? 'في الطريق' : 'مسجلة'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => setSelectedShipment(s)} className="p-1 hover:text-amber-400">
                      <Printer className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl max-w-lg w-full text-xs space-y-3">
            <h3 className="font-bold text-base text-amber-400">إضافة شحنة جديدة</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">المسار</label>
                <select
                  value={form.direction}
                  onChange={e => setForm({...form, direction: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-white"
                >
                  <option value="UAE_TO_EGYPT">من الإمارات إلى مصر</option>
                  <option value="EGYPT_TO_UAE">من مصر إلى الإمارات</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text" required placeholder="اسم الراسل"
                  value={form.sender_name} onChange={e => setForm({...form, sender_name: e.target.value})}
                  className="bg-slate-950 border border-slate-800 p-2 rounded text-white"
                />
                <input
                  type="text" required placeholder="هاتف الراسل"
                  value={form.sender_phone} onChange={e => setForm({...form, sender_phone: e.target.value})}
                  className="bg-slate-950 border border-slate-800 p-2 rounded text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text" required placeholder="اسم المستلم"
                  value={form.receiver_name} onChange={e => setForm({...form, receiver_name: e.target.value})}
                  className="bg-slate-950 border border-slate-800 p-2 rounded text-white"
                />
                <input
                  type="text" required placeholder="هاتف المستلم"
                  value={form.receiver_phone} onChange={e => setForm({...form, receiver_phone: e.target.value})}
                  className="bg-slate-950 border border-slate-800 p-2 rounded text-white"
                />
              </div>

              <input
                type="text" required placeholder="عنوان التوصيل بالتفصيل"
                value={form.receiver_address} onChange={e => setForm({...form, receiver_address: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-white"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number" min="1" placeholder="عدد الطرود"
                  value={form.total_packages} onChange={e => setForm({...form, total_packages: e.target.value})}
                  className="bg-slate-950 border border-slate-800 p-2 rounded text-white"
                />
                <input
                  type="number" step="0.5" placeholder="الوزن الإجمالي"
                  value={form.total_weight} onChange={e => setForm({...form, total_weight: e.target.value})}
                  className="bg-slate-950 border border-slate-800 p-2 rounded text-white"
                />
              </div>

              <div className="p-2 bg-amber-500/10 text-amber-400 font-bold rounded flex justify-between">
                <span>التكلفة المحسوبة:</span>
                <span>{calcPrice()} {form.direction === 'UAE_TO_EGYPT' ? 'AED' : 'EGP'}</span>
              </div>

              <div className="flex justify-end space-x-reverse space-x-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded">إلغاء</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedShipment && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-950 p-6 rounded-xl max-w-sm w-full space-y-3 text-xs shadow-2xl">
            <div className="border-b pb-2 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-sm">مسار لخدمات الشحن البري</h2>
                <div className="text-[10px] text-slate-600">🇦🇪 {PHONES.uae} | 🇪🇬 {PHONES.egypt}</div>
              </div>
              <span className="font-mono font-bold text-amber-600">{selectedShipment.tracking_number}</span>
            </div>

            <div className="space-y-1">
              <div><strong>الراسل:</strong> {selectedShipment.sender_name} ({selectedShipment.sender_phone})</div>
              <div><strong>المستلم:</strong> {selectedShipment.receiver_name} ({selectedShipment.receiver_phone})</div>
              <div><strong>العنوان:</strong> {selectedShipment.receiver_address}</div>
              <div><strong>الوزن / الطرود:</strong> {selectedShipment.total_weight} كجم / {selectedShipment.total_packages} طرد</div>
              <div className="text-sm font-bold pt-2 border-t">المبلغ: {selectedShipment.total_amount} {selectedShipment.currency}</div>
            </div>

            <div className="flex justify-end space-x-reverse space-x-2 pt-3">
              <button onClick={() => setSelectedShipment(null)} className="px-3 py-1 bg-slate-200 rounded">إغلاق</button>
              <button onClick={() => window.print()} className="px-3 py-1 bg-slate-950 text-white font-bold rounded">طباعة</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
