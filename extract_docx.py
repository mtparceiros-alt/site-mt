import re
import os
import zipfile

docx_path = 'analise.docx'
if not os.path.exists(docx_path):
    print(f"File {docx_path} not found.")
else:
    with zipfile.ZipFile(docx_path, 'r') as zip_ref:
        xml_content = zip_ref.read('word/document.xml').decode('utf-8')
        # Remove XML tags
        text = re.sub('<[^>]+>', '', xml_content)
        # Basic cleanup of entities (very basic)
        text = text.replace('&quot;', '"').replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
        print(text)
