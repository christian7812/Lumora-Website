import { BookOpen, BriefcaseBusiness, Cpu, Dumbbell, Gamepad2, HeartPulse, House, PawPrint, Shirt, Sparkles, type LucideIcon,
} from "lucide-react";

export interface CategoryDetails {
  description: string;
  icon: LucideIcon;
  accent: string;
}

export const categoryDetails: Record<string, CategoryDetails> = {
  Electronics: {
    description: "Smart tech and everyday essentials.",
    icon: Cpu,
    accent: "bg-sky-100 text-sky-800",
  },
  Fashion: {
    description: "Fresh styles for every day and every occasion.",
    icon: Shirt,
    accent: "bg-rose-100 text-rose-800",
  },
  Accessories: {
    description: "Thoughtful finishing touches for your look.",
    icon: Sparkles,
    accent: "bg-amber-100 text-amber-800",
  },
  Bags: {
    description: "Carry your everyday essentials in style.",
    icon: BriefcaseBusiness,
    accent: "bg-emerald-100 text-emerald-800",
  },
  "Home & Living": {
    description: "Small details that make a space feel like yours.",
    icon: House,
    accent: "bg-orange-100 text-orange-800",
  },
  Books: {
    description: "Stories, ideas, and inspiration for your next chapter.",
    icon: BookOpen,
    accent: "bg-violet-100 text-violet-800",
  },
  "Beauty & Personal Care": {
    description: "Everyday care, feel-good routines, and little luxuries.",
    icon: HeartPulse,
    accent: "bg-pink-100 text-pink-800",
  },
  "Sports & Outdoors": {
    description: "Gear to get moving, get outside, and go further.",
    icon: Dumbbell,
    accent: "bg-lime-100 text-lime-800",
  },
  "Toys & Games": {
    description: "Playful finds for game night and imaginative days.",
    icon: Gamepad2,
    accent: "bg-indigo-100 text-indigo-800",
  },
  "Pet Supplies": {
    description: "Comfortable, practical picks for furry companions.",
    icon: PawPrint,
    accent: "bg-teal-100 text-teal-800",
  },
};
