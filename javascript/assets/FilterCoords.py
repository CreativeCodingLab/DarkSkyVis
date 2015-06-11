import json
from glob import glob


files = glob("pretty_Halo_257.0_t*")
aggregated = files.pop()
last = files.pop(0)
files.append(last)

guide = files.pop(0)   # This has the coordinates of the 7 particles we want to track overtime

with open(aggregated, 'r') as rd:
    allData = json.load(rd)

#  get the ids from the first time point
with open(guide, 'r') as rd:
    target = json.load(rd)
    pIDs = [ p['id'] for p in target['particles'] ]
    allData[0]['particles'] = target['particles'][:]  # shallow copy

i = 1;
for fn in files:
    with open(fn, 'r') as rd:
        obj = json.load(rd)
        if obj['id'] == allData[i]['id']:
            for part in obj['particles']:
                if part['id'] in pIDs:
                    allData[i]['particles'].append(part)
    i += 1

with open("aggregate_Halo_257_tALL.json", "w") as w:
    w.write(json.dumps(allData))