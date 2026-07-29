import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { LessonService } from "../services/lesson";
import { motion } from "framer-motion";
import { BookOpen, Clock, BarChart, ChevronRight, PlayCircle, Trophy, Sparkles, Swords } from "lucide-react";

export default function LearnPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      const res = await LessonService.getCourses();
      if (res.status === "success" && res.data) {
        setCourses(res.data.courses);
      }
      setIsLoading(false);
    };
    fetchCourses();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#080B14]">
        <div className="w-12 h-12 rounded-full border-2 border-[#D4AF6E]/20 border-t-[#D4AF6E] animate-spin mb-4" />
        <div className="text-[#D4AF6E] font-medium tracking-wide animate-pulse">Loading Masterclasses...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-[#080B14] relative overflow-hidden select-none">
      {/* Background Radial Gold Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(212,175,110,0.12),transparent_70%)] pointer-events-none" />
      <div className="fixed inset-0 opacity-[0.035] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

      <div className="p-6 md:p-12 max-w-7xl mx-auto w-full relative z-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-14 mt-6 md:mt-10 flex flex-col md:flex-row md:items-end justify-between gap-8"
        >
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF6E]/10 border border-[#D4AF6E]/25 text-[#D4AF6E] font-semibold text-xs tracking-wider uppercase mb-6 shadow-[0_0_15px_rgba(212,175,110,0.15)]">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF6E]" />
              <span>XLChess Interactive Academy</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-5 tracking-tight leading-[1.1]">
              Master the Game. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F3D08A] via-[#D4AF6E] to-[#B8934A]">Move by Move.</span>
            </h1>
            <p className="text-base md:text-lg text-white/60 leading-relaxed">
              Interactive courses designed by Grandmasters. Master openings, tactics, and endgames through dynamic, playable board exercises.
            </p>
          </div>
        </motion.div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm">
            <BookOpen className="w-16 h-16 text-[#D4AF6E]/50 mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">No Courses Available</h3>
            <p className="text-white/40">We're preparing new lessons. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
            {courses.map((course, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                key={course.id} 
                className="group flex flex-col bg-[#121624]/60 hover:bg-[#161b2e]/80 border border-[#D4AF6E]/15 hover:border-[#D4AF6E]/40 rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(212,175,110,0.15)] backdrop-blur-md"
              >
                <div className="p-8 md:p-10 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="p-1.5 rounded-lg bg-[#D4AF6E]/10 border border-[#D4AF6E]/20 text-[#D4AF6E]">
                      <Swords className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF6E]/80">Masterclass</span>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-[#D4AF6E] transition-colors">{course.title}</h2>
                  <p className="text-white/50 mb-8 leading-relaxed line-clamp-2 text-sm">
                    {course.description}
                  </p>
                  
                  <div className="mt-auto pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Available Modules</h3>
                      <span className="text-xs font-semibold text-[#D4AF6E] bg-[#D4AF6E]/10 border border-[#D4AF6E]/20 px-3 py-1 rounded-full">
                        {course.lessons?.length || 0} Lessons
                      </span>
                    </div>

                    <div className="space-y-3">
                      {course.lessons?.map((lesson: any) => (
                        <motion.button
                          whileHover={{ scale: 1.01, x: 4 }}
                          whileTap={{ scale: 0.99 }}
                          key={lesson.id}
                          onClick={() => navigate(`/learn/${lesson.slug}`)}
                          className="w-full text-left p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-[#D4AF6E]/40 hover:bg-[#D4AF6E]/5 transition-all duration-300 flex items-center gap-4 group/btn"
                        >
                          <div className="w-10 h-10 rounded-xl bg-[#D4AF6E]/10 border border-[#D4AF6E]/20 flex items-center justify-center text-[#D4AF6E] group-hover/btn:bg-[#D4AF6E] group-hover/btn:text-[#080B14] transition-all shadow-sm">
                            <PlayCircle className="w-5 h-5" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white/90 truncate group-hover/btn:text-white transition-colors text-sm">{lesson.title}</h4>
                            <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-[#D4AF6E]" /> {lesson.estimatedTime}m</span>
                              <span className="w-1 h-1 rounded-full bg-white/20" />
                              <span className="flex items-center gap-1"><BarChart className="w-3 h-3 text-[#D4AF6E]" /> {lesson.difficulty || 'All Levels'}</span>
                            </div>
                          </div>
                          
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 text-white/30 group-hover/btn:bg-[#D4AF6E] group-hover/btn:text-[#080B14] transition-all">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
