import{a as g,r as h,R as S,T as v,u as y,j as s,B as j,L as w}from"./index-C0Wyb_q7.js";import{g as E,u as L,a as T,S as Q,T as x,B as b}from"./Stack-BqtIaBne.js";import{G as d}from"./Grid-DWTgaVyj.js";function M(t,a,e,r,u){const[n,l]=h.useState(()=>u&&e?e(t).matches:r?r(t).matches:a);return L(()=>{if(!e)return;const o=e(t),c=()=>{l(o.matches)};return c(),o.addEventListener("change",c),()=>{o.removeEventListener("change",c)}},[t,e]),n}const I={...S},p=I.useSyncExternalStore;function R(t,a,e,r,u){const n=h.useCallback(()=>a,[a]),l=h.useMemo(()=>{if(u&&e)return()=>e(t).matches;if(r!==null){const{matches:i}=r(t);return()=>i}return n},[n,t,r,u,e]),[o,c]=h.useMemo(()=>{if(e===null)return[n,()=>()=>{}];const i=e(t);return[()=>i.matches,m=>(i.addEventListener("change",m),()=>{i.removeEventListener("change",m)})]},[n,e,t]);return p(c,o,l)}function k(t={}){const{themeId:a}=t;return function(r,u={}){let n=g();n&&a&&(n=n[a]||n);const l=typeof window<"u"&&typeof window.matchMedia<"u",{defaultMatches:o=!1,matchMedia:c=l?window.matchMedia:null,ssrMatchMedia:f=null,noSsr:i=!1}=E({name:"MuiUseMediaQuery",props:u,theme:n});let m=typeof r=="function"?r(n):r;return m=m.replace(/^@media( ?)/m,""),(p!==void 0?R:M)(m,o,c,f,i)}}const B=k({themeId:v}),G=()=>{const t=T(),a=B(t.breakpoints.down("sm")),{t:e}=y(),r=new URL("/fallout2-ce-ems/assets/500-C9L4SD-f.png",import.meta.url).href;return s.jsx(s.Fragment,{children:s.jsxs(d,{container:!0,direction:"column",alignItems:"center",justifyContent:"center",sx:{minHeight:"90vh"},children:[s.jsx(d,{item:!0,xs:12,children:s.jsx(j,{sx:{width:{xs:350,sm:396}},children:s.jsx("img",{src:r,alt:"mantis",style:{height:"100%",width:"100%"}})})}),s.jsx(d,{item:!0,xs:12,children:s.jsxs(Q,{justifyContent:"center",alignItems:"center",children:[s.jsx(x,{align:"center",variant:a?"h2":"h1",children:e("error.Internal Server Error")}),s.jsx(x,{color:"textSecondary",variant:"body2",align:"center",sx:{width:{xs:"73%",sm:"70%"},mt:1},children:e("error.Server error 500. we fixing the problem. please try again at a later stage.")}),s.jsx(b,{component:w,to:"/fallout2-ce-ems",variant:"contained",sx:{textTransform:"none",mt:4},children:e("error.Back To Home")})]})})]})})};export{G as default};
