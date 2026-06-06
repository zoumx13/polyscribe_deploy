import gulp from 'gulp';
import sharp from 'sharp';
import path from 'path';
import * as sass from 'sass';
import gulpSass from 'gulp-sass';
import browserSync from 'browser-sync';
import uglify from 'gulp-uglify';
import concat from 'gulp-concat';
import rename from 'gulp-rename';
import autoprefixer from 'gulp-autoprefixer';
import cleanCSS from 'gulp-clean-css';
import fs from 'fs';

// Configurez gulp-sass pour utiliser dart-sass
const sassCompiler = gulpSass(sass);

// Créez une instance de browserSync
const bs = browserSync.create();

// Compile SCSS into CSS
gulp.task('scss', function() {
  console.log('Running SCSS task');
  return gulp.src('./scss/*.scss')
    .pipe(sassCompiler().on('error', sassCompiler.logError))
    .pipe(autoprefixer({
      overrideBrowserslist: ['last 2 versions'],
      cascade: false
    }))
    .pipe(gulp.dest('./css'))
    .pipe(cleanCSS())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('./css'))
    .pipe(bs.stream());
});

// Copy CSS files to dist
gulp.task('css', function() {
  console.log('Running CSS task');
  return gulp.src('./css/*.css')
    .pipe(gulp.dest('./dist/css'))
    .pipe(bs.stream());
});

// Minify and concatenate JS
gulp.task('js', function() {
  console.log('Running JS task');
  return gulp.src('./js/*.js')
    .pipe(concat('main.js'))
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('./dist/js'))
    .pipe(bs.stream());
});

// Copy HTML files to dist
gulp.task('html', function() {
  console.log('Running HTML task');
  return gulp.src('./*.html')
    .pipe(gulp.dest('./dist'))
    .pipe(bs.stream());
});

// Copy vendor files to dist
gulp.task('vendor', function() {
  console.log('Running Vendor task');
  return gulp.src('./vendor/**/*')
    .pipe(gulp.dest('./dist/vendor'))
    .pipe(bs.stream());
});

// Copy image files to dist
gulp.task('images', function() {
  console.log('Running Images task');
  return gulp.src('./img/**/*')
    .pipe(gulp.dest('./dist/img'))
    .pipe(bs.stream());
});

// Générer sitemap.xml dynamiquement avec la date du jour
gulp.task('seo', function(done) {
  const fs2 = fs;
  const today = new Date().toISOString().split('T')[0];
  
  const pages = [
    {url:'',         freq:'weekly',  prio:'1.0'},
    {url:'etudiants.html',                          freq:'monthly', prio:'0.9'},
    {url:'impression-memoire-marseille.html',        freq:'monthly', prio:'0.9'},
    {url:'plans-architecte-marseille.html',          freq:'monthly', prio:'0.85'},
    {url:'externalisation-impression-marseille.html',freq:'monthly', prio:'0.85'},
    {url:'reprographie-marseille.html',              freq:'monthly', prio:'0.8'},
    {url:'impression-affiche-marseille.html',        freq:'monthly', prio:'0.75'},
    {url:'impression-flyer-marseille.html',          freq:'monthly', prio:'0.75'},
    {url:'location-salle-marseille.html',            freq:'monthly', prio:'0.7'},
    {url:'architectes.html',                         freq:'monthly', prio:'0.7'},
    {url:'avocats.html',                             freq:'monthly', prio:'0.65'},
    {url:'associations.html',                        freq:'monthly', prio:'0.65'},
    {url:'autoentrepreneurs.html',                   freq:'monthly', prio:'0.65'},
  ];

  const BASE = 'https://www.polyscribe.fr/';
  const urls = pages.map(p => `  <url>
    <loc>${BASE}${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.freq}</changefreq>
    <priority>${p.prio}</priority>
  </url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;

  fs2.writeFileSync('./dist/sitemap.xml', xml);
  fs2.copyFileSync('./robots.txt', './dist/robots.txt');
  console.log('SEO files generated with date: ' + today);
  done();
});


// ── Optimisation et redimensionnement images galerie ───────────────────────
// Dimensions d'affichage max dans la page :
// gallery images : ~600px desktop / ~full width mobile → on génère 900px max
// Logo : affiché à 260px → on génère 520px (2x pour retina)
const IMAGE_TARGETS = {
  'img/gallery/photo1.webp': { width: 900, quality: 82 },
  'img/gallery/photo2.webp': { width: 900, quality: 82 },
  'img/gallery/photo3.webp': { width: 900, quality: 82 },
  'img/gallery/photo4.webp': { width: 900, quality: 82 },
  'img/gallery/photo5.webp': { width: 900, quality: 82 },
  'img/gallery/photo6.webp': { width: 900, quality: 82 },
  'img/Logo.webp':            { width: 520, quality: 88 },
  'img/header.jpg':           { width: 1440, quality: 80 },
};

gulp.task('images:optimize', async function() {
  const jobs = Object.entries(IMAGE_TARGETS).map(async ([src, opts]) => {
    const srcPath = `./${src}`;
    const distPath = `./dist/${src}`;
    try {
      const info = await sharp(srcPath).metadata();
      // Ne redimensionner que si l'image est plus grande que la cible
      const resizeOpts = info.width > opts.width ? { width: opts.width } : {};
      await sharp(srcPath)
        .resize(resizeOpts)
        .webp({ quality: opts.quality })
        .toFile(distPath.endsWith('.webp') ? distPath : distPath.replace(/\.jpg$/, '.webp'));
      console.log(`  ✓ ${src} optimisé (cible: ${opts.width}px, qualité: ${opts.quality})`);
    } catch(e) {
      // Si le fichier source n'existe pas encore, copier simplement
      console.log(`  ⚠ ${src} non trouvé, ignoré`);
    }
  });
  await Promise.all(jobs);
});

// Create _redirects file in dist (SPA fallback, exclut les fichiers SEO)
gulp.task('redirects', function(done) {
  console.log('Creating _redirects and _headers files');
  
  // Redirections
  const rules = [
    '/sitemap.xml  /sitemap.xml  200',
    '/robots.txt   /robots.txt   200',
    '/*            /index.html   200'
  ].join('\n');
  fs.writeFileSync('./dist/_redirects', rules);

  // Headers de sécurité
  const headers = `/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://fonts.googleapis.com https://fonts.gstatic.com; font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com; img-src 'self' data: https://raw.githubusercontent.com https://www.google.com https://www.gstatic.com; media-src 'self'; connect-src 'self'; frame-ancestors 'none';
`;
  fs.writeFileSync('./dist/_headers', headers);
  console.log('Security headers written to dist/_headers');
  done();
});

// Static server + watching scss/js/html files
gulp.task('browserSync', function() {
  bs.init({
    server: {
      baseDir: './dist'
    }
  });
});

// Build task
gulp.task('build', gulp.series('scss', 'css', 'js', 'html', 'vendor', 'images', 'images:optimize', 'seo', 'redirects'));

// Dev task
gulp.task('dev', gulp.series('build', 'browserSync', function() {
  gulp.watch('./scss/*.scss', gulp.series('scss', 'css'));
  gulp.watch('./js/*.js', gulp.series('js'));
  gulp.watch('./*.html', gulp.series('html'));
  gulp.watch('./vendor/**/*', gulp.series('vendor'));
  gulp.watch('./img/**/*', gulp.series('images'));
  gulp.watch('./dist/*.html').on('change', bs.reload);
}));

// Default task
gulp.task('default', gulp.series('dev'));