useEffect(() => {
    // 1. Register Service Worker for Offline & Install
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('SW Registered'))
          .catch(err => console.log('SW Failed', err));
      });
    }

    // 2. Capture the Install Prompt
    const handlePrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e); // This shows your "Install" bar in the UI
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);

    // 3. Get Location & Times
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords = new Coordinates(pos.coords.latitude, pos.coords.longitude);
        const p = new PrayerTimes(coords, new Date(), CalculationMethod.UmmAlQura());
        setData({ times: p, qibla: Qibla(coords), city: "Jeddah", next: p.nextPrayer() });
      });
    }

    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);
