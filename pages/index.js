import React, { useState, useEffect } from 'react';
import { Coordinates, CalculationMethod, PrayerTimes, Qibla } from 'adhan';
import { Compass, MapPin, Calendar as CalIcon, Clock, X } from 'lucide-react';

export default function ZenMuslim() {
  const [data, setData] = useState({ times: null, qibla: 0, city: "Jeddah" });
  const [dates, setDates] = useState({ greg: "", hijri: "" });
  const [view, setView] = useState('prayers'); // 'prayers' or 'calendar'

  useEffect(() => {
    const now = new Date();
    
    // Umm al-Qura Calendar Formatting
    const hijriFormatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    
    setDates({
      greg: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      hijri: hijriFormatter.format(now)
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const coords = new Coordinates(lat, lon);
        const params = CalculationMethod.MuslimWorldLeague();
        const pTimes = new PrayerTimes(coords, now, params);
        
        setData({ 
          times: pTimes, 
          qibla: Qibla(coords), 
          city: "Detecting City..." 
        });

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const geoData = await res.json();
          setData(prev => ({ ...prev, city: geoData.address.city || geoData.address.town || "My Location" }));
        } catch (e) {
          setData(prev => ({ ...prev, city: "Jeddah" }));
        }
      });
    }
  }, []);

  const PrayerRow = ({ name, time }) => (
    <div className="flex justify-between items-center p-5 mx-4 mb-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
      <span className="text-lg font-medium text-white/90">{name}</span>
      <span className="text-lg font-mono text-emerald-400">
        {time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
      </span>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#001f3f] text-white pb-24 relative font-sans">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/mosque-ad-din.png')]"></div>

      {/* Main Prayer View */}
      {view === 'prayers' && (
        <>
          <header className="p-8 text-center relative">
            <div className="flex justify-center items-center gap-2 text-emerald-400 mb-1">
              <MapPin size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">{data.city}</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">{dates.hijri}</h1>
            <p className="opacity-60 text-sm italic">{dates.greg}</p>
          </header>

          <div className="px-6 py-4">
            <div className="bg-emerald-500 p-4 rounded-2xl flex justify-between items-center mb-8 shadow-lg shadow-emerald-500/20">
              <div>
                <p className="text-xs font-bold text-emerald-900 uppercase">Qibla Direction</p>
                <p className="text-2xl font-black text-[#001f3f]">{Math.round(data.qibla)}° North</p>
              </div>
              <Compass size={32} className="text-[#001f3f]" />
            </div>

            <div className="space-y-1">
              <PrayerRow name="Fajr" time={data.times?.fajr} />
              <PrayerRow name="Sunrise" time={data.times?.sunrise} />
              <PrayerRow name="Dhuhr" time={data.times?.dhuhr} />
              <PrayerRow name="Asr" time={data.times?.asr} />
              <PrayerRow name="Maghrib" time={data.times?.maghrib} />
              <PrayerRow name="Isha" time={data.times?.isha} />
            </div>
          </>
        )}

      {/* Umm Al-Qura Calendar View */}
      {view === 'calendar' && (
        <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-bold">Islamic Calendar</h2>
            <button onClick={() => setView('prayers')} className="p-2 bg-white/10 rounded-full">
              <X size={20} />
            </button>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 text-center space-y-6">
            <div className="inline-block p-4 bg-emerald-500/20 rounded-full mb-2">
              <CalIcon className="text-emerald-400" size={40} />
            </div>
            <div>
              <p className="text-emerald-400 font-bold text-3xl mb-2">{dates.hijri}</p>
              <p className="text-xs uppercase tracking-[0.2em] opacity-50">Umm Al-Qura Standard</p>
            </div>
            <div className="h-px bg-white/10 w-full" />
            <div>
              <p className="text-xl font-medium">{dates.greg}</p>
              <p className="text-xs uppercase tracking-[0.2em] opacity-50">Gregorian Date</p>
            </div>
          </div>
          
          <p className="mt-8 text-center text-sm opacity-40 leading-relaxed px-4">
            This date is calculated using the official Umm al-Qura sighting standards of Saudi Arabia.
          </p>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[350px] bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full p-4 flex justify-around items-center shadow-2xl">
        <button onClick={() => setView('prayers')} className={view === 'prayers' ? "text-emerald-400" : "text-white/40"}>
          <Clock size={24} />
        </button>
        <button onClick={() => setView('calendar')} className={view === 'calendar' ? "text-emerald-400" : "text-white/40"}>
          <CalIcon size={24} />
        </button>
        <div className="h-6 w-px bg-white/10" />
        <div className="flex flex-col items-center">
          <Compass size={24} className="text-white/20" />
        </div>
      </nav>
    </div>
  );
}
