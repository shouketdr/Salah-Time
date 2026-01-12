import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { Coordinates, CalculationMethod, PrayerTimes, Qibla } from 'adhan';
import { Compass, MapPin, Clock, Calculator, ArrowLeftRight, Smartphone, Download, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ZenMuslim() {
  const [data, setData] = useState({ times: null, qibla: 0, city: "Jeddah", next: "" });
  const [view, setView] = useState('prayers'); 
  const [heading, setHeading] = useState(0); 
  const [wealth, setWealth] = useState("");
  const [hasPermission, setHasPermission] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  
  // Calendar State
  const [calendarDate, setCalendarDate] = useState(new Date());

  // 1. Install Logic (One-Click)
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  // 2. Real-Time Compass Logic
  const requestPermission = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      const res = await DeviceOrientationEvent.requestPermission();
      if (res === 'granted') {
        setHasPermission(true);
        window.addEventListener('deviceorientation', (e) => {
          const h = e.webkitCompassHeading || (360 - e.alpha);
          setHeading(h);
        }, true);
      }
    } else {
      setHasPermission(true);
      window.addEventListener('deviceorientation', (e) => {
        setHeading(e.alpha ? 360 - e.alpha : 0);
      }, true);
    }
  };

  // 3. Hijri Date Formatter
  const getHijriParts = (date) => {
    const f = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {day:'numeric', month:'long', year:'numeric'});
    return f.formatToParts(date).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});
  };

  useEffect(() => {
    const now = new Date();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const coords = new Coordinates(lat, lon);
        const pTimes = new PrayerTimes(coords, now, CalculationMethod.UmmAlQura());
        setData({ times: pTimes, qibla: Qibla(coords), city: "Jeddah", next: pTimes.nextPrayer() });
      });
    }
  }, []);

  // 4. Monthly Hijri View Generator
  const renderMonthlyCalendar = () => {
    const parts = getHijriParts(calendarDate);
    const days = Array.from({ length: 30 }, (_, i) => i + 1); // Basic 30-day lunar grid
    return (
      <div className="bg-white/5 p-4 rounded-3xl border border-white/10 mt-4">
        <div className="flex justify-between items-center mb-4 px-2">
          <button onClick={() => setCalendarDate(new Date(calendarDate.setMonth(calendarDate.getMonth()-1)))}><ChevronLeft/></button>
          <span className="font-bold text-emerald-400">{parts.month} {parts.year}</span>
          <button onClick={() => setCalendarDate(new Date(calendarDate.setMonth(calendarDate.getMonth()+1)))}><ChevronRight/></button>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center text-[10px] opacity-40 mb-2 uppercase tracking-tighter">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map(d => (
            <div key={d} className={`p-2 rounded-lg text-sm font-bold ${d === parseInt(parts.day) ? 'bg-emerald-500 text-[#001f3f]' : 'bg-white/5'}`}>
              {d}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#001f3f] text-white pb-32 font-sans select-none overflow-hidden">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
      </Head>

      {/* Install Button Header */}
      {deferredPrompt && (
        <button onClick={handleInstallClick} className="w-full bg-emerald-500 p-2 text-[10px] font-bold text-[#001f3f] flex items-center justify-center gap-2">
          <Download size={14}/> INSTALL APP FOR FULL SCREEN
        </button>
      )}

      {view === 'prayers' && (
        <div className="p-6 pt-10 animate-in fade-in duration-500">
          <div className="text-center mb-10">
            <h1 className="text-emerald-500 font-black text-2xl tracking-[0.2em] mb-4">SALAH TIME</h1>
            <div className="flex justify-center items-center gap-2 opacity-60 text-xs mb-2">
              <MapPin size={12}/> {data.city}
            </div>
            <h2 className="text-3xl font-bold" dir="rtl">{getHijriParts(new Date()).day} {getHijriParts(new Date()).month}</h2>
          </div>
          
          {["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"].map(p => {
            const isNext = data.next === p.toLowerCase();
            return (
              <div key={p} className={`flex justify-between p-5 mb-2 rounded-2xl border ${isNext ? 'bg-emerald-500 border-emerald-400 text-[#001f3f]' : 'bg-white/5 border-white/10'}`}>
                <span className="font-bold">{p}</span>
                <span className="font-mono">{data.times?.[p.toLowerCase()]?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || "--:--"}</span>
              </div>
            );
          })}
        </div>
      )}

      {view === 'tools' && (
        <div className="p-6 space-y-6">
          <h2 className="text-xl font-bold text-emerald-400 italic">Islamic Calendar</h2>
          {renderMonthlyCalendar()}
          
          <h2 className="text-xl font-bold text-emerald-400 italic mt-8">Zakat Calculator</h2>
          <div className="bg-white/5 p-5 rounded-3xl border border-white/10">
            <input type="number" value={wealth} onChange={(e) => setWealth(e.target.value)} placeholder="Total Wealth (SAR)" className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white outline-none mb-4" />
            <div className="bg-emerald-500 text-[#001f3f] p-4 rounded-xl flex justify-between items-center">
              <span className="font-bold text-xs uppercase">Zakat Due (2.5%):</span>
              <span className="text-2xl font-black">{(wealth * 0.025).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {view === 'qibla' && (
        <div className="p-8 text-center animate-in zoom-in-95">
          <h2 className="text-2xl font-bold mb-10 text-emerald-500 uppercase tracking-widest">Qibla</h2>
          {!hasPermission ? (
            <button onClick={requestPermission} className="bg-emerald-500 text-[#001f3f] font-bold px-8 py-5 rounded-2xl flex items-center gap-3 mx-auto shadow-xl">
              <Smartphone size={24} /> Enable Live Direction
            </button>
          ) : (
            <div className="relative w-72 h-72 mx-auto">
              <div className="absolute inset-0 border-[8px] border-white/5 rounded-full"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 bg-black border-2 border-yellow-600 rounded-md z-10 flex items-center justify-center">
                  <div className="w-full h-1 bg-yellow-600 absolute top-3"></div>
                  <span className="text-[7px] text-yellow-600 mt-4">KAABA</span>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center transition-transform duration-75" 
                   style={{ transform: `rotate(${data.qibla - heading}deg)` }}>
                <div className="w-2.5 h-32 bg-emerald-500 relative rounded-full -translate-y-16">
                  <div className="absolute -top-6 -left-2.5 border-l-[14px] border-r-[14px] border-b-[28px] border-b-emerald-400 border-x-transparent shadow-lg"></div>
                </div>
              </div>
            </div>
          )}
          <div className="mt-10 bg-white/5 inline-block px-10 py-4 rounded-full border border-white/10 font-black text-emerald-400 text-3xl">
            {Math.round(data.qibla)}°
          </div>
        </div>
      )}

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] bg-white/10 backdrop-blur-3xl border border-white/20 rounded-full p-2 flex justify-around items-center z-50">
        <button onClick={() => setView('prayers')} className={`p-4 rounded-full ${view === 'prayers' ? 'bg-white/10 text-emerald-400' : 'text-white/30'}`}><Clock/></button>
        <button onClick={() => setView('tools')} className={`p-4 rounded-full ${view === 'tools' ? 'bg-white/10 text-emerald-400' : 'text-white/30'}`}><ArrowLeftRight/></button>
        <button onClick={() => setView('qibla')} className={`p-4 rounded-full ${view === 'qibla' ? 'bg-white/10 text-emerald-400' : 'text-white/30'}`}><Compass/></button>
      </nav>
    </div>
  );
}
