#!/usr/bin/env python

# Purdue CS530 - Introduction to Scientific Visualization
# Fall 2013

# Simple example to show how vtkRenderWindowInteractor can be customized
# to support additional user requests. Here, a sphere is being rendered 
# and three key-press actions are defined: 's' saves the current frame to 
# a PNG file, 'c' prints out the current camera setting, and 'q' exits
# the application.

# Our example needs the VTK Python package
import sys
import vtk
import os
from os import path

base_name = "frame_"
frame_counter = 0
verbose = False

def print_usage(me, msg):
    if len(msg) > 0:
        print "ERROR: " + msg
    print "USAGE: " + me + " [options]"
    print "DESCRIPTION: Demonstrate the use of vtkRenderWindowInteractor."
    print "OPTIONS:"
    print " -h | --help             Print this information"
    print " -r | --res <int> x2     Image resolution (default: 1024x768)"
    print " -o | --output <string>  Base name for screenshots"
    print " -v | --verbose          Turn on verbose mode (default: off)"
    sys.exit()

def make_sphere():
    global renderer
    # ---------------------------------------------------------------
    # The following code is identical to render_demo.py...
    # ---------------------------------------------------------------
    # create a sphere
    sphere_src = vtk.vtkSphereSource()
    sphere_src.SetRadius(1.0)
    sphere_src.SetCenter(0.0, 0.0, 0.0)
    sphere_src.SetThetaResolution(20)
    sphere_src.SetPhiResolution(20)
    # extract the edges
    edge_extractor = vtk.vtkExtractEdges()
    edge_extractor.SetInputConnection(sphere_src.GetOutputPort())
    # map sphere and edges separately
    sphere_mapper = vtk.vtkPolyDataMapper()
    sphere_mapper.SetInputConnection(sphere_src.GetOutputPort())
    edge_mapper = vtk.vtkPolyDataMapper()
    edge_mapper.SetInputConnection(edge_extractor.GetOutputPort())
    # define different rendering styles for sphere and edges
    sphere_actor = vtk.vtkActor()
    sphere_actor.SetMapper(sphere_mapper)
    sphere_actor.GetProperty().SetColor(1, 0.5, 0)
    edge_actor = vtk.vtkActor()
    edge_actor.SetMapper(edge_mapper)
    edge_actor.GetProperty().SetColor(0, 0.5, 0)
    edge_actor.GetProperty().SetLineWidth(3)
    # add resulting primitives to renderer
    renderer.AddActor(sphere_actor)
    renderer.AddActor(edge_actor)
    
def save_frame():
    global frame_counter
    global window
    global verbose
    # ---------------------------------------------------------------
    # Save current contents of render window to PNG file
    # ---------------------------------------------------------------
    file_name = base_name + str(frame_counter).zfill(5) + ".png"
    image = vtk.vtkWindowToImageFilter()
    image.SetInput(window)
    png_writer = vtk.vtkPNGWriter()
    png_writer.SetInputConnection(image.GetOutputPort())
    png_writer.SetFileName(file_name)
    window.Render()
    png_writer.Write()
    frame_counter += 1
    if verbose:
        print file_name + " has been successfully exported"
    
def print_camera_settings():
    global renderer
    # ---------------------------------------------------------------
    # Print out the current settings of the camera
    # ---------------------------------------------------------------
    camera = renderer.GetActiveCamera()
    print "Camera settings:"
    print "  * position:        %s" % (camera.GetPosition(),)
    print "  * focal point:     %s" % (camera.GetFocalPoint(),)
    print "  * up vector:       %s" % (camera.GetViewUp(),)
    print "  * clipping range:  %s" % (camera.GetViewUp(),)

def key_pressed_callback(obj, event):
    global verbose
    # ---------------------------------------------------------------
    # Attach actions to specific keys
    # ---------------------------------------------------------------
    key = obj.GetKeySym()
    if key == "s":
        save_frame()
    elif key == "c":
        print_camera_settings()
    elif key == "q":
        if verbose:
            print "User requested exit."
        sys.exit()
    
def main():
    global renderer
    global window
    global verbose
    global base_name
    
    # name of the executable
    me = sys.argv[0]
    nargs = len(sys.argv)
    # define image resolution
    w = 1024
    h = 768
    # define background color
    bgcolor = [0, 0, 0]
    
    i = 0
    while i < nargs-1:
        i += 1
        arg = sys.argv[i]
        if arg == "-h" or arg == "--help":
            print_usage(me, "")
        elif arg == "-r" or arg == "--res":
            if i >= nargs-2:
                print_usage(me, "missing resolution parameters")
            w = int(sys.argv[i+1])
            h = int(sys.argv[i+2])
            i += 2
        elif arg == "-bg" or arg == "--background":
            if i >= nargs-3:
                print_usage(me, "missing background color")
            bgcolor = [float(sys.argv[i+1]), float(sys.argv[i+2]), float(sys.argv[i+3])]
            i += 3
        elif arg == "-v" or arg == "--verbose":
            verbose = True
        elif arg == "-o" or arg == "--output":
            if i == nargs-1:
                print_usage(me, "missing output base name")
            base_name = sys.argv[i+1]
            i += 1
        else:
            print_usage(me, "unrecognized input argument: " + arg)
    
    renderer = vtk.vtkRenderer()
    renderer.SetBackground(bgcolor)
    make_sphere()
    renderer.ResetCamera()
    
    window = vtk.vtkRenderWindow()
    window.AddRenderer(renderer)
    window.SetSize(w, h)
    
    interactor = vtk.vtkRenderWindowInteractor()
    interactor.SetRenderWindow(window)
    
    # ---------------------------------------------------------------
    # Add a custom callback function to the interactor
    # ---------------------------------------------------------------
    interactor.AddObserver("KeyPressEvent", key_pressed_callback)
    
    interactor.Initialize()
    window.Render()
    interactor.Start()

if __name__=="__main__":
      main()