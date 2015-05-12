import yt
import vtk
import time
import numpy as np
from glob import glob
from itertools import imap
from yt.utilities.exceptions import *


def l2a(l):
    return np.array(l)


class vtkTimerCallback():
    def __init__(self, actor, camera):
        self.timer_count = 0
        self.actor = actor
        self.camera = camera

    def execute(self, obj, event):
        if self.timer_count < 800:
            self.camera.Zoom(1.005)
            try:
                self.actor.RotateWXYZ(1.001, 0.01, 0.4, 0.0)
            except Exception:
                pass
        elif self.timer_count >= 800 and self.timer_count <= 1600:
            self.camera.Zoom(0.995)
            try:
                self.actor.RotateWXYZ(0.999, 0.01, 0.8, 0.0)
            except Exception:
                pass
        else:
            self.timer_count = 0
        print self.timer_count
        # self.actor.SetPosition(self.timer_count, self.timer_count, 0)
        iren = obj
        iren.GetRenderWindow().Render()
        self.timer_count += 1


class VtkDarkSkyTime(object):
    """docstring for VtkDarkSkyTime"""
    def __init__(self):
        super(VtkDarkSkyTime, self).__init__()
        self.vtkPolyData = vtk.vtkPolyData()
        self.initVTK()
        self.vtkActor = vtk.vtkActor()
        self.vtkActor.SetMapper(self.__setMapper())

    def initVTK(self):
        self.vtkPoints = vtk.vtkPoints()
        self.vtkCells = vtk.vtkCellArray()
        self.vtkDepth = vtk.vtkDoubleArray()

        self.vtkDepth.SetName("DarkMatter_Phi")
        self.dMin = 0.0
        self.dMax = 20.0

        self.vtkPolyData.SetPoints(self.vtkPoints)
        self.vtkPolyData.SetVerts(self.vtkCells)
        self.vtkPolyData.GetPointData().SetScalars(self.vtkDepth)
        self.vtkPolyData.GetPointData().SetActiveScalars('DarkMatter_Phi')

    def addPoints(self, point, color):
        x, y, z = point[:]
        pID = self.vtkPoints.InsertNextPoint(x, y, z)
        self.vtkDepth.InsertNextValue(color)
        self.vtkCells.InsertNextCell(1)
        self.vtkCells.InsertCellPoint(pID)
        self.vtkDepth.Modified()
        self.vtkPoints.Modified()
        self.vtkCells.Modified()

    def __setMapper(self):
        print "Creating vtkPolyDataMapper"
        mapper = vtk.vtkPolyDataMapper()
        mapper.SetInputData(self.vtkPolyData)
        mapper.SetColorModeToDefault()
        mapper.SetScalarRange(self.dMin, self.dMax)
        mapper.SetScalarVisibility(1)
        return mapper


class IndexBuilder(object):
    """Convenience Class which calculates the bounds of a volume
    """
    def __init__(self, offset):
        super(IndexBuilder, self).__init__()
        self.offset = offset

    def __call__(self, axis):
        self.SetBounds(axis)
        iX, iY, iZ = self.GetBounds(axis)
        iXY = np.fromiter(imap(self.Overlay, zip(iX, iY)), np.bool)
        iXYZ = np.fromiter(imap(self.Overlay, zip(iXY, iZ)), np.bool)
        return iXYZ

    def SetBounds(self, axis):
        print "Finding bounds of Axis"
        self.mi, self.ma = l2a(axis).min(), l2a(axis).max()
        self.miB, self.maB = (self.mi + self.offset), (self.ma - self.offset)
        print "MinB: {}".format(self.miB)
        print "Min: {}".format(self.mi)
        print "MaxB: {}".format(self.maB)
        print "Max: {}".format(self.ma)

    def GetBounds(self, axis):
        print "Getting Bounds"
        x, y, z = axis[:, 0], axis[:, 1], axis[:, 2]
        iX = self.mapOverlap(x)
        iY = self.mapOverlap(y)
        iZ = self.mapOverlap(z)
        return iX, iY, iZ

    def mapOverlap(self, axis):
        print "mapping the overlap"
        a1, a2 = self.GetIndices(axis)
        iA = np.fromiter(imap(self.Overlay, zip(a1, a2)), np.bool)
        return iA

    def GetIndices(self, axis):
        print "Getting Indicies"
        ID1 = (self.miB >= l2a(axis)) & (self.mi <= l2a(axis))
        ID2 = (self.maB <= l2a(axis)) & (self.ma >= l2a(axis))
        return (ID1, ID2)

    def Overlay(self, xy):
        """
        NB: Overlay
        This maps a 2D vector such that if one of the values is
        True, then the whole vector should be True.
        """
        if True in xy:
            return True
        else:
            return False


if __name__ == '__main__':
    start = time.clock()
    darkSky = VtkDarkSkyTime()
    Bounder = IndexBuilder(454.17418235000014)
    totalPoints = 0

    PAT = "../data/BlueWaters/*[01].[0-9][0-9]00"
    # PAT = "../data/ds14_scivis_0128/ds14_scivis_0128_e4_dt04_[01].[0-9][0-9]00"
    length = len(glob(PAT))-1
    for i, fn in enumerate(glob(PAT)[::5]):
        s = time.clock()
        print "\nLoading", fn, "now"
        # try:
        #     # ds = yt.load(fn)
        #     # ad = ds.all_data()
        #     # dmXYZ = ad[('dark_matter', 'particle_position')]
        #     dmXYZ = np.load(fn + 'particle_position')
        # except YTDomainOverflow:
        #     LE = ds.domain_left_edge.astype(np.float64)
        #     RE = ds.domain_right_edge.astype(np.float64)
        #     ds.domain_left_edge = np.floor(LE / 10.0) * 10.0
        #     ds.domain_right_edge = np.ceil(RE / 10.0) * 10.0
        #     dmXYZ = ad[('dark_matter', 'particle_position')]
        dmXYZ = np.load('particle_position' + fn)

        iXYZ = Bounder(dmXYZ)
        XYZ = dmXYZ[iXYZ]
        print XYZ.shape,
        totalPoints += XYZ.shape[0]

        print "\nAdding Points!"
        for j in xrange(XYZ.shape[0]):
            xyz = XYZ[j]
            darkSky.addPoints(xyz, float(i))
        print "\nWe are at time ", i, "of", length-1
        print "We have accumulated", totalPoints
        print "Current runtime is", time.clock() - start, "\n"

    # Create the Renderer
    ren = vtk.vtkRenderer()
    ren.AddActor(darkSky.vtkActor)
    ren.SetBackground(0.0, 0.0, 0.0)  # Set background to white
    ren.ResetCamera()

    # Create the RendererWindow
    renWin = vtk.vtkRenderWindow()
    renWin.SetSize(512, 512)
    renWin.AddRenderer(ren)

    # Interactor
    iren = vtk.vtkRenderWindowInteractor()
    iren.SetRenderWindow(renWin)

    # Begin Interaction
    print "We drawing stuffs! {}".format(time.clock() - start)
    renWin.Render()
    iren.Initialize()

    # Sign up to receive TimerEvent
    cb = vtkTimerCallback(darkSky.vtkActor, ren.GetActiveCamera())
    iren.AddObserver('TimerEvent', cb.execute)
    timerId = iren.CreateRepeatingTimer(100)

    iren.Start()
