import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Coordinates, CalculationMethod, PrayerTimes, Qibla } from 'adhan';
import { Compass, MapPin, Clock, Calculator, ArrowLeftRight, Smartphone } from 'lucide-react';

export default function ZenMuslim() {
  const [data, setData] = useState({ times: null, qibla: 0, city: "Jeddah", next: "" });
  const [dates, setDates] = useState({ greg: "", hijri: "" });
  const [view, setView] = useState('prayers'); 
  const [heading, setHeading] = useState(0); 
  const [wealth, setWealth] = useState("");
  const [convDate, setConvDate] = useState("");
  const [convertedResult, setConvertedResult] = useState("");
  const [hasPermission, setHasPermission] = useState(false);

  // 1. Strict Arabic Hijri Formatting (Day / Month / Year)
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

  // 2. Compass Permission & Logic
  const requestPermission = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        if (response === 'granted') {
          setHasPermission(true);
          window.addEventListener('deviceorientation', handleOrientation, true);
        }
      } catch (e) { console.error("Permission denied"); }
    } else {
      setHasPermission(true);
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
  };

  const handleOrientation = (e) => {
    const compass = e.webkitCompassHeading || (360 - e.alpha);
    if (compass) setHeading(compass);
  };

  useEffect(() => {
    const now = new Date();

    // Register Service Worker for Mobile Installation
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

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
        } catch (e) {}
      });
    }

    return () => window.removeEventListener('deviceorientation', handleOrientation);
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
    <div className="max-w-md mx-auto min-h-screen bg-[#001f3f] text-white pb-32 relative font-sans overflow-x-hidden select-none">
      <Head>
        <title>Salah Time</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      
      {/* APP HEADER */}
      <div className="pt-14 px-8 text-center">
         <h1 className="text-emerald-500 font-black text-2xl uppercase tracking-[0.2em]">Salah Time</h1>
      </div>

      {/* VIEW 1: PRAYER TIMES */}
      {view === 'prayers' && (
        <div className="animate-in fade-in duration-500">
          <header className="p-6 text-center">
            <div className="flex justify-center items-center gap-2 text-white/60 mb-3">
              <MapPin size={14} className="text-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-widest">{data.city}</span>
            </div>
            <h2 className="text-3xl font-bold mb-1 tracking-tight" dir="rtl">{dates.hijri}</h2>
            <p className="opacity-40 text-xs font-medium">{dates.greg}</p>
          </header>

          <div className="space-y-1 mt-4">
            {["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"].map(p => (
              <PrayerRow key={p} name={p} time={data.times?.[p.toLowerCase()]} id={p.toLowerCase()} />
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: TOOLS (CALENDAR & ZAKAT) */}
      {view === 'tools' && (
        <div className="p-6 space-y-8 animate-in slide-in-from-bottom-4 duration-300">
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-emerald-400 italic">
              <ArrowLeftRight size={20}/> Hijri Converter
            </h2>
            <div className="bg-white/5 p-5 rounded-3xl border border-white/10">
              <input type="date" onChange={(e) => setConvDate(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white mb-4 outline-none" />
              <button onClick={() => setConvertedResult(formatHijriArabic(new Date(convDate)))} className="w-full bg-white text-[#001f3f] font-black p-4 rounded-xl uppercase active:scale-95 transition-transform">Convert Date</button>
              {convertedResult && <div className="mt-4 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-center"><p className="text-emerald-400 font-black text-xl" dir="rtl">{convertedResult}</p></div>}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-emerald-400 italic">
              <Calculator size={20}/> Zakat Calculator
            </h2>
            <div className="bg-white/5 p-5 rounded-3xl border border-white/10">
              <input type="number" value={wealth} onChange={(e) => setWealth(e.target.value)} placeholder="Total Wealth (SAR)" className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white outline-none mb-4" />
              <div className="bg-emerald-500 text-[#001f3f] p-4 rounded-xl flex justify-between items-center">
                <span className="font-bold uppercase text-xs tracking-wider opacity-70">Zakat Due:</span>
                <span className="text-2xl font-black">{(wealth * 0.025).toFixed(2)}</span>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* VIEW 3: QIBLA */}
      {view === 'qibla' && (
        <div className="p-8 text-center animate-in zoom-in-95 duration-300">
          <h2 className="text-2xl font-bold mb-8 uppercase tracking-widest text-emerald-500">Qibla</h2>
          {!hasPermission ? (
             <button onClick={requestPermission} className="bg-emerald-500 text-[#001f3f] font-bold px-8 py-5 rounded-2xl flex items-center gap-3 mx-auto mb-10 shadow-xl active:scale-95 transition-all">
              <Smartphone size={24} /> Enable Live Compass
            </button>
          ) : (
            <div className="relative w-72 h-72 mx-auto mb-10">
              <div className="absolute inset-0 border-[8px] border-white/5 rounded-full"></div>
              
              {/* Center Kaaba Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 bg-black border-2 border-yellow-600 rounded-md flex flex-col items-center justify-center z-10 shadow-2xl">
                    <div className="w-full h-1.5 bg-yellow-600 absolute top-3"></div>
                    <span className="text-[8px] text-yellow-600 font-bold mt-3">KAABA</span>
                </div>
              </div>

              {/* Rotating Needle */}
              <div className="absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-out" 
                   style={{ transform: `rotate(${data.qibla - heading}deg)` }}>
                <div className="w-2.5 h-32 bg-emerald-500 relative rounded-full -translate-y-16">
                  <div className="absolute -top-6 -left-2.5 border-l-[14px] border-r-[14px] border-b-[28px] border-b-emerald-400 border-x-transparent shadow-emerald-500/40 shadow-lg"></div>
                </div>
              </div>
            </div>
          )}
          <div className="bg-white/5 inline-block px-10 py-4 rounded-full border border-white/10">
            <p className="text-4xl font-black text-emerald-400 tracking-tighter">{Math.round(data.qibla)}°</p>
          </div>
        </div>
      )}

      {/* NAVIGATION BAR */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-[400px] bg-white/10 backdrop-blur-3xl border border-white/20 rounded-full p-3 flex justify-around items-center shadow-2xl z-50">
        <button onClick={() => setView('prayers')} className={view === 'prayers' ? "text-emerald-400 bg-white/10 rounded-full p-4" : "text-white/30 p-4"}><Clock size={28} /></button>
        <button onClick={() => setView('tools')} className={view === 'tools' ? "text-emerald-400 bg-white/10 rounded-full p-4" : "text-white/30 p-4"}><ArrowLeftRight size={28} /></button>
        <button onClick={() => setView('qibla')} className={view === 'qibla' ? "text-emerald-400 bg-white/10 rounded-full p-4" : "text-white/30 p-4"}><Compass size={28} /></button>
      </nav>
    </div>
  );
}
