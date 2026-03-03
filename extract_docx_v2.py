import re
import os
import zipfile
import xml.etree.ElementTree as ET

docx_path = 'analise.docx'
namespace = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

if os.path.exists(docx_path):
    with zipfile.ZipFile(docx_path, 'r') as zip_ref:
        xml_content = zip_ref.read('word/document.xml')
        root = ET.fromstring(xml_content)
        
        texts = []
        for paragraph in root.findall('.//w:p', namespace):
            p_text = ""
            for run in paragraph.findall('.//w:t', namespace):
                if run.text:
                    p_text += run.text
            if p_text:
                texts.append(p_text)
        
        with open('analise_claud.txt', 'w', encoding='utf-8') as f:
            f.write('\n'.join(texts))
        print("Extracted to analise_claud.txt")
