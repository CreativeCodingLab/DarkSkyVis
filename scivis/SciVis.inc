% ---------------------------------------------------------------------
% EG author guidelines plus sample file for EG publication using LaTeX2e input
% D.Fellner, v1.17, Sep 23, 2010


\title[SciVis contest 2015: DarkSky]%
      {Visualizing the Universe, one particle at a time}

% for anonymous conference submission please enter your SUBMISSION ID
% instead of the author's name (and leave the affiliation blank) !!
\author[K. Almryde]
       {Kyle Reese Almryde}

% ------------------------------------------------------------------------

% if the Editors-in-Chief have given you the data, you may uncomment
% the following five lines and insert it here
%
% \volume{27}   % the volume in which the issue will be published;
% \issue{1}     % the issue number of the publication
% \pStartPage{1}      % set starting page


%-------------------------------------------------------------------------
\begin{document}

% \teaser{
%  \includegraphics[width=\linewidth]{eg_new}
%  \centering
%   \caption{New EG Logo}
% \label{fig:teaser}
% }

\maketitle

\begin{abstract}
  In this paper we present a novel application towards the analysis and
visualization of large and complex cosmological simulation data. Our technique
employs an intuitive layout which encourages discovery while also providing clear
and accessible controls with which to filter the data as necessary. We employ a
combined particle streamline system in which we can trace Dark Matter halos through
time
  \begin{classification} % according to http://www.acm.org/class/1998/
    \CCScat{Computer Graphics}{I.3.3}{Time-varying}{DarkSky}{SciVis2015Contest}
  \end{classification}
\end{abstract}

%-------------------------------------------------------------------------
\section{Introduction}
Cosmological simulations are



%-------------------------------------------------------------------------
\section{Domain} % (fold)
\label{sec:domain}

%-------------------------------------------------------------------------
\section{Domain Specific Tasks} % (fold)
\label{sec:common_tasks}
% section common_tasks_with_neuro_imaging_data (end)

%-------------------------------------------------------------------------
\subsection{Exploration} % (fold)
\label{sub:exploration}
One of the most important tasks for a neuroimaging researcher is to simply explore data. By visually examining ones dataset, the researcher can gain insight into the structure of the image, its quality, and often some insight into the results. The ability to simply \emph{explore} the data in order to support sense making is a fundamental task in Neuroimaging. Though typically, researchers have a well defined assumption about the contents of their data. For example, a common exploration task involves visually checking for "oddities" and "inconsistencies" potentially residing in the dataset. These "oddities" can be related to subject motion, which is the result of patients moving during a scan, or they could be scanner related artifacts such as a sudden drop in signal in a region of the brain \cite{churchill2012optimizing}. Dedicated neuroimaging analysis tools, like AFNI\cite{cox1996afni} and SPM\cite{spm2014} have built-in components which enable a user to visually examine their data at each point along the data processing and analysis pipeline. Furthermore, visually assessing the spatial layout of clusters of activation can provide researcher with an accurate sense of the distribution of neural resources the brain employs when solving a task, or, as in the case of disordered brains, where potential sources of problems may be occurring.

%-------------------------------------------------------------------------
\subsection{Comparison} % (fold)
\label{sub:comparison}
Frequently, researchers need to compare one dataset to another, for example when comparing a "typically developing"  brain's data to a developmentally impaired brain, or comparing the results of two experimental conditions against one another. Recently, Plante et. al,\cite{plante2014dynamic} explored the neural correlates of novel language learning between a group of controls and experimental subjects. They found that control subjects recruited fewer regions of the brain when asked to listen to 'shallow' stimuli. That is, they were presented with a fake language that for all intents and purpose sounded like natural language, but which had no meaningful information contained within. By contrast, the experimental group showed numerous regions of the brain recruited when presented with real Norwegian sentences. In this instance, simply being able to see on a whole brain scale, the spatial differences between the two images can be incredibly valuable towards developing the next steps in a high-level analysis. For that matter, comparison tasks are employed during the preprocessing stages of the analysis as a means of checking that the data is visually conforming to your expectations in terms of those data processing steps.

For example, a common step in processing brain imaging data is to register the 3D grid to a standardized `atlas' or template space \cite{robbins2004anatomical}. The underlying principle being that in order to account for the wide variability of individual human brains, `warping' each individual brain to fit a standardized temple reduces error in inter-subject variability \cite{craddock2012whole}. It adds further benefit by enabling comparison across studies. That said, alignment algorithms, while certainly robust, are not fool proof and often take many iterations to ensure the supplied image has been correctly aligned.
%-------------------------------------------------------------------------
\subsection{Identification} % (fold)
\label{sub:identification}
Identification tasks are yet another critical operation performed by neuroimaging researchers and other experts within the medical imaging community. Given the recent awareness of Traumatic Brain Injury (TBI) within the National Football League (NFL) as well as from soldiers returning home from foreign wars, identifying biological markers indicative of TBI has become an area of significant interest \cite{mitsis2014tauopathy,casson2014there}.

It is equally important for experts to be able to confidently identify areas of the brain implicated in a behavioral task, such as identifying the neural substrates of attentive listening. In study by Christensen et. al.,\cite{christensen2010neural} identified a unique set of neural regions recruited when a participant was asked to identify certain attributes of spoken words, that is, in some cases they were told to ignore the content of the words and only attend to the speaker, while in other instances they were asked to ignore the speaker and focus on the content of the word. They identified distinct neural patterns of activity, that is, regions of the brain that 'turn on', depending on the tasks participants performed.

Finally, it is critical that a doctor or other medical professional be able to quickly and accurately identify neural regions impacted due to Epilepsy or post-operative Temporal Lobotomy\cite{tracy2013functional}. Or when performing preoperative planning for surgeries such as Tumor removal \cite{picht2011preoperative}.

%-------------------------------------------------------------------------
\section{Survey} % (fold)
There has been a growing trend over the past 10 years of so within the field of scientific visualization towards generating and interacting with large time-varying volumetric datasets and the domain of neuroimaging is no exception. However, understanding and exploring these datasets is still a major challenge both in terms of managing and expressing the dimensionality of many of these types of datasets as well as dealing with their size\cite{Zhang2012,kehrer2013visualization}. Furthermore, Rendering this kind of data in real time  requires the use of some form of compressed representation as it is not feasible to interactively render every time step in the GPU in real time \cite{balsa2014state}. Though numerous techniques have been developed to address these issues, often they are limited to the specific question they were designed to address\cite{aigner2007visualizing} and differ widely depending on their treatment with regards to the temporal dimension\cite{Wong2013}. With that in mind, advances in hardware acceleration and programmable GPU's have made it easier to develop high-resolution multi-volume rendering, and numerous applications have been developed to take advantage of this. The remained of this survey will spend time examining visualization techniques and applications employed by non-medical scientific fields and their approaches to the challenges highlighted herein. These techniques include the use of particle-based rendering methods in place of more traditional volume rendering techniques and surface mapping which has been found to be a popular method of visualizing brain images. Finally, a discussion on multiple linked views and their applications towards the use of visualizing time-varying volumetric neuroimaging data will conclude the survey.

%------------------------------------------------------------------------
\subsection{Particle-Based Rendering} % (fold)
Within the medical imaging domain, volume rendering techniques are a popular means of representing ones data \cite{voglreiter2012volumetric}. The need for fast, interactive visualization techniques are in high demand and while many such techniques exist\cite{kehrer2013visualization}, often they are incapable of scaling to handle time-varying datasets\cite{zhao2014fused}. Recently, work has been done exploring the use of particles-based rendering (PBR) methods to circumvent some of the more common hangups, such as low frame-rates and the need for object sorting which can be computationally expensive. For example, particle-based methods typically do not require depth sorting. Furthermore, graphics hardware being what it is today, PBR greatly benefits from their parallelized design \cite{voglreiter2012volumetric,zhao2014fused}.

To that end, the need exists for fushion of different types of objects represented in a medically based visualization. For example, being able to display both the structural grey matter based brain images fused with fMRI brain images provides a clear representation of the topological layout of neural activity. This technique was demonstrated in a paper by Forbes et. al.,\cite{forbes2014stereoscopic}. In their work they present a prototype application which used a naive Isosurface Raycasting technique to displayed multiple fMRI activation meshes fused together with a structural brain mesh, resulting in an interesting visualization of functional brain/language networks evolution over time. That said, the application suffers performance wise due to the large number of volumes used. Though their technique is somewhat naive, it does illustrate the limitations, particularly when it comes to volume rendering, when trying to show multiple datasets at the same time. Often this is not feasible, at least at interactive frame rates, as the underlying datasets can be quite large. This is especially true when dealing with time-varying datasets.

\begin{figure}[htb]
  \centering
  \includegraphics[width=.8\linewidth]{Images/NiftiViewer}
\caption{\label{fig:nii}
        3D+Time Brain View\cite{forbes2014stereoscopic} Using an Iso-surface raycasting technique to render in detail a functional language network}
\end{figure}

To address that problem, Zhao et. al.,\cite{zhao2014fused} developed a particle-based rendering technique that is capable of handling large volume datasets and can easily fuse multiple objects together through the use of proxy geometries. Furthermore, their method allows researchers to not only render their data at interactive frame rates, but also allows for easy switching between datasets by performing an initial Raycast which determines the bounds and overall shape of the image. They circumvent the need for object sorting by redefining the nature of object opacity. Usually, opacity is determined from a Transfer function, however Zhao et. al., use a density function of emissive particles. Thus they mimic the effect of opacity by substituting it with density of points.

\begin{figure}[htb]
  \centering
  \includegraphics[width=1.0\linewidth]{Images/APBVR}
\caption{\label{fig:apbvr}
        Adaptive Particle-Based Rendering system showing the different Framerates available
        depending on the visualization type. Notice the middles image, which uses traditional
        mesh based visualization has a painfully slow frame rate, while the APBR system show acceptable levels while also maintaining the same quality of the representation}
\end{figure}



\subsubsection{Surface Mapping} % (fold)
\label{ssub:surface_mapping}
A popular technique, especially among neuroimagers is the use of surface based visualizations via volumetric meshes. Surface-based neuroimaging analysis is advantageous for at least four reason:\\ \textbf{1)} It maintains the topology of cortical gray matter activation. Due in part to the sampling size and resolution of the volume itself, neighboring voxels within the brain are not necessarily sampling neighboring cortical structures. This is in part due to preprocessing techniques in which voxel data is smoothed resulting in the loss of topological information. By mapping the activation data from the volume to the surface domain, data processing measures can be conducted on the surface itself, resulting in \textit{improved} topological detail.\\ \textbf{2)} Surface-based analyses increase statistical power\cite{anticevic2008comparing} due in part to the improved topology and coherence between voxel information and surface mesh nodes.\\ \textbf{3)} Cortical thickness is easy to calculate through the use of an inner and outer gray matter meshes.\\ \textbf{4)} Very high quality visualizations of structural and functional brain data\cite{saad2012suma}. While all of these benefits can be accomplished using volume-based approaches, the computational complexity is much higher. The only overhead that is typically encountered is in the initial creation of the surface mesh, which has been alleviated somewhat with the latest advances in hardware support and more effective registration algorithms and software.

\begin{figure}[htb]
  \centering
  \includegraphics[width=.8\linewidth]{Images/SUMA1.jpg}
\caption{\label{fig:suma}
        SUMA\cite{saad2012suma} A pial gray matter mesh with mapped voxel information}
\end{figure}

Several applications have been developed for the purpose of surface based analysis of neuroimaging data, including FreeSurfer\cite{fischl2012freesurfer}, Caret\cite{van2001integrated}, and SUMA\cite{saad2012suma}, from the creators of a very popular neuroimaging statistical analysis package called AFNI\cite{cox1996afni,Cox2012743} (described in more detail below). Assuming a representative surface mesh is available, it is easy to link the 3D surface mesh to the 3D volume data, allowing for one to interact with their data in several dimensional views. Furthermore, all renderings are connected such that clicking on any surface, whether 2D or 3D volume views, updates the crosshair location on all visualizations, including time-series graphs. A more recent application

% subsubsection surface_mapping (end)
%------------------------------------------------------------------------
\subsection{Multi-linked Views} % (fold)
\label{sub:multi_linked_views}
The concept of multiple linked views can trace its origins to that of the InfoVis and has been a popular technique when displaying multi-modal and multi-temporal data for the past 20 years\cite{kehrer2013visualization}. The use of multiple views is advantageous in that it allows the user to explore different data variables and attributes side-by-side employing well known visualizations into a single interface.

%%%
%%% Figure 1
%%%
\begin{figure}[htb]
  \centering
  \includegraphics[width=.8\linewidth]{Images/AFNI3.jpg}
\caption{\label{fig:afni}
        AFNI\cite{cox1996afni,Cox2012743} 2D orthogonal layout with a linked time-series graph view of the selected variables, in this instance 16 voxels across 164 time points}
\end{figure}

Presently there is a wide range of popular tools which neuroimagers employ to not only process and analyze their data, but also to visualize it as well. The most popular tools used by domain experts within the field include including FSL\cite{smith2004advances,woolrich2009bayesian} and SPM\cite{spm2014} AFNI\cite{cox1996afni,Cox2012743}. AFNI is a UNIX-based open source software package for the Analysis of Functional Neuroimaging data. AFNI follows the guided principle that as a tool it should allow a user to stay close to their data with the ability to view it in several {\em different} ways. In this way a user is able to become familiar with the structure and results of their data. AFNI offers good support for both 2D, 3D, and 4D data representations by taking advantage of representational views the datasets dimensions. For 4D data, it visualizes temporal information as an interactive time-series graph which, when specific points are selected, updates the 2D orthogonal view of the data to show that point in time. They have also integrated a feature in which the selection mode automatically traverses the time-series graph, updating the 2D view in kind. This can be useful when examining a dataset for subtle changes within the signal as well as when tracking artifacts due to motion, for example.

%%%
%%% Figure 1
%%%
\begin{figure}[htb]
  \centering
  \includegraphics[width=.8\linewidth]{Images/VAST1}
\caption{\label{fig:vast}
        VAST\cite{Li201282} Showing two sets of linked views of multiple representations of connectivity data, including structural connectivity data, evidenced by the Diffusion tensor images (DTI), functional connectivity data as evidenced by the time series graph, and a volume rendered brain}
\end{figure}

Li et. al.,\cite{Li201282}, discusses a novel visual analytics approach in which integrate multimodal neuroimaging information into a unified framework via joint modeling of said multi-modal data, as well as data visualization and intuitive user interface. The paper primarily focuses on the application and its features, though it provides a comprehensive analysis of the HCI component. The tool incorporates every type of neuroimaging data, from DTI, functional ROI maps, and structural anatomical images and encourages the inclusion of all modalities for maximum effectiveness. Though able to offer numerous image processing functionalities, this system is through and through a network visualization system with the various modalities supporting the application in that task. Additional features include a network prediction algorithm which attempts to localize single subject ROIs in relation to group activation networks.

\section{Future Directions} % (fold)
\label{sec:future_directions}
Present visualization techniques for for time-varying volumetric visualizations of neuroimaging data have been well established within their respective community. However, as data continues to grow in complexity, and data collection hardware improves in terms of its resolution, more advanced techniques will need to be employed. The use of Particle-based rendering methods presented earlier may have some involvement in this future as they offer better performance for similar encoding of the same data. In nearly every case the use of multiple-linked views will likely dominate the development of these tools as so far there does not seem to be a one-view-fits-all model, and arguably there shouldn't be.
% The future looks bright for time-varying volumetric visualizations of neuroimaging data. While current methods are limited to memory and hardware constraints, these issues are rapidly improving. Furthermore, as more advanced compression and DVR techniques improve, so too will the interactivity of these types of visualization progress. Additionally, the data has become available for even more interesting analysis of cognitive function. While there are inherent challenges involved with large amounts of data, especially multi-temporal data, novel techniques and tools will continue to be developed to meet this challenges. It is likely to be the case that more visualizations will incorporate the evolution of temporal data, such as in the case of the 3D+Time Brain View\cite{forbes2014stereoscopic}. This is a new frontier in medical imaging, there is still much to explore.
% section future_directions (end)

%-------------------------------------------------------------------------
\section{Conclusions} % (fold)
\label{sec:conclusions}
Based on the provided survey of the state-or-the-art of Multi-temporal volume visualization of functional neuroimaging as well as the responses from Domain experts, it is clear that each representation of time-varying data is valuable in its own right. However, no single visualization is capable of meeting every need of the user, nor should it. Instead, a best of both worlds approach should be pursued by marrying some or all of these techniques into coordinated multiple views which take advantage of well-known visualizations such as appears to be the most desirable in terms of the needs outlined by the domain experts.

\begin{figure}[htb]
  \centering
  \includegraphics[width=.8\linewidth]{Images/SUMA2}
\caption{\label{fig:suma2}
        AFNI and SUMA with linked functional data showing how multiple representations improves visual analysis and exploration of the data in question
        }
\end{figure}
% section conclusions (end)

%-------------------------------------------------------------------------
\section{Domain Perspectives} % (fold)
The following section examines domain expert's perspectives on current visual analytic tasks within the domain of neuroimaging\\

\noindent \textbf{What is the main research project you work on?\\} % (fold)
\noindent \textbf{Expert 1}: Imaging the neural correlates of language learning by typical adults and adults with developmental language impairments.  This primarily involves functional MRI data, but we also collect diffusion tensor images that are used to visualize white matter pathways.\\
\noindent \textbf{Expert 2}: Neuroimaging correlates of recovery from aphasia after stroke\\

\noindent \textbf{What would be an ideal result from your research?\\} % (fold)
\noindent \textbf{Expert 1}:We identify the brain regions that are instrumental to learning and how people recruit these neural resources during the learning process.  We then identify which subsystems are not used optimally when learning is impaired , either because regional resources are not recruited enough, or because they are recruited at the wrong time.\\
\noindent \textbf{Expert 2}: To show that certain patterns of reorganization are associated with recovery of language function, whereas other patterns are associated with persistent deficits.\\

\noindent \textbf{What kind of data do you work with most often in your research?\\} % (fold)
\noindent \textbf{Expert 1}: MRI imaging data. The data are dicom images that get converted to other formats (e.g., nifty format) and are processed in multiple ways to produce analyzable data.  FMRI data is 4-D data.  DTI data is 3D data.\\
\noindent \textbf{Expert 2}: In descending order, fMRI, behavioral measures of language function, structural MRI, DTI, ASL perfusion.\\

\noindent
\textbf{How do you gather or generate this data?\\} % (fold)
\noindent \textbf{Expert 2}: MRI scanner, record and analyze interactions with patients\\

\noindent
\textbf{How is this data used/analyzed?\\} % (fold)
\noindent \textbf{Expert 1}: There are two basic steps for all imaging analysis.\\
\textbf{1)} preprocessing that converts native data into other formats, removes signal variation that are not of interest and/or are confounding (e.g., movement, alignment, spikes, slow drift).\\
\textbf{2)} statistical analyses of the preprocessed data.  For functional imaging, this involves statistical procedures designed to detect signal variation associated with task performance and possibly additional statistics that look for associations with behavioral performance metrics, group differences, and other conditions.\\
\noindent \textbf{Expert 2}: Changes in neuroimaging measures over time are correlated to changes in language measures.\\

\noindent
\textbf{What visualization tools/techniques do you use to help make sense of this data?\\} % (fold)
\noindent \textbf{Expert 1}: The primary tools we use are visualization components available in AFNI, FSL, SPM software programs.  These are all freely available and include analysis software and limited visualization tools.  We also use Almryde's nifti viewer\\
\noindent \textbf{Expert 2}: AFNI, MRIcron, MATLAB (custom scripts)\\

\noindent
\textbf{What visualization tools/techniques do you use to display the data and/or communicate with other experts in your field?\\} % (fold)
\noindent \textbf{Expert 1}: Publications still use 2-D images primarily.  However, journals are now offering 3-D on-line viewers that authors can upload their data into.  No one offers a 4-D viewer yet.\\
\noindent \textbf{Expert 2}: Exactly the same.\\

\noindent
\textbf{What type of visualization tools / techniques would you like to see which could help you make better sense of your data\\} % (fold)
\noindent \textbf{Expert 1}: I would like to be able to marry data obtained from different imaging techniques (e.g., structural MRI, fMRI, DTI tractography) into one 4-D viewer.  I would also like to link other statistical data (e.g., magnitude data) and graphic displays (e.g., bar or line graphs) with the underlying data within a brain region.\\
\noindent \textbf{Expert 2}: I wish there was a tool that combined the best features of AFNI and MRIcron. i.e. the way AFNI handles 4D data is very nice (showing plots of time series for each voxel, etc.), whereas MRIcron excels in overlaying multiple functional images, and in 3D surface renderings.\\
I also wish that my image viewing tool would generate publication-quality images without having to use photoshop/illustrator to put figures together.\\
I wish I could save a "view" which would be a set of images/overlays/etc, to come back to later.\\
It would be nice to have better tools for model diagnostics, i.e. seeing how well the GLM fit the data in different voxels.\\
I wish it were easier to combine data from multiple modalities, i.e. easily turn layers on and off, derive RGB values from images of multiple types, etc.\\

\noindent
\textbf{Do you find Direct Volume Rendering visualizations of the brain (Such as the NifitViewer) are useful, or are they just another pretty picture?\\} % (fold)
\noindent \textbf{Expert 1}: This can go either way.  For many very basic studies that use simple analyses and study one fairly static phenomenon, I think it is probably just a pretty picture for those of us who really have a strong internal reference for the 3-D brain.  I think as we begin to exploit the time parameter more in fMRI research (this is coming), this will become more important because it is hard to get your mind around both regional and timing changes at the same time without a viewer.\\
\noindent \textbf{Expert 2}: Surface renderings as in MRIcron are a very useful way of getting overviews of patterns, and sometimes of presenting those patterns in a straightforward way in publications.

\noindent
\textbf{Do you employ any tools which allow you to visualize temporal changes in the brain? If so, what are they and what about them do you find useful?\\} % (fold)
\noindent \textbf{Expert 2}: AFNI for raw temporal changes. Any functional image is derived from temporal changes of course. AFNI is good for temporal changes because it lets you plot the timecourse of any voxel, or small region of voxels, etc.\\

\noindent
\textbf{How do you feel about neuro-imaging tools being deployed online rather than locally like a traditional application? Assuming the application and work with your data locally, rather than making you upload it to some strange server, etc, do you feel there would be an advantage to having web based neuro-imaging tools/visual-analytic tools?\\} % (fold)
\noindent \textbf{Expert 2}: For most tasks, I think the best setup is a local system in which updates are deployed seamlessly, i.e. debian/ubuntu. I don't really understand what software deployed online would gain you if the data is local anyway. I can see some situations in which very computationally intensive analyses could be performed in a cluster by some online tool, but that would require uploading your data.

%-------------------------------------------------------------------------
\section{Acknowledgments} % (fold)
\label{sec:acknowledgments}
The author wishes to thank Dr. Elena Plante, Dr. Stephen Wilson, and Dr. Dianne Patterson for their thoughtful and valuable responses to submitted questions with regards to their domain expertise within the field of neuroimaging.


%-------------------------------------------------------------------------
\bibliographystyle{eg-alpha-doi}

\bibliography{StarReport}

%-------------------------------------------------------------------------
\end{document}
