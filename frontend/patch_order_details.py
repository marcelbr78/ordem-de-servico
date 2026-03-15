import re
import os

filePath = r"c:\Users\loja\Documents\Ordem de serviço\frontend\src\components\orders\OrderDetails.tsx"

with open(filePath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add toggleWaMsg function if not present
if "const toggleWaMsg" not in content:
    content = content.replace(
        "const [whatsappMessage, setWhatsappMessage] = useState('');",
        "const [whatsappMessage, setWhatsappMessage] = useState('');\n    const [expandedWaMsgs, setExpandedWaMsgs] = useState<Set<string>>(new Set());\n\n    const toggleWaMsg = (id: string) => {\n        setExpandedWaMsgs(prev => {\n            const next = new Set(prev);\n            if (next.has(id)) next.delete(id);\n            else next.add(id);\n            return next;\n        });\n    };"
    )

# 2. Replace the WhatsApp indicator span with a button
# We use regex to handle whitespace
indicator_regex = re.compile(r'\{hist\.waMsgSent \? \(\s*<span style=\{\{\s*display: \'inline-flex\', alignItems: \'center\', gap: \'4px\',\s*padding: \'2px 8px\', borderRadius: \'6px\', fontSize: \'10px\', fontWeight: 700,\s*background: \'rgba\(37,211,102,0.15\)\', color: \'#25d366\',\s*border: \'1px solid rgba\(37,211,102,0.2\)\'\s*\}\} title=\{hist\.waMsgContent\}>\s*<MessageCircle size=\{12\} /> WhatsApp Enviado\s*</span>', re.MULTILINE)

replacement_button = """{hist.waMsgSent ? (
                                                                                     <button 
                                                                                        onClick={() => toggleWaMsg(hist.id)}
                                                                                        style={{
                                                                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                                            padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                                                                                            background: expandedWaMsgs.has(hist.id) ? '#25d366' : 'rgba(37,211,102,0.15)', 
                                                                                            color: expandedWaMsgs.has(hist.id) ? '#fff' : '#25d366',
                                                                                            border: '1px solid rgba(37,211,102,0.2)',
                                                                                            cursor: 'pointer'
                                                                                        }} 
                                                                                     >
                                                                                         <MessageCircle size={12} /> {expandedWaMsgs.has(hist.id) ? 'Ocultar WhatsApp' : 'WhatsApp Enviado'}
                                                                                     </button>"""

content = indicator_regex.sub(replacement_button, content)

# 3. Replace the message content display
content_regex = re.compile(r'\{hist\.waMsgSent && hist\.waMsgContent && hist\.waMsgContent !== hist\.comments && \(\s*<div style=\{\{ marginTop: \'8px\', padding: \'8px\', background: \'rgba\(37,211,102,0.05\)\', borderRadius: \'6px\', borderLeft: \'3px solid #25d366\', fontSize: \'12px\', color: \'rgba\(255,255,255,0.5\)\', fontFamily: \'monospace\', whiteSpace: \'pre-wrap\' \}\}>\s*\{hist\.waMsgContent\}\s*</div>\s*\)\}', re.MULTILINE)

replacement_content = """{hist.waMsgSent && hist.waMsgContent && hist.waMsgContent !== hist.comments && expandedWaMsgs.has(hist.id) && (
                                                                     <div className="animate-fade" style={{ 
                                                                        marginTop: '8px', padding: '12px', 
                                                                        background: 'rgba(37,211,102,0.08)', borderRadius: '8px', 
                                                                        borderLeft: '3px solid #25d366', fontSize: '12.5px', 
                                                                        color: 'rgba(255,255,255,0.7)', fontFamily: 'inherit', 
                                                                        whiteSpace: 'pre-wrap', position: 'relative' 
                                                                     }}>
                                                                        <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#25d366', fontWeight: 800, marginBottom: '6px', opacity: 0.8 }}>
                                                                            Conteúdo enviado via WhatsApp:
                                                                        </div>
                                                                         {hist.waMsgContent}
                                                                     </div>
                                                                 )}"""

content = content_regex.sub(replacement_content, content)

with open(filePath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied successfully.")
