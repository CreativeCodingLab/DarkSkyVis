# import yt
import vtk
import time
import numpy as np
import sdfpy as sdf
from glob import glob
from itertools import imap
from utils.vtkDarkSkyUtilities import l2a

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
        """
        Calculate the bounds of each axis, finding the extents fo the bands
        """
        print "Getting Bounds"
        x, y, z = axis[:, 0], axis[:, 1], axis[:, 2]
        iX = self.__mapOverlap(x)
        iY = self.__mapOverlap(y)
        iZ = self.__mapOverlap(z)
        return iX, iY, iZ

    def __mapOverlap(self, axis):
        """
        Merges the two arrays such that if at least one element in the array
        is true, its mirror is also true.
        """
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


class SDFLoader(object):
    """docstring for SDFLoader"""
    def __init__(self, cMpc=False):
        super(SDFLoader, self).__init__()
        self.isCoMoving = cMpc

    def __call__(self, filename):
        self.initSDF(filename)
        return self.sdfPosition

    def initSDF(self, filename):
        self.sdfParticles = sdf.load_sdf(filename)
        self.sdfHeader = self.sdfParticles.parameters
        self.sdfPosition = self.sdfGetXYZ()
        # self.sdfVelocity = self.sdfGetUVW()
        # self.sdfMagnitude = self.sdfGetMagnitude()
        # self.sdfPhi = self.sdfParticles['phi']
        # self.sdfIdent = self.sdfParticles['ident']

    def sdfGetXYZ(self):
        x = self.sdfParticles['x']
        y = self.sdfParticles['y']
        z = self.sdfParticles['z']
        xyz = np.dstack((x, y, z))[0]
        if self.isCoMoving:
            return self.__toCoMoving(xyz)
        else:
            return xyz

    def __toCoMoving(self, proper):
        h_100 = self.sdfHeader['h_100']
        width = self.sdfHeader.parameters['L0']
        cosmo_a = self.sdfHeader.parameters['a']
        kpc_to_Mpc = 1./1000
        return (proper + width/2.) * h_100 * kpc_to_Mpc / cosmo_a

    def __normalize(self, key):
        if self.dMin < 0.0:
            self.factor = max([self.dMax, abs(self.dMin)])
            if key is 'phi':
                self.sdfPhi = self.sdfPhi/self.factor
            elif key is 'index':
                self.sdfIdent = self.sdfIdent/self.factor
            elif key is 'mag':
                self.sdfMagnitude/self.factor
            elif key is 'velx':
                self.sdfVelocity[:, 0] = self.sdfVelocity[:, 0]/self.factor
            elif key is 'vely':
                self.sdfVelocity[:, 1] = self.sdfVelocity[:, 1]/self.factor
            elif key is 'velz':
                self.sdfVelocity[:, 2] = self.sdfVelocity[:, 2]/self.factor
            self.__setMinMaxRange(key)
        else:
            pass


def print_camera_settings():
    global ren
    # ---------------------------------------------------------------
    # Print out the current settings of the camera
    # ---------------------------------------------------------------
    camera = ren.GetActiveCamera()
    print "Camera settings:"
    print "  * position:        %s" % (camera.GetPosition(),)
    print "  * focal point:     %s" % (camera.GetFocalPoint(),)
    print "  * up vector:       %s" % (camera.GetViewUp(),)
    print "  * clipping range:  %s" % (camera.GetViewUp(),)


def Smile_For_the_Camera():
    global frame
    global ren
    global renWin
    file_name = "darkSky" + str(frame).zfill(5) + ".png"
    image = vtk.vtkWindowToImageFilter()
    image.SetInput(renWin)
    png_writer = vtk.vtkPNGWriter()
    png_writer.SetInputConnection(image.GetOutputPort())
    png_writer.SetFileName(file_name)
    renWin.Render()
    png_writer.Write()
    frame += 1
    print file_name + " has been successfully exported"


def key_pressed_callback(obj, event):
    # ---------------------------------------------------------------
    # Attach actions to specific keys
    # ---------------------------------------------------------------
    key = obj.GetKeySym()
    camera = ren.GetActiveCamera()

    if key == "c":
        print_camera_settings()
    if key == "s":
        Smile_For_the_Camera()
    if key == "i":
        camera.Zoom(1.5)
    if key == "o":
        camera.Zoom(0.95)


if __name__ == '__main__':
    start = time.clock()
    darkSky = VtkDarkSkyTime()
    Bounder = IndexBuilder(454.17418235000014)
    Loader = SDFLoader()
    totalPoints = 0

    # PAT = "../data/BlueWaters/*[01].[0-9][0-9]00"
    PAT = "../data/ds14_scivis_0128/ds14_scivis_0128_e4_dt04_[01].[0-9][0-9]00"
    length = len(glob(PAT))-1
    for i, fn in enumerate(glob(PAT)[10::-5]):
        s = time.clock()
        print "\nLoading", fn, "now"
        # try:
        #     ds = yt.load(fn)
        #     ad = ds.all_data()
        #     dmXYZ = ad[('dark_matter', 'particle_position')]
        # except YTDomainOverflow:
        #     LE = ds.domain_left_edge.astype(np.float64)
        #     RE = ds.domain_right_edge.astype(np.float64)
        #     ds.domain_left_edge = np.floor(LE / 10.0) * 10.0
        #     ds.domain_right_edge = np.ceil(RE / 10.0) * 10.0
        #     dmXYZ = ad[('dark_matter', 'particle_position')]
        # dmXYZ = np.load('particle_position' + fn)
        dmXYZ = Loader(fn)
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
    iren.AddObserver("KeyPressEvent", key_pressed_callback)
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
