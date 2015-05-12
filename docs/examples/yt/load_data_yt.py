
# ./examples/load_data_yt.py
# Required libraries:
# pip install yt

import yt

prefix = "Data/ds14_scivis_0128/"
ds = yt.load(prefix+"ds14_scivis_0128_e4_dt04_1.0000")
ad = ds.all_data()
yt.ProjectionPlot(ds, 'z', ('deposit','all_cic')).save()
