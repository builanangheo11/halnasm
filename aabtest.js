const cheerio = require('cheerio');

function escape(c) {
    if (!c) return '';
    const escapeChar = [
        '.', '*', '+', '?', '|',
        '(', ')', '[', ']', '{', '}',
        '^', '&', ';', '\\',
    ];
    return escapeChar.includes(c) ? '\\' + c : c;
}

function createQueryString(queryMml) {
    const $ = cheerio.load(queryMml, { xmlMode: true });
    const root = $('math')[0];

    function processSingleElement(e) {
        if (!e) return '';
        // integration-node
        
  if (e.name === 'mrow' && e.children.length === 0) {
  return '';
}

      if (!e || e.type === 'text' && !e.data.trim()) {
  return '';
}  
        if ($(e).hasClass('integration-node')) {
            return (e.children || []).map(processSingleElement).join('');
        }
        // structure-node
        if ($(e).hasClass('structure-node')) {
            const tag = e.name;
            if (tag === 'mfrac') {
                const num = processSingleElement(e.children[0]);
                const denom = processSingleElement(e.children[1]);
                return `\\frac{${num}}{${denom}}`;
            }
            if (tag === 'msup') {
                const base = processSingleElement(e.children[0]);
                const sup = processSingleElement(e.children[1]);
                return base
            ? `\\sup{${base}}{${sup}}`
            : `\\sup{${sup}}`;
            }
            if (tag === 'msub') {
                const base = processSingleElement(e.children[0]);
                const sub = processSingleElement(e.children[1]);
                return base
                ? `\\sub{${base}}{${sub}}`
                : `\\sub{${sub}}`;
            }
            if (tag === 'msubsup') {
                const base = processSingleElement(e.children[0]);
                const sub = processSingleElement(e.children[1]);
                const sup = processSingleElement(e.children[2]);
                //return `\\subsup{${base}}{${sub}}{${sup}}`;
                if (base && sub && sup) {
                    return `\\subsup{${base}}{${sub}}{${sup}}`;
                } else if (!base && sub && sup) {
                    return `\\subsup{${sub}}{${sup}}`;
                } else {
                    // fallback
                    return `\\subsup{${base}}{${sub}}{${sup}}`;
                }
            }

            // fallback
            return '\\' + tag + (e.children || []).map(child => `{${processSingleElement(child)}}`).join('');
        }
        // character-node
        if ($(e).hasClass('character-node') && !$(e).hasClass('wildcard')) {
            return escape(e.children?.[0]?.data ?? '');
        }
        // regular-expression
        if ($(e).hasClass('regular-expression')) {
            if ($(e).hasClass('wildcard')) return '.';
            if ($(e).hasClass('matrix-wildcard')) return '.+';
            if ($(e).hasClass('character-class')) {
                return '[' + processSingleElement($(e).find('.integration-node')[0]) + ']';
            }
            if ($(e).hasClass('negated-character-class')) {
                return '[^' + processSingleElement($(e).find('.integration-node')[0]) + ']';
            }
            if ($(e).hasClass('backreference')) {
                const num = processSingleElement($(e).find('.integration-node')[0]);
                return '\\' + num;
            }
            if ($(e).hasClass('enclosing-regular-expression')) {
                let content = '';
                if ($(e).hasClass('boolean-or')) {
                    const style = $(e).find('.style-boolean-or')[0];
                    content = [...style.children]
                        .map(alt => processSingleElement($(alt).find('.integration-node')[0]))
                        .join('|');
                } else {
                    content = processSingleElement($(e).find('.integration-node')[0]);
                }
                let group = `(${content})`;
                if ($(e).hasClass('more') && $(e).hasClass('zero-or-one')) group += '*';
                else if ($(e).hasClass('more')) group += '+';
                else if ($(e).hasClass('zero-or-one')) group += '?';
                return group;
            }
            if ($(e).hasClass('custom-regex-s')) return '\\s*';
            if ($(e).hasClass('custom-regex-d')) return '\\d';
            throw new Error('未知の正規表現ノード');
        }
        // fallback for unclassified node
        if (!e.children || e.children.length === 0) {
            
            return e.data || '';
        }
        return (e.children || []).map(processSingleElement).join('');
    }

    return processSingleElement(root);
}

//module.exports = { createQueryString };
