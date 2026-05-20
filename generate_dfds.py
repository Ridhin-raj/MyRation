import zlib
import base64
import urllib.request
import os
import ssl
import time
from urllib.parse import quote

ssl._create_default_https_context = ssl._create_unverified_context

def generate_kroki_url(diagram_type, diagram_code):
    compressed = zlib.compress(diagram_code.encode('utf-8'), 9)
    encoded = base64.urlsafe_b64encode(compressed).decode('ascii')
    return f"https://kroki.io/{diagram_type}/png/{encoded}"

def download_image(url, filename, retries=5):
    save_path = os.path.join(r"c:\Users\Adyuth\Documents\GitHub\miniprojectRIdhin\MyRation", filename)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=30) as response, open(save_path, 'wb') as out_file:
                data = response.read()
                out_file.write(data)
            print(f"Saved {filename}")
            time.sleep(3)
            return
        except Exception as e:
            print(f"Attempt {attempt+1} failed for {filename}: {e}")
            time.sleep(5)
    print(f"Failed to download {filename} after {retries} attempts.")

STYLE = """
    node [fontname="Arial", fontsize=12];
    edge [fontname="Arial", fontsize=10, color="#333333"];
    node [shape=box, style="solid,filled", fillcolor="#f0f0f0", color="#333333", width=1.5, height=0.6];
"""
PROCESS_STYLE = 'node [shape=circle, style="solid,filled", fillcolor="#e1f5fe", color="#0277bd", fixedsize=true, width=1.5];'
STORE_STYLE = 'node [shape=none, style="", fillcolor="none", margin=0];'
OUTPUT_STYLE = 'node [shape=note, style="solid,filled", fillcolor="#e8f5e9", color="#2e7d32", fixedsize=false, width=1.2, height=0.8];'

level0_code = f"""digraph Level0_DFD {{
    rankdir=LR; splines=polyline; nodesep=1.0; ranksep=1.5;
    {STYLE}
    Admin [label="District Admin"]; Shop [label="Shopkeeper / FPS"]; Ben [label="Beneficiary Citizen"];
    {PROCESS_STYLE}
    System [label="0.0\\nSmart Ration\\nManagement", width=2.0];
    Admin -> System [label=" Approve/Query"]; System -> Admin [label=" Analytics/Alerts"];
    Shop -> System [label=" Verify/Sell"]; System -> Shop [label=" Shipments"];
    Ben -> System [label=" Collect"]; System -> Ben [label=" Quota Status"];
}}"""

level1_code = f"""digraph Level1_DFD {{
    rankdir=TD; splines=ortho; nodesep=1.2; ranksep=1.0;
    {STYLE}
    {{ rank=same; Admin; Shop; Ben; }}
    Admin [label="District Admin"]; Shop [label="Shopkeeper"]; Ben [label="Beneficiary"];
    {PROCESS_STYLE}
    P1 [label="1.0\\nRegistration"]; P2 [label="2.0\\nSupply Push"]; P3 [label="3.0\\nInventory Sync"]; P4 [label="4.0\\nDistribution"];
    {STORE_STYLE}
    {{ rank=same; D1; D2; }}
    D1 [label=< <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="8"><TR><TD BORDER="1" SIDES="T,B" COLOR="#333333">System Entities DB</TD></TR></TABLE> >];
    D2 [label=< <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="8"><TR><TD BORDER="1" SIDES="T,B" COLOR="#333333">Logistics &amp; Stock DB</TD></TR></TABLE> >];
    {OUTPUT_STYLE}
    Out_Ration [label="Receipt"];
    
    Admin -> P1; Shop -> P1; Ben -> P1; P1 -> D1;
    Admin -> P2; P2 -> D1 [dir=both]; P2 -> D2 [dir=both];
    Shop -> P3; P3 -> D2 [dir=both];
    Shop -> P4; Ben -> P4; P4 -> D2 [dir=both]; P4 -> Out_Ration;
}}"""

level2_p1_code = f"""digraph Level2_P1 {{
    rankdir=TD; splines=ortho; nodesep=1.2; ranksep=1.0;
    {STYLE}
    {{ rank=same; Ben; Shop; Admin; }}
    Ben [label="Beneficiary"]; Shop [label="Shopkeeper"]; Admin [label="Admin"];
    {PROCESS_STYLE}
    P11 [label="1.1\\nSubmit Profile"]; P12 [label="1.2\\nSubmit Shop"]; P13 [label="1.3\\nStore"]; P14 [label="1.4\\nLocal Verify"]; P15 [label="1.5\\nFinal Approval"];
    {STORE_STYLE}
    {{ rank=same; D_Users; D_Shops; }}
    D_Users [label=< <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="8"><TR><TD BORDER="1" SIDES="T,B">users &amp; profiles</TD></TR></TABLE> >];
    D_Shops [label=< <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="8"><TR><TD BORDER="1" SIDES="T,B">shops</TD></TR></TABLE> >];
    
    Ben -> P11; Shop -> P12; P11 -> P13; P12 -> P13; P13 -> D_Users; P13 -> D_Shops;
    Shop -> P14; P14 -> D_Users; Admin -> P15; P15 -> D_Users; P15 -> D_Shops;
}}"""

level2_p2_code = f"""digraph Level2_P2 {{
    rankdir=TD; splines=ortho; nodesep=1.2; ranksep=1.0;
    {STYLE}
    Admin [label="District Admin"];
    {PROCESS_STYLE}
    P21 [label="2.1\\nQuery Users"]; P22 [label="2.2\\nApply Quota"]; P23 [label="2.3\\nFetch Surplus"]; P24 [label="2.4\\nNet Calc"]; P25 [label="2.5\\nAssign Stock"];
    {STORE_STYLE}
    {{ rank=same; D_Users; D_Quota; D_Stock; D_Transit; }}
    D_Users [label=< <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="8"><TR><TD BORDER="1" SIDES="T,B">user_profiles</TD></TR></TABLE> >];
    D_Quota [label=< <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="8"><TR><TD BORDER="1" SIDES="T,B">quota_logic</TD></TR></TABLE> >];
    D_Stock [label=< <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="8"><TR><TD BORDER="1" SIDES="T,B">stock (prev)</TD></TR></TABLE> >];
    D_Transit [label=< <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="8"><TR><TD BORDER="1" SIDES="T,B">assigned_stock</TD></TR></TABLE> >];
    
    Admin -> P21; P21 -> D_Users; P21 -> P22; P22 -> D_Quota; P22 -> P23; P23 -> D_Stock; P23 -> P24; P24 -> P25; P25 -> D_Transit;
}}"""

level2_p3_code = f"""digraph Level2_P3 {{
    rankdir=TD; splines=ortho; nodesep=1.2; ranksep=1.0;
    {STYLE}
    Shop [label="Shopkeeper"];
    {PROCESS_STYLE}
    P31 [label="3.1\\nFetch Pending"]; P32 [label="3.2\\nVerify Intake"]; P33 [label="3.3\\nUPSERT Ledger"]; P34 [label="3.4\\nAudit Log"];
    {STORE_STYLE}
    {{ rank=same; D_Transit; D_Stock; D_Hist; }}
    D_Transit [label=< <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="8"><TR><TD BORDER="1" SIDES="T,B">assigned_stock</TD></TR></TABLE> >];
    D_Stock [label=< <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="8"><TR><TD BORDER="1" SIDES="T,B">stock</TD></TR></TABLE> >];
    D_Hist [label=< <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="8"><TR><TD BORDER="1" SIDES="T,B">stock_history</TD></TR></TABLE> >];
    
    Shop -> P31; P31 -> D_Transit; P31 -> Shop; Shop -> P32; P32 -> D_Transit;
    P32 -> P33; P33 -> D_Stock; P33 -> P34; P34 -> D_Hist;
}}"""

level2_p4_code = f"""digraph Level2_P4 {{
    rankdir=TD; splines=ortho; nodesep=1.2; ranksep=1.0;
    {STYLE}
    {{ rank=same; Ben; Shop; }}
    Ben [label="Beneficiary"]; Shop [label="Shopkeeper"];
    {PROCESS_STYLE}
    P41 [label="4.1\\nVal. Identity"]; P42 [label="4.2\\nCheck Balances"]; P43 [label="4.3\\nVerify Stock"]; P44 [label="4.4\\nAtomic Update"]; P45 [label="4.5\\nAudit"];
    {STORE_STYLE}
    {{ rank=same; D_Users; D_Bal; D_Stock; D_Hist; }}
    D_Users [label=< <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="8"><TR><TD BORDER="1" SIDES="T,B">user_profiles</TD></TR></TABLE> >];
    D_Bal [label=< <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="8"><TR><TD BORDER="1" SIDES="T,B">user_balances</TD></TR></TABLE> >];
    D_Stock [label=< <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="8"><TR><TD BORDER="1" SIDES="T,B">stock</TD></TR></TABLE> >];
    D_Hist [label=< <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="8"><TR><TD BORDER="1" SIDES="T,B">audit_logs</TD></TR></TABLE> >];
    {OUTPUT_STYLE}
    Out [label="Disbursed"];
    
    Ben -> Shop; Shop -> P41; P41 -> D_Users; P41 -> P42; P42 -> D_Bal; P42 -> P43; P43 -> D_Stock; P43 -> P44; P44 -> D_Bal; P44 -> D_Stock; P44 -> P45; P45 -> D_Hist; P45 -> Out;
}}"""

try:
    print("Generating Level 0 & 1...")
    download_image(generate_kroki_url('graphviz', level0_code), 'DFD_Level0.png')
    download_image(generate_kroki_url('graphviz', level1_code), 'DFD_Level1.png')
    print("Generating Level 2 Sub-diagrams...")
    download_image(generate_kroki_url('graphviz', level2_p1_code), 'DFD_Level2_P1.png')
    download_image(generate_kroki_url('graphviz', level2_p2_code), 'DFD_Level2_P2.png')
    download_image(generate_kroki_url('graphviz', level2_p3_code), 'DFD_Level2_P3.png')
    download_image(generate_kroki_url('graphviz', level2_p4_code), 'DFD_Level2_P4.png')
    print("DONE")
except Exception as e:
    print("ERROR:", e)
