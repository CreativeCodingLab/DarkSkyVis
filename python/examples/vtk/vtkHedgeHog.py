import vtk
import math
import numpy as np


def l2a(l):
    np.array(l)


def creatData(sgrid):
    x = [0.0]*3
    v = [0.0]*3
    rMin = 0.5
    rMax = 1.0
    dims = [13, 11, 11]
    sgrid.SetDimensions(dims)

    vectors = vtk.vtkFloatArray()
    vectors.SetNumberOfComponents(3)
    vectors.SetNumberOfTuples(dims[0]*dims[1]*dims[0])

    points = vtk.vtkPoints()
    points.Allocate(dims[0]*dims[1]*dims[0])

    deltaZ = 2.0 / (dims[2]-1)
    deltaRad = (rMax-rMin) / (dims[1]-1)
    v[2] = 0.0
    for k in range(dims[2]):
        x[2] = -1.0 + k*deltaZ
        kOffset = k * dims[0] * dims[1]
        for j in range(dims[1]):
            radius = rMin + j*deltaRad
            jOffset = j * dims[0]
            for i in range(dims[0]):
                theta = i * math.radians(15.0)
                x[0] = radius * math.cos(theta)
                x[1] = radius * math.sin(theta)
                v[0] = -x[1]
                v[1] = x[0]
                offset = i + jOffset + kOffset
                points.InsertPoint(offset, x)
                vectors.InsertTuple(offset, v)
    sgrid.SetPoints(points)
    sgrid.GetPointData().SetVectors(vectors)


sgrid = vtk.vtkStructuredGrid()
creatData(sgrid)

hedgehog = vtk.vtkHedgeHog()
hedgehog.SetInputData(sgrid)
hedgehog.SetScaleFactor(0.1)

sgridMapper = vtk.vtkPolyDataMapper()
sgridMapper.SetInputConnection(hedgehog.GetOutputPort())

sgridActor = vtk.vtkActor()
sgridActor.SetMapper(sgridMapper)
sgridActor.GetProperty().SetColor(0, 0, 0)

ren = vtk.vtkRenderer()
ren.AddActor(sgridActor)
ren.SetBackground(1, 1, 1)  # Set background to white
ren.ResetCamera()

ren.GetActiveCamera().Elevation(60.0)
ren.GetActiveCamera().Azimuth(30.0)
ren.GetActiveCamera().Zoom(1.25)

# Create the RendererWindow
renWin = vtk.vtkRenderWindow()
renWin.SetSize(300, 300)
renWin.AddRenderer(ren)

# Interactor
iren = vtk.vtkRenderWindowInteractor()
iren.SetRenderWindow(renWin)

# Begin Interaction
renWin.Render()
iren.Initialize()
iren.Start()
