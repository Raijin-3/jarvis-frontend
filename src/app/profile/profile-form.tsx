"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/lib/toast";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { TextareaHTMLAttributes } from "react";
import { 
  User, 
  GraduationCap, 
  Briefcase, 
  MapPin, 
  Heart, 
  Target, 
  Clock, 
  Brain, 
  Globe, 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown, 
  Check,
  Sparkles,
  BookOpen,
  Trophy,
  Calendar,
  Coffee,
  Moon,
  Sun,
  Zap,
  Star,
  Users,
  Music,
  Gamepad2,
  Palette,
  Code,
  TrendingUp,
  Award
} from "lucide-react";

const schema = z.object({
  education: z.string().optional().or(z.literal("")),
  graduation_year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 5).optional().or(z.nan()),
  domain: z.string().optional().or(z.literal("")),
  profession: z.string().optional().or(z.literal("")),
  full_name: z.string().min(2, "Enter your name").optional().or(z.literal("")),
  year_of_study: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 5).optional().or(z.nan()),
  qualification: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  current_institute: z.string().optional().or(z.literal("")),
  previous_learning_experiences: z.string().optional().or(z.literal("")),
  reason_for_learning: z.string().optional().or(z.literal("")),
  best_study_time: z.string().optional().or(z.literal("")),
  past_challenges: z.string().optional().or(z.literal("")),
  hobbies_extracurricular: z.string().optional().or(z.literal("")),
  favorites: z.string().optional().or(z.literal("")),
  sports_arts: z.string().optional().or(z.literal("")),
  languages: z.string().optional().or(z.literal("")),
  motivations: z.string().optional().or(z.literal("")),
  // New fields for enhanced onboarding
  learning_style: z.string().optional().or(z.literal("")),
  career_goal: z.string().optional().or(z.literal("")),
  experience_level: z.string().optional().or(z.literal("")),
  preferred_pace: z.string().optional().or(z.literal("")),
  time_commitment: z.string().optional().or(z.literal("")),
  focus_areas: z.array(z.string()).optional(),
});

function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={["min-h-24 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm resize-none", props.className]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

// Selection cards component
function SelectionCard({ 
  icon, 
  title, 
  description, 
  selected, 
  onClick,
  variant = "default"
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  variant?: "default" | "compact";
}) {
  return (
    <div
      onClick={onClick}
      className={`
        relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 
        ${selected 
          ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20' 
          : 'border-border bg-white/60 hover:border-indigo-300 hover:bg-indigo-50/30'
        }
        ${variant === "compact" ? "p-3" : "p-4"}
      `}
    >
      {selected && (
        <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-white">
          <Check className="h-3 w-3" />
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className={`flex items-center justify-center rounded-lg text-indigo-600 ${variant === "compact" ? "h-8 w-8" : "h-10 w-10"}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold text-gray-900 ${variant === "compact" ? "text-sm" : "text-base"}`}>{title}</h3>
          <p className={`text-gray-600 ${variant === "compact" ? "text-xs" : "text-sm"}`}>{description}</p>
        </div>
      </div>
    </div>
  );
}

// Multi-select chips component
function MultiSelectChips({ 
  options, 
  selected, 
  onChange,
  limit = undefined 
}: {
  options: Array<{ value: string; label: string; icon?: React.ReactNode }>;
  selected: string[];
  onChange: (values: string[]) => void;
  limit?: number;
}) {
  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else if (!limit || selected.length < limit) {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        const isDisabled = limit && selected.length >= limit && !isSelected;
        
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => !isDisabled && toggleOption(option.value)}
            disabled={isDisabled}
            className={`
              flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all
              ${isSelected 
                ? 'bg-indigo-500 text-white ring-2 ring-indigo-500/30' 
                : isDisabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-border text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
              }
            `}
          >
            {option.icon}
            {option.label}
            {isSelected && <Check className="h-3 w-3" />}
          </button>
        );
      })}
    </div>
  );
}

export function ProfileForm({ initial }: { initial: Partial<z.infer<typeof schema>> }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [focusAreas, setFocusAreas] = useState<string[]>(initial.focus_areas || []);
  
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      education: (initial as any).education ?? "",
      graduation_year: (initial as any).graduation_year ?? undefined,
      domain: (initial as any).domain ?? "",
      profession: (initial as any).profession ?? "",
      full_name: initial.full_name ?? "",
      year_of_study: (initial.year_of_study as any) ?? undefined,
      qualification: initial.qualification ?? "",
      location: initial.location ?? "",
      current_institute: initial.current_institute ?? "",
      previous_learning_experiences: initial.previous_learning_experiences ?? "",
      reason_for_learning: initial.reason_for_learning ?? "",
      best_study_time: initial.best_study_time ?? "",
      past_challenges: initial.past_challenges ?? "",
      hobbies_extracurricular: initial.hobbies_extracurricular ?? "",
      favorites: initial.favorites ?? "",
      sports_arts: initial.sports_arts ?? "",
      languages: initial.languages ?? "",
      motivations: initial.motivations ?? "",
      learning_style: (initial as any).learning_style ?? "",
      career_goal: (initial as any).career_goal ?? "",
      experience_level: (initial as any).experience_level ?? "",
      preferred_pace: (initial as any).preferred_pace ?? "",
      time_commitment: (initial as any).time_commitment ?? "",
      focus_areas: initial.focus_areas || [],
    },
    mode: "onBlur",
  });

  const steps = [
    { id: "basic", title: "Basic Info", icon: <User className="h-4 w-4" /> },
    { id: "education", title: "Education", icon: <GraduationCap className="h-4 w-4" /> },
    { id: "experience", title: "Experience", icon: <Briefcase className="h-4 w-4" /> },
    { id: "learning", title: "Learning Style", icon: <Brain className="h-4 w-4" /> },
    { id: "goals", title: "Goals & Focus", icon: <Target className="h-4 w-4" /> },
    { id: "personal", title: "Personal Touch", icon: <Heart className="h-4 w-4" /> }
  ];

  const educationOptions = [
    { value: "high_school", label: "High School", description: "Currently in or completed high school" },
    { value: "bachelors", label: "Bachelor's Degree", description: "Undergraduate studies (B.Sc, B.Tech, B.A, etc.)" },
    { value: "masters", label: "Master's Degree", description: "Graduate studies (MBA, M.Sc, M.Tech, etc.)" },
    { value: "phd", label: "PhD/Doctorate", description: "Doctoral or equivalent research degree" },
    { value: "diploma", label: "Diploma/Certificate", description: "Technical or professional certification" },
    { value: "self_taught", label: "Self-taught", description: "Independent learning and experience" },
  ];

  const professionOptions = [
    { value: "student", label: "Student", description: "Full-time student" },
    { value: "intern", label: "Intern", description: "Internship or trainee" },
    { value: "analyst", label: "Analyst", description: "Data/Business analyst" },
    { value: "engineer", label: "Engineer", description: "Software/Data engineer" },
    { value: "consultant", label: "Consultant", description: "Business/Tech consultant" },
    { value: "manager", label: "Manager", description: "Team/Project manager" },
    { value: "freelancer", label: "Freelancer", description: "Independent contractor" },
    { value: "other", label: "Other", description: "Different profession" },
  ];

  const learningStyleOptions = [
    { value: "visual", label: "Visual Learner", description: "Learn best with diagrams, charts, and visual aids", icon: <Palette className="h-4 w-4" /> },
    { value: "hands_on", label: "Hands-on Learner", description: "Learn by doing and practical exercises", icon: <Code className="h-4 w-4" /> },
    { value: "structured", label: "Structured Learner", description: "Prefer step-by-step guided lessons", icon: <BookOpen className="h-4 w-4" /> },
    { value: "self_paced", label: "Self-paced Learner", description: "Like to explore and learn independently", icon: <Zap className="h-4 w-4" /> },
  ];

  const studyTimeOptions = [
    { value: "early_morning", label: "Early Morning (5-8 AM)", icon: <Sun className="h-4 w-4" /> },
    { value: "morning", label: "Morning (8-12 PM)", icon: <Coffee className="h-4 w-4" /> },
    { value: "afternoon", label: "Afternoon (12-5 PM)", icon: <Sun className="h-4 w-4" /> },
    { value: "evening", label: "Evening (5-9 PM)", icon: <Clock className="h-4 w-4" /> },
    { value: "night", label: "Night (9 PM-12 AM)", icon: <Moon className="h-4 w-4" /> },
    { value: "flexible", label: "Flexible/Varies", icon: <Calendar className="h-4 w-4" /> },
  ];

  const focusAreaOptions = [
    { value: "sql", label: "SQL & Databases", icon: <Brain className="h-4 w-4" /> },
    { value: "python", label: "Python Programming", icon: <Code className="h-4 w-4" /> },
    { value: "excel", label: "Excel & Spreadsheets", icon: <TrendingUp className="h-4 w-4" /> },
    { value: "data_viz", label: "Data Visualization", icon: <Palette className="h-4 w-4" /> },
    { value: "statistics", label: "Statistics & Math", icon: <Trophy className="h-4 w-4" /> },
    { value: "machine_learning", label: "Machine Learning", icon: <Brain className="h-4 w-4" /> },
    { value: "business_intelligence", label: "Business Intelligence", icon: <Briefcase className="h-4 w-4" /> },
    { value: "data_engineering", label: "Data Engineering", icon: <Zap className="h-4 w-4" /> },
  ];

  const experienceLevels = [
    { value: "complete_beginner", label: "Complete Beginner", description: "New to data and analytics" },
    { value: "some_basics", label: "Know Some Basics", description: "Familiar with basic concepts" },
    { value: "intermediate", label: "Intermediate", description: "Have worked on some projects" },
    { value: "advanced", label: "Advanced", description: "Experienced in the field" },
  ];

  const timeCommitmentOptions = [
    { value: "2_4_hours", label: "2-4 hours/week", description: "Light commitment, flexible pace" },
    { value: "5_10_hours", label: "5-10 hours/week", description: "Regular study schedule" },
    { value: "10_20_hours", label: "10-20 hours/week", description: "Serious commitment" },
    { value: "20_plus", label: "20+ hours/week", description: "Intensive learning" },
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (v: z.infer<typeof schema>) => {
    const body: any = { ...v, focus_areas: focusAreas, onboarding_completed: true };
    // Normalize empties to null so we don't store empty strings
    Object.keys(body).forEach((k) => {
      if (body[k] === "" || Number.isNaN(body[k])) body[k] = null;
    });
    
    const sb = supabaseBrowser();
    const { data: { session } } = await sb.auth.getSession();
    const token = session?.access_token;

    await toast.promise(
      fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      }).then(async (r) => {
        const text = await r.text();
        if (!r.ok) throw new Error(text || "Request failed");
        return text ? JSON.parse(text) : null;
      }), {
      loading: "Setting up your profile…",
      success: "Welcome to Jarvis!",
      error: (e) => (e as Error).message || "Failed to save",
    });
    // Redirect to assessment/start after profile completion for new students
    router.replace("/assessment/start?first=1");
  };

  const stepProgress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="mt-4">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            Step {currentStep + 1} of {steps.length}
          </div>
          <div className="text-sm font-medium text-indigo-600">
            {Math.round(stepProgress)}% Complete
          </div>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${stepProgress}%` }}
          />
        </div>
      </div>

      {/* Step Navigation */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div 
                className={`
                  flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all
                  ${index <= currentStep 
                    ? 'border-indigo-500 bg-indigo-500 text-white' 
                    : 'border-gray-300 bg-white text-gray-400'
                  }
                `}
              >
                {index < currentStep ? <Check className="h-4 w-4" /> : step.icon}
              </div>
              <div className={`hidden md:block ml-2 text-sm ${index <= currentStep ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>
                {step.title}
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-px mx-4 ${index < currentStep ? 'bg-indigo-500' : 'bg-gray-300'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form
        // Prevent any native form submit; we trigger save only from the final button
        onSubmit={(e) => { e.preventDefault(); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const target = e.target as HTMLElement | null;
            const tag = (target?.tagName || "").toLowerCase();
            const isTextArea = tag === "textarea";
            if (!isTextArea) {
              e.preventDefault(); // Always prevent default Enter behavior
              if (currentStep < steps.length - 1) {
                nextStep();
              }
              // Only allow form submission on last step via the submit button
            }
          }
        }}
        onKeyUp={(e) => {
          // Extra guard: prevent Enter keyup from causing implicit submits
          if (e.key === 'Enter') e.preventDefault();
        }}
        className="space-y-8"
      >
        {/* Step 1: Basic Info */}
        {currentStep === 0 && (
          <div className="rounded-xl border border-border bg-white/70 p-6 backdrop-blur">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-5 w-5 text-indigo-600" />
                <h2 className="text-xl font-semibold text-gray-900">Let's get to know you!</h2>
              </div>
              <p className="text-gray-600">Start with some basic information about yourself.</p>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="full_name" className="text-base font-medium">What's your full name?</Label>
                <Input 
                  id="full_name" 
                  placeholder="Jane Doe" 
                  className="mt-2 text-lg"
                  {...form.register("full_name")} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location" className="text-base font-medium">Where are you located?</Label>
                  <div className="relative mt-2">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input 
                      id="location" 
                      placeholder="City, Country" 
                      className="pl-10"
                      {...form.register("location")} 
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="languages" className="text-base font-medium">Languages you speak</Label>
                  <div className="relative mt-2">
                    <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input 
                      id="languages" 
                      placeholder="English, Spanish, Mandarin..." 
                      className="pl-10"
                      {...form.register("languages")} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Education */}
        {currentStep === 1 && (
          <div className="rounded-xl border border-border bg-white/70 p-6 backdrop-blur">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="h-5 w-5 text-indigo-600" />
                <h2 className="text-xl font-semibold text-gray-900">Your educational background</h2>
              </div>
              <p className="text-gray-600">Help us understand your learning foundation.</p>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium mb-4 block">What's your highest level of education?</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {educationOptions.map((option) => (
                    <SelectionCard
                      key={option.value}
                      icon={<GraduationCap className="h-6 w-6" />}
                      title={option.label}
                      description={option.description}
                      selected={form.watch("education") === option.value}
                      onClick={() => form.setValue("education", option.value)}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="graduation_year" className="text-base font-medium">Graduation year (if applicable)</Label>
                  <Input 
                    id="graduation_year" 
                    type="number" 
                    placeholder="2024" 
                    className="mt-2"
                    {...form.register("graduation_year", { valueAsNumber: true })} 
                  />
                </div>
                <div>
                  <Label htmlFor="current_institute" className="text-base font-medium">Current/Last Institution</Label>
                  <Input 
                    id="current_institute" 
                    placeholder="University name, Company, etc." 
                    className="mt-2"
                    {...form.register("current_institute")} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Experience */}
        {currentStep === 2 && (
          <div className="rounded-xl border border-border bg-white/70 p-6 backdrop-blur">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="h-5 w-5 text-indigo-600" />
                <h2 className="text-xl font-semibold text-gray-900">Professional background</h2>
              </div>
              <p className="text-gray-600">Tell us about your work experience and expertise level.</p>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium mb-4 block">What's your current profession?</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {professionOptions.map((option) => (
                    <SelectionCard
                      key={option.value}
                      icon={<Briefcase className="h-5 w-5" />}
                      title={option.label}
                      description={option.description}
                      selected={form.watch("profession") === option.value}
                      onClick={() => form.setValue("profession", option.value)}
                      variant="compact"
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium mb-4 block">What's your experience level with data & analytics?</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {experienceLevels.map((option) => (
                    <SelectionCard
                      key={option.value}
                      icon={<Trophy className="h-5 w-5" />}
                      title={option.label}
                      description={option.description}
                      selected={form.watch("experience_level") === option.value}
                      onClick={() => form.setValue("experience_level", option.value)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="domain" className="text-base font-medium">Domain/Industry of interest</Label>
                <Input 
                  id="domain" 
                  placeholder="Finance, Healthcare, E-commerce, Marketing..." 
                  className="mt-2"
                  {...form.register("domain")} 
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Learning Style */}
        {currentStep === 3 && (
          <div className="rounded-xl border border-border bg-white/70 p-6 backdrop-blur">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-5 w-5 text-indigo-600" />
                <h2 className="text-xl font-semibold text-gray-900">How do you learn best?</h2>
              </div>
              <p className="text-gray-600">Understanding your preferences helps us customize your experience.</p>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium mb-4 block">Your learning style</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {learningStyleOptions.map((option) => (
                    <SelectionCard
                      key={option.value}
                      icon={option.icon}
                      title={option.label}
                      description={option.description}
                      selected={form.watch("learning_style") === option.value}
                      onClick={() => form.setValue("learning_style", option.value)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium mb-4 block">When do you study best?</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {studyTimeOptions.map((option) => (
                    <SelectionCard
                      key={option.value}
                      icon={option.icon}
                      title={option.label}
                      description=""
                      selected={form.watch("best_study_time") === option.value}
                      onClick={() => form.setValue("best_study_time", option.value)}
                      variant="compact"
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium mb-4 block">How much time can you commit weekly?</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {timeCommitmentOptions.map((option) => (
                    <SelectionCard
                      key={option.value}
                      icon={<Clock className="h-5 w-5" />}
                      title={option.label}
                      description={option.description}
                      selected={form.watch("time_commitment") === option.value}
                      onClick={() => form.setValue("time_commitment", option.value)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Goals & Focus */}
        {currentStep === 4 && (
          <div className="rounded-xl border border-border bg-white/70 p-6 backdrop-blur">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-indigo-600" />
                <h2 className="text-xl font-semibold text-gray-900">Your goals and focus areas</h2>
              </div>
              <p className="text-gray-600">Help us tailor your learning path to match your objectives.</p>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium mb-4 block">
                  What areas do you want to focus on? <span className="text-sm text-gray-500">(Select up to 4)</span>
                </Label>
                <MultiSelectChips
                  options={focusAreaOptions}
                  selected={focusAreas}
                  onChange={setFocusAreas}
                  limit={4}
                />
              </div>

              <div>
                <Label htmlFor="reason_for_learning" className="text-base font-medium">Why are you pursuing this learning?</Label>
                <Textarea 
                  id="reason_for_learning" 
                  placeholder="Career switch, promotion, personal interest, starting a business..." 
                  className="mt-2"
                  rows={3}
                  {...form.register("reason_for_learning")} 
                />
              </div>

              <div>
                <Label htmlFor="career_goal" className="text-base font-medium">What are your career goals?</Label>
                <Textarea 
                  id="career_goal" 
                  placeholder="Become a data analyst, start my own consultancy, transition to tech..." 
                  className="mt-2"
                  rows={3}
                  {...form.register("career_goal")} 
                />
              </div>

              <div>
                <Label htmlFor="past_challenges" className="text-base font-medium">Any past challenges in learning you'd like to overcome?</Label>
                <Textarea 
                  id="past_challenges" 
                  placeholder="Staying motivated, finding time, understanding complex concepts..." 
                  className="mt-2"
                  rows={3}
                  {...form.register("past_challenges")} 
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Personal Touch */}
        {currentStep === 5 && (
          <div className="rounded-xl border border-border bg-white/70 p-6 backdrop-blur">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-5 w-5 text-indigo-600" />
                <h2 className="text-xl font-semibold text-gray-900">Personal touches</h2>
              </div>
              <p className="text-gray-600">These details help our AI coach personalize your experience!</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hobbies_extracurricular" className="text-base font-medium">Hobbies & interests</Label>
                  <div className="relative mt-2">
                    <Star className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input 
                      id="hobbies_extracurricular" 
                      placeholder="Photography, cooking, traveling..." 
                      className="pl-10"
                      {...form.register("hobbies_extracurricular")} 
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="sports_arts" className="text-base font-medium">Sports or arts you enjoy</Label>
                  <div className="relative mt-2">
                    <Award className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input 
                      id="sports_arts" 
                      placeholder="Basketball, painting, music..." 
                      className="pl-10"
                      {...form.register("sports_arts")} 
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="favorites" className="text-base font-medium">Favorite books, shows, or games</Label>
                <div className="relative mt-2">
                  <Gamepad2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input 
                    id="favorites" 
                    placeholder="The Office, Chess, Harry Potter, Call of Duty..." 
                    className="pl-10"
                    {...form.register("favorites")} 
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="motivations" className="text-base font-medium">What motivates you most?</Label>
                <Textarea 
                  id="motivations" 
                  placeholder="Solving real problems, helping others, recognition, financial independence..." 
                  className="mt-2"
                  rows={3}
                  {...form.register("motivations")} 
                />
              </div>

              <div>
                <Label htmlFor="previous_learning_experiences" className="text-base font-medium">Previous learning experiences</Label>
                <Textarea 
                  id="previous_learning_experiences" 
                  placeholder="Online courses, bootcamps, YouTube tutorials, books..." 
                  className="mt-2"
                  rows={3}
                  {...form.register("previous_learning_experiences")} 
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={form.formState.isSubmitting}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            >
              {form.formState.isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Setting up...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Complete Setup
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

