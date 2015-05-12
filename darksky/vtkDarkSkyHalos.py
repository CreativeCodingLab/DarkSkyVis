import vtk
import numpy as np
import thingking as tk  # loadtxt
from useful import Halo
# from darksky.utils import Halo

class vtkDarkSkyHalos(object):
    """docstring for vtkDarkSkyHalos"""
    def __init__(self, filename, key):
        super(vtkDarkSkyHalos, self).__init__()
        self.filename = filename
        self.key = key
        self.vtkPolyData = vtk.vtkPolyData()

