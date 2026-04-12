import zipfile
from xml.etree import ElementTree as ET
from pathlib import Path

def read_docx(filepath):
    try:
        with zipfile.ZipFile(str(filepath), "r") as zf:
            xml = zf.read("word/document.xml")
        ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
        root = ET.fromstring(xml)
        lines = []
        for para in root.iter(f"{{{ns}}}p"):
            texts = [t.text for run in para.iter(f"{{{ns}}}r") for t in run.iter(f"{{{ns}}}t") if t.text]
            line = "".join(texts).strip()
            if line: lines.append(line)
        return lines
    except Exception as e:
        return [str(e)]

p1 = r"e:\Projetos AntiGrafity\Material\PROVAS E GABARITOS\PROVAS\05 -  PROFETAS MAIORES.docx"
p2 = r"e:\Projetos AntiGrafity\Material\PROVAS E GABARITOS\PROVAS\06 - PROFETAS MENORES.docx"

print("--- PROFETAS MAIORES ---")
lines1 = read_docx(p1)
for l in lines1[:20]: print(l)
print(f"\nTotal lines: {len(lines1)}")

print("\n--- PROFETAS MENORES ---")
lines2 = read_docx(p2)
for l in lines2[:20]: print(l)
print(f"\nTotal lines: {len(lines2)}")
