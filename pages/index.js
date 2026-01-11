import React, { useState, useEffect } from 'react';
import { Coordinates, CalculationMethod, PrayerTimes, Qibla } from 'adhan';
import { Compass, MapPin, Calendar as CalIcon, Clock, Calculator, ArrowLeftRight } from 'lucide-react';

export default function ZenMuslim() {
  const [data, setData] = useState({ times: null, qibla: 0, city: "Jeddah", next: "" });
  const [dates, setDates] = useState({ greg: "", hijri: "" });
  const [view, setView] = useState('prayers'); 
  const [wealth, setWealth] = useState("");
  const [convDate, setConvDate] = useState("");
  const [convertedResult, setConvertedResult] = useState("");

  const formatHijriArabic = (date) => {
    const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    const parts = formatter.formatToParts(date);
    const day = parts.find(p => p.type === 'day').value;
    const month = parts.find(p => p.type === 'month').value;
    const year = parts.find(p => p.type === 'year').value;
    return `${day} / ${month} / ${year}`;
  };

  useEffect(() => {
    const now = new Date();
    setDates({
      greg: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      hijri: formatHijriArabic(now)
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const coords = new Coordinates(lat, lon);
        const params = CalculationMethod.UmmAlQura(); 
        const pTimes = new PrayerTimes(coords, now, params);
        
        setData(prev => ({ 
          ...prev, 
          times: pTimes, 
          qibla: Qibla(coords),
          next: pTimes.nextPrayer() 
        }));

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const geoData = await res.json();
          setData(prev => ({ ...prev, city: geoData.address.city || geoData.address.town || "Jeddah" }));
        } catch (e) { console.error("City fetch failed"); }
      });
    }
  }, []);

  const PrayerRow = ({ name, time, id }) => {
    const isNext = data.next === id;
    return (
      <div className={`flex justify-between items-center p-5 mx-4 mb-2 rounded-2xl border transition-all duration-500 ${
        isNext 
        ? 'bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/20 scale-[1.02]' 
        : 'bg-white/5 border-white/10'
      }`}>
        <span className={`text-lg font-bold ${isNext ? 'text-[#001f3f]' : 'text-white/90'}`}>{name}</span>
        <div className="flex items-center gap-3">
          <span className={`text-lg font-mono ${isNext ? 'text-[#001f3f]' : 'text-emerald-400'}`}>
            {time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
          </span>
          {isNext && <div className="w-2 h-2 bg-[#001f3f] rounded-full animate-ping"></div>}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#001f3f] text-white pb-28 relative font-sans overflow-x-hidden">
      
      <div className="pt-10 px-8 text-center">
         <h1 className="text-emerald-500 font-black text-2xl uppercase tracking-[0.2em]">Salah Time</h1>
      </div>

      {view === 'prayers' && (
        <>
          <header className="p-6 text-center">
            <div className="flex justify-center items-center gap-2 text-white/60 mb-3">
              <MapPin size={14} className="text-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-widest">{data.city}</span>
            </div>
            <h2 className="text-3xl font-bold mb-1 tracking-tight" dir="rtl">{dates.hijri}</h2>
            <p className="opacity-40 text-xs font-medium">{dates.greg}</p>
          </header>

          <div className="space-y-1 mt-4">
            <PrayerRow name="Fajr" time={data.times?.fajr} id="fajr" />
            <PrayerRow name="Sunrise" time={data.times?.sunrise} id="sunrise" />
            <PrayerRow name="Dhuhr" time={data.times?.dhuhr} id="dhuhr" />
            <PrayerRow name="Asr" time={data.times?.asr} id="asr" />
            <PrayerRow name="Maghrib" time={data.times?.maghrib} id="maghrib" />
            <PrayerRow name="Isha" time={data.times?.isha} id="isha" />
          </div>
        </>
      )}

      {view === 'tools' && (
        <div className="p-6 space-y-8 animate-in fade-in duration-300">
           <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-emerald-400 font-mono italic">Date Converter</h2>
            <div className="bg-white/5 p-5 rounded-3xl border border-white/10">
              <input type="date" onChange={(e) => setConvDate(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white mb-4" />
              <button onClick={() => setConvertedResult(formatHijriArabic(new Date(convDate)))} className="w-full bg-white text-[#001f3f] font-black p-4 rounded-xl mb-4 uppercase tracking-tighter">Convert to Hijri</button>
              {convertedResult && <div className="text-center p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30"><p className="text-emerald-400 font-black text-xl" dir="rtl">{convertedResult}</p></div>}
            </div>
          </section>
          
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-emerald-400 font-mono italic">Zakat Calculator</h2>
            <div className="bg-white/5 p-5 rounded-3xl border border-white/10">
              <input type="number" value={wealth} onChange={(e) => setWealth(e.target.value)} placeholder="Total wealth" className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white outline-none mb-4" />
              <div className="bg-emerald-500 text-[#001f3f] p-4 rounded-xl flex justify-between items-center"><span className="font-bold">Zakat (2.5%):</span><span className="text-2xl font-black">{(wealth * 0.025).toFixed(2)}</span></div>
            </div>
          </section>
        </div>
      )}

      {view === 'qibla' && (
        <div className="p-8 text-center animate-in zoom-in-95 duration-300">
          <h2 className="text-2xl font-bold mb-8 uppercase tracking-widest text-emerald-500">Qibla</h2>
          <div className="relative w-64 h-64 mx-auto mb-10">
            <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
            <div className="absolute inset-0 flex items-center justify-center transition-transform duration-700" style={{ transform: `rotate(${data.qibla}deg)` }}>
              <div className="w-1.5 h-32 bg-emerald-500 relative rounded-full"><div className="absolute -top-4 -left-2 border-l-[10px] border-r-[10px] border-b-[20px] border-b-emerald-500 border-x-transparent"></div></div>
            </div>
          </div>
          <p className="text-4xl font-black text-emerald-400">{Math.round(data.qibla)}°</p>
        </div>
      )}

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[380px] bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full p-3 flex justify-around items-center shadow-2xl z-50">
        <button onClick={() => setView('prayers')} className={view === 'prayers' ? "text-emerald-400 bg-white/5 rounded-full p-3" : "text-white/30 p-3"}><Clock size={24} /></button>
        <button onClick={() => setView('tools')} className={view === 'tools' ? "text-emerald-400 bg-white/5 rounded-full p-3" : "text-white/30 p-3"}><ArrowLeftRight size={24} /></button>
        <button onClick={() => setView('qibla')} className={view === 'qibla' ? "text-emerald-400 bg-white/5 rounded-full p-3" : "text-white/30 p-3"}><Compass size={24} /></button>
      </nav>
    </div>
  );
}
