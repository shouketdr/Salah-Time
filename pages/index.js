import React, { useState, useEffect } from 'react';
import { Coordinates, CalculationMethod, PrayerTimes, Qibla } from 'adhan';
import { Compass, MapPin, Calendar as CalIcon, Clock } from 'lucide-react';

export default function ZenMuslim() {
  const [data, setData] = useState({ times: null, qibla: 0, location: "Determining location..." });
  const [dates, setDates] = useState({ greg: "", hijri: "" });

  useEffect(() => {
    // 1. Handle Dates
    const now = new Date();
    const greg = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const hijri = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(now);
    setDates({ greg, hijri });

    // 2. Handle Location & Prayer
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords = new Coordinates(pos.coords.latitude, pos.coords.longitude);
        const params = CalculationMethod.MuslimWorldLeague();
        const pTimes = new PrayerTimes(coords, now, params);
        const qiblaDir = Qibla(coords);

        setData({
          times: pTimes,
          qibla: qiblaDir,
          location: `Near ${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`
        });
      }, () => setData(prev => ({ ...prev, location: "Location Access Denied" })));
    }
  }, []);

  const PrayerRow = ({ name, time, active }) => (
    <div className={`flex justify-between items-center p-5 rounded-2xl mb-2 ${active ? 'bg-emerald-50 border-l-4 border-emerald-500' : 'bg-white'}`}>
      <span className={`text-lg ${active ? 'font-bold text-emerald-700' : 'text-slate-600'}`}>{name}</span>
      <span className="text-lg font-mono text-slate-500">
        {time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
      </span>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 pb-20 font-sans antialiased text-slate-900">
      {/* Header & Calendar */}
      <header className="p-8 pt-12 bg-white rounded-b-[40px] shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-emerald-600">Zen Muslim</h1>
            <div className="flex items-center gap-1 mt-2 text-slate-400">
              <MapPin size={14} />
              <span className="text-xs font-medium uppercase tracking-wider">{data.location}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-800">{dates.hijri}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{dates.greg}</p>
          </div>
        </div>
      </header>

      {/* Qibla Indicator Card */}
      <div className="m-6 p-6 bg-slate-900 rounded-3xl text-white flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 uppercase font-bold mb-1">Qibla Direction</p>
          <p className="text-2xl font-mono">{Math.round(data.qibla)}° <span className="text-sm text-slate-500 text-normal">from North</span></p>
        </div>
        <div className="h-16 w-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Compass className="animate-pulse" />
        </div>
      </div>

      {/* Prayer Times List */}
      <div className="px-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Today's Schedule</h3>
        <PrayerRow name="Fajr" time={data.times?.fajr} />
        <PrayerRow name="Sunrise" time={data.times?.sunrise} />
        <PrayerRow name="Dhuhr" time={data.times?.dhuhr} />
        <PrayerRow name="Asr" time={data.times?.asr} />
        <PrayerRow name="Maghrib" time={data.times?.maghrib} />
        <PrayerRow name="Isha" time={data.times?.isha} />
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-xl border-t border-slate-100 p-4 flex justify-around">
        <Clock className="text-emerald-600" size={24} />
        <CalIcon className="text-slate-300" size={24} />
        <Compass className="text-slate-300" size={24} />
      </nav>
    </div>
  );
}
