// ── Horaires Polyscribe (badge ouvert/fermé + popup horaires d'été) ─────────
// Pour changer les horaires : modifier uniquement EXCEPTIONS ci-dessous,
// puis remplacer ce seul fichier (js/site.js) sur le serveur — aucune autre
// page n'a besoin d'être touchée.
(function(){
  const DEFAULT_H={1:[[510,750],[780,1050]],2:[[510,750],[780,1110]],3:[[510,750],[780,1050]],4:[[510,750],[780,1110]],5:[[510,750],[780,1110]],6:[[540,690]]};

  // Périodes spéciales (remplacent l'horaire habituel pendant ces dates, incluses) :
  const EXCEPTIONS=[
    {start:'2026-06-29',end:'2026-07-12',hours:{1:[[540,750],[780,1020]],2:[[540,750],[780,1020]],3:[[540,750],[780,1020]],4:[[540,750],[780,1020]],5:[[540,750],[780,1020]]},label:'29 juin → 12 juillet',display:'Lun-Ven 9h–12h30 / 13h–17h'},
    {start:'2026-07-13',end:'2026-07-31',hours:{1:[[540,720]],2:[[540,720]],3:[[540,720]],4:[[540,720]],5:[[540,720]]},label:'13 → 31 juillet',display:'Lun-Ven 9h–12h'},
    {start:'2026-08-01',end:'2026-08-19',hours:{},label:'1er → 19 août',display:'Fermeture'},
    {start:'2026-08-20',end:'2026-08-31',hours:{1:[[540,750],[780,900]],2:[[540,750],[780,900]],3:[[540,750],[780,900]],4:[[540,750],[780,900]],5:[[540,750],[780,900]]},label:'20 → 31 août',display:'Lun-Ven 9h–12h30 / 13h–15h'}
  ];
  // Dernier jour où une exception s'applique : le popup ne s'affiche plus après cette date.
  const POPUP_LAST_DAY = EXCEPTIONS[EXCEPTIONS.length-1].end; // '2026-08-31'
  const RESUME_LABEL = '1er septembre'; // reprise des horaires habituels

  const DAYS=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
  const mins=d=>d.getHours()*60+d.getMinutes();
  const fmt=(totalMins)=>{const h=Math.floor(totalMins/60),mn=totalMins%60;return h+'h'+(mn?String(mn).padStart(2,'0'):'');};
  const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');

  const scheduleFor=(date)=>{
    const key=ymd(date);
    for(const ex of EXCEPTIONS){ if(key>=ex.start && key<=ex.end) return ex.hours; }
    return DEFAULT_H;
  };

  const isOpen=()=>{const n=new Date(),h=scheduleFor(n),s=h[n.getDay()];return s&&s.some(([a,b])=>mins(n)>=a&&mins(n)<b);};

  const next=()=>{
    const n=new Date(),now=mins(n);
    const todaySlots=scheduleFor(n)[n.getDay()]||[];
    for(const [a,b] of todaySlots){if(a>now)return `Réouvre aujourd'hui à ${fmt(a)}`;}
    for(let i=1;i<=60;i++){
      const d=new Date(n);d.setDate(n.getDate()+i);
      const slots=scheduleFor(d)[d.getDay()];
      if(slots&&slots.length){
        const label=i===1?'demain':(i<7?DAYS[d.getDay()]:d.getDate()+'/'+String(d.getMonth()+1).padStart(2,'0'));
        return 'Ouvre '+label+' à '+fmt(slots[0][0]);
      }
    }
    return 'Fermé';
  };

  // ── Badge Ouvert/Fermé dans la navbar ──
  const badge=document.getElementById('nav-status'),text=document.getElementById('sb-text');
  if(badge && text){
    if(isOpen()){badge.classList.add('open');text.textContent='Ouvert';}
    else{badge.classList.add('closed');text.textContent='Fermé · '+next();}
  }

  // ── Popup horaires spéciaux (généré à partir de EXCEPTIONS) ──
  const TODAY=ymd(new Date());
  if(TODAY>POPUP_LAST_DAY) return; // plus utile une fois toutes les périodes spéciales passées

  const modal=document.getElementById('summerModal');
  if(!modal) return;
  const body=document.getElementById('summerModalBody');
  if(body){
    let html="<p style=\"margin-top:1rem;\">Polyscribe adapte ses horaires pour l'été :</p>";
    for(const ex of EXCEPTIONS){
      html+=`<div class="hours-row"><span>${ex.label}</span><span>${ex.display}</span></div>`;
    }
    html+=`<p style="margin-top:1rem;font-size:0.9rem;color:var(--text-muted);">Reprise des horaires habituels à partir du ${RESUME_LABEL}. Pour toute urgence, contactez-nous au <span class="reveal-tel" title="Cliquer pour afficher">04&#160;96&#160;10&#160;12&#160;••</span>.</p>`;
    body.innerHTML=html;
  }

  if(localStorage.getItem('ps-summer2026-dismissed')==='1') return;
  setTimeout(()=>modal.classList.add('open'),600);
  const closeBtn=document.getElementById('summerModalClose');
  const dismiss=()=>{modal.classList.remove('open');localStorage.setItem('ps-summer2026-dismissed','1');};
  if(closeBtn) closeBtn.addEventListener('click',dismiss);
  modal.addEventListener('click',e=>{if(e.target===modal)dismiss();});

  // Le binding global ".reveal-tel" tourne avant cette injection HTML, donc on relie
  // manuellement le même comportement (clic -> affiche le numéro complet) ici.
  if(body){
    body.querySelectorAll('.reveal-tel').forEach(function(el){
      el.addEventListener('click',function(){
        this.outerHTML='<a href="tel:+33496101280" style="color:inherit;text-decoration:none;font-weight:inherit;">04 96 10 12 80</a>';
      });
    });
  }
})();
