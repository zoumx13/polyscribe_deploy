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

// ── E-mail : adresse assemblée au clic (absente du code de la page) ─────
// Téléphone : ouverture directe (le téléphone propose lui-même Gmail, Outlook…)
// Ordinateur : 1er clic = l'adresse s'affiche dans le bouton ET est copiée ;
//              2e clic  = ouverture du logiciel de messagerie par défaut
(function(){
  function addr(a){return a.getAttribute('data-u')+'@'+a.getAttribute('data-d');}
  function isDesktop(){return window.matchMedia&&window.matchMedia('(hover: hover) and (pointer: fine)').matches;}
  function openMail(a){window.location.href='mai'+'lto:'+addr(a)+(a.getAttribute('data-q')||'');}
  function label(a){
    var sp=a.querySelector('span');if(sp)return sp;
    sp=document.createElement('span');
    Array.prototype.slice.call(a.childNodes).forEach(function(n){if(n.nodeType===3&&n.textContent.trim()){a.removeChild(n);}});
    a.appendChild(document.createTextNode(' '));a.appendChild(sp);return sp;
  }
  function copy(t,ok){
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(ok,function(){});return;}
    var ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';
    document.body.appendChild(ta);ta.select();try{if(document.execCommand('copy'))ok();}catch(e){}ta.remove();
  }
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[data-u][data-d]');
    if(!a)return;
    e.preventDefault();
    if(!isDesktop()||a.getAttribute('data-revealed')){openMail(a);return;}
    var to=addr(a),sp=label(a);
    a.setAttribute('data-revealed','1');
    a.setAttribute('title','Cliquer à nouveau pour ouvrir votre messagerie');
    sp.style.textTransform='none';sp.style.letterSpacing='normal';sp.style.borderBottom='none';sp.removeAttribute('title');
    sp.textContent=to;
    copy(to,function(){
      sp.textContent=to+' — copiée ✓';
      setTimeout(function(){sp.textContent=to;},2500);
    });
  });
})();

// ── Grilles de cartes équilibrées (PC / tablette) ─────────────────────────
// Ex. 6 cartes sur 4 colonnes (4+2) → 3+3 ; 5 cartes → 3+2 centré ; dernière ligne toujours centrée
(function(){
  var SEL='.lp-services-grid,.lp-why-grid,.campus-grid,.pricing-grid,.steps-grid,.pain-grid,.profil-cards,.audience-cards,.geo-grid';
  function reset(g){
    g.style.display='';g.style.flexWrap='';g.style.justifyContent='';
    Array.prototype.forEach.call(g.children,function(k){k.style.flex='';k.style.maxWidth='';});
  }
  function balance(){
    document.querySelectorAll(SEL).forEach(function(g){
      reset(g);
      if(window.innerWidth<=768)return;
      var kids=Array.prototype.filter.call(g.children,function(k){return k.offsetWidth>0;});
      var n=kids.length;if(n<3)return;
      var top=kids[0].offsetTop,c=0;
      for(var i=0;i<n;i++){if(Math.abs(kids[i].offsetTop-top)<5)c++;else break;}
      if(c>=n||c<1)return;
      var rows=Math.ceil(n/c),cols=Math.ceil(n/rows);
      if(n%cols===0&&cols===c)return;           // déjà équilibré
      var gap=getComputedStyle(g).columnGap;if(!gap||gap==='normal')gap='0px';
      g.style.display='flex';g.style.flexWrap='wrap';g.style.justifyContent='center';
      kids.forEach(function(k){
        var w='calc((100% - '+(cols-1)+' * '+gap+') / '+cols+')';
        k.style.flex='0 0 '+w;k.style.maxWidth=w;
      });
    });
  }
  // Rangées de boutons / étiquettes (largeurs variables) : on limite la largeur du bloc
  // pour obtenir des lignes équilibrées (ex. 3+1 → 2+2, 7+3 → 5+5), le tout centré.
  var SEL2='.lp-hero-cta,.lp-cta-group,.bde-list,.urgence-items,.trust-inner';
  function rowsOf(kids){var r=[],top=null;kids.forEach(function(k){var t=k.offsetTop;if(top===null||Math.abs(t-top)>5){r.push(0);top=t;}r[r.length-1]++;});return r;}
  function balanceRows(){
    document.querySelectorAll(SEL2).forEach(function(g){
      g.style.maxWidth='';g.style.marginLeft='';g.style.marginRight='';g.style.justifyContent='center';
      var kids=Array.prototype.filter.call(g.children,function(k){return k.offsetWidth>0;});
      var n=kids.length;if(n<3)return;
      var before=rowsOf(kids);if(before.length<2)return;
      var r=before.length,per=Math.ceil(n/r);
      if(before[r-1]>=per-1&&before[0]-before[r-1]<=1)return;   // déjà équilibré
      var gap=parseFloat(getComputedStyle(g).columnGap)||0,w=0;
      for(var i=0;i<n;i+=per){
        var sum=0,cnt=0;
        for(var j=i;j<Math.min(i+per,n);j++){var cs=getComputedStyle(kids[j]);sum+=kids[j].getBoundingClientRect().width+parseFloat(cs.marginLeft)+parseFloat(cs.marginRight);cnt++;}
        w=Math.max(w,sum+gap*(cnt-1));
      }
      var pad=parseFloat(getComputedStyle(g).paddingLeft)+parseFloat(getComputedStyle(g).paddingRight);
      g.style.maxWidth=Math.ceil(w+pad+2)+'px';g.style.marginLeft='auto';g.style.marginRight='auto';
      var after=rowsOf(kids);
      if(after.length!==r||after[after.length-1]<before[r-1]){g.style.maxWidth='';g.style.marginLeft='';g.style.marginRight='';}
    });
  }
  var t;window.addEventListener('resize',function(){clearTimeout(t);t=setTimeout(function(){balance();balanceRows();},120);});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',balanceRows);else balanceRows();
  window.addEventListener('load',balanceRows);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',balance);else balance();
  window.addEventListener('load',balance);
})();
