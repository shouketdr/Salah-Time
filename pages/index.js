import React, { useState, useEffect } from 'react';
import { Coordinates, CalculationMethod, PrayerTimes, Qibla } from 'adhan';
import { Compass, MapPin, Calendar as CalIcon, Clock, Calculator, ArrowLeftRight } from 'lucide-react';

export default function ZenMuslim() {
  const [data, setData] = useState({ times: null, qibla: 0, city: "Jeddah" });
  const [dates, setDates] = useState({ greg: "", hijri: "" });
  const [view, setView] = useState('prayers'); 
  
  // Zakat State
  const [wealth, setWealth] = useState("");
  // Converter State
  const [convDate, setConvDate] = useState("");
  const [convertedResult, setConvertedResult] = useState("");

  useEffect(() => {
    const now = new Date();
    
    // FIX: Arabic Hijri Formatter (Umm al-Qura) - Day / Month / Year
    const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    // Format the date parts to ensure Day / Month / Year order
    const parts = hijriFormatter.formatToParts(now);
    const hDay = parts.find(p => p.type === 'day').value;
    const hMonth = parts.find(p => p.type === 'month').value;
    const hYear = parts.find(p => p.type === 'year').value;

    setDates({
      greg: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      hijri: `${hDay} / ${hMonth} / ${hYear}` // Fixed Format
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const coords = new Coordinates(lat, lon);
        const params = CalculationMethod.MuslimWorldLeague();
        const pTimes = new PrayerTimes(coords, now, params);
        setData(prev => ({ ...prev, times: pTimes, qibla: Qibla(coords) }));
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const geoData = await res.json();
          setData(prev => ({ ...prev, city: geoData.address.city || geoData.address.town || "My Location" }));
        } catch (e) { console.error("City fetch failed"); }
      });
    }
  }, []);

  const handleConvert = (type) => {
    if (!convDate) return;
    const d = new Date(convDate);
    // Fixed conversion logic to Hijri month names
    const h = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(d);
    setConvertedResult(h);
  };

  const PrayerRow = ({ name, time }) => (
    <div className="flex justify-between items-center p-5 mx-4 mb-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
      <span className="text-lg font-medium text-white/90">{name}</span>
      <span className="text-lg font-mono text-emerald-400">
        {time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
      </span>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#001f3f] text-white pb-28 relative font-sans overflow-x-hidden">
      
      {/* HEADER: Salah Time */}
      <div className="pt-8 px-8 text-center">
         <h1 className="text-emerald-500 font-black text-xl uppercase tracking-[0.3em]">Salah Time</h1>
      </div>

      {/* 1. PRAYERS VIEW */}
      {view === 'prayers' && (
        <>
          <header className="p-6 text-center">
            <div className="flex justify-center items-center gap-2 text-emerald-400 mb-2">
              <MapPin size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{data.city}</span>
            </div>
            <h2 className="text-2xl font-bold mb-1 tracking-tight">{dates.hijri}</h2>
            <p className="opacity-40 text-[10px] uppercase tracking-[0.2em]">{dates.greg}</p>
          </header>
          <div className="space-y-1">
            {["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"].map(p => (
              <PrayerRow key={p} name={p} time={data.times?.[p.toLowerCase()]} />
            ))}
          </div>
        </>
      )}

      {/* 2. ZAKAT & CONVERTER VIEW */}
      {view === 'tools' && (
        <div className="p-6 space-y-8 animate-in fade-in duration-300">
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Calculator className="text-emerald-400"/> Zakat Calculator</h2>
            <div className="bg-white/5 p-5 rounded-3xl border border-white/10">
              <label className="text-xs opacity-50 uppercase mb-2 block font-bold">Total Wealth</label>
              <input 
                type="number" 
                value={wealth} 
                onChange={(e) => setWealth(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white outline-none focus:border-emerald-500 mb-4"
              />
              <div className="flex justify-between items-center bg-emerald-500/20 p-4 rounded-xl">
                <span className="text-sm font-bold">Amount (2.5%):</span>
                <span className="text-xl font-black text-emerald-400">{(wealth * 0.025).toFixed(2)}</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><ArrowLeftRight className="text-emerald-400"/> Date Converter</h2>
            <div className="bg-white/5 p-5 rounded-3xl border border-white/10">
              <input 
                type="date" 
                onChange={(e) => setConvDate(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white mb-4"
              />
              <button 
                onClick={() => handleConvert('toHijri')}
                className="w-full bg-emerald-500 text-[#001f3f] font-bold p-3 rounded-xl mb-4 uppercase text-xs tracking-widest"
              >
                Get Hijri Date
              </button>
              {convertedResult && (
                <div className="text-center p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                  <p className="text-emerald-400 font-black text-lg">{convertedResult}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* 3. QIBLA VIEW */}
      {view === 'qibla' && (
        <div className="p-8 text-center animate-in zoom-in-95 duration-300">
          <h2 className="text-2xl font-bold mb-8 uppercase tracking-widest">Qibla</h2>
          <div className="relative w-64 h-64 mx-auto mb-10">
            <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
            <div className="absolute inset-0 flex items-center justify-center transition-transform duration-500" style={{ transform: `rotate(${data.qibla}deg)` }}>
              <div className="w-1 h-32 bg-emerald-500 relative"><div className="absolute -top-4 -left-1.5 border-l-8 border-r-8 border-b-16 border-b-emerald-500 border-x-transparent"></div></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Compass size={40} className="text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-400">{Math.round(data.qibla)}°</p>
        </div>
      )}

      {/* NAVIGATION BAR */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[380px] bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full p-3 flex justify-around items-center shadow-2xl z-50">
        <button onClick={() => setView('prayers')} className={view === 'prayers' ? "text-emerald-400 p-2 bg-white/5 rounded-full" : "text-white/40 p-2"}><Clock size={24} /></button>
        <button onClick={() => setView('tools')} className={view === 'tools' ? "text-emerald-400 p-2 bg-white/5 rounded-full" : "text-white/40 p-2"}><Calculator size={24} /></button>
        <button onClick={() => setView('qibla')} className={view === 'qibla' ? "text-emerald-400 p-2 bg-white/5 rounded-full" : "text-white/40 p-2"}><Compass size={24} /></button>
      </nav>
    </div>
  );
}
