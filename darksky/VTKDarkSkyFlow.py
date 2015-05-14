import yt
import vtk
import time
import struct
import numpy as np
import sdfpy as sdf
import random as rd


def l2a(l):
    return np.array(l)


class vtkDarkSkyFlow(object):
    """docstring for vtkDarkSkyFlow"""
    def __init__(self, fn, key=None, style=None, useSDF=True, cMpc=False):
        super(vtkDarkSkyFlow, self).__init__()
        self.useSDF = useSDF
        self.isCoMoving = cMpc
        self.filename = fn
        self.start = time.clock()
        # Only do one of these
        # ======================
        if self.useSDF:
            self.initSDF()
        else:
            self.initYT()
        # =======================
        self.initVTK(key)
        self.initFlow(style)

    def initFlow(self, style=None):
        print "initializing Flow objects", style
        self.vtkFlowActor = vtk.vtkActor()
        self.initHedgeHog()
        # if style is None:
        #     self.initHedgeHog()
        # elif style in "streamlines":
        #     self.initStreamlines()

    def initSDF(self):
        print "loading SDF data!"
        self.sdfParticles = sdf.load_sdf(self.filename)
        self.sdfHeader = self.sdfParticles.parameters
        self.sdfPhi = self.sdfParticles['phi']
        self.sdfIdent = self.sdfParticles['ident']
        self.sdfPosition = self.sdfGetXYZ()
        self.sdfVelocity = self.sdfGetUVW()
        self.sdfMagnitude = self.sdfGetMagnitude()

    def initVTK(self, key):
        print "initializing VTK objects"
        self.__setMinMaxRange(key)
        self.__normalize(key)

        # Create our Data object
        vtk.vtkStructuredGrid()
        self.vtkStructuredGrid = vtk.vtkStructuredGrid()
        self.vtkStructuredGrid.SetDimensions([128]*3)

        # Set up Points
        self.vtkPoints = vtk.vtkPoints()
        self.vtkPoints.Allocate(128*3)

        # Set up Cells
        # self.vtkCells = vtk.vtkCellArray()

        # Setup the velocity vectors
        self.vtkVectors = vtk.vtkDoubleArray()
        self.vtkVectors.SetNumberOfComponents(3)
        self.vtkVectors.SetNumberOfTuples(self.sdfIdent.size)

        # Setup the Scalars
        self.vtkScalars = vtk.vtkDoubleArray()
        self.vtkScalars.SetName(key)

        # Allocate points, cells, scalars, and vector fields
        self.AllocateData(self.sdfIdent.size, key)

        # Now attach newly allocated objects to the grid
        self.vtkStructuredGrid.SetPoints(self.vtkPoints)
        # self.vtkStructuredGrid.SetVerts(self.vtkCells)
        self.vtkStructuredGrid.GetPointData().SetVectors(self.vtkVectors)
        self.vtkStructuredGrid.GetPointData().SetScalars(self.vtkScalars)
        self.vtkStructuredGrid.GetPointData().SetActiveScalars(key)

    def AllocateData(self, size, key):
        start = time.clock()
        print "Assigning Points, Cells, Scalars, and Vectors!", start, "sec"
        for i in xrange(size):
            self.addData(i, key)
            if i % 500000 == 0:
                print "at {} points! {} secs".format(i, time.clock() - start)
        print "total runtime was: {} secs".format(time.clock() - start)

    def addData(self, index, key):
        pID = self.addPoint(index)
        # self.addCell(pID)
        self.addVector(index, pID)
        self.addScalar(index, key)

    def addPoint(self, index):
        x, y, z = self.sdfPosition[index]
        pID = self.vtkPoints.InsertNextPoint(x, y, z)
        self.vtkPoints.Modified()
        return pID

    def addCell(self, pID):
        self.vtkCells.InsertNextCell(1)
        self.vtkCells.InsertCellPoint(pID)
        self.vtkCells.Modified()

    def addVector(self, index, pID):
        uvw = self.sdfVelocity[index]
        self.vtkVectors.InsertTuple(pID, uvw)
        self.vtkVectors.Modified()

    def addScalar(self, index, key):
        m = None
        if key in "magnitude":
            m = self.sdfMagnitude[index]
        elif key in "phi":
            m = self.sdfPhi[index]
        else:
            m = self.sdfIdent[index]

        self.vtkScalars.InsertNextValue(m)
        self.vtkScalars.Modified()

    def initHedgeHog(self, scale=0.1):
        print "initializing HedgeHog object", scale
        # Create the HedgeHog object
        self.vtkHedgHog = vtk.vtkHedgeHog()
        self.vtkHedgHog.SetInputData(self.vtkStructuredGrid)
        self.vtkHedgHog.SetScaleFactor(scale)

        print "Making the HedgeHog mapper"
        # Now create its Actor and associated mapper
        mapper = vtk.vtkPolyDataMapper()
        print "mapper.SetInputConnection(self.vtkHedgHog.GetOutputPort())"
        mapper.SetInputConnection(self.vtkHedgHog.GetOutputPort())
        print "Setting mapper to actor"
        self.vtkFlowActor.SetMapper(mapper)
        # self.vtkFlowActor.GetProperty().SetColor(1.0, 1.0, 1.0)

    def sdfGetXYZ(self):
        x = self.sdfParticles['x']
        y = self.sdfParticles['y']
        z = self.sdfParticles['z']
        xyz = np.dstack((x, y, z))[0]
        if self.isCoMoving:
            return self.__toCoMoving(xyz)
        else:
            return xyz

    def sdfGetUVW(self):
        u = self.sdfParticles['vx']
        v = self.sdfParticles['vy']
        w = self.sdfParticles['vz']
        return np.dstack((u, v, w))[0]

    def sdfGetMagnitude(self):
        return abs(np.sqrt(self.sdfVelocity[:, 0]**2 +
                           self.sdfVelocity[:, 1]**2 +
                           self.sdfVelocity[:, 2]**+2))

    # +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    #                   Private Methods
    # +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    def __toCoMoving(self, proper):
        """
        Define a simple function to convert proper to comoving Mpc/h.
        """
        h_100 = self.sdfHeader['h_100']
        width = self.sdfHeader.parameters['L0']
        cosmo_a = self.sdfHeader.parameters['a']
        kpc_to_Mpc = 1./1000
        return (proper + width/2.) * h_100 * kpc_to_Mpc / cosmo_a

    def __setMinMaxRange(self, key=None):
        if key is 'phi':
            self.dMin = self.sdfPhi.min()
            self.dMax = self.sdfPhi.max()
        elif key is 'index':
            self.dMin = self.sdfIdent.min()
            self.dMax = self.sdfIdent.max()
        elif key is 'mag':
            self.dMin = self.sdfMagnitude.min()
            self.dMax = self.sdfMagnitude.max()
        elif key is 'velx':
            self.dMin = self.sdfVelocity[:, 0].min()
            self.dMax = self.sdfVelocity[:, 0].max()
        elif key is 'vely':
            self.dMin = self.sdfVelocity[:, 1].min()
            self.dMax = self.sdfVelocity[:, 1].max()
        elif key is 'velz':
            self.dMin = self.sdfVelocity[:, 2].min()
            self.dMax = self.sdfVelocity[:, 2].max()
        else:
            self.dMin = 0.0
            self.dMax = 1.0
        print "Min/Max values are: {}/{}".format(self.dMin, self.dMax)

    def __scalar(self, index, key):
        if key is 'phi':
            return self.sdfPhi[index]
        elif key is 'index':
            return self.sdfIdent[index]
        elif key is 'mag':
            return self.sdfMagnitude[index]
        elif key is 'velx':
            return self.sdfVelocity[index, 0]
        elif key is 'vely':
            return self.sdfVelocity[index, 1]
        elif key is 'velz':
            return self.sdfVelocity[index, 2]
        else:
            return rd.random()

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
    start = time.clock()
    fn = "../data/ds14_scivis_0128/ds14_scivis_0128_e4_dt04_1.0000"
    dk = vtkDarkSkyFlow(fn, 'mag')

    # Renderer
    # Create the Renderer
    ren = vtk.vtkRenderer()
    print "add actor to renderer?"
    ren.AddActor(dk.vtkFlowActor)
    print "set Background?"
    ren.SetBackground(.0, .0, .0)  # Set background to white
    # print "ren.ResetCamera()"
    # ren.ResetCamera()

    # Create the RendererWindow
    print "renWin = vtk.vtkRenderWindow()"
    renWin = vtk.vtkRenderWindow()
    print "renWin.SetSize(512, 512)"
    renWin.SetSize(512, 512)
    print "renWin.AddRenderer(ren)"
    renWin.AddRenderer(ren)

    # Interactor
    iren = vtk.vtkRenderWindowInteractor()
    iren.SetRenderWindow(renWin)

    # Begin Interaction
    print "We drawing stuffs!"
    renWin.Render()
    iren.Initialize()
    iren.Start()
