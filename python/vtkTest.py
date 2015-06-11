import vtk
import time
import numpy as np
import sdfpy as sdf

class SDFLoader(object):
    """docstring for SDFLoader"""
    def __init__(self, filename, isCoMoving=False):
        super(SDFLoader, self).__init__()
        self.filename = filename
        self.isCoMoving = isCoMoving
        self.initSDF()

    def initSDF(self):
        self.Particles = sdf.load_sdf(self.filename)
        self.Header = self.Particles.parameters
        self.Position = self.GetXYZ()
        self.Velocity = self.GetUVW()
        self.Magnitude = self.GetMagnitude()
        self.Phi = self.Particles['phi']
        self.Ident = self.Particles['ident']
        self.setMinMaxRange('phi')

    def GetXYZ(self):
        x = self.Particles['x']
        y = self.Particles['y']
        z = self.Particles['z']
        xyz = np.dstack((x, y, z))[0]
        if self.isCoMoving:
            return self.toCoMoving(xyz)
        else:
            return xyz

    def GetUVW(self):
        u = self.Particles['vx']
        v = self.Particles['vy']
        w = self.Particles['vz']
        return np.dstack((u, v, w))[0]

    def GetMagnitude(self):
        return abs(np.sqrt(self.Velocity[:, 0]**2 +
                           self.Velocity[:, 1]**2 +
                           self.Velocity[:, 2]**2))

    def toCoMoving(self, proper):
        h_100 = self.Header['h_100']
        width = self.Header['L0']
        cosmo_a = self.Header['a']
        kpc_to_Mpc = 1./1000
        return (proper + width/2.) * h_100 * kpc_to_Mpc / cosmo_a

    def setMinMaxRange(self, key=None):
        if key is 'phi':
            self.dMin = self.Phi.min()
            self.dMax = self.Phi.max()
        elif key is 'ident':
            self.dMin = self.Ident.min()
            self.dMax = self.Ident.max()
        elif key is 'mag':
            self.dMin = self.Magnitude.min()
            self.dMax = self.Magnitude.max()
        elif key is 'velx':
            self.dMin = self.Velocity[:, 0].min()
            self.dMax = self.Velocity[:, 0].max()
        elif key is 'vely':
            self.dMin = self.Velocity[:, 1].min()
            self.dMax = self.Velocity[:, 1].max()
        elif key is 'velz':
            self.dMin = self.Velocity[:, 2].min()
            self.dMax = self.Velocity[:, 2].max()
        else:
            self.dMin = 0.0
            self.dMax = 1.0
        print "Min/Max values are: {}/{}".format(self.dMin, self.dMax)

    def normalize(self, key):
        if self.dMin < 0.0:
            self.factor = max([self.dMax, abs(self.dMin)])
            if key is 'phi':
                self.Phi = self.Phi/self.factor
            elif key is 'index':
                self.Ident = self.Ident/self.factor
            elif key is 'mag':
                self.Magnitude/self.factor
            elif key is 'velx':
                self.Velocity[:, 0] = self.Velocity[:, 0]/self.factor
            elif key is 'vely':
                self.Velocity[:, 1] = self.Velocity[:, 1]/self.factor
            elif key is 'velz':
                self.Velocity[:, 2] = self.Velocity[:, 2]/self.factor
            self.setMinMaxRange(key)
        else:
            pass


class vtkTimerCallback():
    def __init__(self, actor, camera):
        self.timer_count = 0
        self.actor = actor
        self.camera = camera

    def execute(self, obj, event):
        if self.timer_count < 800:
            self.camera.Zoom(1.005)
            try:
                self.actor.RotateWXYZ(1.001, 0.01, 0.8, 0.0)
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


if __name__ == '__main__':
    # DarkSky
    start = time.clock()
    # fn = "../data/BlueWater/1.0000"
    fn = "../data/ds14_scivis_0128/ds14_scivis_0128_e4_dt04_1.0000"
    pSDF = SDFLoader(fn, True)
    pSDF.normalize('phi')
    darkSky = Particles(pSDF.Position, pSDF.Phi, 'phi')

    # Renderer
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
