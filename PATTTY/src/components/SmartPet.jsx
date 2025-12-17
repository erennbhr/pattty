import React, { useEffect, useCallback, useRef } from 'react';
import { useRive, useStateMachineInput, Layout, Fit, Alignment } from '@rive-app/react-canvas';

export default function SmartPet({ 
  riveFile,                     
  moodId = 0,                   
  mainColor = "#9CA3AF",        
  eyeColor = "#FCD34D",         
  onInteract,                   // Callback artık tür (type) alacak: 'meow' veya 'purr'
  className = ""
}) {
  
  // --- RIVE KURULUMU ---
  const { rive, RiveComponent } = useRive({
    src: riveFile,
    stateMachines: 'State Machine 1',
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });

  // --- INPUTLAR ---
  const inputMood = useStateMachineInput(rive, 'State Machine 1', 'MoodID');
  const inputLookX = useStateMachineInput(rive, 'State Machine 1', 'LookX');
  const inputLookY = useStateMachineInput(rive, 'State Machine 1', 'LookY');
  const trigMeow = useStateMachineInput(rive, 'State Machine 1', 'Trig_Meow'); 
  const trigPurr = useStateMachineInput(rive, 'State Machine 1', 'Trig_Purr');

  // --- MOOD & RENK ---
  useEffect(() => {
    if (inputMood) inputMood.value = moodId;
  }, [moodId, inputMood]);

  const applyColor = useCallback((shapeName, hex) => {
    if (!rive || !hex) return;
    const node = rive.artboard.node(shapeName);
    if (node && node.fills && node.fills.length > 0) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      node.fills[0].color = { r, g, b, a: 255 }; 
    }
  }, [rive]);

  useEffect(() => {
    if (!rive) return;
    const parts = ['Obj_Body', 'Obj_Head', 'Obj_Tail', 'Obj_Ear_Back_L', 'Obj_Ear_Back_R', 'Obj_Leg_L', 'Obj_Leg_R'];
    parts.forEach(part => applyColor(part, mainColor));
    applyColor('Obj_Eye_L', eyeColor);
    applyColor('Obj_Eye_R', eyeColor);
  }, [rive, mainColor, eyeColor, applyColor]);

  // --- MOUSE TAKİBİ ---
  const handleMove = (clientX, clientY, currentTarget) => {
    if (!inputLookX || !inputLookY) return;
    const rect = currentTarget.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = 100 - ((clientY - rect.top) / rect.height) * 100;
    inputLookX.value = x;
    inputLookY.value = y;
  };

  // ==========================================
  // 🕒 BASILI TUTMA MANTIĞI (LONG PRESS LOGIC)
  // ==========================================
  const timerRef = useRef(null);
  const isLongPress = useRef(false);

  const handlePointerDown = (e) => {
    // Sağ tık engelle (Telefonda menü açılmasın)
    if (e.button === 2) return;

    isLongPress.current = false; // Sıfırla

    // Zamanlayıcıyı başlat (800ms sonra Purr çalışsın)
    timerRef.current = setTimeout(() => {
      isLongPress.current = true; // Artık uzun basıldı olarak işaretle
      
      // Mırlamayı Tetikle
      if (trigPurr) trigPurr.fire();
      if (onInteract) onInteract('purr'); // Üst bileşene "purr" sesi çal de
      
      // Titreşim (Haptics) ekleyebilirsin (Mobilde güzel hissettirir)
      if (navigator.vibrate) navigator.vibrate(50);

    }, 800); // <-- Süre: 800 milisaniye basılı tutulursa
  };

  const handlePointerUp = () => {
    // Parmağını çektiğinde zamanlayıcıyı iptal et
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Eğer uzun basılmadıysa (Süre dolmadan çektim) -> MIYAVLA
    if (!isLongPress.current) {
      if (trigMeow) trigMeow.fire();
      if (onInteract) onInteract('meow'); // Üst bileşene "meow" sesi çal de
    }
  };

  const handlePointerLeave = () => {
    // Parmağı ekrandan kaydırırsa işlemi iptal et
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <div 
      className={`w-full h-full select-none ${className}`} // select-none önemli: Metin seçilmesin
      onMouseMove={(e) => handleMove(e.clientX, e.clientY, e.currentTarget)}
      onTouchMove={(e) => {
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY, e.currentTarget);
      }}
      // --- YENİ EVENTLER ---
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onContextMenu={(e) => e.preventDefault()} // Sağ tık menüsünü engelle
    >
      <RiveComponent className="w-full h-full pointer-events-none" /> 
      {/* pointer-events-none Rive'a verdik ki div eventleri alsın */}
    </div>
  );
}