import { EnhancedCourseManager } from "./ui-enhanced";

export const metadata = { title: "Enhanced Course Management | Jarvis" };

export default function AdminCoursesPage() {
  // Render client manager; it fetches and updates data without page refresh
  return <EnhancedCourseManager initialCourses={[]} />;
}
