"use client";



import { useEffect, useState, useRef } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { toast } from "@/lib/toast";

import { Star, Trophy, Lock, Package2, CheckCircle, ArrowDown, Zap, BookOpen } from "lucide-react";



// Keep the same props signature to avoid touching page.tsx

export function LearningPathContent({ isFirstTime, profile }: { isFirstTime: boolean; profile: any }) {

  const [loading, setLoading] = useState(true);

  const [modules, setModules] = useState<ModuleWithMandatory[]>([]);

  const [pathNodes, setPathNodes] = useState<PathNode[]>([]);

  const [query, setQuery] = useState("");

  const [visibleNodes, setVisibleNodes] = useState(6); // Show first 6 nodes initially

  const [animatedNodes, setAnimatedNodes] = useState<Set<string>>(new Set());

  const router = useRouter();



  useEffect(() => {

    loadLearningPathModules();

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, []);



  // Animate nodes in sequence after data loads

  useEffect(() => {

    if (pathNodes.length > 0 && !loading) {

      const timer = setTimeout(() => {

        pathNodes.slice(0, visibleNodes).forEach((node, index) => {

          setTimeout(() => {

            setAnimatedNodes(prev => new Set([...prev, node.id]));

          }, index * 200); // Stagger animations by 200ms

        });

      }, 300);

      return () => clearTimeout(timer);

    }

  }, [pathNodes, visibleNodes, loading]);



  // Find the current node (next node to work on)

  const findCurrentNode = (nodes: PathNode[]): PathNode | null => {

    // Find the first node that is not locked and not completed

    return nodes.find(node => !node.locked && !node.completed) || null;

  };



  // Convert modules to path nodes

  const createPathNodes = (modules: ModuleWithMandatory[]): PathNode[] => {

    const nodes: PathNode[] = [];



    // Track used IDs to ensure uniqueness across all nodes

    const usedIds = new Set<string>();

    const slug = (s?: string) =>

      (s || "")

        .toString()

        .toLowerCase()

        .replace(/[^a-z0-9]+/g, "-")

        .replace(/^-+|-+$/g, "");

    const uniqueId = (base: string) => {

      let id = base || "node";

      let i = 1;

      while (usedIds.has(id)) {

        id = `${base}-${i++}`;

      }

      usedIds.add(id);

      return id;

    };

    

    // Start node

    nodes.push({

      id: uniqueId('start'),

      type: 'start',

      title: 'Start Learning',

      description: 'Begin your journey',

      completed: false,

      locked: false

    });



    // Sort modules by order or by course/subject

    // const sortedModules = modules.sort((a, b) => {

    //   if (a.order_index !== undefined && b.order_index !== undefined) {

    //     return a.order_index - b.order_index;

    //   }

    //   return (a.course_title || "").localeCompare(b.course_title || "") || 

    //          (a.subject_title || "").localeCompare(b.subject_title || "");

    // });



    // Add module nodes with progressive unlocking logic

    modules.forEach((module, index) => {

      const isFirst = index === 0;

      const previousNode = index > 0 ? nodes[nodes.length - 1] : null;

      const previousCompleted = isFirst || (previousNode && previousNode.completed);

      

      const baseModuleId = `module-${slug(module.course_title)}-${slug(module.subject_title)}-${slug(module.id)}`;



      nodes.push({

        id: uniqueId(baseModuleId),

        type: 'module',

        title: module.title,

        description: `${module.subject_title} - ${module.course_title}`,

        completed: module.completed || false,

        locked: !isFirst && !previousCompleted,

        progress: module.progress || (module.completed ? 100 : 0),

        module: module

      });



      // Add milestone every 3-4 modules

      // if ((index + 1) % 3 === 0 && index < modules.length - 1) {

      //   const recentModules = nodes.slice(-3).filter(n => n.type === 'module');

      //   const milestoneCompleted = recentModules.every(n => n.completed);

      //   nodes.push({

      //     id: uniqueId(`milestone-${Math.floor(index / 3)}`),

      //     type: 'milestone',

      //     title: 'Milestone Reached',

      //     description: 'Great progress!',

      //     completed: milestoneCompleted,

      //     locked: !milestoneCompleted

      //   });

      // }

    });



    // Final completion node

    nodes.push({

      id: uniqueId('final'),

      type: 'final',

      title: 'Learning Complete',

      description: 'Congratulations!',

      completed: modules.every(m => m.completed),

      locked: !modules.every(m => m.completed)

    });



    return nodes;

  };



  const loadLearningPathModules = async () => {

    try {

      setLoading(true);



      // Fetch or generate once the user's learning path

      const userPathRes = await fetch("/api/learning-paths/user/me");

      if (!userPathRes.ok) {

        throw new Error("Failed to load your learning path");

      }

      const learningPath = await userPathRes.json();



      const candidates = Array.isArray(learningPath)

        ? learningPath

        : Array.isArray(learningPath?.path?.path?.courses)

          ? learningPath.path.path.courses

          : Array.isArray(learningPath?.path?.courses)

            ? learningPath.path.courses

            : [];



      const extractedModules: ModuleWithMandatory[] = [];



      candidates.forEach((course: any) => {

        const subjects = Array.isArray(course?.subjects) ? course.subjects : [];

        const courseId = course?.id ?? course?.courseId ?? course?.course_id;

        const courseTitle = course?.title ?? "";

        subjects.forEach((subject: any) => {

          const modules = Array.isArray(subject?.modules) ? subject.modules : [];

          const subjectId = subject?.id ?? subject?.subjectId ?? subject?.subject_id;

          const subjectTitle = subject?.title ?? "";

          modules.forEach((module: any) => {

            const moduleId = module?.id ?? module?.moduleId ?? module?.module_id ?? module?.slug;

            if (!moduleId) return;

            const correctnessRaw = module?.correctness_percentage;

            const correctnessNumber =

              correctnessRaw === null || correctnessRaw === undefined ? undefined : Number(correctnessRaw);

            const normalizedCorrectness =

              typeof correctnessNumber === "number" && Number.isFinite(correctnessNumber)

                ? correctnessNumber

                : undefined;

            extractedModules.push({

              id: String(moduleId),

              title: module?.title ?? "Module",

              subject_title: subjectTitle,

              course_title: courseTitle,

              subjectId: subjectId ? String(subjectId) : undefined,

              courseId: courseId ? String(courseId) : undefined,

              status: module?.status,

              correctness_percentage: normalizedCorrectness,

              assessment_based: module?.assessment_based,

              is_mandatory: module?.is_mandatory,

            });

          });

        });

      });



      const modulesWithProgress = extractedModules.map((module) => {

        const correctness = Number(module.correctness_percentage ?? module.progress ?? 0);

        const normalized = Number.isFinite(correctness) ? Math.max(0, Math.min(100, correctness)) : 0;

        return {

          ...module,

          progress: normalized,

          completed: module.completed ?? normalized >= 100,

        };

      });



      setModules(modulesWithProgress);

      setPathNodes(createPathNodes(modulesWithProgress));



      

  

    } catch (e: any) {

      console.error("Failed to load learning path modules:", e);

      toast.error(e?.message || "Failed to load learning path modules");

      setModules([]);

    } finally {

      setLoading(false);

    }

  };



  

  // Helper to get node icon (brand-colored for available states)

  const getNodeIcon = (node: PathNode) => {

    if (node.locked) {

      return <Lock className="h-6 w-6 text-gray-400" />;

    }

    

    switch (node.type) {

      case 'start':

        return <Star className="h-6 w-6 text-white" />;

      case 'milestone':

        return <Package2 className="h-6 w-6 text-gray-600" />;

      case 'final':

        return <Trophy className="h-6 w-6 text-gray-600" />;

      default:

        return node.completed ? 

          <CheckCircle className="h-6 w-6 text-white" /> : 

          <Star className="h-6 w-6 text-[hsl(var(--brand))]" />;

    }

  };



  // Helper to get node style

  const getNodeStyle = (node: PathNode) => {

    if (node.type === 'start' && !node.locked) {

      return "bg-[hsl(var(--brand))] border-[hsl(var(--brand))] text-white hover:brightness-110";

    }

    if (node.completed) {

      return "bg-[hsl(var(--brand))] border-[hsl(var(--brand))] text-white";

    }

    if (node.locked) {

      return "bg-muted border-border text-gray-400 cursor-not-allowed";

    }

    return "bg-white border-border hover:bg-muted";

  };



  // Handle node click

  const handleNodeClick = (node: PathNode) => {

    if (node.locked) {

      toast.error("Complete the previous step to unlock this one");

      return;

    }

    

    if (node.type === 'start') {

      toast.success("Starting your learning journey!");

    } else if (node.type === 'module') {

      const moduleInfo = node.module;

      if (!moduleInfo) {

        toast.error("Module link unavailable. Try refreshing your learning path.");

        return;

      }

      const legacyModule = moduleInfo as ModuleWithMandatory & { course_id?: string; subject_id?: string };

      const courseId = moduleInfo.courseId ?? legacyModule.course_id;

      const subjectId = moduleInfo.subjectId ?? legacyModule.subject_id;

      const moduleId = moduleInfo.id;

      if (courseId && subjectId && moduleId) {

        toast.success(`Loading ${node.title}...`);

        router.push(`/curriculum/${courseId}/${subjectId}?module=${encodeURIComponent(moduleId)}`);

      } else {

        toast.error("Module link unavailable. Try refreshing your learning path.");

      }

    } else if (node.type === 'milestone') {

      toast.success("Milestone reached! Great progress!");

    } else if (node.type === 'final') {

      toast.success("Congratulations on completing the learning path!");

    }

  };



  // Load more nodes

  const handleLoadMore = () => {

    const newVisibleCount = Math.min(visibleNodes + 6, pathNodes.length);

    setVisibleNodes(newVisibleCount);

    

    // Animate new nodes

    pathNodes.slice(visibleNodes, newVisibleCount).forEach((node, index) => {

      setTimeout(() => {

        setAnimatedNodes(prev => new Set([...prev, node.id]));

      }, index * 150);

    });

  };



  return (

    <div className={`relative ${isFirstTime ? "bg-gradient-to-br from-[hsl(var(--brand))/0.06] via-white to-[hsl(var(--brand-accent))/0.06]" : ""}`}>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">

        <div className="flex items-center justify-between gap-3 flex-wrap">

          <div className="space-y-1">

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Learning Path</h1>

            <p className="text-sm text-gray-600">Follow the snake path to complete your personalized learning journey. Complete each step to unlock the next.</p>

          </div>

          <div className="flex items-center gap-2">

            <Button variant="secondary" onClick={loadLearningPathModules} disabled={loading}>

              {loading ? "Loading..." : "Refresh"}

            </Button>

          </div>

        </div>



        {loading ? (

          <div className="flex items-center justify-center min-h-96">

            <div className="text-center">

              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-3" />

              <p className="text-gray-600">Loading your learning path...</p>

            </div>

          </div>

        ) : pathNodes.length === 0 ? (

          <div className="rounded-lg border p-8 text-center text-gray-600 bg-white/60">

            No learning path found.

          </div>

        ) : (

          <div className="relative">

            {/* Animated Learning Path */}

            <div className="py-12 max-w-5xl mx-auto relative">

              {/* Dynamic Background Pattern */}

              <div className="absolute inset-0 overflow-hidden pointer-events-none">

                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-[hsl(var(--brand))]/5 to-transparent rounded-full blur-3xl animate-pulse"></div>

                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-[hsl(var(--brand-accent))]/5 to-transparent rounded-full blur-2xl animate-pulse delay-1000"></div>

              </div>

              

              {/* Central Learning Path Container */}

              <div className="relative">

                {pathNodes.slice(0, visibleNodes).map((node, index) => {

                  const isVisible = index < visibleNodes;

                  const isAnimated = animatedNodes.has(node.id);

                  const isEven = index % 2 === 0;

                  const isLast = index === pathNodes.length - 1;

                  const showConnection = !isLast && index < visibleNodes - 1;

                  const currentNode = findCurrentNode(pathNodes);

                  const isCurrentNode = currentNode?.id === node.id;

                  

                  return (

                    <div key={node.id} className="relative mb-16">

                      {/* Animated Connection Path */}

                      {showConnection && (

                        <div className="absolute left-1/2 top-20 transform -translate-x-1/2 z-0 pointer-events-none">

                          <div className={`

                            w-0.5 h-16 bg-gradient-to-b from-[hsl(var(--brand))]/40 via-[hsl(var(--brand))]/20 to-[hsl(var(--brand-accent))]/40 

                            transition-all duration-1000 ease-out ${isAnimated ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'}

                          `}></div>

                          

                          {/* Flowing Animation */}

                          <div className={`

                            absolute top-0 w-0.5 h-4 bg-gradient-to-b from-[hsl(var(--brand))] to-transparent

                            animate-pulse ${isAnimated ? 'opacity-60' : 'opacity-0'}

                          `}></div>

                          

                          {/* Connection Dot */}

                          <div className={`

                            absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full

                            bg-[hsl(var(--brand-accent))] transition-all duration-500 delay-300

                            ${isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}

                          `}></div>

                        </div>

                      )}

                      

                      {/* Centered Content Layout */}

                      <div className={`

                        flex items-center justify-center transition-all duration-700 ease-out transform

                        ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}

                      `}>

                        {/* Left Node (for odd indices) */}

                        {!isEven && (

                          <div className="relative flex-shrink-0 mr-6">

                            <button

                              onClick={() => handleNodeClick(node)}

                              disabled={node.locked}

                              className={`

                                relative w-20 h-20 rounded-full border-3 transition-all duration-700 group

                                flex items-center justify-center shadow-xl hover:shadow-2xl

                                transform hover:scale-110 ${node.locked ? 'cursor-not-allowed' : 'cursor-pointer'}

                                ${getNodeStyle(node)}

                                ${isCurrentNode ? 'animate-current-node' : ''}

                              `}

                            >

                              {/* Glow Effect for Active Nodes */}

                              {!node.locked && (

                                <div className={`

                                  absolute inset-0 rounded-full bg-[hsl(var(--brand))]/20 blur-lg transition-opacity duration-300

                                  ${isCurrentNode ? 'opacity-60' : 'opacity-0 group-hover:opacity-100'}

                                `}></div>

                              )}

                              

                              {/* Enhanced Glow for Current Node */}

                              {isCurrentNode && (

                                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[hsl(var(--brand))]/30 to-[hsl(var(--brand-accent))]/30 blur-md opacity-70 animate-pulse"></div>

                              )}

                              

                              {/* Node Icon */}

                              <div className="relative z-10 transition-transform duration-300 group-hover:rotate-12">

                                {getNodeIcon(node)}

                              </div>

                              

                              {/* Progress Ring for Module Nodes */}

                              {node.type === 'module' && node.progress !== undefined && node.progress > 0 && (

                                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">

                                  <circle

                                    cx="40"

                                    cy="40"

                                    r="36"

                                    stroke="currentColor"

                                    strokeWidth="3"

                                    fill="none"

                                    className="text-gray-200"

                                  />

                                  <circle

                                    cx="40"

                                    cy="40"

                                    r="36"

                                    stroke="hsl(var(--brand))"

                                    strokeWidth="3"

                                    fill="none"

                                    strokeDasharray={`${2 * Math.PI * 36}`}

                                    strokeDashoffset={`${2 * Math.PI * 36 * (1 - (node.progress || 0) / 100)}`}

                                    className="transition-all duration-1000 ease-out"

                                    style={{ filter: 'drop-shadow(0 0 6px hsl(var(--brand)))' }}

                                  />

                                </svg>

                              )}

                              

                              {/* Completion Badge */}

                              {node.completed && (

                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">

                                  <CheckCircle className="w-4 h-4 text-white" />

                                </div>

                              )}

                            </button>

                            

                            {/* Floating Animation for Current Node Only */}

                            {isCurrentNode && (

                              <div className="absolute -inset-2 bg-[hsl(var(--brand))]/10 rounded-full animate-current-pulse opacity-75"></div>

                            )}

                          </div>

                        )}



                        {/* Centered Content Card */}

                        <div className={`

                          w-80 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200/50

                          transition-all duration-500 ${isAnimated ? 'opacity-100' : 'opacity-0'}

                          hover:shadow-xl hover:bg-white/90 group

                        `}>

                          <div className="flex items-start justify-between">

                            <div className="flex-1">

                              <h3 className={`font-semibold text-lg transition-colors duration-200 ${

                                node.locked ? 'text-gray-400' : 'text-gray-900 group-hover:text-[hsl(var(--brand))]'

                              }`}>

                                {node.title}

                              </h3>

                              {node.description && (

                                <p className={`text-sm mt-1 ${node.locked ? 'text-gray-400' : 'text-gray-600'}`}>

                                  {node.description}

                                </p>

                              )}

                              

                              {/* Module Status and Progress */}

                              {node.type === 'module' && (

                                <div className="mt-2 flex items-center gap-2">

                                  {node.module?.status && (

                                      <span

                                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${

                                          node.module?.status.includes('optional')

                                            ? 'bg-[hsl(var(--brand))]/10 text-amber-700'

                                            : 'bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))]'

                                        }`}

                                      >

                                        <Zap className="w-3 h-3" />

                                        {node.module?.status}

                                      </span>

                                    )}

                                  {node.progress !== undefined && node.progress > 0 && (

                                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">

                                      {node.progress}% Complete

                                    </span>

                                  )}

                                </div>

                              )}

                              

                              {/* Other Node Types Status */}

                              {node.type === 'start' && (

                                <div className="mt-2">

                                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">

                                    <BookOpen className="w-3 h-3" />

                                    Journey Begins

                                  </span>

                                </div>

                              )}

                              {node.type === 'final' && (

                                <div className="mt-2">

                                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">

                                    <Trophy className="w-3 h-3" />

                                    Final Goal

                                  </span>

                                </div>

                              )}

                            </div>

                            {/* Action Icon */}

                            <div className="ml-3 flex-shrink-0">

                              <ArrowDown className={`w-5 h-5 transition-colors duration-200 ${

                                node.locked ? 'text-gray-400' : 'text-[hsl(var(--brand))] group-hover:text-[hsl(var(--brand-accent))]'

                              }`} />

                            </div>

                          </div>

                        </div>



                        {/* Right Node (for even indices) */}

                        {isEven && (

                          <div className="relative flex-shrink-0 ml-6">

                            <button

                              onClick={() => handleNodeClick(node)}

                              disabled={node.locked}

                              className={`

                                relative w-20 h-20 rounded-full border-3 transition-all duration-700 group

                                flex items-center justify-center shadow-xl hover:shadow-2xl

                                transform hover:scale-110 ${node.locked ? 'cursor-not-allowed' : 'cursor-pointer'}

                                ${getNodeStyle(node)}

                                ${isCurrentNode ? 'animate-current-node' : ''}

                              `}

                            >

                              {/* Glow Effect for Active Nodes */}

                              {!node.locked && (

                                <div className={`

                                  absolute inset-0 rounded-full bg-[hsl(var(--brand))]/20 blur-lg transition-opacity duration-300

                                  ${isCurrentNode ? 'opacity-60' : 'opacity-0 group-hover:opacity-100'}

                                `}></div>

                              )}

                              

                              {/* Enhanced Glow for Current Node */}

                              {isCurrentNode && (

                                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[hsl(var(--brand))]/30 to-[hsl(var(--brand-accent))]/30 blur-md opacity-70 animate-pulse"></div>

                              )}

                              

                              {/* Node Icon */}

                              <div className="relative z-10 transition-transform duration-300 group-hover:rotate-12">

                                {getNodeIcon(node)}

                              </div>

                              

                              {/* Progress Ring for Module Nodes */}

                              {node.type === 'module' && node.progress !== undefined && node.progress > 0 && (

                                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">

                                  <circle

                                    cx="40"

                                    cy="40"

                                    r="36"

                                    stroke="currentColor"

                                    strokeWidth="3"

                                    fill="none"

                                    className="text-gray-200"

                                  />

                                  <circle

                                    cx="40"

                                    cy="40"

                                    r="36"

                                    stroke="hsl(var(--brand))"

                                    strokeWidth="3"

                                    fill="none"

                                    strokeDasharray={`${2 * Math.PI * 36}`}

                                    strokeDashoffset={`${2 * Math.PI * 36 * (1 - (node.progress || 0) / 100)}`}

                                    className="transition-all duration-1000 ease-out"

                                    style={{ filter: 'drop-shadow(0 0 6px hsl(var(--brand)))' }}

                                  />

                                </svg>

                              )}

                              

                              {/* Completion Badge */}

                              {node.completed && (

                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">

                                  <CheckCircle className="w-4 h-4 text-white" />

                                </div>

                              )}

                            </button>

                            

                            {/* Floating Animation for Current Node Only */}

                            {isCurrentNode && (

                              <div className="absolute -inset-2 bg-[hsl(var(--brand))]/10 rounded-full animate-current-pulse opacity-75"></div>

                            )}

                          </div>

                        )}

                      </div>

                    </div>

                  );

                })}

              </div>

              

              {/* Load More Section */}

              {pathNodes.length > visibleNodes && (

                <div className="mt-16 text-center">

                  <div className="inline-block bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200/50">

                    <div className="space-y-4">

                      <div className="flex items-center justify-center space-x-2">

                        <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-[hsl(var(--brand))] to-transparent"></div>

                        <Package2 className="w-6 h-6 text-[hsl(var(--brand))]" />

                        <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-[hsl(var(--brand))] to-transparent"></div>

                      </div>

                      <h3 className="text-xl font-semibold text-gray-900">Continue Your Journey</h3>

                      <p className="text-gray-600 max-w-md mx-auto">

                        {pathNodes.length - visibleNodes} more modules await. Load them to continue your personalized learning path.

                      </p>

                      <Button 

                        onClick={() => {

                          const newVisible = Math.min(visibleNodes + 6, pathNodes.length);

                          setVisibleNodes(newVisible);

                        }}

                        className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"

                      >

                        <span className="flex items-center gap-2">

                          Load More Modules

                        </span>

                      </Button>

                      <p className="text-sm text-gray-500 mt-2">

                        Showing {visibleNodes} of {pathNodes.length} modules

                      </p>

                    </div>

                  </div>

                </div>

              )}

            </div>

            

            {/* Enhanced Legend */}

            <div className="mt-16 bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50">

              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">

                <Star className="w-5 h-5 text-[hsl(var(--brand))]" />

                Learning Path Guide

              </h4>

              

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

                {/* Available Node */}

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 bg-[hsl(var(--brand))] border-[hsl(var(--brand))] text-white rounded-full flex items-center justify-center shadow-md">

                    <Star className="w-4 h-4" />

                  </div>

                  <div>

                    <div className="font-medium text-gray-900">Available</div>

                    <div className="text-xs text-gray-600">Ready to start</div>

                  </div>

                </div>

                

                {/* Completed Node */}

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 bg-green-500 border-green-500 text-white rounded-full flex items-center justify-center shadow-md">

                    <CheckCircle className="w-4 h-4" />

                  </div>

                  <div>

                    <div className="font-medium text-gray-900">Completed</div>

                    <div className="text-xs text-gray-600">Well done!</div>

                  </div>

                </div>

                

                {/* Locked Node */}

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 bg-gray-400 border-gray-400 text-white rounded-full flex items-center justify-center shadow-md">

                    <Lock className="w-4 h-4" />

                  </div>

                  <div>

                    <div className="font-medium text-gray-900">Locked</div>

                    <div className="text-xs text-gray-600">Complete prerequisites first</div>

                  </div>

                </div>

                

                {/* Final Goal */}

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-500 text-white rounded-full flex items-center justify-center shadow-md">

                    <Trophy className="w-4 h-4" />

                  </div>

                  <div>

                    <div className="font-medium text-gray-900">Final Goal</div>

                    <div className="text-xs text-gray-600">Journey completion</div>

                  </div>

                </div>

              </div>

              

              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-400">

                <div className="flex-shrink-0">

                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">

                    <Zap className="w-4 h-4 text-blue-600" />

                  </div>

                </div>

                <div>

                  <div className="font-medium text-blue-900">Pro Tip</div>

                  <div className="text-sm text-blue-700 mt-1">

                    Hover over nodes to see progress rings and glow effects. Complete modules sequentially to unlock the next step in your learning journey.

                  </div>

                </div>

              </div>

            </div>

          </div>

        )}

      </div>

    </div>

  );

}



// Types

type ModuleWithMandatory = {

  id: string;

  title: string;

  course_title: string;

  subject_title: string;

  courseId?: string;

  subjectId?: string;

  status?: string;

  correctness_percentage?: number;

  assessment_based?: boolean;

  completed?: boolean;

  progress?: number;

  is_mandatory?: boolean;

  order_index?: number;

}



type PathNode = {

  id: string;

  type: 'start' | 'module' | 'milestone' | 'final';

  title: string;

  description?: string;

  completed: boolean;

  locked: boolean;

  progress?: number;

  module?: ModuleWithMandatory;

}

