export interface HostileSvgCase {
  name: string;
  svg: string;
  forbidden: RegExp[];
}

export const hostileSvgCorpus: HostileSvgCase[] = [
  {
    name: 'script tag',
    svg: '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><circle r="4" /></svg>',
    forbidden: [/<script/i, /alert\(1\)/]
  },
  {
    name: 'escaped script closing tag',
    svg: '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)<\\/script><circle r="4" /></svg>',
    forbidden: [/<script/i, /alert\(1\)/, /<\\?\/script/i]
  },
  {
    name: 'event handler attribute',
    svg: '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" onload="alert(1)" /></svg>',
    forbidden: [/\sonload\s*=/i, /alert\(1\)/]
  },
  {
    name: 'javascript href',
    svg: '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><circle r="4" /></a></svg>',
    forbidden: [/href\s*=/i, /javascript:/i]
  },
  {
    name: 'xlink javascript href',
    svg: '<svg xmlns:xlink="http://www.w3.org/1999/xlink"><use xlink:href="javascript:alert(1)" /></svg>',
    forbidden: [/xlink:href\s*=/i, /javascript:/i]
  },
  {
    name: 'foreignObject block',
    svg: '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><body onload="alert(1)">bad</body></foreignObject></svg>',
    forbidden: [/foreignObject/i, /onload/i, /alert\(1\)/]
  },
  {
    name: 'encoded javascript href',
    svg: '<svg xmlns="http://www.w3.org/2000/svg"><a href="java&#x73;cript:alert(1)"><rect width="10" /></a></svg>',
    forbidden: [/href\s*=/i, /java&#x73;cript/i, /alert\(1\)/]
  },
  {
    name: 'CSS javascript URL',
    svg: '<svg xmlns="http://www.w3.org/2000/svg"><path style="fill:url(javascript:alert(1))" d="M0 0h10" /></svg>',
    forbidden: [/style\s*=/i, /javascript:/i]
  },
  {
    name: 'encoded CSS expression',
    svg: '<svg xmlns="http://www.w3.org/2000/svg"><path style="width:expre&#x73;sion(alert(1))" d="M0 0h10" /></svg>',
    forbidden: [/style\s*=/i, /expre&#x73;sion/i, /alert\(1\)/]
  },
  {
    name: 'data SVG href',
    svg: '<svg xmlns="http://www.w3.org/2000/svg"><image href="data:image/svg+xml,<svg onload=alert(1)>" /></svg>',
    forbidden: [/href\s*=/i, /data:image\/svg\+xml/i, /onload/i]
  },
  {
    name: 'active object element',
    svg: '<svg xmlns="http://www.w3.org/2000/svg"><object data="https://example.test/payload.html"></object></svg>',
    forbidden: [/<object/i, /payload\.html/i]
  },
  {
    name: 'malformed SVG still strips active content',
    svg: '<svg><script>alert(1)</script><foreignObject><div>bad</svg>',
    forbidden: [/<script/i, /alert\(1\)/, /foreignObject/i]
  }
];
