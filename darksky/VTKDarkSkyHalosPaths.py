import vtk
import numpy as np
import os.path as op
from glob import glob
import thingking as tk  # loadtxt
from useful import Halo


class vtkTimerCallback():
    def __init__(self, actor, camera):
        self.timer_count = 0
        self.actor = actor
        self.camera = camera

    def execute(self, obj, event):
        if self.timer_count < 800:
            # self.camera.Roll(1.001)
            # try:
            #     # self.actor.RotateWXYZ(1.001, 0.05, 0.0, 0.0)
            # except Exception:
                pass
        elif self.timer_count >= 800 and self.timer_count <= 1600:
            # self.camera.Roll(0.999)
            # try:
            #     # self.actor.RotateWXYZ(0.999, 0.05, 0.0, 0.0)
            # except Exception:
                pass
        else:
            self.timer_count = 0
        print self.timer_count
        # self.actor.SetPosition(self.timer_count, self.timer_count, 0)
        iren = obj
        iren.GetRenderWindow().Render()
        self.timer_count += 1


class Renderer(object):
    """docstring for Renderer"""
    def __init__(self):
        super(Renderer, self).__init__()
        self.renderer = vtk.vtkRenderer()
        self.renderWindow = vtk.vtkRenderWindow()
        self.renderWindow.AddRenderer(self.renderer)
        self.renderWindowInteractor = vtk.vtkRenderWindowInteractor()
        self.renderWindowInteractor.SetRenderWindow(self.renderWindow)
        # self.camera = self.renderer.GetActiveCamera()

    def __call__(self, actor):
        self.renderer.AddActor(actor)
        # self.cb = vtkTimerCallback(actor, self.camera)

    def run(self):
        self.renderWindow.Render()
        self.renderWindowInteractor.Initialize()
        # self.renderWindowInteractor.AddObserver('TimerEvent', self.cb.execute)
        # timerId = self.renderWindowInteractor.CreateRepeatingTimer(100)
        self.renderWindowInteractor.Start()


class HaloPath(object):
    """docstring for HaloPath"""
    def __init__(self, coords, originID, orginIndex):
        super(HaloPath, self).__init__()
        print "New HaloPath! ID is: ", originID, "with ", len(coords), "coords"
        self.coords = coords
        self.originID = originID
        self.orginIndex = orginIndex
        # initialize VTK objects
        self.initVTK()

    def initVTK(self):
        print "initialize VTK objects!"
        self.vtkPoints = vtk.vtkPoints()
        self.AddPoints()
        self.DrawLines()
        self.initPolyData()
        self.initMapper()

    def AddPoints(self):
        print "Adding points"
        self.vtkPoints.SetNumberOfPoints(len(self.coords))
        for i, p in enumerate(self.coords):
            p = l2a(p)  # /45.468530000000001
            print p
            self.vtkPoints.SetPoint(i, p[0], p[1], p[2])

    def DrawLines(self):
        print "Connecting the Dots!"
        self.vtkLines = vtk.vtkCellArray()
        # line = vtk.vtkLine()
        self.vtkLines.InsertNextCell(89)  # Inserting all 89 cells at once.
        for i in range(89):
            # line = vtk.vtkLine()
            # line.GetPointIds().SetId(i, i)
            # line.GetPointIds().SetId(i+1, i+1)
            self.vtkLines.InsertCellPoint(i)

    def initPolyData(self):
        print "Adding PolyData object"
        self.vtkPolyData = vtk.vtkPolyData()
        # Add the points to the dataset
        self.vtkPolyData.SetPoints(self.vtkPoints)
        # Add the lines to the dataset
        self.vtkPolyData.SetLines(self.vtkLines)

        # Setup the colors array
        red = [255, 0, 0]
        green = [0, 255, 0]

        # Setup the colors array
        colors = vtk.vtkUnsignedCharArray()
        colors.SetNumberOfComponents(3)
        colors.SetName("Colors")
        colorlist = [[205, 92, 92], [240, 128, 128], [250, 128, 114],
                     [233, 150, 122], [255, 160, 122], [220, 20, 60],
                     [255, 0, 0], [178, 34, 34], [139, 0, 0], [255, 192, 203],
                     [255, 182, 193], [255, 105, 180], [255, 20, 147],
                     [199, 21, 133],[219, 112, 147], [255, 160, 122],
                     [255, 127, 80], [255, 99, 71], [255, 69, 0], [255, 140, 0],
                     [255, 165, 0],
                     [255, 215, 0], [255, 255, 0], [255, 255, 224], [255, 250, 205],
                     [250, 250, 210], [255, 239, 213], [255, 228, 181], [255, 218, 185],
                     [238, 232, 170],[240, 230, 140], [189, 183, 107], [230, 230, 250],
                     [216, 191, 216], [221, 160, 221], [238, 130, 238], [218, 112, 214],
                     [255, 0, 255], [255, 0, 255], [186, 85, 211], [147, 112, 219],
                     [138, 43, 226], [148, 0, 211], [153, 50, 204], [139, 0, 139],
                     [128, 0, 128], [75, 0, 130], [106, 90, 205], [72, 61, 139],
                     [173, 255, 47], [127, 255, 0], [124, 252, 0], [0, 255, 0],
                     [50, 205, 50], [152, 251, 152], [144, 238, 144], [0, 250, 154],
                     [0, 255, 127], [60, 179, 113], [46, 139, 87], [34, 139, 34],
                     [0, 128, 0], [0, 100, 0], [154, 205, 50], [107, 142, 35],
                     [128, 128, 0], [85, 107, 47], [102, 205, 170], [143, 188, 143],
                     [32, 178, 170], [0, 139, 139], [0, 128, 128], [0, 255, 255],
                     [0, 255, 255], [224, 255, 255], [175, 238, 238], [127, 255, 212],
                     [64, 224, 208], [72, 209, 204], [0, 206, 209], [95, 158, 160],
                     [70, 130, 180],[176, 196, 222], [176, 224, 230], [173, 216, 230],
                     [135, 206, 235], [135, 206, 250], [0, 191, 255], [30, 144, 255]]
        # Add the colors we created to the colors array
        for c in colorlist:
            colors.InsertNextTupleValue(c)
        # Setup two colors - one for each line
        self.vtkPolyData.GetCellData().SetScalars(colors)

    def initMapper(self):
        print "adding the Mapper"
        self.vtkActor = vtk.vtkActor()
        self.vtkMapper = vtk.vtkPolyDataMapper()
        self.vtkMapper.SetInputData(self.vtkPolyData)
        self.vtkMapper.Update()

        self.vtkMapper.SetColorModeToDefault()
        self.vtkMapper.SetScalarRange(0, 89)
        self.vtkMapper.SetScalarVisibility(1)

        self.vtkActor.SetMapper(self.vtkMapper)


def l2a(l):
    """
    A convenience function which converts a python list to a numpy array
    """
    return np.array(l)


def intoTheVoid(fileList, ID, pID, coords, n):
    """
    The name is silly, but the role it serves in not

    Recursive Halo tracker which follows the parent/descendant id of a Halo
    across a set of Halo-Files/Time Points.

    Returns a set of coordinates of a Halo's position over time
    """
    print len(fileList), ID, pID, len(coords), n
    if len(fileList) == 0:
        print "file is empty"
        return coords, n
    fn = fileList[0]
    halos = l2a([Halo(x, fn, n) for x in tk.loadtxt(fn)])
    ids = l2a([x.id for x in halos])
    if ID is None:
        print ID, "is None"
        ID = ids[0]
    index = (ids == ID).nonzero()[0][0]
    if index < 0 or index is []:
        print "its -1!"
        return coords, n
    elif index > -1:
        tHl = halos[index]
        # print details
        print index, fn, tHl.id, tHl.desc_id, tHl.pid, n
        xyz = [tHl.x, tHl.y, tHl.z]
        coords.append(xyz)
        return intoTheVoid(fileList[1:], tHl.desc_id, tHl.id, coords, n+1)


# def save_frame():
#     global frame
#     global renderer
#     global verbose
#     # ---------------------------------------------------------------
#     # Save current contents of render window to PNG file
#     # ---------------------------------------------------------------
#     file_name = "haloList_T0_Frame" + str(frame).zfill(5) + ".png"
#     image = vtk.vtkWindowToImageFilter()
#     image.SetInput(renderer.vtkRenderWindow)
#     png_writer = vtk.vtkPNGWriter()
#     png_writer.SetInputConnection(image.GetOutputPort())
#     png_writer.SetFileName(file_name)
#     renderer.vtkRenderWindow.Render()
#     png_writer.Write()
#     frame += 1
#     print file_name + " has been successfully exported"


def main():
    global renderer
    global frame
    frame = 0
    renderer = Renderer()

    RAW = "../data/ds14_scivis_0128"
    ROCKSTAR = op.join(RAW, "rockstar", "hlists", "hlist_[0-1].[0-9][0-9]000.*")
    PARTICLES = op.join(RAW, "ds14_scivis_0128_e4_dt04_[0-1].[0-9][0-9]00")
    hlist = l2a(glob(ROCKSTAR))
    parts = l2a(glob(PARTICLES))

    haloIDs = [257.,  259.,  260.,  263.,  265.,  129.,  131.,  132.,  133.,
               228.,  224.,  248.,  335.,  135.,  125.,  184.,  121.,  113.,
               318.,  300.,   75.,   76.,    5.,  340.,   80.,   82.,  245.,
               178.,  169.,   37.,  226.,   65.,   64.,  102.,  284.,  289.,
               286.,  126.,   62.,   22.,  174.,  163.,  341.,  342.,   69.,
               72.,  151.,  321.,  137.,   31.,   78.,   79.,    4.,  180.,
               74.,  179.,  272.,  283.,  247.,   36.,   71.,  199.,  290.]

    for i, hid in enumerate(haloIDs[::5]):
        print "entering the void with", hid, i
        # intoTheVoid is recursive
        coords, n = intoTheVoid(hlist, hid, -1, [], 0)
        coords = l2a(coords)
        # print coords, coords.shape, coords[:,1]
        # plt.scatter(coords[:,0], coords[:,1], coords[:,2])
        # plt.show()
        haloLine = HaloPath(coords, hid, i)
        renderer(haloLine.vtkActor)
    renderer.run()

if __name__ == '__main__':
    main()
