export type ThemeId =
  | "relaxation"
  | "adventure"
  | "foodie"
  | "culture"
  | "romantic"
  | "family"
  | "nightlife"
  | "spiritual"
  | "budget"
  | "luxury";

export type Pace = "relaxed" | "balanced" | "packed";
export type Category = "Sight" | "Food" | "Stay" | "Experience" | "Shopping" | "Nature";
export type Role = "owner" | "editor" | "viewer";

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  source: "Google" | "Yatri" | "Tripadvisor";
  verified?: boolean;
}

export interface Place {
  id: string;
  name: string;
  city: string;
  country: string;
  category: Category;
  rating: number;
  reviewCount: number;
  price: number;
  priceLevel: 1 | 2 | 3 | 4;
  lat: number;
  lng: number;
  image: string;
  tags: string[];
  description: string;
  hours: string;
  closedOn?: string;
  duration: string;
  why: string;
  aiSummary: {
    summary: string;
    pros: string[];
    cons: string[];
    bestFor: string[];
  };
  reviews: Review[];
}

export interface City {
  id: string;
  name: string;
  country: string;
  tagline: string;
  image: string;
  lat: number;
  lng: number;
  themes: ThemeId[];
  from: number;
  bestSeason: string;
}

export interface Member {
  id: string;
  name: string;
  role: Role;
  color: string;
}

export interface ItineraryItem {
  id: string;
  placeId: string;
  time: string;
  duration: string;
  cost: number;
  note?: string;
}

export interface ItineraryDay {
  day: number;
  date: string;
  items: ItineraryItem[];
}

export interface CategoryBudgets {
  stays?: number;
  food?: number;
  activities?: number;
  freeRoaming?: number;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  country: string;
  lat: number;
  lng: number;
  startDate: string;
  endDate: string;
  days: number;
  budget: number;
  categoryBudgets?: CategoryBudgets;
  currency: string;
  theme: ThemeId;
  pace: Pace;
  cover: string;
  status: "draft" | "planned" | "live" | "completed";
  visibility: "private" | "public";
  members: Member[];
  itinerary: ItineraryDay[];
  createdAt: string;
}

export interface Preferences {
  name: string;
  email: string;
  homeCity: string;
  currency: string;
  locale: string;
  diet: string;
  pace: Pace;
  budgetStyle: string;
  interests: string[];
  mobility: string;
  notifications: boolean;
}

export interface FlightHint {
  from: string;
  to: string;
  cabin: string;
  indicative: number;
  currency: string;
  airlines: string[];
  deepLinks: { label: string; url: string }[];
  note: string;
}

export interface StayHint {
  city: string;
  tier: string;
  indicativePerNight: number;
  currency: string;
  options: { name: string; area: string; price: number; rating: number; link: string }[];
  note: string;
}

export interface WeatherDay {
  date: string;
  code: number;
  label: string;
  icon: string;
  tMax: number;
  tMin: number;
  rain: number;
  wind: number;
  source: "forecast" | "typical";
}

export interface WeatherResponse {
  city: string;
  latitude: number;
  longitude: number;
  daily: WeatherDay[];
  source: "forecast" | "typical";
  fetchedAt: string;
  attribution: string;
}
