import { CourseManager } from "../admin/courses/ui";

export const metadata = { title: "Course Management Demo | Jarvis" };

// Demo data for showcasing the interface
const demoCourses = [
  {
    id: "1",
    title: "Introduction to Data Analytics",
    description: "Learn the fundamentals of data analysis, visualization, and statistical thinking. Perfect for beginners who want to start their data analytics journey.",
    status: "published" as const,
    difficulty: "beginner" as const,
    enrolled_count: 1234,
    duration: 480,
    category: "Data Science",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-20T14:30:00Z"
  },
  {
    id: "2", 
    title: "Advanced Machine Learning",
    description: "Deep dive into advanced ML algorithms, neural networks, and deep learning techniques. Includes hands-on projects and real-world applications.",
    status: "published" as const,
    difficulty: "advanced" as const,
    enrolled_count: 567,
    duration: 720,
    category: "Machine Learning",
    created_at: "2024-02-01T09:00:00Z",
    updated_at: "2024-02-15T16:45:00Z"
  },
  {
    id: "3",
    title: "Python for Data Science",
    description: "Master Python programming for data science applications. Covers pandas, numpy, matplotlib, and scikit-learn libraries.",
    status: "draft" as const,
    difficulty: "intermediate" as const,
    enrolled_count: 0,
    duration: 600,
    category: "Programming",
    created_at: "2024-03-01T11:00:00Z",
    updated_at: "2024-03-01T11:00:00Z"
  },
  {
    id: "4",
    title: "SQL Database Design", 
    description: "Learn database design principles, normalization, and advanced SQL queries. Build real-world database solutions.",
    status: "published" as const,
    difficulty: "intermediate" as const,
    enrolled_count: 892,
    duration: 360,
    category: "Database",
    created_at: "2024-01-10T08:00:00Z",
    updated_at: "2024-01-25T12:00:00Z"
  },
  {
    id: "5",
    title: "Business Intelligence & Reporting",
    description: "Create compelling dashboards and reports using modern BI tools. Transform raw data into actionable business insights.",
    status: "archived" as const,
    difficulty: "intermediate" as const,
    enrolled_count: 345,
    duration: 420,
    category: "Business Intelligence",
    created_at: "2023-12-01T10:00:00Z",
    updated_at: "2023-12-15T15:00:00Z"
  },
  {
    id: "6",
    title: "Statistics for Data Analysis",
    description: "Essential statistical concepts for data analysts. Hypothesis testing, regression analysis, and statistical inference.",
    status: "published" as const,
    difficulty: "beginner" as const,
    enrolled_count: 1567,
    duration: 300,
    category: "Statistics",
    created_at: "2024-01-05T09:30:00Z",
    updated_at: "2024-01-18T11:15:00Z"
  }
];

export default function DemoCoursesPage() {
  return <CourseManager initialCourses={demoCourses} />;
}