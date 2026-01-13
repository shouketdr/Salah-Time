"use client";

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Coordinates, CalculationMethod, PrayerTimes, Qibla } from 'adhan';
import { Compass, MapPin, Clock, Calculator, Calendar as CalendarIcon, Download, Smartphone, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

export default function SalahApp() {
  const [data, setData] = useState({ times: null, qibla: 0, city: "Jeddah", next: "" });
  const [view, setView] = useState('prayers'); 
  const [heading, setHeading] = useState(0); 
  const [wealth, setWealth] = useState("");
  const [convDate, setConvDate] = useState("");
  const [convertedResult, setConvertedResult] = useState("");
  const [hasPermission, setHasPermission] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [calDate, setCalDate] = useState(new Date());

  // 1. One-Click Install Logic
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') setInstallPrompt(null);
    } else {
      alert("To Install: \n1. Open Safari/Chrome\n2. Tap 'Share' or 'Menu'\n3. Select 'Add to Home Screen'");
    }
  };

  // 2. Compass Sensor
  const startCompass = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      const res = await DeviceOrientationEvent.requestPermission();
      if (res === 'granted') {
        setHasPermission(true);
        window.addEventListener('deviceorientation', (e) => setHeading(e.webkitCompassHeading || 360 - e.alpha), true);
      }
    } else {
      setHasPermission(true);
      window.addEventListener('deviceorientation', (e) => setHeading(360 - e.alpha), true);
    }
  };

  // 3. Hijri Date Helper (Forced to show Rajab, etc.)
  const getHijri = (date) => {
    const f = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', {day:'numeric', month:'long', year:'numeric'});
    return f.formatToParts(date).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords = new Coordinates(pos.coords.latitude, pos.coords.longitude);
        const p = new PrayerTimes(coords, new Date(), CalculationMethod.UmmAlQura());
        setData({ times: p, qibla: Qibla(coords), city: "Jeddah", next: p.nextPrayer() });
      });
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const renderCalendarDays = () => {
    const days = [];
    const tempDate = new Date(calDate);
    tempDate.setDate(1); 
    for (let i = 0; i < 30; i++) {
      const d = new Date(tempDate);
      d.setDate(tempDate.getDate() + i);
      const h = getHijri(d);
      const isToday = d.toDateString() === new Date().toDateString();
      days.push(
        <div key={i} className={`relative aspect-square flex flex-col items-center justify-center rounded-xl border ${isToday ? 'bg-emerald-500 border-emerald-400 text-[#001f3f]' : 'bg-white/5 border-white/10'}`}>
          <span className="text-lg font-black">{h.day}</span>
          <span className={`text-[9px] font-bold opacity-70 ${isToday ? 'text-[#001f3f]' : 'text-emerald-400'}`}>{d.getDate()} {d.toLocaleDateString('en-US', { month: 'short' })}</span>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#001f3f] text-white pb-32 font-sans overflow-hidden">
      <Head>
        <title>Salah Time</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
      </Head>

      {/* INSTALL BAR */}
      <div className="bg-emerald-500 p-4 sticky top-0 z-[100] cursor-pointer" onClick={handleInstall}>
        <span className="text-[#001f3f] font-black text-xs flex justify-center items-center gap-2 uppercase tracking-widest"><Download size={14}/> Install Salah App</span>
      </div>

      {/* PRAYERS VIEW */}
      {view === 'prayers' && (
        <div className="p-6 pt-10">
          <div className="text-center mb-10">
            <h1 className="text-emerald-500 font-black tracking-[0.3em] text-xl mb-6">SALAH TIME</h1>
            <div className="inline-block bg-white/5 px-8 py-3 rounded-full border border-white/10 mb-2 shadow-xl">
              <h2 className="text-2xl font-bold" dir="rtl">{getHijri(new Date()).day} {getHijri(new Date()).month}</h2>
            </div>
            <p className="opacity-40 text-xs font-bold uppercase tracking-widest mt-2">{new Date().toDateString()}</p>
          </div>
          {["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"].map(p => (
            <div key={p} className={`flex justify-between p-5 mb-2 rounded-2xl border ${data.next === p.toLowerCase() ? 'bg-emerald-500 border-emerald-400 text-[#001f3f] shadow-xl' : 'bg-white/5 border-white/10'}`}>
              <span className="font-black uppercase text-xs tracking-widest">{p}</span>
              <span className="font-mono font-bold text-lg">{data.times?.[p.toLowerCase()]?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || "--:--"}</span>
            </div>
          ))}
        </div>
      )}

      {/* CALENDAR VIEW */}
      {view === 'calendar' && (
        <div className="p-6 animate-in slide-in-from-bottom-4">
          <h3 className="text-emerald-400 font-black uppercase tracking-widest text-xs mb-6 flex items-center gap-2"><CalendarIcon size={16}/> Monthly View</h3>
          <div className="bg-white/5 p-5 rounded-[2.5rem] border border-white/10">
            <div className="flex justify-between items-center mb-8">
              <button onClick={()=>setCalDate(new Date(calDate.setMonth(calDate.getMonth()-1)))} className="p-2"><ChevronLeft/></button>
              <div className="text-center">
                <span className="block font-black text-xl text-emerald-400">{getHijri(calDate).month}</span>
                <span className="text-[10px] opacity-40 font-bold uppercase tracking-widest">{getHijri(calDate).year} AH</span>
              </div>
              <button onClick={()=>setCalDate(new Date(calDate.setMonth(calDate.getMonth()+1)))} className="p-2"><ChevronRight/></button>
            </div>
            <div className="grid grid-cols-4 gap-3">{renderCalendarDays()}</div>
          </div>
        </div>
      )}

      {/* TOOLS VIEW */}
      {view === 'tools' && (
        <div className="p-6 space-y-8">
          <section>
            <h3 className="text-emerald-400 font-black uppercase tracking-widest text-xs mb-4 flex items-center gap-2"><Calculator size={16}/> Zakat Calculator</h3>
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10">
              <input type="number" placeholder="Wealth (SAR)" onChange={(e)=>setWealth(e.target.value)} className="w-full bg-white/10 p-5 rounded-2xl outline-none mb-4" />
              <div className="bg-emerald-500 p-5 rounded-2xl flex justify-between items-center text-[#001f3f]">
                <span className="font-black text-[10px] uppercase">Amount:</span>
                <span className="text-3xl font-black">{(wealth * 0.025).toFixed(2)}</span>
              </div>
            </div>
          </section>
          <section>
            <h3 className="text-emerald-400 font-black uppercase tracking-widest text-xs mb-4 flex items-center gap-2"><Clock size={16}/> Date Converter</h3>
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10">
              <input type="date" onChange={(e)=>setConvDate(e.target.value)} className="w-full bg-white/10 p-5 rounded-2xl outline-none mb-4" />
              <button onClick={()=>setConvertedResult(getHijri(new Date(convDate)).day + " " + getHijri(new Date(convDate)).month)} className="w-full bg-white text-[#001f3f] font-black p-4 rounded-2xl uppercase tracking-widest">Convert</button>
              {convertedResult && <p className="mt-6 text-center text-emerald-400 font-black text-2xl" dir="rtl">{convertedResult}</p>}
            </div>
          </section>
        </div>
      )}

      {/* QIBLA VIEW */}
      {view === 'qibla' && (
        <div className="p-10 text-center">
          {!hasPermission ? (
            <button onClick={startCompass} className="bg-emerald-500 text-[#001f3f] font-black p-8 rounded-[2rem] flex items-center gap-4 mx-auto shadow-2xl">
              <Smartphone size={28}/> ENABLE SENSORS
            </button>
          ) : (
            <div className="relative w-80 h-80 mx-auto">
              <div className="absolute inset-0 border-[12px] border-white/5 rounded-full"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-black border-4 border-yellow-600 rounded-2xl flex items-center justify-center z-10 shadow-2xl">
                  <div className="w-full h-2 bg-yellow-600 absolute top-5"></div>
                  <span className="text-[10px] text-yellow-600 mt-6 font-black tracking-widest">KAABA</span>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center transition-transform duration-75" style={{ transform: `rotate(${data.qibla - heading}deg)` }}>
                <div className="w-3 h-36 bg-emerald-500 relative rounded-full -translate-y-16">
                  <div className="absolute -top-8 -left-3 border-l-[18px] border-r-[18px] border-b-[36px] border-b-emerald-400 border-x-transparent shadow-xl"></div>
                </div>
              </div>
            </div>
          )}
          <div className="mt-14 space-y-4">
            <div className="bg-white/5 inline-block px-12 py-4 rounded-full border border-white/10 text-emerald-400 font-black text-4xl shadow-inner">{Math.round(data.qibla)}°</div>
            <a href="https://qiblafinder.withgoogle.com/" target="_blank" className="flex items-center justify-center gap-2 text-white/40 text-[10px] font-bold uppercase">
              <ExternalLink size={12}/> Try Google Qibla Finder
            </a>
          </div>
        </div>
      )}

      {/* NAVIGATION */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] bg-white/10 backdrop-blur-3xl border border-white/20 rounded-full p-2 flex justify-between items-center z-50">
        <button onClick={()=>setView('prayers')} className={`p-4 rounded-full ${view ==='prayers' ? 'bg-emerald-500 text-[#001f3f]' : 'text-white/30'}`}><Clock size={24}/></button>
        <button onClick={()=>setView('calendar')} className={`p-4 rounded-full ${view ==='calendar' ? 'bg-emerald-500 text-[#001f3f]' : 'text-white/30'}`}><CalendarIcon size={24}/></button>
        <button onClick={()=>setView('tools')} className={`p-4 rounded-full ${view ==='tools' ? 'bg-emerald-500 text-[#001f3f]' : 'text-white/30'}`}><Calculator size={24}/></button>
        <button onClick={()=>setView('qibla')} className={`p-4 rounded-full ${view ==='qibla' ? 'bg-emerald-500 text-[#001f3f]' : 'text-white/30'}`}><Compass size={24}/></button>
      </nav>
    </div>
  );
}
