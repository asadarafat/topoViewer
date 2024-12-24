!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?e(exports,require("@floating-ui/core")):"function"==typeof define&&define.amd?define(["exports","@floating-ui/core"],e):e((t="undefined"!=typeof globalThis?globalThis:t||self).FloatingUIDOM={},t.FloatingUICore)}(this,(function(t,e){"use strict";const n=Math.min,o=Math.max,i=Math.round,r=Math.floor,c=t=>({x:t,y:t});function l(t){return u(t)?(t.nodeName||"").toLowerCase():"#document"}function f(t){var e;return(null==t||null==(e=t.ownerDocument)?void 0:e.defaultView)||window}function s(t){var e;return null==(e=(u(t)?t.ownerDocument:t.document)||window.document)?void 0:e.documentElement}function u(t){return t instanceof Node||t instanceof f(t).Node}function a(t){return t instanceof Element||t instanceof f(t).Element}function d(t){return t instanceof HTMLElement||t instanceof f(t).HTMLElement}function h(t){return"undefined"!=typeof ShadowRoot&&(t instanceof ShadowRoot||t instanceof f(t).ShadowRoot)}function p(t){const{overflow:e,overflowX:n,overflowY:o,display:i}=b(t);return/auto|scroll|overlay|hidden|clip/.test(e+o+n)&&!["inline","contents"].includes(i)}function m(t){return["table","td","th"].includes(l(t))}function g(t){const e=y(),n=b(t);return"none"!==n.transform||"none"!==n.perspective||!!n.containerType&&"normal"!==n.containerType||!e&&!!n.backdropFilter&&"none"!==n.backdropFilter||!e&&!!n.filter&&"none"!==n.filter||["transform","perspective","filter"].some((t=>(n.willChange||"").includes(t)))||["paint","layout","strict","content"].some((t=>(n.contain||"").includes(t)))}function y(){return!("undefined"==typeof CSS||!CSS.supports)&&CSS.supports("-webkit-backdrop-filter","none")}function w(t){return["html","body","#document"].includes(l(t))}function b(t){return f(t).getComputedStyle(t)}function x(t){return a(t)?{scrollLeft:t.scrollLeft,scrollTop:t.scrollTop}:{scrollLeft:t.pageXOffset,scrollTop:t.pageYOffset}}function v(t){if("html"===l(t))return t;const e=t.assignedSlot||t.parentNode||h(t)&&t.host||s(t);return h(e)?e.host:e}function T(t){const e=v(t);return w(e)?t.ownerDocument?t.ownerDocument.body:t.body:d(e)&&p(e)?e:T(e)}function L(t,e,n){var o;void 0===e&&(e=[]),void 0===n&&(n=!0);const i=T(t),r=i===(null==(o=t.ownerDocument)?void 0:o.body),c=f(i);return r?e.concat(c,c.visualViewport||[],p(i)?i:[],c.frameElement&&n?L(c.frameElement):[]):e.concat(i,L(i))}function O(t){const e=b(t);let n=parseFloat(e.width)||0,o=parseFloat(e.height)||0;const r=d(t),c=r?t.offsetWidth:n,l=r?t.offsetHeight:o,f=i(n)!==c||i(o)!==l;return f&&(n=c,o=l),{width:n,height:o,$:f}}function R(t){return a(t)?t:t.contextElement}function E(t){const e=R(t);if(!d(e))return c(1);const n=e.getBoundingClientRect(),{width:o,height:r,$:l}=O(e);let f=(l?i(n.width):n.width)/o,s=(l?i(n.height):n.height)/r;return f&&Number.isFinite(f)||(f=1),s&&Number.isFinite(s)||(s=1),{x:f,y:s}}const P=c(0);function C(t){const e=f(t);return y()&&e.visualViewport?{x:e.visualViewport.offsetLeft,y:e.visualViewport.offsetTop}:P}function S(t,n,o,i){void 0===n&&(n=!1),void 0===o&&(o=!1);const r=t.getBoundingClientRect(),l=R(t);let s=c(1);n&&(i?a(i)&&(s=E(i)):s=E(t));const u=function(t,e,n){return void 0===e&&(e=!1),!(!n||e&&n!==f(t))&&e}(l,o,i)?C(l):c(0);let d=(r.left+u.x)/s.x,h=(r.top+u.y)/s.y,p=r.width/s.x,m=r.height/s.y;if(l){const t=f(l),e=i&&a(i)?f(i):i;let n=t.frameElement;for(;n&&i&&e!==t;){const t=E(n),e=n.getBoundingClientRect(),o=b(n),i=e.left+(n.clientLeft+parseFloat(o.paddingLeft))*t.x,r=e.top+(n.clientTop+parseFloat(o.paddingTop))*t.y;d*=t.x,h*=t.y,p*=t.x,m*=t.y,d+=i,h+=r,n=f(n).frameElement}}return e.rectToClientRect({width:p,height:m,x:d,y:h})}function F(t){return S(s(t)).left+x(t).scrollLeft}function j(t,n,i){let r;if("viewport"===n)r=function(t,e){const n=f(t),o=s(t),i=n.visualViewport;let r=o.clientWidth,c=o.clientHeight,l=0,u=0;if(i){r=i.width,c=i.height;const t=y();(!t||t&&"fixed"===e)&&(l=i.offsetLeft,u=i.offsetTop)}return{width:r,height:c,x:l,y:u}}(t,i);else if("document"===n)r=function(t){const e=s(t),n=x(t),i=t.ownerDocument.body,r=o(e.scrollWidth,e.clientWidth,i.scrollWidth,i.clientWidth),c=o(e.scrollHeight,e.clientHeight,i.scrollHeight,i.clientHeight);let l=-n.scrollLeft+F(t);const f=-n.scrollTop;return"rtl"===b(i).direction&&(l+=o(e.clientWidth,i.clientWidth)-r),{width:r,height:c,x:l,y:f}}(s(t));else if(a(n))r=function(t,e){const n=S(t,!0,"fixed"===e),o=n.top+t.clientTop,i=n.left+t.clientLeft,r=d(t)?E(t):c(1);return{width:t.clientWidth*r.x,height:t.clientHeight*r.y,x:i*r.x,y:o*r.y}}(n,i);else{const e=C(t);r={...n,x:n.x-e.x,y:n.y-e.y}}return e.rectToClientRect(r)}function D(t,e){const n=v(t);return!(n===e||!a(n)||w(n))&&("fixed"===b(n).position||D(n,e))}function H(t,e,n){const o=d(e),i=s(e),r="fixed"===n,f=S(t,!0,r,e);let u={scrollLeft:0,scrollTop:0};const a=c(0);if(o||!o&&!r)if(("body"!==l(e)||p(i))&&(u=x(e)),o){const t=S(e,!0,r,e);a.x=t.x+e.clientLeft,a.y=t.y+e.clientTop}else i&&(a.x=F(i));return{x:f.left+u.scrollLeft-a.x,y:f.top+u.scrollTop-a.y,width:f.width,height:f.height}}function W(t,e){return d(t)&&"fixed"!==b(t).position?e?e(t):t.offsetParent:null}function M(t,e){const n=f(t);if(!d(t))return n;let o=W(t,e);for(;o&&m(o)&&"static"===b(o).position;)o=W(o,e);return o&&("html"===l(o)||"body"===l(o)&&"static"===b(o).position&&!g(o))?n:o||function(t){let e=v(t);for(;d(e)&&!w(e);){if(g(e))return e;e=v(e)}return null}(t)||n}const z={convertOffsetParentRelativeRectToViewportRelativeRect:function(t){let{rect:e,offsetParent:n,strategy:o}=t;const i=d(n),r=s(n);if(n===r)return e;let f={scrollLeft:0,scrollTop:0},u=c(1);const a=c(0);if((i||!i&&"fixed"!==o)&&(("body"!==l(n)||p(r))&&(f=x(n)),d(n))){const t=S(n);u=E(n),a.x=t.x+n.clientLeft,a.y=t.y+n.clientTop}return{width:e.width*u.x,height:e.height*u.y,x:e.x*u.x-f.scrollLeft*u.x+a.x,y:e.y*u.y-f.scrollTop*u.y+a.y}},getDocumentElement:s,getClippingRect:function(t){let{element:e,boundary:i,rootBoundary:r,strategy:c}=t;const f=[..."clippingAncestors"===i?function(t,e){const n=e.get(t);if(n)return n;let o=L(t,[],!1).filter((t=>a(t)&&"body"!==l(t))),i=null;const r="fixed"===b(t).position;let c=r?v(t):t;for(;a(c)&&!w(c);){const e=b(c),n=g(c);n||"fixed"!==e.position||(i=null),(r?!n&&!i:!n&&"static"===e.position&&i&&["absolute","fixed"].includes(i.position)||p(c)&&!n&&D(t,c))?o=o.filter((t=>t!==c)):i=e,c=v(c)}return e.set(t,o),o}(e,this._c):[].concat(i),r],s=f[0],u=f.reduce(((t,i)=>{const r=j(e,i,c);return t.top=o(r.top,t.top),t.right=n(r.right,t.right),t.bottom=n(r.bottom,t.bottom),t.left=o(r.left,t.left),t}),j(e,s,c));return{width:u.right-u.left,height:u.bottom-u.top,x:u.left,y:u.top}},getOffsetParent:M,getElementRects:async function(t){let{reference:e,floating:n,strategy:o}=t;const i=this.getOffsetParent||M,r=this.getDimensions;return{reference:H(e,await i(n),o),floating:{x:0,y:0,...await r(n)}}},getClientRects:function(t){return Array.from(t.getClientRects())},getDimensions:function(t){return O(t)},getScale:E,isElement:a,isRTL:function(t){return"rtl"===b(t).direction}};Object.defineProperty(t,"arrow",{enumerable:!0,get:function(){return e.arrow}}),Object.defineProperty(t,"autoPlacement",{enumerable:!0,get:function(){return e.autoPlacement}}),Object.defineProperty(t,"detectOverflow",{enumerable:!0,get:function(){return e.detectOverflow}}),Object.defineProperty(t,"flip",{enumerable:!0,get:function(){return e.flip}}),Object.defineProperty(t,"hide",{enumerable:!0,get:function(){return e.hide}}),Object.defineProperty(t,"inline",{enumerable:!0,get:function(){return e.inline}}),Object.defineProperty(t,"limitShift",{enumerable:!0,get:function(){return e.limitShift}}),Object.defineProperty(t,"offset",{enumerable:!0,get:function(){return e.offset}}),Object.defineProperty(t,"shift",{enumerable:!0,get:function(){return e.shift}}),Object.defineProperty(t,"size",{enumerable:!0,get:function(){return e.size}}),t.autoUpdate=function(t,e,i,c){void 0===c&&(c={});const{ancestorScroll:l=!0,ancestorResize:f=!0,elementResize:u="function"==typeof ResizeObserver,layoutShift:a="function"==typeof IntersectionObserver,animationFrame:d=!1}=c,h=R(t),p=l||f?[...h?L(h):[],...L(e)]:[];p.forEach((t=>{l&&t.addEventListener("scroll",i,{passive:!0}),f&&t.addEventListener("resize",i)}));const m=h&&a?function(t,e){let i,c=null;const l=s(t);function f(){clearTimeout(i),c&&c.disconnect(),c=null}return function s(u,a){void 0===u&&(u=!1),void 0===a&&(a=1),f();const{left:d,top:h,width:p,height:m}=t.getBoundingClientRect();if(u||e(),!p||!m)return;const g={rootMargin:-r(h)+"px "+-r(l.clientWidth-(d+p))+"px "+-r(l.clientHeight-(h+m))+"px "+-r(d)+"px",threshold:o(0,n(1,a))||1};let y=!0;function w(t){const e=t[0].intersectionRatio;if(e!==a){if(!y)return s();e?s(!1,e):i=setTimeout((()=>{s(!1,1e-7)}),100)}y=!1}try{c=new IntersectionObserver(w,{...g,root:l.ownerDocument})}catch(t){c=new IntersectionObserver(w,g)}c.observe(t)}(!0),f}(h,i):null;let g,y=-1,w=null;u&&(w=new ResizeObserver((t=>{let[n]=t;n&&n.target===h&&w&&(w.unobserve(e),cancelAnimationFrame(y),y=requestAnimationFrame((()=>{w&&w.observe(e)}))),i()})),h&&!d&&w.observe(h),w.observe(e));let b=d?S(t):null;return d&&function e(){const n=S(t);!b||n.x===b.x&&n.y===b.y&&n.width===b.width&&n.height===b.height||i();b=n,g=requestAnimationFrame(e)}(),i(),()=>{p.forEach((t=>{l&&t.removeEventListener("scroll",i),f&&t.removeEventListener("resize",i)})),m&&m(),w&&w.disconnect(),w=null,d&&cancelAnimationFrame(g)}},t.computePosition=(t,n,o)=>{const i=new Map,r={platform:z,...o},c={...r.platform,_c:i};return e.computePosition(t,n,{...r,platform:c})},t.getOverflowAncestors=L,t.platform=z}));