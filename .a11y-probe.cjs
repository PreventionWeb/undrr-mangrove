const path = require('path');
const sass = require('sass');
const SCSS_DIR = '/private/tmp/mangrove-pr1080-v2.Tnk35F/stories/assets/scss';
const BRANDS = ['preventionweb', 'irp', 'mcr', 'delta'];
const compile = e => sass.compile(path.join(SCSS_DIR, `${e}.scss`), {loadPaths:[SCSS_DIR], silenceDeprecations:['import'], logger: sass.Logger.silent}).css;

const srgb = c => { c/=255; return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4); };
const lum = ({r,g,b}) => 0.2126*srgb(r)+0.7152*srgb(g)+0.0722*srgb(b);
const contrast = (a,b) => { const [x,y]=[lum(a),lum(b)].sort((m,n)=>n-m); return (x+0.05)/(y+0.05); };
const flatten = (fg,bg) => fg.a===1?fg:{r:fg.r*fg.a+bg.r*(1-fg.a),g:fg.g*fg.a+bg.g*(1-fg.a),b:fg.b*fg.a+bg.b*(1-fg.a),a:1};
const oklchToRgb = (L,C,H) => {
  const h = H*Math.PI/180;
  const a = C*Math.cos(h), b2 = C*Math.sin(h);
  const l_=L+0.3963377774*a+0.2158037573*b2;
  const m_=L-0.1055613458*a-0.0638541728*b2;
  const s_=L-0.0894841775*a-1.2914855480*b2;
  const l=l_**3,m=m_**3,s3=s_**3;
  const lin=[
    4.0767416621*l-3.3077115913*m+0.2309699292*s3,
    -1.2684380046*l+2.6097574011*m-0.3413193965*s3,
    -0.0041960863*l-0.7034186147*m+1.7076147010*s3,
  ];
  const enc=c=>{c=c<=0.0031308?12.92*c:1.055*Math.pow(c,1/2.4)-0.055;return Math.min(255,Math.max(0,Math.round(c*255)));};
  return {r:enc(lin[0]),g:enc(lin[1]),b:enc(lin[2]),a:1};
};
const parseColor = v => {
  if (!v) return null; v=v.trim();
  if (v==='transparent'||v==='none') return {r:0,g:0,b:0,a:0};
  const ok=v.match(/^oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)\s*\)$/);
  if (ok) return oklchToRgb(v.includes('%')?+ok[1]/100:+ok[1],+ok[2],+ok[3]);
  if (/^#[0-9a-f]{6}$/i.test(v)) return {r:parseInt(v.slice(1,3),16),g:parseInt(v.slice(3,5),16),b:parseInt(v.slice(5,7),16),a:1};
  if (/^#[0-9a-f]{3}$/i.test(v)) return {r:parseInt(v[1]+v[1],16),g:parseInt(v[2]+v[2],16),b:parseInt(v[3]+v[3],16),a:1};
  const fn = v.match(/^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*(?:\/\s*([\d.]+))?\s*\)$/);
  if (fn) return {r:+fn[1],g:+fn[2],b:+fn[3],a:fn[4]?+fn[4]:1};
  const t = v.match(/^(\d+)\s+(\d+)\s+(\d+)$/);
  return t?{r:+t[1],g:+t[2],b:+t[3],a:1}:null;
};
const declarations = (css, selector) => {
  const out={};
  for (const m of css.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;}]+)[;}]/g)) out[m[1]]=m[2].trim();
  if (selector) {
    const block = css.match(new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
    for (const m of block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;}]+)[;}]/g)) out[m[1]]=m[2].trim();
  }
  return out;
};
const substitute = (vars, value, depth=0) => {
  if (depth>20 || !value || !value.includes('var(')) return value;
  let out='', i=0;
  while (i<value.length) {
    const at = value.indexOf('var(', i);
    if (at===-1){out+=value.slice(i);break;}
    out+=value.slice(i,at);
    let level=0,end=at+3;
    for(;end<value.length;end++){if(value[end]==='(')level++;else if(value[end]===')'){level--;if(level===0)break;}}
    const inner=value.slice(at+4,end);
    let lvl=0,comma=-1;
    for(let k=0;k<inner.length;k++){if(inner[k]==='(')lvl++;else if(inner[k]===')')lvl--;else if(inner[k]===','&&lvl===0){comma=k;break;}}
    const name=(comma===-1?inner:inner.slice(0,comma)).trim();
    const fb=comma===-1?'':inner.slice(comma+1).trim();
    out += vars[name]!==undefined?vars[name]:fb;
    i=end+1;
  }
  return substitute(vars,out,depth+1);
};
const WHITE={r:255,g:255,b:255,a:1};

const themes = [['base', 'style', null], ...BRANDS.map(b=>[b, `style-${b}`, `.mg-theme-${b}`])];
const css = {};
themes.forEach(([n,e])=>css[n]=compile(e));

const PAIRS = JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));

for (const p of PAIRS) {
  const row = [];
  for (const [name,, sel] of themes) {
    const vars = declarations(css[name], sel);
    const read = tok => tok==='#fff' ? WHITE : parseColor(substitute(vars, vars[tok]!==undefined?vars[tok]:tok).trim());
    const fg = read(p.fg);
    let bg = WHITE;
    for (const layer of [...p.bg].reverse()) {
      const c = read(layer);
      if (!c) { bg = null; break; }
      bg = flatten(c, bg);
    }
    if (!fg || !bg) { row.push(`${name}:MISSING(${!fg?p.fg:'bg'})`); continue; }
    const r = contrast(flatten(fg,bg), bg);
    row.push(`${name}:${r.toFixed(2)}${r<p.min?'*FAIL':''}`);
  }
  console.log(`${p.min}  ${p.fg} ON ${p.bg.join(' / ')}\n     ${row.join('  ')}`);
}
