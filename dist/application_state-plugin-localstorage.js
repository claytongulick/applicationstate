!function(t){var e={};function n(o){if(e[o])return e[o].exports;var r=e[o]={i:o,l:!1,exports:{}};return t[o].call(r.exports,r,r.exports,n),r.l=!0,r.exports}n.m=t,n.c=e,n.d=function(t,e,o){n.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:o})},n.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},n.t=function(t,e){if(1&e&&(t=n(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var o=Object.create(null);if(n.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var r in t)n.d(o,r,function(e){return t[e]}.bind(null,r));return o},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},n.p="",n(n.s=0)}([function(t,e,n){"use strict";let o;function r(t,e){o=t,e&&(i.load(e),new a(e))}n.r(e),n.d(e,"init",function(){return r}),n.d(e,"StateLoader",function(){return i}),n.d(e,"StatePersistence",function(){return a});const i={load:function(t){const e=localStorage[t]||"{}";try{const t=JSON.parse(e);o.disable_notfication();const n=Object.keys(t);for(let e=0;e<n.length;e++){const r=n[e],i=t[r];o._assignValue("app."+r,i)}o.enable_notification()}catch(t){throw o.enable_notification(),t}}};function a(t){this.db_name=t,o.listen("app",this.onAppChange.bind(this)),this.operation_queue=[]}a.prototype.onAppChange=function(t,e,n){if(o._options[n]){if(!o._options[n].persist)return}let r=n.replace("app.",""),i=o._resolvePath(r,t);this.operation_queue.push({state:t,full_path:n,sub_path:r,value:void 0===i?i:JSON.parse(JSON.stringify(i))}),this.operation_queue.length>1||function t(){if(0==this.operation_queue.length)return;const e=this.operation_queue[0];let n=e.full_path;let r=e.sub_path;e.state;let i=e.value;const a=localStorage[this.db_name]||"{}";try{const e=JSON.parse(a),u=Object.keys(e);for(let t=0;t<u.length;t++){const n=u[t];if(0==n.indexOf(r)){if(n.length>r.length&&"."!=n[r.length])continue;delete e[n]}}let l=o._options[n]&&o._options[n].immutable;if(void 0===i)return;if(i&&"object"==typeof i&&!l){let t=o.flatten(i,r);for(let n=0;n<t.length;n++){const o=t[n];e[o.key]=o.value}}else{let t=JSON.stringify(i);t||(t=""),e[r]=t}const s=JSON.stringify(e);localStorage[this.db_name]=s,this.operation_queue.shift(),t.bind(this)()}catch(t){console.error("Error in saving state, probably a JSON parse error",t)}}.bind(this)()}}]);