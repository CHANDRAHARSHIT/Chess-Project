import React, { useState } from 'react';
import { 
  Plus, Trash2, ArrowUp, ArrowDown, Copy, Edit2, 
  Save, Upload, MessageSquare, MousePointer2, PenTool, 
  Wand2, Layout, Image as ImageIcon, CheckCircle, Search, 
  ChevronRight, ChevronDown, Type, Eye, Share2, Grid, MousePointerClick,
  Star, Cloud, History, Video, Presentation, Lock, Undo, Redo, Printer, 
  ZoomIn, Palette, Bold, Italic, Underline, MoreVertical
} from 'lucide-react';


const INITIAL_STATE = [
  {
    id: 'seg-1',
    title: 'Introduction to the Center',
    isExpanded: true,
    slides: [
      { id: 'slide-1', title: 'Why the center matters', coachText: 'Control the center to control the game. Notice how the pawns on e4 and d4 dominate the board.', fen: 'rnbqkbnr/pppppppp/8/8/3PP3/8/PPP2PPP/RNBQKBNR b KQkq - 0 1' },
      { id: 'slide-2', title: 'Developing Knights', coachText: 'Knights belong in the center where they can attack up to 8 squares.', fen: 'r1bqkbnr/pppppppp/2n5/8/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq - 2 2' }
    ]
  },
  {
    id: 'seg-2',
    title: 'Basic Tactics',
    isExpanded: true,
    slides: [
      { id: 'slide-3', title: 'The Fork', coachText: 'A fork is a double attack. Here the Knight attacks both the King and the Rook.', fen: 'k7/8/8/8/3N4/8/8/K6r w - - 0 1' }
    ]
  }
];

export default function LessonBuilder() {
  const [segments, setSegments] = useState(INITIAL_STATE);
  const [activeSegmentId, setActiveSegmentId] = useState('seg-1');
  const [activeSlideId, setActiveSlideId] = useState('slide-1');
  const [lessonTitle, setLessonTitle] = useState('Mastering the Center');

  // Find active slide data
  let activeSlide = null;
  segments.forEach(seg => {
    const slide = seg.slides.find(s => s.id === activeSlideId);
    if (slide) activeSlide = slide;
  });


  const addSegment = () => {
    const newSeg = {
      id: `seg-${Date.now()}`,
      title: 'New Segment',
      isExpanded: true,
      slides: [{ id: `slide-${Date.now()}`, title: 'New Slide', coachText: '', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' }]
    };
    setSegments([...segments, newSeg]);
    setActiveSegmentId(newSeg.id);
    setActiveSlideId(newSeg.slides[0].id);
  };

  const updateSegmentTitle = (segId, title) => {
    setSegments(segments.map(s => s.id === segId ? { ...s, title } : s));
  };

  const deleteSegment = (segId) => {
    if (segments.length <= 1) return alert("Must have at least one segment.");
    const newSegs = segments.filter(s => s.id !== segId);
    setSegments(newSegs);
    if (activeSegmentId === segId) {
      setActiveSegmentId(newSegs[0].id);
      setActiveSlideId(newSegs[0].slides[0].id);
    }
  };

  const moveSegment = (index, direction) => {
    if (index + direction < 0 || index + direction >= segments.length) return;
    const newSegs = [...segments];
    const temp = newSegs[index];
    newSegs[index] = newSegs[index + direction];
    newSegs[index + direction] = temp;
    setSegments(newSegs);
  };

  const toggleSegment = (segId) => {
    setSegments(segments.map(s => s.id === segId ? { ...s, isExpanded: !s.isExpanded } : s));
  };


  const addSlide = (segId) => {
    const newSlide = { id: `slide-${Date.now()}`, title: 'New Slide', coachText: '', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' };
    setSegments(segments.map(s => {
      if (s.id === segId) return { ...s, slides: [...s.slides, newSlide], isExpanded: true };
      return s;
    }));
    setActiveSegmentId(segId);
    setActiveSlideId(newSlide.id);
  };

  const duplicateSlide = (segId, slideIndex) => {
    setSegments(segments.map(s => {
      if (s.id === segId) {
        const slideToCopy = s.slides[slideIndex];
        const newSlide = { ...slideToCopy, id: `slide-${Date.now()}`, title: `${slideToCopy.title} (Copy)` };
        const newSlides = [...s.slides];
        newSlides.splice(slideIndex + 1, 0, newSlide);
        return { ...s, slides: newSlides };
      }
      return s;
    }));
  };

  const deleteSlide = (segId, slideId) => {
    setSegments(segments.map(s => {
      if (s.id === segId) {
        if (s.slides.length <= 1) return s; // Don't delete last slide in segment
        const newSlides = s.slides.filter(sl => sl.id !== slideId);
        if (activeSlideId === slideId) setActiveSlideId(newSlides[0].id);
        return { ...s, slides: newSlides };
      }
      return s;
    }));
  };

  const moveSlide = (segId, index, direction) => {
    setSegments(segments.map(s => {
      if (s.id === segId) {
        if (index + direction < 0 || index + direction >= s.slides.length) return s;
        const newSlides = [...s.slides];
        const temp = newSlides[index];
        newSlides[index] = newSlides[index + direction];
        newSlides[index + direction] = temp;
        return { ...s, slides: newSlides };
      }
      return s;
    }));
  };

  const updateActiveSlide = (field, value) => {
    setSegments(segments.map(s => ({
      ...s,
      slides: s.slides.map(sl => sl.id === activeSlideId ? { ...sl, [field]: value } : sl)
    })));
  };

  const TopNav = () => (
    <div className="flex flex-col bg-[#1d1f24] border-b border-[#3c4043] shrink-0">
      {/* Top Menu Row */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          {/* Mock Logo */}
          <div className="w-10 h-10 bg-[#f4b400] rounded text-white flex items-center justify-center text-xl shadow-sm mr-1">♞</div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <input 
                type="text" 
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                className="bg-transparent text-[#e8eaed] font-medium text-lg outline-none border border-transparent hover:border-[#3c4043] focus:border-[#8ab4f8] rounded px-1 -ml-1 transition-colors"
                placeholder="Untitled presentation"
              />
              <Star className="w-4 h-4 text-[#9aa0a6] cursor-pointer hover:text-[#e8eaed] transition-colors" />
              <Cloud className="w-4 h-4 text-[#9aa0a6] cursor-pointer hover:text-[#e8eaed] transition-colors" />
            </div>
            
            <div className="flex gap-4 text-[13px] text-[#9aa0a6] mt-0.5 -ml-1">
              {['File', 'Edit', 'View', 'Insert', 'Format', 'Slide', 'Arrange', 'Tools', 'Extensions', 'Help'].map(item => (
                <span key={item} className="hover:bg-[#303339] hover:text-[#e8eaed] px-1.5 py-0.5 rounded cursor-pointer transition-colors">{item}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 pr-2">
          <History className="w-5 h-5 text-[#9aa0a6] cursor-pointer hover:bg-[#303339] hover:text-[#e8eaed] rounded-full p-0.5 transition-colors" />
          <MessageSquare className="w-5 h-5 text-[#9aa0a6] cursor-pointer hover:bg-[#303339] hover:text-[#e8eaed] rounded-full p-0.5 transition-colors" />
          <Video className="w-5 h-5 text-[#9aa0a6] cursor-pointer hover:bg-[#303339] hover:text-[#e8eaed] rounded-full p-0.5 transition-colors" />
          
          <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#282a2e] border border-[#3c4043] text-[#e8eaed] hover:bg-[#303339] text-sm font-medium ml-2 shadow-sm transition-colors">
             <Presentation className="w-4 h-4" /> Slideshow <ChevronDown className="w-3 h-3 ml-1" />
          </button>
          
          <button className="flex items-center gap-2 px-5 py-1.5 rounded-full bg-[#8ab4f8] text-[#141518] hover:bg-[#9bbef9] transition-colors text-sm font-medium ml-1">
            <Lock className="w-4 h-4" /> Share
          </button>

          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold ml-2">A</div>
        </div>
      </div>

      {/* Tools Row */}
      <div className="flex items-center gap-1 px-4 py-1 bg-[#282a2e] rounded-full mx-3 mb-2 border border-[#3c4043]">
        <button onClick={addSegment} className="p-1.5 hover:bg-[#3c4043] rounded text-[#e8eaed] flex items-center transition-colors"><Plus className="w-4 h-4" /><ChevronDown className="w-3 h-3 ml-0.5"/></button>
        <div className="w-px h-4 bg-[#5f6368] mx-1"></div>
        <button className="p-1.5 hover:bg-[#3c4043] rounded text-[#e8eaed] transition-colors"><Undo className="w-4 h-4" /></button>
        <button className="p-1.5 hover:bg-[#3c4043] rounded text-[#e8eaed] transition-colors"><Redo className="w-4 h-4" /></button>
        <button className="p-1.5 hover:bg-[#3c4043] rounded text-[#e8eaed] transition-colors"><Printer className="w-4 h-4" /></button>
        <button className="p-1.5 hover:bg-[#3c4043] rounded text-[#e8eaed] transition-colors"><Palette className="w-4 h-4" /></button>
        <button className="p-1.5 hover:bg-[#3c4043] rounded text-[#e8eaed] transition-colors"><ZoomIn className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-[#5f6368] mx-1"></div>
        <button className="p-1.5 bg-[#8ab4f8]/20 hover:bg-[#8ab4f8]/30 rounded text-[#8ab4f8] transition-colors"><MousePointer2 className="w-4 h-4" /></button>
        <button className="p-1.5 hover:bg-[#3c4043] rounded text-[#e8eaed] transition-colors"><Type className="w-4 h-4" /></button>
        <button className="p-1.5 hover:bg-[#3c4043] rounded text-[#e8eaed] transition-colors"><ImageIcon className="w-4 h-4" /></button>
        <button className="p-1.5 hover:bg-[#3c4043] rounded text-[#e8eaed] transition-colors"><Grid className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-[#5f6368] mx-1"></div>
        
        {/* Mocking formatting tools for text editor */}
        <span className="text-[13px] font-medium text-[#9aa0a6] hover:text-[#e8eaed] px-2 cursor-pointer hover:bg-[#3c4043] rounded py-1 transition-colors">Background</span>
        <span className="text-[13px] font-medium text-[#9aa0a6] hover:text-[#e8eaed] px-2 cursor-pointer hover:bg-[#3c4043] rounded py-1 transition-colors">Layout</span>
        <span className="text-[13px] font-medium text-[#9aa0a6] hover:text-[#e8eaed] px-2 cursor-pointer hover:bg-[#3c4043] rounded py-1 transition-colors">Theme</span>
        <span className="text-[13px] font-medium text-[#9aa0a6] hover:text-[#e8eaed] px-2 cursor-pointer hover:bg-[#3c4043] rounded py-1 transition-colors">Transition</span>
      </div>
    </div>
  );

  const Sidebar = () => (
    <div className="w-64 border-r border-[#3c4043] bg-[#1d1f24] flex flex-col shrink-0">
      <div className="flex-1 overflow-y-auto py-2">
        {segments.map((seg, segIdx) => (
          <div key={seg.id} className="mb-4">
            {/* Segment "Section" Header - Subtle */}
            <div className="px-2 mb-1 flex items-center justify-between group cursor-pointer hover:bg-[#303339] rounded mx-1 transition-colors">
              <div className="flex items-center gap-1 w-full" onClick={() => toggleSegment(seg.id)}>
                {seg.isExpanded ? <ChevronDown className="w-3 h-3 text-[#9aa0a6]" /> : <ChevronRight className="w-3 h-3 text-[#9aa0a6]" />}
                <input 
                  type="text" 
                  value={seg.title}
                  onChange={(e) => updateSegmentTitle(seg.id, e.target.value)}
                  className="bg-transparent text-[11px] font-semibold text-[#9aa0a6] uppercase tracking-wider outline-none w-full py-1 focus:bg-[#3c4043] focus:text-[#e8eaed] rounded px-1 transition-colors"
                />
              </div>
            </div>

            {/* Slides in Section */}
            {seg.isExpanded && (
              <div className="space-y-2">
                {seg.slides.map((slide, slideIdx) => {
                  const isActive = activeSlideId === slide.id;
                  // Calculate absolute slide number for visual sequence
                  let slideNumber = 1;
                  for(let i=0; i<segIdx; i++) {
                     slideNumber += segments[i].slides.length;
                  }
                  slideNumber += slideIdx;

                  return (
                    <div 
                      key={slide.id}
                      onClick={() => { setActiveSlideId(slide.id); setActiveSegmentId(seg.id); }}
                      className="group flex gap-2 pl-2 pr-4 py-1 cursor-pointer items-start"
                    >
                      <span className="text-[11px] font-medium text-[#9aa0a6] mt-2 w-4 text-right select-none">{slideNumber}</span>
                      
                      {/* Slide Thumbnail */}
                      <div className={`
                        relative flex-1 aspect-[4/3] rounded-md border-2 bg-[#282a2e] flex flex-col transition-all overflow-hidden
                        ${isActive ? 'border-[#8ab4f8] shadow-[0_0_8px_rgba(138,180,248,0.2)]' : 'border-transparent shadow-[0_0_0_1px_rgba(255,255,255,0.05)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.2)]'}
                      `}>
                         <div className="w-full h-full bg-[#141518] flex flex-col p-1.5 gap-1 opacity-80">
                           {/* Mini Mock Layout inside thumbnail */}
                           <div className="w-full h-2 bg-[#3c4043] rounded-sm"></div>
                           <div className="flex-1 flex gap-1">
                             <div className="w-1/2 bg-[#779556] rounded-sm"></div>
                             <div className="w-1/2 bg-[#282a2e] rounded-sm"></div>
                           </div>
                         </div>

                         {/* Hover Controls for Slide */}
                         <div className="absolute right-0 top-0 bottom-0 w-6 bg-[#282a2e]/90 border-l border-[#3c4043] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); deleteSlide(seg.id, slide.id); }} className="p-1 text-[#9aa0a6] hover:text-red-400" title="Delete"><Trash2 className="w-3 h-3"/></button>
                            <button onClick={(e) => { e.stopPropagation(); duplicateSlide(seg.id, slideIdx); }} className="p-1 text-[#9aa0a6] hover:text-[#8ab4f8]" title="Duplicate"><Copy className="w-3 h-3"/></button>
                         </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const MockChessboard = () => {
    const isWhiteSquare = (rank, file) => (rank + file) % 2 !== 0;
    const files = [0,1,2,3,4,5,6,7];
    const ranks = [0,1,2,3,4,5,6,7];

    return (
      <div className="w-full max-w-[400px] aspect-square border-4 border-[#3c4043] rounded-sm overflow-hidden flex flex-col relative shadow-lg mx-auto">
        {ranks.map(rank => (
          <div key={rank} className="flex-1 flex">
            {files.map(file => (
              <div 
                key={`${rank}-${file}`} 
                className={`flex-1 flex items-center justify-center ${isWhiteSquare(rank, file) ? 'bg-[#ebecd0]' : 'bg-[#779556]'}`}
              >
                {/* Mock Pieces */}
                {rank === 3 && file === 4 && <span className="text-4xl lg:text-5xl drop-shadow-md text-white">♙</span>}
                {rank === 4 && file === 3 && <span className="text-4xl lg:text-5xl drop-shadow-md text-black">♟</span>}
                {rank === 6 && file === 5 && <span className="text-4xl lg:text-5xl drop-shadow-md text-white">♘</span>}
              </div>
            ))}
          </div>
        ))}
        {/* Coordinates */}
        <div className="absolute bottom-0.5 left-0 w-full flex text-[10px] font-bold text-black/60 px-1 justify-around pointer-events-none">
           <span>a</span><span>b</span><span>c</span><span>d</span><span>e</span><span>f</span><span>g</span><span>h</span>
        </div>
        <div className="absolute left-1 top-0 h-full flex flex-col text-[10px] font-bold text-black/60 py-1 justify-around pointer-events-none">
           <span>8</span><span>7</span><span>6</span><span>5</span><span>4</span><span>3</span><span>2</span><span>1</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#1d1f24] text-[#e8eaed] font-sans overflow-hidden selection:bg-[#8ab4f8]/30">
      <TopNav />
      
      <div className="flex flex-1 overflow-hidden bg-[#141518]">
        <Sidebar />
        
        {/* Main Editor Canvas Workspace */}
        <div className="flex-1 flex flex-col overflow-y-auto relative items-center justify-center p-8">
          
          {/* Mock Canvas Container (The "Slide") */}
          <div className="w-full max-w-5xl aspect-[16/9] bg-[#202124] rounded-md shadow-2xl border border-[#3c4043] flex relative">
            
            {/* Left Side: Chess Board Component */}
            <div className="w-1/2 border-r border-dashed border-[#3c4043] p-8 flex flex-col items-center justify-center bg-[#1d1f24]/30 rounded-l-md">
               
               {/* Contextual Board Tools (Floating above board) */}
               <div className="absolute top-4 left-4 flex bg-[#282a2e] shadow-lg border border-[#3c4043] rounded-md p-1 gap-1 z-10">
                 <button className="p-1.5 rounded hover:bg-[#3c4043] text-[#9aa0a6] hover:text-[#e8eaed] transition-colors" title="Draw Arrow"><ArrowUp className="w-4 h-4 transform rotate-45" /></button>
                 <button className="p-1.5 rounded hover:bg-[#3c4043] text-[#9aa0a6] hover:text-[#e8eaed] transition-colors" title="Highlight Square"><Grid className="w-4 h-4" /></button>
                 <button className="p-1.5 rounded hover:bg-[#3c4043] text-[#9aa0a6] hover:text-[#e8eaed] transition-colors" title="Add Bubble"><MessageSquare className="w-4 h-4" /></button>
               </div>

               <MockChessboard />
            </div>

            {/* Right Side: Text Editor Component */}
            <div className="w-1/2 p-8 flex flex-col relative group">
              
              {/* Click to add title */}
              <input 
                 type="text" 
                 value={activeSlide?.title || ''}
                 onChange={(e) => updateActiveSlide('title', e.target.value)}
                 className="w-full bg-transparent text-4xl font-normal text-[#e8eaed] focus:outline-none placeholder-[#5f6368] border border-transparent focus:border-[#8ab4f8] focus:bg-[#8ab4f8]/5 p-2 -ml-2 rounded transition-colors mb-6"
                 placeholder="Click to add title"
              />

              {/* Click to add text (Coach Text) */}
              <div className="flex-1 border border-transparent focus-within:border-[#8ab4f8] focus-within:bg-[#8ab4f8]/5 -ml-2 p-2 rounded transition-colors flex flex-col relative">
                
                {/* Formatting Toolbar (Appears on focus/hover) */}
                <div className="absolute -top-10 left-0 bg-[#282a2e] shadow-lg border border-[#3c4043] rounded-md p-1 flex items-center gap-1 opacity-0 group-focus-within:opacity-100 transition-opacity z-10">
                   <button className="p-1.5 hover:bg-[#3c4043] rounded text-[#e8eaed] font-bold transition-colors"><Bold className="w-3.5 h-3.5"/></button>
                   <button className="p-1.5 hover:bg-[#3c4043] rounded text-[#e8eaed] italic transition-colors"><Italic className="w-3.5 h-3.5"/></button>
                   <button className="p-1.5 hover:bg-[#3c4043] rounded text-[#e8eaed] underline transition-colors"><Underline className="w-3.5 h-3.5"/></button>
                   <div className="w-px h-4 bg-[#5f6368] mx-1"></div>
                   <button className="p-1 text-xs font-medium text-[#8ab4f8] hover:bg-[#8ab4f8]/20 flex items-center gap-1 rounded border border-transparent hover:border-[#8ab4f8]/50 px-2 transition-colors">
                     <MousePointerClick className="w-3 h-3" /> Tag Move
                   </button>
                   <button className="p-1 text-xs font-medium text-[#c58af9] hover:bg-[#c58af9]/20 flex items-center gap-1 rounded border border-transparent hover:border-[#c58af9]/50 px-2 ml-auto transition-colors">
                     <Wand2 className="w-3 h-3" /> Fix Grammar
                   </button>
                </div>

                <textarea
                   value={activeSlide?.coachText || ''}
                   onChange={(e) => updateActiveSlide('coachText', e.target.value)}
                   className="w-full h-full bg-transparent text-xl font-normal text-[#e8eaed] focus:outline-none resize-none placeholder-[#5f6368] leading-relaxed"
                   placeholder="Click to add text"
                />
              </div>

            </div>
          </div>
          
          {/* Bottom Bar for Speaker Notes / FEN Data */}
          <div className="absolute bottom-0 left-0 right-0 bg-[#1d1f24] border-t border-[#3c4043] px-4 py-2 flex items-center justify-between z-20">
            <div className="text-[13px] text-[#9aa0a6] font-medium">
               Click to add speaker notes
            </div>
            
            {/* Putting the FEN loader down here so it doesn't clutter the clean slide interface */}
            <div className="flex items-center gap-2 max-w-md w-full bg-[#141518] rounded border border-[#3c4043] px-2 py-1">
              <span className="text-[11px] font-bold text-[#9aa0a6]">FEN:</span>
              <input 
                type="text" 
                value={activeSlide?.fen || ''}
                onChange={(e) => updateActiveSlide('fen', e.target.value)}
                className="flex-1 bg-transparent text-[11px] text-[#e8eaed] outline-none font-mono"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}