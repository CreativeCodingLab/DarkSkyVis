import yt
import vtk
import struct
import numpy as np
from sdfpy import load_sdf


def l2a(l):
    return np.array(l)


class VtkDarkSky(object):
    """docstring for VtkDarkSky"""
    def __init__(self, filename):
        super(VtkDarkSky, self).__init__()
        self.filename = filename
        self.vtkPolyData = vtk.vtkPolyData()
        self.vtkStreamline = vtk.vtkStreamLine()
        self.initYT()
        self.initVTK()

    def initYT(self):
        print "Extracting YT data"
        self.ytDataSource = yt.load(self.filename)
        self.ytAllData = self.ytDataSource.all_data()
        self.ytPhi = self.__getDarkMatterPaticleData(0)
        self.ytIndex = self.__getDarkMatterPaticleData(1)
        self.ytPosition = self.__getDarkMatterPaticleData(2)
        self.ytVelocity = self.__getDarkMatterPaticleData(3)
        self.ytMagnitude = self.__getDarkMatterPaticleData(4)

    def initSDF(self):
        self.sdfParticles = load_sdf(self.filename)
        self.h_100 = self.sdfParticles.parameters['h_100']
        self.width = self.sdfParticles.parameters['L0']
        self.cosmo_a = self.sdfParticles.parameters['a']
        self.kpc_to_Mpc = 1./1000

    def initVTK(self):
        print "initializing VTK objects"
        self.resetPoints()
        print "adding points and vectors"
        for i in xrange(self.ytIndex.size):
            self.addPoints(i)
            # self.addVectors(i)
            self.addScalars(i)
        self.setPointActor()
        # self.initSeedPoint()
        # self.initStreamlines()
        # self.setStreamlineActor()

    def initStreamlines(self):
        print "initializing Streamlines"
        RK4 = vtk.vtkRungeKutta4()
        self.vtkStreamline.SetInputData(self.vtkPolyData)
        self.vtkStreamline.SetSourceConnection(self.vtkSeeds.GetOutputPort())
        self.vtkStreamline.SetMaximumPropagationTime(500)
        self.vtkStreamline.SetIntegrationStepLength(.2)
        self.vtkStreamline.SetStepLength(0.001)
        self.vtkStreamline.SetNumberOfThreads(1)
        self.vtkStreamline.SetIntegrationDirectionToIntegrateBothDirections()
        self.vtkStreamline.SetIntegrator(RK4)
        self.vtkStreamline.VorticityOn()

    def initSeedPoint(self):
        print "initializing SeedPoint"
        self.vtkSeeds = vtk.vtkPlaneSource()
        self.vtkSeeds.SetXResolution(4)
        self.vtkSeeds.SetYResolution(4)
        p1 = self.ytDataSource.domain_left_edge
        p2 = self.ytDataSource.domain_right_edge
        self.vtkSeeds.SetOrigin(0.0, 0.0, 0.0)
        self.vtkSeeds.SetPoint1(p1[0], p1[1], p1[2])
        self.vtkSeeds.SetPoint2(p2[0], p2[1], p2[2])

    def resetPoints(self):
        print "resetting Points"
        self.vtkPoints = vtk.vtkPoints()
        self.vtkCells = vtk.vtkCellArray()
        self.vtkVelocity = vtk.vtkDoubleArray()
        self.vtkMagnitude = vtk.vtkDoubleArray()
        self.vtkDepth = vtk.vtkDoubleArray()

        self.vtkVelocity.SetName("DM_Velocity")
        self.vtkMagnitude.SetName("DM_Magnitude")
        self.vtkDepth.SetName("DM_Phi")
        self.dMin = self.ytIndex.min()
        self.dMax = self.ytIndex.max()

        self.vtkPolyData.SetPoints(self.vtkPoints)
        self.vtkPolyData.SetVerts(self.vtkCells)
        self.vtkPolyData.GetPointData().SetScalars(self.vtkDepth)
        self.vtkPolyData.GetPointData().SetActiveScalars('DM_Phi')

        # Setup the velocity vectors
        self.vtkVelocity.SetNumberOfComponents(3)
        self.vtkVelocity.SetNumberOfTuples(self.ytVelocity.size)
        self.vtkPolyData.GetPointData().AddArray(self.vtkVelocity)
        self.vtkPolyData.GetPointData().SetActiveVectors("DM_Velocity")
        # Setup the magnitude
        self.vtkPolyData.GetPointData().SetScalars(self.vtkMagnitude)

    def setPointActor(self):
        print "Creating vtkPolyDataMapper"
        self.vtkPointActor = vtk.vtkActor()
        mapper = vtk.vtkPolyDataMapper()
        mapper.SetInputData(self.vtkPolyData)
        mapper.SetColorModeToDefault()
        # mapper.SetColorModeToMapScalars()
        # mapper.SetScalarRange(self.dMin, self.dMax)
        # mapper.SetLookupTable(self.__MakeLUT())
        print "Phi scalar range is {}, {}".format(self.dMin, self.dMax)
        mapper.SetScalarRange(self.dMin/self.dMax, self.dMax/self.dMax)
        mapper.SetScalarVisibility(1)
        self.vtkPointActor.SetMapper(mapper)

    def setStreamlineActor(self):
        print "setting Streamline Actor"
        self.vtkStreamActor = vtk.vtkActor()
        mapper = vtk.vtkPolyDataMapper()
        mapper.SetInputConnection(self.vtkStreamline.GetOutputPort())
        self.vtkStreamActor.SetMapper(mapper)
        self.vtkStreamActor.VisibilityOn()

    def addPoints(self, index):
        x, y, z = self.ytPosition[index]
        pID = self.vtkPoints.InsertNextPoint(x, y, z)
        self.addCells(index, pID)
        self.vtkPoints.Modified()

    def addCells(self, index, pID):
        self.vtkCells.InsertNextCell(1)
        self.vtkCells.InsertCellPoint(pID)
        self.vtkCells.Modified()

    def addVectors(self, index):
        u, v, w = self.ytVelocity[index]
        self.vtkVelocity.SetTuple3(index, u, v, w)
        self.vtkVelocity.Modified()

    def addScalars(self, index):
        v = self.ytIndex[index]
        m = self.ytMagnitude[index]
        self.vtkMagnitude.InsertNextValue(m)
        self.vtkDepth.InsertNextValue(v)
        self.vtkMagnitude.Modified()
        self.vtkDepth.Modified()

    def write(self, fn):
        writer = vtk.vtkXMLPolyDataWriter()
        writer.SetFileName(fn+".vtp")
        writer.SetInputData(self.vtkPolyData)
        writer.Write()

    def histo(self, bins=255, dRange=None):
        import matplotlib.pyplot as plt
        hist, counts = np.histogram(self.ytPhi, bins=bins, range=dRange)
        # hist, bins = np.histogram(niiData, bins=100)
        width = 0.9 * (counts[1] - counts[0])
        center = (counts[:-1] + counts[1:]) / 2

        fig, ax = plt.subplots()
        ax.bar(center, hist, align='center', width=width)
        fig.savefig("DarkSky.png")

        plt.bar(center, hist, align='center', width=width)
        plt.show()
        return hist, counts

    # +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    #                   Private Methdods
    # +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    def __cMpc(self, key, index=None):
        """
        Define a simple function to convert proper to comoving Mpc/h.
        """
        particles = None

        if index is not None:
            particles = self.sdfParticles[key][index]
        else:
            particles = self.sdfParticles[key]
        return (particles + self.width/2.) * self.h_100 * self.kpc_to_Mpc / self.cosmo_a

    def __getDarkMatterPaticleData(self, index):
        registry = [('dark_matter', 'phi'),
                    ('dark_matter', 'particle_index'),
                    ('dark_matter', 'particle_position'),
                    ('dark_matter', 'particle_velocity'),
                    ('dark_matter', 'particle_velocity_magnitude')]
        return self.ytAllData[registry[index]]

    def __hex2rgb(self, hexStr):
        print hexStr
        r, g, b = struct.unpack('BBB', hexStr.decode('hex'))
        return (r/255., g/255., b/255.)

    def __MakeLUT(self):
        '''
        Make a lookup table using vtkColorSeries.
        :return: An indexed lookup table.
        '''
        # Make the lookup table.
        pal = "../util/color_circle_Ajj.pal"
        tableSize = 255
        colorFunc = vtk.vtkColorTransferFunction()
        scalars = self.histo()[1]
        with open(pal) as f:
            lines = f.readlines()
            # lines.reverse()
            for i, line in enumerate(lines):
                l = line.strip()
                r, g, b = self.__hex2rgb(l[1:])
                # print scalars[i], r, g, b
                colorFunc.AddRGBPoint(scalars[i], r, g, b)
        lut = vtk.vtkLookupTable()
        lut.SetNumberOfTableValues(tableSize)
        lut.Build()
        for i in range(0, tableSize):
            rgb = list(colorFunc.GetColor(float(i)/tableSize))+[1]
            lut.SetTableValue(i, rgb)
        return lut

    def __createLUT(self, data):
        # transfer function (lookup table) for mapping point scalar data
        # to colors (parent class is vtkScalarsToColors)
        a, b = data.GetOutput().GetScalarRange()
        lut = vtk.vtkLookupTable()
        lut.SetHueRange(b, a)
        lut.SetValueRange(a, b)
        lut.SetSaturationRange(a, b)
        lut.SetTableRange(a, b)
        return lut


if __name__ == '__main__':

    # DarkSky
    dk = VtkDarkSky("../data/ds14_scivis_0128/ds14_scivis_0128_e4_dt04_1.0000")
    dk.write("ds14_scivis_0128_e4_dt04_1.")
    print dk.histo()

    # Renderer
    # Create the Renderer
    ren = vtk.vtkRenderer()
    ren.AddActor(dk.vtkPointActor)
    ren.AddActor(dk.vtkStreamActor)
    ren.SetBackground(.0, .0, .0)  # Set background to white
    ren.ResetCamera()

    # Create the RendererWindow
    renWin = vtk.vtkRenderWindow()
    renWin.SetSize(512, 512)
    renWin.AddRenderer(ren)

    # Interactor
    iren = vtk.vtkRenderWindowInteractor()
    iren.SetRenderWindow(renWin)

    # Begin Interaction
    print "We drawing stuffs!"
    renWin.Render()
    iren.Initialize()
    iren.Start()
