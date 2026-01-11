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

  const formatHijriArabic = (date) => {
    const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    const parts = formatter.formatToParts(date);
    return `${parts.find(p => p.type === 'day').value} / ${parts.find(p => p.type === 'month').value} / ${parts.find(p => p.type === 'year').value}`;
  };

  // Request Compass Permission (iOS)
  const requestPermission = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        if (response === 'granted') {
          setHasPermission(true);
          window.addEventListener('deviceorientation', handleOrientation, true);
        }
      } catch (e) { console.error(e); }
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
        setData(prev => ({ ...prev, times: pTimes, qibla: Qibla(coords), next: pTimes.nextPrayer() }));
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const geoData = await res.json();
          setData(prev => ({ ...prev, city: geoData.address.city || "Jeddah" }));
        } catch (e) {}
      });
    }
  }, []);

  const PrayerRow = ({ name, time, id }) => {
    const isNext = data.next === id;
    return (
      <div className={`flex justify-between items-center p-5 mx-4 mb-2 rounded-2xl border transition-all ${isNext ? 'bg-emerald-500 border-emerald-400 shadow-lg scale-[1.02]' : 'bg-white/5 border-white/10'}`}>
        <span className={`text-lg font-bold ${isNext ? 'text-[#001f3f]' : 'text-white/90'}`}>{name}</span>
        <span className={`text-lg font-mono ${isNext ? 'text-[#001f3f]' : 'text-emerald-400'}`}>
          {time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
        </span>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#001f3f] text-white pb-28 relative font-sans select-none touch-none">
      <Head>
        <title>Salah Time</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>
      
      <div className="pt-14 px-8 text-center">
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
            {["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"].map(p => (
              <PrayerRow key={p} name={p} time={data.times?.[p.toLowerCase()]} id={p.toLowerCase()} />
            ))}
          </div>
        </>
      )}

      {view === 'qibla' && (
        <div className="p-8 text-center animate-in zoom-in-95 duration-300">
          <h2 className="text-2xl font-bold mb-8 uppercase tracking-widest text-emerald-500">Qibla</h2>
          {!hasPermission ? (
            <button onClick={requestPermission} className="bg-emerald-500 text-[#001f3f] font-bold px-6 py-4 rounded-2xl flex items-center gap-2 mx-auto mb-10 shadow-lg">
              <Smartphone size={20} /> Enable Compass
            </button>
          ) : (
            <div className="relative w-64 h-64 mx-auto mb-10">
              <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
              <div className="absolute inset-0 flex items-center justify-center transition-transform duration-200" style={{ transform: `rotate(${data.qibla - heading}deg)` }}>
                <div className="w-2 h-32 bg-emerald-500 relative rounded-full">
                  <div className="absolute -top-4 -left-2 border-l-[12px] border-r-[12px] border-b-[24px] border-b-emerald-500 border-x-transparent"></div>
                </div>
              </div>
            </div>
          )}
          <p className="text-4xl font-black text-emerald-400">{Math.round(data.qibla)}°</p>
        </div>
      )}

      {view === 'tools' && (
        <div className="p-6 space-y-8">
           <section>
            <h2 className="text-xl font-bold mb-4 text-emerald-400 italic">Date Converter</h2>
            <div className="bg-white/5 p-5 rounded-3xl border border-white/10">
              <input type="date" onChange={(e) => setConvDate(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white mb-4" />
              <button onClick={() => setConvertedResult(formatHijriArabic(new Date(convDate)))} className="w-full bg-white text-[#001f3f] font-black p-4 rounded-xl uppercase tracking-tighter">Convert</button>
              {convertedResult && <div className="mt-4 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-center"><p className="text-emerald-400 font-black text-xl" dir="rtl">{convertedResult}</p></div>}
            </div>
          </section>
        </div>
      )}

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[380px] bg-white/10 backdrop-blur-3xl border border-white/20 rounded-full p-3 flex justify-around items-center shadow-2xl z-50">
        <button onClick={() => setView('prayers')} className={view === 'prayers' ? "text-emerald-400 bg-white/5 rounded-full p-3" : "text-white/30 p-3"}><Clock size={24} /></button>
        <button onClick={() => setView('tools')} className={view === 'tools' ? "text-emerald-400 bg-white/5 rounded-full p-3" : "text-white/30 p-3"}><ArrowLeftRight size={24} /></button>
        <button onClick={() => setView('qibla')} className={view === 'qibla' ? "text-emerald-400 bg-white/5 rounded-full p-3" : "text-white/30 p-3"}><Compass size={24} /></button>
      </nav>
    </div>
  );
}
